import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Loan Management System",
  description: "Complete loan application management system with multi-bank DSA support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        <ReduxProvider>
          <SessionProvider>
            {children}
            <Toaster />
          </SessionProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
