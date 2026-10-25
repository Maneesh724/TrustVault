import uuid
import hashlib
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone

def generate_user_id():
    return f"user-{uuid.uuid4().hex[:8]}"

def generate_doc_id():
    return f"doc-{uuid.uuid4().hex[:8]}"

def generate_grant_id():
    return f"grant-{uuid.uuid4().hex[:8]}"

def generate_ver_id():
    return f"ver-{uuid.uuid4().hex[:8]}"

def generate_audit_id():
    return f"audit-{uuid.uuid4().hex[:12]}"

def generate_notif_id():
    return f"notif-{uuid.uuid4().hex[:8]}"


class CustomUserManager(BaseUserManager):
    def create_user(self, email, name, password=None, role='VIEWER', **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, role=role, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('status', 'ACTIVE')
        return self.create_user(email, name, password, role='ADMIN', **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('ADMIN', 'Administrator'),
        ('OWNER', 'Document Owner'),
        ('VIEWER', 'Viewer'),
    )

    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('PENDING_APPROVAL', 'Pending Approval'),
        ('SUSPENDED', 'Suspended'),
        ('INVITED', 'Invited'),
    )

    id = models.CharField(max_length=64, primary_key=True, default=generate_user_id)
    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='VIEWER')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING_APPROVAL')
    phone = models.CharField(max_length=30, blank=True, default='')
    phone_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    approved_by = models.CharField(max_length=150, blank=True, default='')
    approved_at = models.DateTimeField(null=True, blank=True)
    department = models.CharField(max_length=150, default='General Operations')
    mfa_enabled = models.BooleanField(default=True)
    avatar_url = models.URLField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(default=timezone.now)
    last_login_at = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return f"{self.name} <{self.email}> ({self.role})"


class MobileOTP(models.Model):
    phone = models.CharField(max_length=30, db_index=True)
    otp_hash = models.CharField(max_length=128)
    attempts = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=128, blank=True, default='', db_index=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def is_expired(self):
        return timezone.now() > self.expires_at

    def verify_code(self, candidate_code):
        candidate_hash = hashlib.sha256(f"{candidate_code.strip()}{self.phone}".encode()).hexdigest()
        return candidate_hash == self.otp_hash


class EmailOTP(models.Model):
    email = models.EmailField(db_index=True)
    otp_hash = models.CharField(max_length=128)
    attempts = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=128, blank=True, default='', db_index=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def is_expired(self):
        return timezone.now() > self.expires_at

    def verify_code(self, candidate_code):
        candidate_hash = hashlib.sha256(f"{candidate_code.strip()}{self.email.strip().lower()}".encode()).hexdigest()
        return candidate_hash == self.otp_hash


class PasswordResetToken(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=generate_audit_id)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token_hash = models.CharField(max_length=128, db_index=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def is_expired(self):
        return timezone.now() > self.expires_at


class UserInvitation(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=generate_audit_id)
    email = models.EmailField(db_index=True)
    role = models.CharField(max_length=20, default='VIEWER')
    invited_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sent_invitations')
    token = models.CharField(max_length=128, unique=True, db_index=True)
    document_id = models.CharField(max_length=64, blank=True, default='')
    expires_at = models.DateTimeField()
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def is_expired(self):
        return timezone.now() > self.expires_at


class VaultDocument(models.Model):
    CLASSIFICATION_CHOICES = (
        ('PUBLIC', 'Public'),
        ('INTERNAL', 'Internal'),
        ('CONFIDENTIAL', 'Confidential'),
        ('RESTRICTED', 'Restricted'),
    )

    id = models.CharField(max_length=64, primary_key=True, default=generate_doc_id)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    filename = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100, default='application/pdf')
    file_size_bytes = models.BigIntegerField(default=0)
    classification = models.CharField(max_length=30, choices=CLASSIFICATION_CHOICES, default='CONFIDENTIAL')
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='owned_documents')
    owner_name = models.CharField(max_length=150, blank=True, default='')
    owner_email = models.CharField(max_length=255, blank=True, default='')
    sha256_hash = models.CharField(max_length=64)
    watermark_enabled = models.BooleanField(default=False)
    download_restricted = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    file = models.FileField(upload_to='vault_files/', null=True, blank=True)
    file_content = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.owner:
            self.owner_name = self.owner.name
            self.owner_email = self.owner.email
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.classification})"


class DocumentGrant(models.Model):
    PERMISSION_CHOICES = (
        ('READ', 'Read'),
        ('EDIT', 'Edit'),
        ('ADMIN', 'Admin'),
    )

    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('REVOKED', 'Revoked'),
        ('EXPIRED', 'Expired'),
    )

    id = models.CharField(max_length=64, primary_key=True, default=generate_grant_id)
    document = models.ForeignKey(VaultDocument, on_delete=models.CASCADE, related_name='grants')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='document_grants')
    user_name = models.CharField(max_length=150, blank=True, default='')
    user_email = models.CharField(max_length=255, blank=True, default='')
    user_role = models.CharField(max_length=30, blank=True, default='VIEWER')
    permission = models.CharField(max_length=20, choices=PERMISSION_CHOICES, default='READ')
    granted_by = models.CharField(max_length=150)
    granted_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_by = models.CharField(max_length=150, blank=True, default='')

    class Meta:
        ordering = ['-granted_at']

    def is_valid_now(self):
        if self.status != 'ACTIVE':
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True

    def save(self, *args, **kwargs):
        if self.user:
            self.user_name = self.user.name
            self.user_email = self.user.email
            self.user_role = self.user.role
        super().save(*args, **kwargs)


class DocumentVersion(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=generate_ver_id)
    document = models.ForeignKey(VaultDocument, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField(default=1)
    uploaded_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    uploader_name = models.CharField(max_length=150)
    sha256_hash = models.CharField(max_length=64)
    file_size_bytes = models.BigIntegerField(default=0)
    change_summary = models.TextField(blank=True, default='')
    uploaded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-version_number']


class AuditRecord(models.Model):
    SEVERITY_CHOICES = (
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('CRITICAL', 'Critical'),
    )

    OUTCOME_CHOICES = (
        ('SUCCESS', 'Success'),
        ('DENIED', 'Denied'),
        ('FAILED', 'Failed'),
    )

    id = models.CharField(max_length=64, primary_key=True, default=generate_audit_id)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    actor_id = models.CharField(max_length=64)
    actor_name = models.CharField(max_length=150)
    actor_email = models.CharField(max_length=255)
    actor_role = models.CharField(max_length=30)
    action = models.CharField(max_length=50, db_index=True)
    target_resource_id = models.CharField(max_length=64, blank=True, default='')
    target_resource_name = models.CharField(max_length=255, blank=True, default='')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='INFO')
    ip_address = models.GenericIPAddressField(default='127.0.0.1')
    user_agent = models.TextField(blank=True, default='')
    outcome = models.CharField(max_length=20, choices=OUTCOME_CHOICES, default='SUCCESS')
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']

    # Immutable append-only audit record defense
    def delete(self, *args, **kwargs):
        if kwargs.pop('force', False):
            return super().delete(*args, **kwargs)
        raise PermissionError("Tamper-Evident Security Defense: Audit logs are append-only and cannot be deleted.")


class AdminNotification(models.Model):
    APPROVAL_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    id = models.CharField(max_length=64, primary_key=True, default=generate_notif_id)
    type = models.CharField(max_length=50, db_index=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    read = models.BooleanField(default=False)
    actor_id = models.CharField(max_length=64)
    actor_name = models.CharField(max_length=150)
    actor_email = models.CharField(max_length=255)
    actor_role = models.CharField(max_length=30)
    target_resource_id = models.CharField(max_length=64, blank=True, default='')
    target_resource_name = models.CharField(max_length=255, blank=True, default='')
    pending_user_id = models.CharField(max_length=64, blank=True, default='')
    approval_status = models.CharField(max_length=20, choices=APPROVAL_CHOICES, blank=True, default='')
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']


class SecurityPolicy(models.Model):
    CATEGORY_CHOICES = (
        ('AUTHENTICATION', 'Authentication'),
        ('DATA_LOSS_PREVENTION', 'Data Loss Prevention'),
        ('ACCESS_CONTROL', 'Access Control'),
        ('ENCRYPTION', 'Encryption'),
    )

    name = models.CharField(max_length=255)
    description = models.TextField()
    enabled = models.BooleanField(default=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    threat_ref = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({'Enabled' if self.enabled else 'Disabled'})"


class ThreatAlert(models.Model):
    SEVERITY_CHOICES = (
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('CRITICAL', 'Critical'),
    )

    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('MITIGATED', 'Mitigated'),
        ('INVESTIGATING', 'Investigating'),
    )

    timestamp = models.DateTimeField(default=timezone.now)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='CRITICAL')
    title = models.CharField(max_length=255)
    description = models.TextField()
    source_ip = models.CharField(max_length=50)
    mitigation_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='ACTIVE')
    threat_category = models.CharField(max_length=100)

    class Meta:
        ordering = ['-timestamp']
