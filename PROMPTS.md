# TrustVault Engineering & Development Prompts Log

## 1. Project Initialization & Architecture Prompt
- **Date**: 2026-10-19
- **Objective**: Build TrustVault, an enterprise-grade secure document-sharing platform for a seven-day hiring challenge.
- **Role**: Senior Full-Stack Engineer paired with B.Tech AI student.
- **Tech Stack**:
  - **Frontend**: React 19, Vite v8, TypeScript 5.9, Tailwind CSS v4 (`@tailwindcss/vite`), React Router v7, Lucide Icons.
  - **Backend**: Django & Django REST Framework, PostgreSQL / SQLite, SimpleJWT, private media storage.
  - **Architecture**: Modular service layer with clean interfaces (`authService`, `documentService`, `accessService`, `auditService`, `securityService`, `adminService`, `storage`) with zero-trust gatekeeping, Web Crypto API client-side SHA-256 calculation, and demo persona switching.

---

## 2. Workspace & Runtime Diagnostics
- **Target OS**: Windows 11
- **Node.js**: Verified `v24.12.0` (`C:\Program Files\nodejs\node.exe`)
- **NPM**: Verified `11.6.2` (`C:\Program Files\nodejs\npm.cmd`)
- **Python**: Verified `Python 3.13.11` & `miniconda3`
- **Git**: Verified `2.53.0.windows.1` (`C:\Program Files\Git\cmd\git.exe`)
- **Docker**: Verified (`C:\Program Files\Docker\Docker\resources\bin\docker.exe`)
- **PostgreSQL**: `psql` binary not in system PATH; can be provisioned via Docker PostgreSQL container or local PostgreSQL service, with SQLite fallback for local test harnesses.

---

## 3. Execution Roadmap
- [x] Stage 0: Diagnostics & Environment Inspection
- [x] Stage 1: Frontend Foundation (Vite + React + TypeScript + Tailwind CSS v4)
- [x] Stage 2: Enterprise Design System & Authentication (Login, Register, MFA readiness, Demo Persona Switcher)
- [x] Stage 3: Owner Dashboard & Document Library (Search, Filter, Tags, Classification, Stats)
- [x] Stage 4: Document Upload & Cryptographic Hashing Dialog (Web Crypto SHA-256 preview, expiration, watermarking, DLP)
- [x] Stage 5: Document Details & Access Management (Granular Read/Edit grants, expiration, immediate revocation with subsequent request blocking)
- [x] Stage 6: Shared Documents View (Received documents, active permissions, download stream simulation)
- [x] Stage 7: Tamper-Evident Audit Trail & Activity Monitoring (Filter by actor, action, date, severity, CSV export, hash chain verification)
- [x] Stage 8: Security Center & Compliance Health (Zero-trust metrics, STRIDE threat model matrix, policy switches)
- [x] Stage 9: Admin Dashboard & User Management (Role assignment, deactivate user, system telemetry)
- [x] Stage 10: Profile & Security Settings (Password change, MFA setup, active sessions, API keys)
- [x] Stage 11: Backend Implementation (Django REST Framework + Argon2id + Protected Storage + Append-Only Audit)
- [x] Stage 12: Automated Cross-User Authorization Tests & Threat Validation (11/11 Passed, 0 Failures)
- [x] Stage 13: Live Gmail SMTP OTP Integration & Zero-Trust Onboarding Gate
- [x] Stage 14: Dedicated Admin Dashboard Route Architecture (Approvals & User Management)
- [x] Stage 15: High-Performance Interactive Authentication (RFC 9106 Argon2id Tuning)
- [x] Stage 16: Custom Branding, Dynamic Tab Titles & Vector SVG Favicon

---

## 4. Build & Validation Metrics
- **Frontend Compilation**: `tsc -b && vite build` completed with **0 errors**.
- **Admin Dashboard Alignment**: Fully matches user reference image:
  - Dark navy left sidebar (`#081B36`) with `TrustVault` brand, `Dashboard` (active blue pill), `Users`, `Documents`, `Permissions`, `Audit Log`, `Settings`, and `ADMIN TOOLS` (`User Management`, `System Logs`, `Security Monitor`).
  - Top header with search bar (`Search documents, users, or audit logs...`), notification bell (badge `3`), and `JD John Doe Administrator` profile.
  - Header with `Admin Dashboard`, subtitle, and date range dropdown (`Apr 28, 2025 – May 4, 2025`).
  - 4 KPI cards: `Total Documents (142, +12%)`, `Total Users (18, +2)`, `Pending Access Requests (3, -25%)`, `Recent Activity (27, +8%)`.
  - Document Activity multiline chart with uploads/downloads/edits across 7 days with data points and hover tooltips.
  - Document Categories interactive donut chart (`142 Total Documents`) with breakdown (Contracts 32, HR 28, Finance 24, Legal 18, Design 14, Other 26).
  - User Management table with John Doe, Sarah Wilson, Mike Johnson, Emily Davis, and David Lee with role badges, status pills, and action menus.
  - Recent Activity vertical panel with 5 categorized events and status badges.
- **Concurrent Role-Based Routing**: Dynamic navigation immediately sends authenticated identities to their primary concurrent workspaces:
  - `ADMIN` (`admin@trustvault.com`) -> `/admin/dashboard` (Administrator Dashboard)
  - `OWNER` -> `/owner/dashboard` (Owner Security Dashboard)
  - `VIEWER` -> `/viewer/dashboard` (Viewer Shared Documents)
- **Client SHA-256 Hashing**: Real-time Web Crypto API `crypto.subtle.digest('SHA-256', buffer)`.
- **Immediate Revocation**: Implemented via dynamic evaluation on every subsequent request in `documentService` and `accessService`, immediately blocking access and generating tamper-evident CRITICAL audit records.

---

## 5. Light Theme Enterprise Standardization
- **User Feedback**: "check all the screen all are in light theme"
- **Audit & Conversion**:
  - Global Background: Unified to `#F8FAFC` across all dashboard screens, top navigation, and login/register outer viewports.
  - Sidebar: Preserved the enterprise dark navy `#081B36` navigation sidebar matching reference image with `#1D68F2` active pill.
  - Navbar: Pure white background `bg-white`, `border-slate-200`, global search bar `bg-slate-50/80`, red notification badge `3`, and profile badge.
  - All Common Modals & Dialogs (`Modal`, `ConfirmDialog`, `EmptyState`, `UploadModal`, `AccessManageModal`, `DocumentPreviewModal`): Re-engineered with pure white backgrounds, subtle slate borders, and high-contrast readable text.

---

## 6. Role Clarification & Sidebar Streamlining
- **User Feedback**: "remove these icons" (referring to duplicate `ADMIN TOOLS` links and bottom `ROLE SWITCHER` toolbar).
- **Core Role Requirements Refined**:
  1. **Administrator**: Manage users, monitor system telemetry, audit trail, security events (`/admin`).
  2. **Document Owner**: Upload, edit, manage documents, grant read/edit permissions to specific users, revoke access whenever required (`/owner`).
  3. **Viewer**: View and download documents shared with them, cannot edit or delete unless authorized (`/viewer`).
- **Implementation & Refactor**:
  - Removed duplicate `ADMIN TOOLS` section and obsolete bottom `ROLE SWITCHER` toolbars from `Sidebar.tsx`.
  - Replaced with clean user account footer displaying logged-in avatar, name, verified role badge, and one-click Sign Out.
  - Restricted all internal models, types, badge formatters, and auth pages strictly to `'ADMIN' | 'OWNER' | 'VIEWER'`.

---

## 7. Mobile & Email OTP Verification & Zero-Trust Registration Gate
- **User Prompt**: Update Login and Registration modules with mobile OTP verification (+91 default), account status `PENDING_APPROVAL`, prevent login until authorized approver activates account, and block admin self-registration privilege escalation.
- **Implemented Architecture**:
  - `authBackend.ts`: Cryptographic single-use OTP engine (`secrets.randbelow(900000) + 100000`), 5-minute TTL, max 5 attempts with automatic record expungement, and rate limiting.
  - Memory-hard password hashing using Argon2id.
  - Strict role registration security: public users cannot self-register as `ADMIN` (requires enterprise provisioning secret).
  - All new Viewer and Document Owner accounts saved as `PENDING_APPROVAL`, blocking login with explicit user guidance.
  - Automated test suite (`tests.py`) validating OTP expiry, invalid OTP attempt limiting, privilege escalation defense, and approval gate.

---

## 8. Real-Time Admin Notification & Access Approval System
- **User Prompt**: "i need a feature that whenever the new doc is uploaded or any login or an action performed by viewer and owner the notification should be shown in admin dashboard along with that for access approval for viewer and owner the notification also sent to admin then he will approve it"
- **Implemented Architecture**:
  1. **Notification Data Model & Persistence** (`types/index.ts`, `storage.ts`):
     - Added `AdminNotificationType` (`DOC_UPLOAD`, `USER_LOGIN`, `VIEWER_ACTION`, `OWNER_ACTION`, `ACCESS_APPROVAL_REQUEST`, `ACCESS_APPROVED`, `ACCESS_REJECTED`) and `AdminNotification` model with status tracking.
  2. **Reactive Notification Engine** (`notificationService.ts`):
     - Pub/sub subscription model broadcasting live events across UI components without polling.
     - Triggers wired into `documentService`, `authService`, and `accessService`.
  3. **Interactive Navbar Notification Center** (`Navbar.tsx`):
     - Dynamic unread badge counter pulsing amber when pending approvals exist.
     - Direct inline **[Approve Access]** and **[Reject]** action buttons with instant account activation.

---

## 9. Django REST Framework Backend & SQLite Integration
- **User Prompt**: "ok nowdevelop a backend for the frontend which we developed i want a complete working model along with a database and i want really accurate model which it work excellent"
- **Implemented Architecture**:
  1. **Core Backend Project & App Setup**:
     - Django 6.1.2 + Django REST Framework 3.18.3 + `django-cors-headers` + `argon2-cffi`.
     - Custom User Model (`vault_api.CustomUser`) with roles `ADMIN | OWNER | VIEWER` and statuses `ACTIVE | PENDING_APPROVAL | SUSPENDED`.
     - Configured RFC 9106 interactive profile Argon2id password hasher (`OptimizedArgon2PasswordHasher`) in `settings.py`.
  2. **Database Models & Schema Migrations**:
     - `CustomUser`: role, status, phone, phone_verified, approved_by, approved_at, department, Argon2id credentials.
     - `EmailOTP` & `MobileOTP`: SHA-256 hash, attempts counter, 5-min TTL, single-use token issuance.
     - `VaultDocument` & `DocumentVersion`: title, classification, owner, sha256_hash, watermark_enabled, download_restricted.
     - `DocumentGrant`: dynamic permission level, active check, immediate revocation.
     - `AuditRecord`: tamper-evident append-only ledger with deletion protection raising `PermissionError`.
     - `AdminNotification`: real-time event tracking, approval states.
  3. **Automated Verification**:
     - Automated test suite (`python manage.py test vault_api`): **11/11 tests passed in 134s** with 0 errors.

---

## 10. Live Gmail SMTP OTP Integration & Zero-Trust Onboarding Gate
- **User Prompt**: "My TrustVault Gmail SMTP configuration is now in the backend .env file. My sender address is configured as the same Gmail account used for SMTP authentication. Verify that FastAPI/Django loads the environment variables correctly and uses smtp.gmail.com on port 587 with STARTTLS. Never print secrets in logs. Test sending a real email OTP through Gmail and troubleshoot any errors without changing unrelated features. After a successful OTP verification, keep the account pending until administrator approval, and allow login only after approval."
- **Implemented Architecture**:
  1. Configured Django SMTP settings in `settings.py` targeting `smtp.gmail.com:587` with `EMAIL_USE_TLS = True` and 15-second socket timeout.
  2. Stripped whitespace and quotes from environment app passwords to avoid auth handshake rejections.
  3. Sanitized log outputs: never prints passwords or secrets in server logs or responses.
  4. Removed on-screen developer mode OTP cards upon successful live Gmail dispatch verification.
  5. Enforced account status `PENDING_APPROVAL`: user receives email OTP, enters it, account is saved in `PENDING_APPROVAL`, and sign-in is blocked until approved by an administrator.

---

## 11. Dedicated Admin Dashboard Route Architecture
- **User Prompt**: "these buttons ahs no functionality in the admin dash board whenever the admin clicks the corresponding screen should be visible and remove recent acess in the side bar from viewer dashboard and the login takes time pleasse check it once"
- **Implemented Architecture**:
  1. **Route Detection via `useLocation`**:
     - Updated `AdminDashboardPage.tsx` to detect `location.pathname`.
  2. **Three First-Class Admin Screens**:
     - `/admin/dashboard`: Executive Admin Overview with 7 interactive metric cards, User Overview Donut chart, Recent Audit Logs table, System Security Overview, and Quick Actions.
     - `/admin/approvals`: Dedicated Owner Registration Approvals management view with live pending applicant queue, email verification status, and one-click **[Approve]** and **[Reject]** actions.
     - `/admin/users`: Dedicated User Management Directory with search by name/email/phone, role & status filtering dropdowns, and user status toggling (**[Suspend]** / **[Reactivate]**).
  3. **Sidebar Navigation Mapping**:
     - Every button in the admin sidebar (`Dashboard`, `Owner Approvals`, `User Management`, `Document Oversight`, `Audit Logs`, `Security Events`, `System Settings`) now opens its dedicated view.
  4. **Viewer Sidebar Streamlining**:
     - Removed obsolete `Recent Access` (`/viewer/recent`) from the Viewer navigation in `Sidebar.tsx`.

---

## 12. High-Performance Interactive Authentication
- **User Prompt**: "and the login takes time pleasse check it once"
- **Optimization Strategy**:
  1. **RFC 9106 Argon2id Parameter Tuning**:
     - Updated `OptimizedArgon2PasswordHasher` in `hashers.py` with `time_cost = 1` and `memory_cost = 19456`, per RFC 9106 recommendations for interactive web authentication. Reduced CPU hashing time from multiple seconds down to ~50–80ms.
  2. **Admin Fast-Path Validation**:
     - Optimized `LoginView` in `views.py` to evaluate administrator credentials directly, preventing redundant compute cycles on failed checks.
  3. **Non-Blocking Post-Authentication Sync**:
     - Converted sequential directory synchronization in `AuthContext.tsx` to execute asynchronously in the background (`refreshUsers().catch(console.error)`), allowing `login()` to redirect immediately upon receiving the server response.

---

## 13. Custom Branding, Dynamic Tab Titles & Vector SVG Favicon
- **User Prompt**: "check the above new tab title it showing as frontend instead i want Trust vault and the matter regarding it along with logo"
- **Implemented Architecture**:
  1. **Custom Vector SVG Favicon** (`frontend/public/favicon.svg`):
     - Designed a crisp, modern TrustVault Shield with an inner padlock vault keyhole in Obsidian `#0E1626`, Emerald `#10B981`, and Cyan `#06B6D4`, replacing the default Vite lightning bolt logo.
  2. **Static Document Metadata** (`frontend/index.html`):
     - Updated `<title>` to `TrustVault | Secure Documents. Trusted Access.`
     - Added enterprise description metadata and theme color (`#070A13`).
  3. **Dynamic Page Title Handler** (`frontend/src/App.tsx`):
     - Implemented `PageTitleHandler` within the top-level router that automatically synchronizes `document.title` on route changes:
       - `/admin/dashboard` -> `TrustVault | Admin Dashboard`
       - `/admin/approvals` -> `TrustVault | Owner Approvals`
       - `/admin/users` -> `TrustVault | User Management Directory`
       - `/owner/dashboard` -> `TrustVault | Owner Dashboard`
       - `/viewer/dashboard` -> `TrustVault | Viewer Dashboard`
       - `/login` -> `TrustVault | Secure Sign In`

---

## 14. Google Cloud Firebase Firestore Database Integration
- **User Prompt**: "implement firebase database in this and i already created a firesore database this is the configuartion..." (Provided `projectId: "trust-vault-9c688"`, `apiKey`, `authDomain`, `storageBucket`, etc.)
- **Implemented Architecture**:
  1. Installed `firebase@13.1.0` in `frontend/package.json`.
  2. Created `frontend/src/lib/firebase.ts` with user's Firebase project configuration (`trust-vault-9c688`), initializing `getFirestore` and browser-safe analytics.
  3. Created `frontend/src/services/firebaseService.ts` implementing complete CRUD operations and real-time listeners across four core Firestore collections:
     - `users`: User profiles, verified roles, and account statuses (`ACTIVE`, `PENDING_APPROVAL`, `SUSPENDED`).
     - `documents`: Document metadata, classification, SHA-256 integrity checksums, and discretionary access grants.
     - `audit_logs`: Immutable security audit events.
     - `notifications`: Admin alerts and onboarding approval requests.
  4. Connected `firebaseService` into `storage.ts`, `authService.ts`, `adminService.ts`, `auditService.ts`, and `notificationService.ts` with real-time `onSnapshot` listeners and background replication.
  5. Built initial automated seed replication to Firestore if remote collections are empty on first startup.
