export enum UserRole {
  Admin = 'ADMIN',
  Student = 'STUDENT'
}

export interface User {
  id: string;
  role: UserRole;
  name?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export interface Student {
  id: string; // HCSXXXX format
  name: string;
  class: number;
  section: string;
  password?: string;
  guardianName: string;
  contact: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  month: string;
  year: number;
  date: string; // ISO string
}

export interface FeeStructure {
  [classLevel: number]: {
    [month: string]: number;
  };
}

export interface ClassFee {
    classLevel: number;
    monthlyFee: number;
    otherFees: { name: string; amount: number }[];
}