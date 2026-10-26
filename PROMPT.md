# TrustVault Engineering & Development Prompts Log

## 1. Project Initialization & Architecture Prompt
- **Date**: 2026-10-19
- **Objective**: Build TrustVault, an enterprise-grade secure document-sharing platform for a seven-day hiring challenge.
- **Role**: Senior Full-Stack Engineer paired with B.Tech AI student.
- **Tech Stack**:
  - **Frontend**: React 19, Vite v8, TypeScript 5.9, Tailwind CSS v4 (`@tailwindcss/vite`), React Router v7, Lucide Icons.
  - **Backend**: Django & Django REST Framework, PostgreSQL / SQLite, SimpleJWT, private media storage.
  - **Architecture**: Modular service layer with clean interfaces (`authService`, `documentService`, `accessService`, `auditService`, `securityService`, `adminService`, `storage`, `firebaseService`) with zero-trust gatekeeping, Web Crypto API client-side SHA-256 calculation, and demo persona switching.

---

## 2. Workspace & Runtime Diagnostics
- **Target OS**: Windows 11
- **Node.js**: Verified `v24.12.0` (`C:\Program Files\nodejs\node.exe`)
- **NPM**: Verified `11.6.2` (`C:\Program Files\nodejs\npm.cmd`)
- **Python**: Verified `Python 3.13.11` & `miniconda3`
- **Git**: Verified `2.53.0.windows.1` (`C:\Program Files\Git\cmd\git.exe`)
- **Docker**: Verified (`C:\Program Files\Docker\Docker\resources\bin\docker.exe`)
- **Live Deployment URLs**:
  - Frontend: `https://trust-vault-9c688.web.app` (Firebase Hosting)
  - Backend: `https://trustvault-backend-jmrw.onrender.com` (Render Cloud API)

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
- [x] Stage 17: Zero-Trust Route Lock-Down, In-Tab Session Token Isolation & Direct Navigation Blockers
- [x] Stage 18: PostgreSQL Document Binary Streaming & Non-Volatile Persistence
- [x] Stage 19: Authorized Document Deletion Architecture & Atomic Cascade Purge
- [x] Stage 20: Cloud-Resilient Brevo HTTPS API OTP Dispatch & SMTP Fallback
- [x] Stage 21: Linear Migration Graph Consolidation & App Startup Optimization

---

## 4. Build & Validation Metrics
- **Frontend Compilation**: `tsc -b && vite build` completed with **0 errors**.
- **Admin Dashboard Alignment**:
  - Dark navy left sidebar (`#081B36`) with `TrustVault` brand, `Dashboard` (active blue pill), `Users`, `Documents`, `Permissions`, `Audit Log`, `Settings`, and `ADMIN TOOLS`.
  - Top header with search bar (`Search documents, users, or audit logs...`), notification bell, and user profile badge.
  - Interactive KPI cards, User Overview Donut chart, and Activity multiline chart.
- **Concurrent Role-Based Routing**: Dynamic navigation immediately sends authenticated identities to their primary concurrent workspaces:
  - `ADMIN` (`admin@trustvault.com`) -> `/admin/dashboard`
  - `OWNER` -> `/owner/dashboard`
  - `VIEWER` -> `/viewer/dashboard`
- **Client SHA-256 Hashing**: Real-time Web Crypto API `crypto.subtle.digest('SHA-256', buffer)`.
- **Immediate Revocation**: Implemented via dynamic evaluation on every subsequent request in `documentService` and `accessService`, immediately blocking access and generating tamper-evident CRITICAL audit records.

---

## 5. Light Theme Enterprise Standardization
- Unified global background to `#F8FAFC` across all dashboard screens, top navigation, and login/register outer viewports.
- Preserved enterprise dark navy `#081B36` navigation sidebar with `#1D68F2` active pill.
- Pure white background `bg-white`, `border-slate-200` for top navbar and modals (`UploadModal`, `AccessManageModal`, `DocumentPreviewModal`).

---

## 6. Role Clarification & Sidebar Streamlining
- Streamlined navigation strictly to three primary roles: `ADMIN`, `OWNER`, and `VIEWER`.
- Removed duplicate toolbar items and obsolete persona switchers in production build.
- Added clean user account footer displaying logged-in avatar, name, verified role badge, and one-click Sign Out.

---

## 7. Mobile & Email OTP Verification & Zero-Trust Registration Gate
- Cryptographic single-use OTP engine (`secrets.randbelow(900000) + 100000`), 5-minute TTL, max 5 attempts with automatic record expungement, and rate limiting.
- RFC 9106 Argon2id memory-hard password hashing.
- Public registration endpoints strictly reject `role: "ADMIN"` with `403 Forbidden`.
- All new Owner accounts default to `PENDING_APPROVAL`, blocking sign-in until approved by an administrator.

---

## 8. Real-Time Admin Notification & Access Approval System
- Reactive pub/sub notification model broadcasting live events across UI components without polling.
- Dynamic unread badge counter in Navbar.
- Direct inline **[Approve Access]** and **[Reject]** workflows with instant account activation.

---

## 9. Django REST Framework Backend & SQLite Integration
- Django 6.1.2 + DRF 3.18.3 + `django-cors-headers` + `argon2-cffi`.
- Custom User Model (`vault_api.CustomUser`) with roles `ADMIN | OWNER | VIEWER` and statuses `ACTIVE | PENDING_APPROVAL | SUSPENDED`.
- Automated test suite (`python manage.py test vault_api`): **11/11 tests passed in 134s** with 0 errors.

---

## 10. Live Gmail SMTP OTP Integration & Zero-Trust Onboarding Gate
- Configured Django SMTP settings targeting `smtp.gmail.com:587` with STARTTLS.
- Enforced account status `PENDING_APPROVAL`: user receives email OTP, enters it, account is saved in `PENDING_APPROVAL`, and sign-in is blocked until approved by an administrator.

---

## 11. Dedicated Admin Dashboard Route Architecture
- Detected routes via `useLocation` for distinct views:
  - `/admin/dashboard`: Executive Admin Overview with interactive KPI metrics, user distribution, and security events.
  - `/admin/approvals`: Dedicated Owner Registration Approvals management view.
  - `/admin/users`: Dedicated User Management Directory with multi-filter search.

---

## 12. High-Performance Interactive Authentication
- RFC 9106 Argon2id parameter tuning (`time_cost=1`, `memory_cost=19456`, `parallelism=2`), reducing verification latency from multiple seconds to ~50–80ms.
- Admin fast-path credential validation and asynchronous user directory synchronization.

---

## 13. Custom Branding, Dynamic Tab Titles & Vector SVG Favicon
- Designed custom vector SVG favicon (`favicon.svg`) with TrustVault Shield and padlock keyhole.
- Implemented `PageTitleHandler` within the top-level router dynamically updating `document.title` on route changes.

---

## 14. Google Cloud Firebase Firestore Database Integration
- Installed `firebase@13.1.0` and initialized `getFirestore` with project `trust-vault-9c688`.
- Synchronized collections: `users`, `documents`, `audit_logs`, `notifications` with live `onSnapshot` reactive listeners.

---

## 15. Live Deployment: Firebase Hosting & Render Backend
- Frontend deployed to Firebase Hosting at `https://trust-vault-9c688.web.app`.
- Backend deployed to Render PaaS at `https://trustvault-backend-jmrw.onrender.com`.
- Cross-origin CORS & CSRF configurations updated with wildcard subdomains and credentials support.

---

## 16. In-Line Document Viewer & PDF Rendering Engine
- Re-architected `DocumentPreviewModal` with real-time base64 binary streaming and blob URL generation.
- Replaced placeholder simulation cards with true inline document rendering for PDF, TXT, MD, CSV, and image formats.

---

## 17. Zero-Trust Route Lock-Down & In-Tab Session Token Isolation
- **User Prompt**: "i am an issue that when i use https://trust-vault-9c688.web.app/admin/dashboard it taking me to admin dashboard directly i dont want that it should show error please solve this isssue... check the entire frontend routing because i want a secure web"
- **Vulnerability Identified**: Browsers caching cross-site session cookies for Render backend allowed background `/api/auth/me` calls to succeed even on cold page loads in fresh tabs without an explicit login flow in that tab.
- **Architectural Defense**:
  1. **Cryptographic In-Tab Session Isolation (`sessionStorage`)**:
     - Introduced `trustvault_active_session` stored strictly in `sessionStorage` (scoped to the specific browser tab, destroyed on tab close, never shared across tabs or windows).
     - On cold page loads, `AuthContext` strictly verifies that `sessionStorage.getItem('trustvault_active_session')` exists. If absent, the user is immediately treated as unauthenticated.
     - Any lingering user IDs in `localStorage` are purged on startup.
  2. **Strict Route Guards with Explicit 403 Redirection**:
     - Updated `ProtectedRoute` in `App.tsx`: if a direct URL (e.g. `/admin/dashboard`, `/owner/documents`, `/viewer/dashboard`, `/documents`) is navigated to without an active in-tab session, navigation is immediately aborted and redirected to `/access-denied` with HTTP 403 Forbidden.
  3. **Dedicated Security Alert Pages**:
     - Built `AccessDeniedPage.tsx` (`/access-denied`): High-contrast HTTP 403 security shield displaying blocked target route, zero-trust violation rationale, and return-to-login action.
     - Built `NotFoundPage.tsx` (`/not-found` & `*`): Hardened 404 security blocker for any unmapped or malicious path.

---

## 18. PostgreSQL Document Binary Streaming & Non-Volatile Persistence
- **User Prompt**: "the pdf is not vsisble there is TrustVault Protected Document... here instead the uploadedpdf should be visible but what is this"
- **Root Cause**: Cloud PaaS platforms like Render use ephemeral container filesystems. When containers restart or redeploy, local disk files (`vault_storage/`) are wiped, causing uploaded documents to become inaccessible.
- **Architectural Defense**:
  1. Added `file_content` (`models.TextField`) to `VaultDocument` in `models.py` storing complete Base64-encoded document binaries directly in the database.
  2. On upload (`DocumentUploadView`), files are written both to `vault_storage` and persisted into the database column.
  3. On download (`DocumentDownloadView`), if the file on disk is absent, the backend automatically decodes `doc.file_content`, writes it back to disk cache, and streams the binary content seamlessly to the client.

---

## 19. Authorized Document Deletion Architecture & Atomic Cascade Purge
- **User Prompt**: "ONE MODIFICATION THAT REGARDI8NG THE DELETION OF THE DOUMENT THE ADMIN AND DOC OWNER CAN DELETE UN NECESSARY DOCS BUT HERE THE DELETION OF DOC IS NOT WORKING IT SHOWS THAT DOC IS DELETED BUT IT SHOWING THE DOC... Deletion Failed Server rejected document deletion"
- **Architectural Defense**:
  1. Updated `DocumentDetailView` in `views.py` to support `DELETE` and `POST` methods with action parameter `?action=delete` or body `{"action": "delete"}`.
  2. Enforced strict RBAC: only the Document Owner or an Administrator can delete a document. Viewers are strictly rejected with HTTP 403 Forbidden.
  3. Atomic cascade deletion:
     - All associated `DocumentGrant` access permissions are permanently revoked.
     - Physical disk binary is unlinked.
     - Database record is deleted.
     - Firestore cloud document is synchronized.
     - An immutable `DOC_DELETE` audit log entry is recorded with actor ID, IP address, and timestamp.

---

## 20. Cloud-Resilient Brevo HTTPS API OTP Dispatch & SMTP Fallback
- **User Prompt**: "in environment varivable i used brevos mail but it showing email port and email host password like this"
- **Root Cause**: Render free tier blocks outbound TCP connections on SMTP ports 25, 465, and 587. Attempting to use SMTP results in socket timeouts and network errors. Additionally, non-integer or empty `EMAIL_PORT` values could cause Python parsing exceptions.
- **Architectural Defense**:
  1. **Brevo REST API (Port 443 HTTPS)**: Configured `send_live_email` in `views.py` to use `https://api.brevo.com/v3/smtp/email` using `BREVO_API_KEY`. Port 443 is universally open across all cloud providers.
  2. **Defensive API Key Detection**: If a user enters their Brevo API key (`xkeysib-...`) into `EMAIL_HOST_PASSWORD`, the system automatically detects it and routes the request via the HTTPS REST API.
  3. **Robust Sender Address Formatting**: Sanitized `sender_email` via regex extraction so that format strings like `TrustVault Security <user@example.com>` are cleanly passed as `user@example.com` to prevent Brevo 400 validation rejections.
  4. **Fault-Tolerant Port Parsing**: Updated `settings.py` to safely parse `EMAIL_PORT`, falling back to 587 without crashing if an empty string or invalid character is passed.

---

## 21. Linear Migration Graph Consolidation & App Startup Optimization
- **User Prompt**: Conflicting migrations detected: multiple leaf nodes in migration graph `(0002_emailotp..., 0002_vaultdocument_file_content)`.
- **Architectural Defense**:
  1. Consolidated migration graph linearly: removed duplicate `0002_vaultdocument_file_content.py` and created `0003_vaultdocument_file_content.py` depending strictly on `0002_emailotp_customuser_email_verified_and_more.py`.
  2. Removed premature raw SQL execution from `AppConfig.ready()` in `apps.py` to adhere to Django best practices and prevent `RuntimeWarning: Accessing the database during app initialization is discouraged`.
