import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      firstName: string;
      lastName: string;
      phone: string;
      bankName?: string;
      dsaId?: string;
      isActive: boolean;
      isVerified: boolean;
      profilePicture?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    firstName: string;
    lastName: string;
    phone: string;
    bankName?: string;
    dsaId?: string;
    isActive: boolean;
    isVerified: boolean;
    profilePicture?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    firstName: string;
    lastName: string;
    phone: string;
    bankName?: string;
    dsaId?: string;
    isActive: boolean;
    isVerified: boolean;
    profilePicture?: string;
  }
}
