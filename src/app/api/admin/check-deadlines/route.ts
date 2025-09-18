import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/utils";
import connectDB from "@/lib/db/connection";
import LoanApplication from "@/lib/db/models/LoanApplication";
import User from "@/lib/db/models/User";
import { logApiResponse, logError } from "@/lib/logger";

interface PopulatedUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface PopulatedApplication {
  _id: string;
  applicationNumber: string;
  reviewDeadline: Date;
  dsaReviews: Array<{ status: string; dsaId: string }>;
  userId: PopulatedUser;
  assignedDSAs: PopulatedUser[];
}

// POST /api/admin/check-deadlines - Check for expired review deadlines and unverify DSAs
export async function POST() {
  try {
    const session = await getAuthSession();

    // Only admin or system can call this endpoint
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const now = new Date();

    // Find applications with expired deadlines where DSAs haven't reviewed
    const expiredApplications = await LoanApplication.find({
      reviewDeadline: { $lt: now },
      status: "under_review",
      "dsaReviews.status": "pending",
    }).populate("assignedDSAs", "firstName lastName email isActive isVerified");

    const unverifiedDSAs: Array<{
      dsaId: string;
      name: string;
      email: string;
      applicationId: string;
      applicationNumber: string;
      deadline: Date;
    }> = [];
    const processedApplications: Array<{
      applicationId: string;
      applicationNumber: string;
      status: string;
    }> = [];

    for (const application of expiredApplications) {
      const pendingReviews = application.dsaReviews.filter(
        (review: { status: string }) => review.status === "pending"
      );

      for (const review of pendingReviews) {
        const dsaId = review.dsaId.toString();

        // Find the DSA user
        const dsa = await User.findById(dsaId);
        if (dsa && dsa.isVerified && dsa.isActive) {
          // Unverify the DSA for missing deadline
          dsa.isVerified = false;
          dsa.verifiedAt = undefined;
          dsa.verifiedBy = undefined;
          await dsa.save();

          unverifiedDSAs.push({
            dsaId: dsa._id,
            name: `${dsa.firstName} ${dsa.lastName}`,
            email: dsa.email,
            applicationId: application._id,
            applicationNumber: application.applicationNumber,
            deadline: application.reviewDeadline,
          });

          logError("DSA deadline missed", {
            dsaId: dsa._id,
            dsaEmail: dsa.email,
            applicationId: application._id,
            deadline: application.reviewDeadline,
          });
        }
      }

      // Update application status if all assigned DSAs missed deadline
      const allPending = application.dsaReviews.every(
        (review: { status: string }) => review.status === "pending"
      );
      if (allPending) {
        application.status = "pending"; // Reset to pending for reassignment
        await application.save();

        processedApplications.push({
          applicationId: application._id.toString(),
          applicationNumber: application.applicationNumber,
          status: "reset_to_pending",
        });
      }
    }

    logApiResponse("POST", "/api/admin/check-deadlines", 200, 0, undefined, {
      unverifiedDSAsCount: unverifiedDSAs.length,
      processedApplicationsCount: processedApplications.length,
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredApplications.length} expired applications`,
      unverifiedDSAs,
      processedApplications,
      summary: {
        expiredApplications: expiredApplications.length,
        unverifiedDSAs: unverifiedDSAs.length,
        resetApplications: processedApplications.length,
      },
    });
  } catch (error) {
    logError("Error checking deadlines", error);
    console.error("Error checking deadlines:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/admin/check-deadlines - Get upcoming deadlines and overdue applications
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get overdue applications
    const overdueApplications = await LoanApplication.find({
      reviewDeadline: { $lt: now },
      status: "under_review",
      "dsaReviews.status": "pending",
    })
      .populate("assignedDSAs", "firstName lastName email")
      .populate("userId", "firstName lastName email")
      .select(
        "applicationNumber reviewDeadline assignedDSAs userId dsaReviews status"
      );

    // Get applications due in next 24 hours
    const upcomingDeadlines = await LoanApplication.find({
      reviewDeadline: { $gte: now, $lte: next24Hours },
      status: "under_review",
      "dsaReviews.status": "pending",
    })
      .populate("assignedDSAs", "firstName lastName email")
      .populate("userId", "firstName lastName email")
      .select(
        "applicationNumber reviewDeadline assignedDSAs userId dsaReviews status"
      );

    return NextResponse.json({
      success: true,
      overdueApplications: overdueApplications.map((app) => ({
        applicationId: app._id,
        applicationNumber: app.applicationNumber,
        deadline: app.reviewDeadline,
        hoursOverdue: Math.floor(
          (now.getTime() - new Date(app.reviewDeadline).getTime()) /
            (1000 * 60 * 60)
        ),
        applicant: {
          name: `${(app as any).userId.firstName} ${
            (app as any).userId.lastName
          }`,
          email: (app as any).userId.email,
        },
        pendingDSAs: (app as any).assignedDSAs
          .filter(
            (_: PopulatedUser, index: number) =>
              app.dsaReviews[index]?.status === "pending"
          )
          .map((dsa: PopulatedUser) => ({
            name: `${dsa.firstName} ${dsa.lastName}`,
            email: dsa.email,
          })),
      })),
      upcomingDeadlines: upcomingDeadlines.map((app) => ({
        applicationId: app._id,
        applicationNumber: app.applicationNumber,
        deadline: app.reviewDeadline,
        hoursRemaining: Math.floor(
          (new Date(app.reviewDeadline).getTime() - now.getTime()) /
            (1000 * 60 * 60)
        ),
        applicant: {
          name: `${(app as any).userId.firstName} ${
            (app as any).userId.lastName
          }`,
          email: (app as any).userId.email,
        },
        pendingDSAs: (app as any).assignedDSAs
          .filter(
            (_: PopulatedUser, index: number) =>
              app.dsaReviews[index]?.status === "pending"
          )
          .map((dsa: PopulatedUser) => ({
            name: `${dsa.firstName} ${dsa.lastName}`,
            email: dsa.email,
          })),
      })),
      summary: {
        overdueCount: overdueApplications.length,
        upcomingCount: upcomingDeadlines.length,
      },
    });
  } catch (error) {
    logError("Error fetching deadline info", error);
    console.error("Error fetching deadline info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
