// src/lib/server/validation.ts
import { z } from 'zod';

export function sanitizeString(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

const DepartmentEnum = z.enum([
  'dean', 'hod', 'exams_records', 'bursary',
  'library', 'medical', 'alumni', 'senate',
]);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email:    z.string().email('Invalid email address').max(254).transform(v => v.toLowerCase().trim()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const RegisterStudentSchema = z.object({
  name:           z.string().min(2).max(120).transform(v => sanitizeString(v)),
  email:          z.string().email().max(254).transform(v => v.toLowerCase().trim()),
  password:       z.string().min(8).max(128),
  matricNumber:   z.string().min(5).max(20)
                    .regex(/^[A-Z0-9\/\-]+$/i, 'Invalid matric number format')
                    .transform(v => v.toUpperCase().trim()),
  faculty:        z.string().min(2).max(100).transform(v => sanitizeString(v)),
  programme:      z.string().min(2).max(100).transform(v => sanitizeString(v)),
  graduationYear: z.coerce.number().int().min(2000).max(new Date().getFullYear() + 2),
});

// ─── Admin management (used by graduate_admin routes) ─────────────────────────
export const CreateAdminSchema = z.object({
  name:       z.string().min(2).max(120).transform(v => sanitizeString(v)),
  email:      z.string().email().max(254).transform(v => v.toLowerCase().trim()),
  password:   z.string().min(10).max(128),
  department: DepartmentEnum,
  adminNote:  z.string().max(300).optional().transform(v => v ? sanitizeString(v) : v),
});

export const UpdateAdminSchema = z.object({
  adminId:    z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
  name:       z.string().min(2).max(120).optional().transform(v => v ? sanitizeString(v) : v),
  department: DepartmentEnum.optional(),
  adminNote:  z.string().max(300).optional().transform(v => v ? sanitizeString(v) : v),
  active:     z.coerce.boolean().optional(),
});

export const DeleteAdminSchema = z.object({
  adminId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
});

// ─── Review (used by admin routes) ───────────────────────────────────────────
export const ReviewSchema = z.object({
  requestId:  z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID'),
  department: DepartmentEnum,
  action:     z.enum(['approve', 'reject']),
  comment:    z.string().max(500).optional().transform(v => v ? sanitizeString(v) : v),
});

export type LoginInput           = z.infer<typeof LoginSchema>;
export type RegisterStudentInput = z.infer<typeof RegisterStudentSchema>;
export type CreateAdminInput     = z.infer<typeof CreateAdminSchema>;
export type ReviewInput          = z.infer<typeof ReviewSchema>;
