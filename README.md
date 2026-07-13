# UniClear — Graduate Online Clearance System

A full-stack, production-ready online clearance system for graduating university students. Built with **SvelteKit 5 + TypeScript + Tailwind CSS v4 + MongoDB + Cloudinary**, deployable as serverless functions on **Vercel**.

---

## Architecture Overview

```
clearance-system/
├── src/
│   ├── app.css                      # Design tokens, EK motion curves, global component styles
│   ├── app.html                     # HTML shell (DM Sans + DM Serif Display fonts)
│   ├── app.d.ts                     # TypeScript augmentation (App.Locals, App.PageData)
│   ├── hooks.server.ts              # RBAC middleware — blocks students from /admin/*, vice versa
│   ├── lib/
│   │   ├── types.ts                 # Shared TS interfaces, Department enum, constants
│   │   ├── server/
│   │   │   ├── db.ts                # MongoDB singleton (warm reuse across Vercel invocations)
│   │   │   ├── models.ts            # Mongoose schemas: User, ClearanceRequest
│   │   │   ├── auth.ts              # JWT sign/verify, bcrypt, HttpOnly cookie helpers
│   │   │   ├── cloudinary.ts        # Server-side upload with magic-byte validation
│   │   │   └── validation.ts        # Zod schemas (LoginSchema, RegisterStudentSchema, ReviewSchema)
│   │   └── components/
│   │       ├── Navbar.svelte        # Role-aware nav, mobile hamburger menu
│   │       ├── ClearanceStatusCard.svelte  # Per-department status display
│   │       └── UploadModal.svelte   # Drag-and-drop file upload modal
│   └── routes/
│       ├── +layout.server.ts        # Passes user session to all pages
│       ├── +layout.svelte           # Global layout, Navbar
│       ├── +page.svelte             # Landing page
│       ├── auth/
│       │   ├── login/               # Email/password login
│       │   ├── register/            # 2-step student registration
│       │   └── logout/              # Cookie clear + redirect
│       ├── student/
│       │   ├── dashboard/           # Clearance progress, per-dept status grid
│       │   └── upload/              # Server action: validate + upload to Cloudinary
│       └── admin/
│           ├── dashboard/           # Department-filtered list of student requests
│           └── review/[id]/         # Approve/reject individual clearance items
├── .env.example                     # Environment variable template
├── vercel.json                      # Vercel serverless config
├── svelte.config.js                 # @sveltejs/adapter-vercel
└── vite.config.ts                   # Tailwind v4 via @tailwindcss/vite
```

---

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd clearance-system
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, CLOUDINARY_*, ADMIN_REGISTRATION_CODE
```

### 3. Run Locally

```bash
npm run dev
```

---

## Deployment to Vercel

### Prerequisites

- Vercel account
- MongoDB Atlas cluster (free tier works)
- Cloudinary account (free tier: 25GB storage)

### Steps

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Add environment secrets
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
vercel env add ADMIN_REGISTRATION_CODE

# Deploy
vercel --prod
```

The `@sveltejs/adapter-vercel` handles routing SvelteKit's `+page.server.ts` files as Node.js 20 serverless functions automatically.

---

## Security Architecture

### 1. Role-Based Access Control (RBAC)

Every request passes through `src/hooks.server.ts` before hitting any route:

- Students hitting `/admin/*` → 303 redirect to `/student/dashboard`
- Admins hitting `/student/*` → 303 redirect to `/admin/dashboard`
- Unauthenticated requests to protected routes → 303 redirect to `/auth/login`
- Admin actions (approve/reject) verify the admin's department matches the clearance item's department server-side — a Bursary admin cannot approve Library items

### 2. File Upload Security (3-layer validation)

**Layer 1 — MIME type whitelist** (server action):
```
ALLOWED: application/pdf | image/jpeg | image/png | image/webp
```

**Layer 2 — File size limit** (server action):
```
MAX: 5 MB per file, 5 files per upload
```

**Layer 3 — Magic byte verification** (cloudinary.ts):
Reads the actual binary header of each file to confirm it matches the declared MIME type. Prevents attackers from renaming a `.exe` to `.pdf` and uploading it.

### 3. Input Sanitization

All form input passes through **Zod schemas** before touching the database:
- `LoginSchema` — email normalized, length-capped
- `RegisterStudentSchema` — matric number format-enforced (`/^[A-Z0-9\/\-]+$/i`), HTML tags stripped
- `ReviewSchema` — department validated against a strict enum, ObjectId format-checked

Mongoose's typed schema + Zod parameterization eliminates raw string interpolation into DB queries entirely — no SQL/NoSQL injection surface.

### 4. Session Security

- `HttpOnly; Secure; SameSite=Strict` cookie — not accessible to JavaScript, CSRF-resistant
- JWT signed with `HS256` using a 64-byte random secret
- 7-day expiry; logout deletes the cookie with `Max-Age=0`

### 5. SvelteKit CSRF Protection

`svelte.config.js` enables `csrf.checkOrigin: true` — blocks cross-origin form submissions.

---

## Database Schema

### User

| Field | Type | Notes |
|-------|------|-------|
| name | String | HTML-sanitized |
| email | String | Unique, lowercased |
| passwordHash | String | bcrypt, 12 rounds |
| role | Enum | `student \| admin \| superadmin` |
| department | Enum | Admin only — 14 departments |
| matricNumber | String | Unique, uppercase |
| faculty | String | |
| programme | String | |
| graduationYear | Number | |

### ClearanceRequest

| Field | Type | Notes |
|-------|------|-------|
| student | ObjectId → User | |
| academicSession | String | e.g. `2025/2026` |
| graduationYear | Number | |
| clearances | ClearanceItem[] | 14 items, one per department |
| overallStatus | Enum | `in_progress \| completed \| rejected` |

**ClearanceItem** (embedded):
- `department` — enum
- `status` — `not_submitted | pending | approved | rejected`
- `comment` — admin note (max 500 chars)
- `reviewedBy`, `reviewedAt`
- `documents` — array of Cloudinary-uploaded files

---

## Design System

- **Palette**: Apex Clarity — crisp white/blue institutional feel
- **Typography**: DM Serif Display (headings) + DM Sans (body)
- **Motion**: EK Design curves — `cubic-bezier(0.23, 1, 0.32, 1)` for entering elements, `cubic-bezier(0.77, 0, 0.175, 1)` for on-screen movement
- **Animation rules**: UI transitions ≤ 250ms, exit faster than enter, `prefers-reduced-motion` respected, hover gated behind `@media (hover: hover) and (pointer: fine)`
- **Touch targets**: minimum 44×44px on all interactive elements
- **Stagger**: department cards enter with 50ms cascade delays

---

## Adding a New Department

1. Add the value to the `Department` type in `src/lib/types.ts`
2. Add the label to `DEPARTMENT_LABELS`
3. Add it to the Mongoose enum in `src/lib/server/models.ts`
4. Add it to the Zod enum in `src/lib/server/validation.ts`

That's it — the dashboard, upload modal, and admin review pages all derive from the shared type.

---

## Seed: Creating Your First Admin

Since admin registration requires an `ADMIN_REGISTRATION_CODE` env var, you can create admins via a one-time seed script or by temporarily exposing a protected endpoint. Alternatively, connect to MongoDB Atlas and insert a user document directly with `role: "admin"` and the correct `department`.
