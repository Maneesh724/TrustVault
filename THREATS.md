# TrustVault Threat Model & Security Matrix

## 1. Overview
TrustVault is a zero-trust enterprise secure document-sharing platform designed for high-assurance data governance, strict authorization, and granular auditability.

---

## 2. Threat Modeling Framework (STRIDE)

| Threat Category | Potential Attack Vector | TrustVault Mitigation Strategy | Implementation Status |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Session hijacking, forged JWTs, credential stuffing | HttpOnly secure cookies, server-side session authentication, Argon2id memory-hard password hashing, mobile OTP with 5-min TTL, rate limiting on auth endpoints. | Implemented & Verified in Django backend (`tests.py`) |
| **Tampering** | Parameter manipulation, unauthorized file overwrite, tampering with audit trail | Document cryptographic hash verification (SHA-256), immutable append-only audit records (`delete()` raises `PermissionError`), strict payload validation. | Implemented & Verified (`tests.py`) |
| **Repudiation** | Denying sharing, accessing, or revoking actions | Tamper-evident, structured audit log recording User ID, Action, Target Doc ID, IP Address, Timestamp, and Outcome. | Implemented & Verified (`AuditRecord` model + tests) |
| **Information Disclosure** | IDOR (Insecure Direct Object Reference), unauthorized document preview/download | Strict document-level ownership & permission check on every read/download request. Evaluates database grants on each download; denies revoked users with 403. | Implemented & Verified in `DocumentDownloadView` |
| **Denial of Service** | File upload abuse (zip bombs, massive files), spamming sharing requests | Strict file size caps, MIME-type whitelisting, OTP rate limits (max 3/window, max 5 attempts/code). | Implemented & Verified in `MobileOTP` engine |
| **Elevation of Privilege** | Normal user elevating to admin or modifying permissions without grant | Role-Based Access Control (RBAC) combined with Discretionary Access Control (DAC) per document. Public admin self-registration strictly blocked with 403. Immediate revocation check. | Implemented & Verified in `RegisterView` & `DocumentRevokeView` |

---

## 3. TrustVault Security Pillars

### 3.1 Immediate Revocation
- **Threat**: A revoked user retains access via stale sessions or cached tokens.
- **Defense**: Permissions are evaluated dynamically on each subsequent request. Cache invalidation signals immediately purge active grants.

### 3.2 Private File Storage
- **Threat**: Direct access to underlying storage path without passing through the authorization layer.
- **Defense**: File paths are non-deterministic UUIDs stored outside web root. Document downloads are served strictly via authenticated streaming endpoints verifying active grants.

### 3.3 Protected Audit Trail
- **Threat**: Malicious actors modifying or deleting audit trails to cover unauthorized access.
- **Defense**: Audit logs are append-only; updates and deletes are prohibited at both the database level (triggers/rules) and application layer.

---

## 4. Registration Gate & Admin Notification Security

### 4.1 Unapproved Public Self-Registration Attack
- **Threat**: Attackers register arbitrary accounts to immediately access or upload corporate documents.
- **Defense**: All public self-registrations default to status `PENDING_APPROVAL`. The zero-trust gate rejects login attempts with `403 Forbidden` until an Administrator explicitly reviews and activates the identity.

### 4.2 Real-time Security Notification & Activity Audit
- **Threat**: Malicious actions (unauthorized uploads, anomalous logins, bulk downloads) go unnoticed by system administrators.
- **Defense**: Live pub/sub notification service alerts administrators in real-time on all Document Owner and Viewer operations (doc upload, authentication, document access, download, grant creation, grant revocation).

### 4.3 Privilege Escalation via Registration
- **Threat**: Public users attempting to self-provision Administrator privileges.
- **Defense**: Self-registration for Administrator is blocked without a cryptographic enterprise provisioning secret. Document Owner registrations strictly require administrator approval before activation.
