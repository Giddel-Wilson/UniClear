// src/lib/server/models.ts
import mongoose, { Schema, type Document } from 'mongoose';
import type { UserRole, Department, ClearanceStatus } from '$lib/types';

const DEPARTMENT_VALUES: Department[] = [
  'dean', 'hod', 'exams_records', 'bursary',
  'library', 'medical', 'alumni', 'senate',
];

// ─── User ────────────────────────────────────────────────────────────────────
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  department?: Department;  // set for admin / graduate_admin
  matricNumber?: string;
  faculty?: string;
  programme?: string;
  graduationYear?: number;
  /** graduate_admin only — notes about this admin account */
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:         { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String, required: true, unique: true,
      lowercase: true, trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'admin', 'graduate_admin', 'superadmin'],
      default: 'student',
    },
    department:    { type: String, enum: DEPARTMENT_VALUES },
    matricNumber:  { type: String, trim: true, sparse: true },
    faculty:       { type: String, trim: true },
    programme:     { type: String, trim: true },
    graduationYear:{ type: Number },
    adminNote:     { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, department: 1 });

// ─── Clearance Request ───────────────────────────────────────────────────────
export interface IDocument {
  name: string;
  url: string;
  publicId: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface IClearanceItem {
  department: Department;
  status: ClearanceStatus;
  comment?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  documents: IDocument[];
}

export interface IClearanceRequest extends Document {
  student: mongoose.Types.ObjectId;
  academicSession: string;
  graduationYear: number;
  clearances: IClearanceItem[];
  overallStatus: 'in_progress' | 'completed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  name:      { type: String, required: true },
  url:       { type: String, required: true },
  publicId:  { type: String, required: true },
  mimeType:  { type: String, required: true },
  size:      { type: Number, required: true },
  uploadedAt:{ type: Date,   default: Date.now },
});

const ClearanceItemSchema = new Schema<IClearanceItem>({
  department: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_submitted'],
    default: 'not_submitted',
  },
  comment:    { type: String, maxlength: 500 },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  documents:  [DocumentSchema],
});

const ClearanceRequestSchema = new Schema<IClearanceRequest>(
  {
    student:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
    academicSession: { type: String, required: true },
    graduationYear:  { type: Number, required: true },
    clearances:      [ClearanceItemSchema],
    overallStatus: {
      type: String,
      enum: ['in_progress', 'completed', 'rejected'],
      default: 'in_progress',
    },
  },
  { timestamps: true }
);

ClearanceRequestSchema.index({ student: 1, academicSession: 1 }, { unique: true });
ClearanceRequestSchema.index({ overallStatus: 1 });
ClearanceRequestSchema.index({ 'clearances.department': 1, 'clearances.status': 1 });

export const User =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export const ClearanceRequest =
  mongoose.models.ClearanceRequest ||
  mongoose.model<IClearanceRequest>('ClearanceRequest', ClearanceRequestSchema);
