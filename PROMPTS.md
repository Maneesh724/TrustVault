# TrustVault Engineering & Development Prompts Log

## 1. Project Initialization & Architecture Prompt
- **Date**: 2026-10-19
- **Objective**: Build TrustVault, an enterprise-grade secure document-sharing platform for a seven-day hiring challenge.
- **Role**: Senior Full-Stack Engineer paired with B.Tech AI student.
- **Tech Stack**:
  - **Frontend**: React 19, Vite v8, TypeScript 5.9, Tailwind CSS v4 (`@tailwindcss/vite`), React Router v7, Lucide Icons.
  - **Backend**: Django & Django REST Framework, PostgreSQL, SimpleJWT, private media storage.
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

---

## 4. Build & Validation Metrics
- **Frontend Compilation**: `tsc -b && vite build` completed in **9.20s** with **0 errors**.
- **Bundle**: `dist/assets/index-CEVmAb59.css` (64.55 kB) & `dist/assets/index-Poww2oAv.js` (455.47 kB).
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
  - `ADMIN` (`admin@trustvault.com` / `john@trustvault.com`) -> `/admin` (Administrator Dashboard)
  - `OWNER` (`sarah@trustvault.com`) -> `/dashboard` (Owner Security Dashboard)
  - `AUDITOR` (`elena.rostova@external-audit.com`) -> `/audit` (Audit Trail)
  - `EDITOR` (`mike@trustvault.com`) -> `/documents` (Document Library)
  - `VIEWER` (`david@trustvault.com` / `emily@trustvault.com`) -> `/shared` (Shared Documents)
- **Client SHA-256 Hashing**: Real-time Web Crypto API `crypto.subtle.digest('SHA-256', buffer)`.
- **Immediate Revocation**: Implemented via dynamic evaluation on every subsequent request in `documentService` and `accessService`, immediately blocking access and generating tamper-evident CRITICAL audit records.

---

## 5. Light Theme Enterprise Standardization
- **User Feedback**: "check all the screen all are in light theme"
- **Audit & Conversion**:
  - Global Background: Unified to `#F8FAFC` across all dashboard screens, top navigation, and login/register outer viewports.
  - Sidebar: Preserved the enterprise dark navy `#081B36` navigation sidebar matching reference image 2 with `#1D68F2` active pill.
  - Navbar: Pure white background `bg-white`, `border-slate-200`, global search bar `bg-slate-50/80`, red notification badge `3`, and profile badge.
  - Admin Dashboard (`/admin`): Fully light `#F8FAFC` background with 4 KPI cards, multiline Document Activity line chart, Donut chart, User Management table, and Recent Activity feed.
  - Document Library (`/documents`): Converted to light theme cards, white filter control bar, search input, scope tabs (`All`, `Owned by Me`, `Shared With Me`), and classification filter pills.
  - Document Details (`/documents/:id`): Converted to white cards, high-contrast typography, light zero-trust access denied screen (`bg-white border-rose-200`), metadata grid, version history, and document-specific audit trail.
  - Shared Documents (`/shared`): Converted to light white cards with slate borders, high-contrast headings, and action buttons.
  - Owner Dashboard (`/dashboard`): Converted to white welcome card, light KPI cards, STRIDE mitigation alert banner, and real-time audit activity feed.
  - Security Center (`/security`): Converted to white health score card, light threat mitigation incident cards, STRIDE architecture matrix table, and zero-trust policy toggle switches.
  - Profile Settings (`/settings`): Converted to white identity card, light MFA enforcement toggle, active login sessions, and scoped API key generator.
  - Audit Trail (`/audit`): Converted to white table, filter control bar, hash chain verification indicator, and light JSON payload viewer modal.
  - Authentication Screens (`/login`, `/register`): Converted to split layout with navy `#081B36` left brand panel and crisp white `#FFFFFF` right form panel over a `#F8FAFC` background.
  - All Common Modals & Dialogs (`Modal`, `ConfirmDialog`, `EmptyState`, `UploadModal`, `AccessManageModal`, `DocumentPreviewModal`): Re-engineered with pure white backgrounds, subtle slate borders, and high-contrast readable text.

---

## 6. Role Clarification & Sidebar Streamlining
- **User Feedback**: "remove these icons" (referring to `media_1792406102088_f5f599e5.png` showing duplicate `ADMIN TOOLS` links and bottom `ROLE SWITCHER` toolbar).
- **Core Role Requirements Refined**:
  1. **Administrator**: Manage users, monitor system telemetry, audit trail, security events (`/admin`).
  2. **Document Owner**: Upload, edit, manage documents, grant read/edit permissions to specific users, revoke access whenever required (`/dashboard`, `/documents`).
  3. **Viewer**: View and download documents shared with them, cannot edit or delete unless authorized (`/shared`).
  - Single common Login & Registration entry point automatically routing authenticated users to their concurrent role workspace.
- **Implementation & Refactor**:
  - Removed duplicate `ADMIN TOOLS` section and obsolete bottom `ROLE SWITCHER` toolbars from `Sidebar.tsx`.
  - Replaced with clean user account footer displaying logged-in avatar, name, verified role badge, and one-click Sign Out.
  - Added quick interactive profile menu in `Navbar.tsx` for easy persona switching and profile management.
  - Restricted all internal models, types, mock databases, badge formatters, and auth pages strictly to `'ADMIN' | 'OWNER' | 'VIEWER'`.

---

## 7. Mobile OTP Verification & Zero-Trust Registration Gate
- **User Prompt**: Update Login and Registration modules with mobile OTP verification (+91 default), account status `PENDING_APPROVAL`, prevent login until authorized approver activates account, and block admin self-registration privilege escalation.
- **Implemented Architecture**:
  - `authBackend.ts`: Cryptographic single-use OTP engine (`crypto.randomInt(100000, 1000000)`), 5-minute TTL, max 5 attempts with automatic record expungement, and rate limiting.
  - Development SMS provider clearly labelled without fabricated SMS claims.
  - Memory-hard password hashing using `crypto.scrypt` (N=16384, r=8, p=1).
  - Strict role registration security: public users cannot self-register as `ADMIN` (requires enterprise provisioning secret).
  - All new Viewer and Document Owner accounts saved as `PENDING_APPROVAL`, blocking login with explicit user guidance.
  - Automated test suite (`tests/auth.test.ts`) validating OTP expiry, invalid OTP attempt limiting, privilege escalation defense, and approval gate.

---

## 8. Real-Time Admin Notification & Access Approval System
- **User Prompt**: "i need a feature that whenever the new doc is uploaded or any login or an action performed by viewer and owner the notification should be shown in admin dashboard along with that for access approval for viewer and owner the notification also sent to admin then he will approve it"
- **Implemented Architecture**:
  1. **Notification Data Model & Persistence** (`types/index.ts`, `storage.ts`, `mockData.ts`):
     - Added `AdminNotificationType` (`DOC_UPLOAD`, `USER_LOGIN`, `VIEWER_ACTION`, `OWNER_ACTION`, `ACCESS_APPROVAL_REQUEST`, `ACCESS_APPROVED`, `ACCESS_REJECTED`) and `AdminNotification` model with status tracking.
     - Persistent storage in localStorage with initial seed data matching real-world enterprise operations.
  2. **Reactive Notification Engine** (`notificationService.ts`):
     - Pub/sub subscription model broadcasting live events across UI components without polling.
     - Triggers wired into `documentService` (uploads, views, downloads, deletions), `authService` (logins, registrations), and `accessService` (grant creation, updates, immediate revocations).
     - Single-click `approveAccess()` and `rejectAccess()` methods that transition user accounts to `ACTIVE` and notify all listeners.
  3. **Interactive Navbar Notification Center** (`Navbar.tsx`):
     - Dynamic unread badge counter pulsing amber when pending approvals exist.
     - Filter tabs: `All`, `Approvals`, `Docs`, `Activity`.
     - Direct inline **[Approve Access]** and **[Reject]** action buttons with instant account activation and toast feedback.
  4. **Admin Dashboard Real-Time Integration** (`AdminDashboardPage.tsx`):
     - Dynamic **Pending Access Requests** KPI card displaying real-time counts.
     - Highlighted **Access Approvals Required** banner for one-click admin authorization.
     - Interactive **Live Activity Feed** streaming all Viewer and Document Owner actions in real time.
     - User Management table highlighting `Pending Approval` accounts with instant row-level approval buttons.
  5. **Automated Verification**:
     - `tsc -b` passed with 0 errors.
     - Full production build `npm run build` generated cleanly.
     - Automated test suite (`npm test`) passing 5/5 tests with 0 failures.

---

## 9. Django REST Framework Backend & SQLite Integration
- **User Prompt**: "ok nowdevelop a backend for the frontend which we developed i want a complete working model along with a database and i want really accurate model which it work excellent"
- **Implemented Architecture**:
  1. **Core Backend Project & App Setup**:
     - Django 6.1.2 + Django REST Framework 3.18.3 + `django-cors-headers` + `argon2-cffi`.
     - Custom User Model (`vault_api.CustomUser`) with roles `ADMIN | OWNER | VIEWER` and statuses `ACTIVE | PENDING_APPROVAL | SUSPENDED`.
     - Configured RFC 9106 interactive profile Argon2id password hasher (`OptimizedArgon2PasswordHasher`, time=2, mem=19MB, parallel=2) in `settings.py`.
  2. **Database Models & Schema Migrations**:
     - `CustomUser`: role, status, phone, phone_verified, approved_by, approved_at, department, Argon2id credentials.
     - `MobileOTP`: SHA-256 hash, attempts counter, 5-min TTL, single-use token issuance.
     - `VaultDocument` & `DocumentVersion`: title, classification, owner, sha256_hash, watermark_enabled, download_restricted.
     - `DocumentGrant`: dynamic permission level, active check, immediate revocation.
     - `AuditRecord`: tamper-evident append-only ledger with deletion protection raising `PermissionError`.
     - `AdminNotification`: real-time event tracking, approval states.
     - `SecurityPolicy` & `ThreatAlert`.
  3. **REST API Endpoints** (`vault_api/views.py` & `urls.py`):
     - `POST /api/auth/send-otp`: 5-min TTL, rate-limited (max 3/window), dev mode fallback with clear notices.
     - `POST /api/auth/verify-otp`: SHA-256 hash check, single-use token, max 5 attempts invalidation.
     - `POST /api/auth/register`: verifies token, blocks admin privilege escalation with 403, sets `PENDING_APPROVAL`, alerts admin.
     - `POST /api/auth/login`: checks status (blocks pending and suspended accounts with 403), verifies Argon2id password, sets session.
     - `GET /api/auth/me`: live status check on every request (revokes session if status changes).
     - `GET /api/auth/pending-users`, `POST /api/auth/approve`, `POST /api/auth/reject`: full admin approval lifecycle.
     - `GET/POST /api/documents/`: list, upload with SHA-256 hashing.
     - `POST /api/documents/<id>/grant`, `POST /api/documents/<id>/revoke`: immediate grant and revocation.
     - `GET /api/documents/<id>/download`: dynamically evaluates active grants per request; denies revoked users with 403.
     - `GET /api/audit`: compliance audit trail.
     - `GET /api/notifications`: live admin notification stream.
  4. **Automated Verification**:
     - Database seed script (`seed_data.py`) initialized personas, documents, grants, policies, and notifications.
     - Automated test suite (`python manage.py test vault_api`): **11/11 tests passed in 134s** with 0 errors.
     - End-to-end integration test (`backend/test_integration.py`): all 9 verification steps completed with 100% success.
     - Frontend TypeScript type check (`npx tsc -b`): **0 errors**.
     - Vite proxy configured to route `/api/*` to `http://127.0.0.1:8000/`.

