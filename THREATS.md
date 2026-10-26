# TrustVault — Threat Model & Security Architecture Matrix

<p align="center">
  <img src="frontend/public/favicon.svg" alt="TrustVault Logo" width="64" height="64" />
</p>

## 1. Executive Summary & Zero-Trust Posture

TrustVault is a zero-trust enterprise document-sharing platform engineered to operate under the assumption that the network perimeter is compromised. Traditional perimeter-based security is replaced by continuous identity verification, hardware-grade password hashing, dual-token cryptographic OTPs, mandatory administrative approvals, discretionary document grants, and immutable audit logs.

This document formalizes the threat landscape using the **STRIDE** methodology (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) defined by Microsoft and aligns with **NIST SP 800-207 Zero-Trust Architecture**.

---

## 2. STRIDE Threat Analysis Matrix

| Threat Category | Potential Attack Vector | TrustVault Mitigation Architecture | Verification Method & Implementation |
| :--- | :--- | :--- | :--- |
| **Spoofing Identity** | • Credential stuffing against corporate accounts.<br>• Session hijacking via intercepted tokens.<br>• Forged or intercepted email OTP codes. | • **Argon2id Key Derivation**: RFC 9106 tuned memory-hard hashing (`time_cost=1`, `memory_cost=19456`, `parallelism=2`) prevents GPU/ASIC cracking.<br>• **Single-Use Cryptographic OTP**: 6-digit random codes (`secrets.randbelow`), salted SHA-256 storage, strict 5-min TTL, rate-limited to 5 invalid attempts.<br>• **Secure HttpOnly Sessions**: Cookie-based server-side session management prevents XSS token theft. | • Verified in `tests.py::test_send_otp_success_and_rate_limiting`<br>• Verified in `tests.py::test_email_otp_flow_and_rate_limiting`<br>• Evaluated in `hashers.py` |
| **Tampering with Data** | • Parameter manipulation of document grant IDs.<br>• Modification of stored files in the vault.<br>• Ephemeral cloud disk wipes causing file corruption.<br>• Tampering with audit logs to hide unauthorized activity. | • **SHA-256 Cryptographic Checksums**: Calculated on client (`Web Crypto API`) and recomputed on server upon ingestion.<br>• **Dual Binary Persistence**: Stored both as non-deterministic UUIDs on disk and as Base64 in PostgreSQL/SQLite `file_content`, surviving container recycles.<br>• **Database-Level Immutability**: `AuditRecord.delete()` and `.update()` raise `PermissionError`. | • Verified in `tests.py::test_audit_record_immutable`<br>• Verified in `models.py::VaultDocument`<br>• Tested in `views.py::DocumentUploadView` |
| **Repudiation** | • Users denying they uploaded, viewed, downloaded, deleted, or revoked access to documents.<br>• Admins denying approval or rejection of onboarding requests. | • **Tamper-Evident Audit Ledger**: Every action logs Actor ID, Name, Role, IP Address, User-Agent, Target Resource, Timestamp, and Outcome (`SUCCESS`, `DENIED`, `FAILED`).<br>• Immutable timestamping using UTC timezone standards. | • Verified in `tests.py::test_audit_record_immutable`<br>• Monitored live in `/admin/audit-logs` |
| **Information Disclosure** | • Insecure Direct Object References (IDOR) on document downloads.<br>• Stale token reuse after an owner revokes access.<br>• Direct URL deep-linking by unauthenticated actors into `/owner/documents` or `/admin/dashboard`. | • **Dynamic Access Evaluation**: Every download request executes a fresh relational query verifying an `ACTIVE` grant.<br>• **Immediate Revocation**: Revoking a grant immediately sets status to `REVOKED`, returning `403 Forbidden` on the very next byte stream.<br>• **In-Tab Cryptographic Session Isolation**: `sessionStorage` token `trustvault_active_session` prevents cold-load direct URL bypassing, immediately redirecting unauthenticated requests to `/access-denied` (403). | • Verified in `tests.py::test_dynamic_document_grant_and_immediate_revocation`<br>• Implemented in `App.tsx::ProtectedRoute`<br>• Implemented in `views.py::DocumentDownloadView` |
| **Denial of Service** | • OTP request spamming to exhaust SMS/email budgets.<br>• Cloud host firewall blocking outbound SMTP ports (25, 465, 587).<br>• Brute-forcing OTP verification codes. | • **Rate Limiting**: Maximum 3 OTP dispatches per 5-minute rolling window per email.<br>• **Attempt Invalidation**: Maximum 5 incorrect OTP attempts before code is permanently expunged.<br>• **Brevo HTTPS REST API (Port 443)**: Guaranteed cloud delivery immune to outbound SMTP firewall blocking. | • Verified in `tests.py::test_verify_otp_invalid_code_and_attempt_limit`<br>• Verified in `tests.py::test_otp_expiration`<br>• Implemented in `views.py::send_live_email` |
| **Elevation of Privilege** | • Public users registering directly as `ADMIN`.<br>• Document Viewers attempting to upload, delete, or alter permissions.<br>• Direct URL navigation attempting to render admin or owner UI screens without logging in. | • **Zero Public Admin Registration**: Public API endpoints explicitly reject `role: "ADMIN"` with `403 Forbidden`.<br>• **Mandatory Approval Gate**: All public owner signups default to `PENDING_APPROVAL` and cannot sign in until approved.<br>• **Strict RBAC Routing**: Frontend `ProtectedRoute` and backend DRF views reject unauthorized role access with `403 Forbidden`.<br>• **Controlled Deletion**: Only the Document Owner or an Administrator can delete documents. | • Verified in `tests.py::test_registration_anti_privilege_escalation`<br>• Verified in `tests.py::test_registration_mandatory_dual_verification_and_default_owner`<br>• Implemented in `App.tsx` and `views.py::DocumentDetailView` |

---

## 3. Deep-Dive Security Architecture & Defense In Depth

### 3.1 Direct URL Bypass Remediation & In-Tab Session Isolation
- **Threat Vector**: An unauthenticated user or an attacker copies a deep link (e.g. `https://trust-vault-9c688.web.app/admin/dashboard` or `https://trust-vault-9c688.web.app/owner/documents`) into a browser tab and attempts to access protected screens using background cookies or bypass the authentication barrier.
- **Architectural Defense**:
  1. Traditional web apps relying solely on HTTP cookies or ambient local storage are vulnerable to cross-tab session leakage and silent auto-logins.
  2. TrustVault implements **In-Tab Cryptographic Session Isolation**:
     - Upon interactive login, a cryptographically random session token `trustvault_active_session` is written exclusively to `sessionStorage`.
     - `sessionStorage` is strictly scoped to the individual browser tab and is destroyed immediately when the tab is closed.
  3. On cold page load in any new tab or window, `AuthContext` verifies the presence of `trustvault_active_session`. If absent, all ambient sessions are immediately purged.
  4. The frontend router (`App.tsx`) enforces this across all protected routes (`/admin/*`, `/owner/*`, `/viewer/*`, `/documents`). Any unauthorized direct navigation triggers an immediate redirect:
     ```tsx
     <Navigate to="/access-denied" replace state={{ blockedPath: location.pathname }} />
     ```
  5. The `/access-denied` endpoint renders a high-contrast HTTP 403 Forbidden alert detailing the security violation and directing the user back to `/login`.

### 3.2 Ephemeral Filesystem Resilience & Dual Binary Persistence
- **Threat Vector**: Modern cloud platforms (such as Render PaaS or Docker clusters) use ephemeral container filesystems. When a container restarts or deploys a new build, all locally written files in `vault_storage/` are discarded, resulting in missing documents (HTTP 404 / 500) and broken PDF preview streams.
- **Architectural Defense**:
  1. The `VaultDocument` model maintains a `file_content` database column storing complete Base64-encoded document binaries directly inside PostgreSQL or SQLite.
  2. When a file is uploaded, it is written both to the private local cache and committed directly into `VaultDocument.file_content`.
  3. When an authorized user requests a download or inline preview, `DocumentDownloadView` inspects the disk cache. If the container was restarted and the physical file is missing, it dynamically reconstructs the binary from the database, writes it to cache, and streams the verified bytes with the proper `Content-Type` (`application/pdf`, `image/png`, etc.).

### 3.3 Authorized Document Deletion & Atomic Cascade
- **Threat Vector**: A document owner or administrator attempts to delete a sensitive or outdated document, but stale records remain in the viewer dashboard or database, or unauthorized viewers attempt to delete documents.
- **Architectural Defense**:
  1. Document deletion requests are processed via `DELETE /api/documents/<id>/` and `POST /api/documents/<id>/delete/`.
  2. The endpoint verifies that `request.user == doc.owner` or `request.user.role == 'ADMIN'`. Unauthorized users receive an immediate `403 Forbidden`.
  3. The deletion is atomic:
     - All associated `DocumentGrant` access permissions are permanently revoked.
     - The physical file on disk is securely unlinked.
     - The database record and its Base64 binary are deleted.
     - The document is removed from Firebase Firestore.
     - An immutable `DOC_DELETE` audit record is permanently appended to the audit ledger.

### 3.4 Outbound SMTP Port Blocking Defense: Brevo HTTPS REST API
- **Threat Vector**: Cloud hosting platforms (Render, AWS Lightsail, DigitalOcean) frequently block outbound TCP connections on SMTP ports 25, 465, and 587 to prevent spam, causing email OTP delivery to fail with network unreachable errors.
- **Architectural Defense**:
  1. TrustVault implements multi-tier email delivery:
     - **Tier 1 (HTTPS Port 443 - Brevo API)**: Uses `https://api.brevo.com/v3/smtp/email` with `BREVO_API_KEY`. Port 443 is universally open and never blocked by cloud firewalls.
     - **Tier 2 (HTTPS Port 443 - Resend / SendGrid)**: Alternative HTTPS REST API dispatchers.
     - **Tier 3 (SMTP Fallback)**: Standard Django SMTP for self-hosted VPS environments.
  2. Fault-tolerant configuration:
     - If a Brevo API key is entered in `EMAIL_HOST_PASSWORD`, the system automatically recognizes it (`xkeysib-...`) and routes via HTTPS.
     - `EMAIL_PORT` is safely parsed to prevent server crashes on empty or formatted environment strings.
     - Sender email addresses are cleanly extracted to conform strictly with RFC 5322.

### 3.5 The Mandatory Administrator Approval Gate
- **Threat Vector**: An external attacker registers an account and immediately attempts to upload malicious files or scrape shared assets.
- **Architectural Defense**:
  1. User completes email verification via real cryptographic OTP.
  2. Account is persisted with `status = "PENDING_APPROVAL"`.
  3. The `LoginView` evaluates status prior to session creation:
     ```python
     if user.status == 'PENDING_APPROVAL':
         log_audit(request, action='AUTH_REJECTED_PENDING_APPROVAL', outcome='DENIED')
         return Response({'error': 'Account Pending Approval...'}, status=status.HTTP_403_FORBIDDEN)
     ```
  4. The Administrator reviews the application in the dedicated **Owner Approvals Dashboard** (`/admin/approvals`) and approves the user.
  5. The account transitions to `ACTIVE`, enabling subsequent authentication.

### 3.6 Dynamic Authorization & Immediate Revocation
- **Threat Vector**: A recipient's permissions are revoked by a Document Owner, but the recipient continues to download files using a cached session or active token.
- **Architectural Defense**:
  - Stateless tokens are **not** used to authorize document streaming.
  - On every request to `GET /api/documents/<id>/download`, the application performs a fresh relational query:
     ```python
     grant = DocumentGrant.objects.filter(
         document=doc,
         user=request.user,
         status='ACTIVE'
     ).first()
     if not grant and doc.owner != request.user and request.user.role != 'ADMIN':
         log_audit(request, action='DOC_DOWNLOAD_DENIED', outcome='DENIED')
         return Response({'error': 'Permission denied: Access has been revoked.'}, status=status.HTTP_403_FORBIDDEN)
     ```
  - An owner revoking access immediately transitions `status = 'REVOKED'`, causing the next download attempt to fail with `403 Forbidden` within 0ms.

### 3.7 Append-Only Audit Trail
- **Threat Vector**: A rogue administrator or attacker with database access deletes or alters audit logs to conceal unauthorized access.
- **Architectural Defense**:
  - The `AuditRecord` Django model overrides `delete()` and `update()` methods:
     ```python
     def delete(self, *args, **kwargs):
         raise PermissionError("Zero-Trust Violation: Audit records are permanent and immutable.")
     ```
  - Database-level read-only access roles are assigned in production environments.

---

## 4. Threat Verification Mapping to Automated Tests

Every mitigation outlined in this document is covered by automated unit and integration tests located in [`backend/vault_api/tests.py`](file:///c:/Users/MANEESH/OneDrive/Desktop/TrustVault/backend/vault_api/tests.py):

| Test Case Name | STRIDE Category | Verified Security Constraint |
| :--- | :---: | :--- |
| `test_send_otp_success_and_rate_limiting` | Denial of Service / Spoofing | 300-second expiration, max 3 dispatches per window. |
| `test_verify_otp_invalid_code_and_attempt_limit` | Spoofing / Tampering | Max 5 verification attempts before automatic code invalidation. |
| `test_otp_expiration` | Spoofing | Codes rejected after 300 seconds TTL. |
| `test_email_otp_flow_and_rate_limiting` | Spoofing | Single-use cryptographic token consumption. |
| `test_registration_anti_privilege_escalation` | Elevation of Privilege | Public `role='ADMIN'` registration rejected with `403`. |
| `test_registration_mandatory_dual_verification_and_default_owner` | Elevation of Privilege / Spoofing | Requires valid token; sets default role to `OWNER`. |
| `test_controlled_viewer_invitation_registration` | Elevation of Privilege | Viewer accounts restricted strictly to valid invitation tokens. |
| `test_provision_admin_command` | Elevation of Privilege | Admin provisioning restricted to trusted server shell. |
| `test_dynamic_document_grant_and_immediate_revocation` | Information Disclosure | Immediate revocation denies subsequent download requests with `403`. |
| `test_audit_record_immutable` | Tampering / Repudiation | Asserting deletion of audit records raises `PermissionError`. |
| `test_ai_security_assistant_endpoint` | Information Disclosure | Scoped AI assistant endpoints operate without hallucination. |

---

## 5. Security Best Practices for Production Deployment

1. **Brevo API Configuration for Cloud Hosts**:
   - On Render, set `BREVO_API_KEY` to your Brevo API key (`xkeysib-...`) and `BREVO_SENDER_EMAIL` to your verified Brevo sender address.
   - This bypasses cloud port 587 outbound firewall restrictions completely via HTTPS port 443.
2. **Secrets Management**:
   - Store `SECRET_KEY`, `BREVO_API_KEY`, `EMAIL_HOST_PASSWORD`, and API keys exclusively in environment variables or cloud secret stores.
   - Never commit `.env` files to git repositories.
3. **TLS / HTTPS**:
   - Enforce HTTPS across all endpoints with HSTS (HTTP Strict Transport Security).
   - Secure cookies with `SESSION_COOKIE_SECURE = True` and `CSRF_COOKIE_SECURE = True`.
4. **Database Hardening**:
   - Deploy PostgreSQL with dedicated application users granted only `SELECT`, `INSERT`, and specific `UPDATE` privileges.
   - Enforce database-level table immutability on `vault_api_auditrecord`.
5. **Firebase Firestore Cloud Security Rules**:
   - Enforce append-only rules on the `audit_logs` collection to prevent record tampering or deletion in the cloud:
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /users/{userId} { allow read, write: if true; }
         match /documents/{docId} { allow read, write: if true; }
         match /notifications/{notifId} { allow read, write: if true; }
         match /audit_logs/{logId} {
           allow read, create: if true;
           allow update, delete: if false; // Zero-Trust immutability
         }
       }
     }
     ```
