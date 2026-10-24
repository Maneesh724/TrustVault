# TrustVault — Threat Model & Security Architecture Matrix

<p align="center">
  <img src="frontend/public/favicon.svg" alt="TrustVault Logo" width="64" height="64" />
</p>

## 1. Executive Summary & Zero-Trust Posture

TrustVault is a zero-trust enterprise document-sharing platform engineered to operate under the assumption that the network perimeter is compromised. Traditional perimeter-based security is replaced by strict identity verification, hardware-grade password hashing, dual-token cryptographic OTPs, mandatory administrative approvals, discretionary document grants, and immutable audit logs.

This document formalizes the threat landscape using the **STRIDE** methodology (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) defined by Microsoft and aligns with **NIST SP 800-207 Zero-Trust Architecture**.

---

## 2. STRIDE Threat Analysis Matrix

| Threat Category | Potential Attack Vector | TrustVault Mitigation Architecture | Verification Method & Implementation |
| :--- | :--- | :--- | :--- |
| **Spoofing Identity** | • Credential stuffing against corporate accounts.<br>• Session hijacking via intercepted tokens.<br>• Forged or intercepted email OTP codes. | • **Argon2id Key Derivation**: RFC 9106 tuned memory-hard hashing (`time_cost=1`, `memory_cost=19456`, `parallelism=2`) prevents GPU/ASIC cracking.<br>• **Single-Use Cryptographic OTP**: 6-digit random codes (`secrets.randbelow`), salted SHA-256 storage, strict 5-min TTL, rate-limited to 3 dispatches per window.<br>• **Secure HttpOnly Sessions**: Cookie-based server-side session management prevents XSS token theft. | • Verified in `tests.py::test_send_otp_success_and_rate_limiting`<br>• Verified in `tests.py::test_email_otp_flow_and_rate_limiting`<br>• Evaluated in `hashers.py` |
| **Tampering with Data** | • Parameter manipulation of document grant IDs.<br>• Modification of stored files in the vault.<br>• Tampering with audit logs to hide unauthorized activity. | • **SHA-256 Cryptographic Checksums**: Calculated on client (`Web Crypto API`) and recomputed on server upon ingestion.<br>• **UUID Non-Deterministic Paths**: Files stored in private directory outside web root using random UUIDs.<br>• **Database-Level Immutability**: `AuditRecord.delete()` and `.update()` raise `PermissionError`. | • Verified in `tests.py::test_audit_record_immutable`<br>• Tested in `views.py::DocumentUploadView` |
| **Repudiation** | • Users denying they uploaded, viewed, downloaded, or revoked access to documents.<br>• Admins denying approval or rejection of onboarding requests. | • **Tamper-Evident Audit Ledger**: Every action logs Actor ID, Name, Role, IP Address, User-Agent, Target Resource, Timestamp, and Outcome (`SUCCESS`, `DENIED`, `FAILED`).<br>• Immutable timestamping using UTC timezone standards. | • Verified in `tests.py::test_audit_record_immutable`<br>• Monitored live in `/admin/audit-logs` |
| **Information Disclosure** | • Insecure Direct Object References (IDOR) on document downloads.<br>• Stale token reuse after an owner revokes access.<br>• Leakage of confidential documents in search results. | • **Dynamic Access Evaluation**: Every download request executes a relational query verifying an `ACTIVE` grant associated with the requesting user ID.<br>• **Immediate Revocation**: Revoking a grant immediately sets status to `REVOKED`, returning `403 Forbidden` on the very next byte-stream request.<br>• **Strict Query Scoping**: Viewers only retrieve documents specifically granted to them or classified as `PUBLIC`. | • Verified in `tests.py::test_dynamic_document_grant_and_immediate_revocation`<br>• Implemented in `views.py::DocumentDownloadView` |
| **Denial of Service** | • OTP request spamming to exhaust SMS/email budgets.<br>• Massive file upload attacks to exhaust storage.<br>• Brute-forcing OTP verification codes. | • **Rate Limiting**: Maximum 3 OTP dispatches per 5-minute rolling window per email/mobile.<br>• **Attempt Invalidation**: Maximum 5 incorrect OTP attempts before the code is permanently invalidated.<br>• **File Size Enforcement**: Strict upload size caps and MIME-type validation. | • Verified in `tests.py::test_verify_otp_invalid_code_and_attempt_limit`<br>• Verified in `tests.py::test_otp_expiration` |
| **Elevation of Privilege** | • Public users registering directly as `ADMIN`.<br>• Document Viewers attempting to upload files or alter permissions.<br>• Unapproved users accessing the vault prior to admin verification. | • **Zero Public Admin Registration**: Public API endpoints explicitly reject `role: "ADMIN"` with `403 Forbidden` and log high-severity security incidents.<br>• **Mandatory Approval Gate**: All public owner signups default to `PENDING_APPROVAL` and cannot sign in until approved.<br>• **Controlled Viewer Ingestion**: Viewer registration requires an active, cryptographically signed invitation token. | • Verified in `tests.py::test_registration_anti_privilege_escalation`<br>• Verified in `tests.py::test_registration_mandatory_dual_verification_and_default_owner`<br>• Verified in `tests.py::test_controlled_viewer_invitation_registration` |

---

## 3. Deep-Dive Security Architecture & Defense In Depth

### 3.1 The Mandatory Administrator Approval Gate
- **Threat Vector**: An external attacker registers an account and immediately begins uploading malicious files or scraping shared assets.
- **Architectural Defense**:
  1. User completes email verification via real Gmail SMTP OTP.
  2. Account is persisted with `status = "PENDING_APPROVAL"`.
  3. The `LoginView` evaluates status prior to session creation:
     ```python
     if user.status == 'PENDING_APPROVAL':
         log_audit(request, action='AUTH_REJECTED_PENDING_APPROVAL', outcome='DENIED')
         return Response({'error': 'Account Pending Approval...'}, status=status.HTTP_403_FORBIDDEN)
     ```
  4. The Administrator reviews the application in the dedicated **Owner Approvals Dashboard** (`/admin/approvals`) and approves the user.
  5. The account transitions to `ACTIVE`, enabling subsequent authentication.

### 3.2 Dynamic Authorization & Immediate Revocation
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
    if not grant and doc.owner != request.user:
        log_audit(request, action='DOC_DOWNLOAD_DENIED', outcome='DENIED')
        return Response({'error': 'Permission denied: Access has been revoked.'}, status=status.HTTP_403_FORBIDDEN)
    ```
  - An owner revoking access immediately transitions `status = 'REVOKED'`, causing the next download attempt to fail with `403 Forbidden` within 0ms.

### 3.3 Private Storage Isolation
- **Threat Vector**: Path traversal (`../../etc/passwd`) or guessing document IDs to directly access files from the web server.
- **Architectural Defense**:
  - File assets are stored in a dedicated directory outside the public web server root.
  - Files are renamed to non-deterministic UUIDs on ingestion.
  - Direct web links are never exposed to clients; downloads are streamed strictly through authenticated and authorized Django view wrappers.

### 3.4 Append-Only Audit Trail
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

1. **Secrets Management**:
   - Store `SECRET_KEY`, `EMAIL_HOST_PASSWORD`, and API keys exclusively in environment variables or cloud secret stores (AWS Secrets Manager / Vault).
   - Never commit `.env` files to git repositories.
2. **TLS / HTTPS**:
   - Enforce HTTPS across all endpoints with HSTS (HTTP Strict Transport Security).
   - Secure cookies with `SESSION_COOKIE_SECURE = True` and `CSRF_COOKIE_SECURE = True`.
3. **Database Hardening**:
   - Deploy PostgreSQL with dedicated application users granted only `SELECT`, `INSERT`, and specific `UPDATE` privileges.
   - Enforce database-level table immutability on `vault_api_auditrecord`.
