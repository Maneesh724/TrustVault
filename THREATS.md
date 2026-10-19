# TrustVault Threat Model & Security Matrix

## 1. Overview
TrustVault is a zero-trust enterprise secure document-sharing platform designed for high-assurance data governance, strict authorization, and granular auditability.

---

## 2. Threat Modeling Framework (STRIDE)

| Threat Category | Potential Attack Vector | TrustVault Mitigation Strategy | Implementation Status |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Session hijacking, forged JWTs, credential stuffing | HttpOnly secure cookies, short-lived JWT access tokens with secure refresh tokens, MFA readiness, rate limiting on auth endpoints. | Planned (Backend Stage) / Frontend Auth Form Validations Implemented |
| **Tampering** | Parameter manipulation, unauthorized file overwrite, tampering with audit trail | Document cryptographic hash verification (SHA-256), immutable append-only audit records, strict payload validation. | Document hash & audit trail modeled; to enforce in backend |
| **Repudiation** | Denying sharing, accessing, or revoking actions | Tamper-evident, structured audit log recording User ID, Action, Target Doc ID, IP Address, Timestamp, and Outcome. | Audit trail UI and mock services built; backend audit table planned |
| **Information Disclosure** | IDOR (Insecure Direct Object Reference), unauthorized document preview/download | Strict document-level ownership & permission check on every read request. Pre-signed/tokenized private storage URLs with immediate expiration. No public S3/directory listing. | Frontend access-controlled UI views ready; backend cross-user auth tests mandatory |
| **Denial of Service** | File upload abuse (zip bombs, massive files), spamming sharing requests | Strict file size caps (max 50MB), MIME-type whitelisting, virus/signature scanning hook, API rate limits. | Client-side file type & size validators implemented; backend file chunking and validation planned |
| **Elevation of Privilege** | Normal user elevating to admin or modifying permissions without grant | Role-Based Access Control (RBAC) combined with Discretionary Access Control (DAC) per document. Explicit permission validation (Owner vs Admin vs Viewer with document-level read/edit grants). Immediate revocation check. | Document-level permission matrix designed & enforced in client service layer; backend auth guards planned |

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
