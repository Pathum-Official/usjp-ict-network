export type Role = 'student' | 'rep' | 'academic_rep' | 'treasurer' | 'super_admin' | 'media_rep';

export interface User {
  uid: string;
  email: string;
  publicEmail?: string;
  name: string;
  regNo?: string;
  cohortId: string;
  role: Role;
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  photoURL?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  currentAddress?: string;
  dob?: string;
  degree?: string;
  school?: string;
  combination?: string;
  jobCompany?: string;
  jobPosition?: string;
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    github?: string;
    instagram?: string;
    youtube?: string;
  };
}

export interface Cohort {
  id: string; // e.g., 'ict-2022'
  name: string;
  intakeYear: number;
  isActive: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  cohortId: string;
  createdAt: number;
  createdBy: string;
}

export interface Resource {
  id: string;
  title: string;
  moduleCode: string;
  subject: string;
  driveFileId: string;
  driveViewUrl: string;
  cohortId: string;
  category: 'notes' | 'past_papers';
}

export interface Finance {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  receiptUrl?: string;
  date: string;
  cohortId: string;
}

export interface Complaint {
  id: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved';
  cohortId: string;
  createdAt: number;
  // Intentionally omitting uid for anonymity
}
