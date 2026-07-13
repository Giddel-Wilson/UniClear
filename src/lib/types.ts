// src/lib/types.ts
export type UserRole = 'student' | 'admin' | 'graduate_admin' | 'superadmin';

/**
 * Every clearance checkpoint a graduating student must pass.
 *
 *   dean            – Dean of the Faculty (academic sign-off)
 *   hod             – Head of Department
 *   exams_records   – Exams & Records / Registry (confirms result sheets, transcripts)
 *   bursary         – School fees / outstanding balances
 *   library         – Overdue books / library fines
 *   medical         – Medical records, outstanding bills
 *   alumni          – Alumni registration
 *   senate          – Senate/Academic Board final clearance
 */
export type Department =
  | 'dean'
  | 'hod'
  | 'exams_records'
  | 'bursary'
  | 'library'
  | 'medical'
  | 'alumni'
  | 'senate';

export type ClearanceStatus = 'pending' | 'approved' | 'rejected' | 'not_submitted';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: Department;
  matricNumber?: string;
  faculty?: string;
  programme?: string;
  createdAt: Date;
}

export interface ClearanceItem {
  department: Department;
  status: ClearanceStatus;
  comment?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  documents: UploadedDocument[];
}

export interface UploadedDocument {
  _id: string;
  name: string;
  url: string;
  publicId: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface ClearanceRequest {
  _id: string;
  student: User;
  academicSession: string;
  graduationYear: number;
  clearances: ClearanceItem[];
  overallStatus: 'in_progress' | 'completed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: Department;
  matricNumber?: string;
}

export const DEPARTMENT_LABELS: Record<Department, string> = {
  dean:          'Dean of Faculty',
  hod:           'Head of Department',
  exams_records: 'Exams & Records (Registry)',
  bursary:       'Bursary',
  library:       'Library',
  medical:       'Medical Centre',
  alumni:        'Alumni Association',
  senate:        'Senate / Academic Board',
};

/** Ordered list — students see them in this sequence on their dashboard */
export const ALL_DEPARTMENTS: Department[] = [
  'dean',
  'hod',
  'exams_records',
  'bursary',
  'library',
  'medical',
  'alumni',
  'senate',
];

/** Every department is mandatory in this configuration */
export const MANDATORY_DEPARTMENTS: Department[] = [...ALL_DEPARTMENTS];

export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
