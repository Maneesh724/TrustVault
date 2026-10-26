from rest_framework import serializers
from .models import (
    CustomUser, MobileOTP, EmailOTP, PasswordResetToken, UserInvitation,
    VaultDocument, DocumentGrant, DocumentVersion, AuditRecord,
    AdminNotification, SecurityPolicy, ThreatAlert
)


class UserSerializer(serializers.ModelSerializer):
    phoneVerified = serializers.BooleanField(source='phone_verified', read_only=True)
    emailVerified = serializers.BooleanField(source='email_verified', read_only=True)
    mfaEnabled = serializers.BooleanField(source='mfa_enabled', read_only=True)
    approvedBy = serializers.CharField(source='approved_by', read_only=True)
    approvedAt = serializers.DateTimeField(source='approved_at', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    lastLoginAt = serializers.DateTimeField(source='last_login_at', read_only=True)
    avatarUrl = serializers.CharField(source='avatar_url', read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'name', 'role', 'status', 'phone',
            'phoneVerified', 'emailVerified', 'department', 'mfaEnabled',
            'approvedBy', 'approvedAt', 'createdAt', 'lastLoginAt', 'avatarUrl'
        ]


class SendOtpSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=30)
    role = serializers.CharField(max_length=20, default='VIEWER', required=False)


class VerifyOtpSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=30)
    otp = serializers.CharField(max_length=10)


class SendEmailOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyEmailOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=10)


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=30)
    password = serializers.CharField(min_length=8, write_only=True)
    department = serializers.CharField(max_length=150, required=False, allow_blank=True, default='General Operations')
    emailVerificationToken = serializers.CharField(max_length=128, required=False, allow_blank=True)
    otpVerificationToken = serializers.CharField(max_length=128, required=False, allow_blank=True)
    mobileVerificationToken = serializers.CharField(max_length=128, required=False, allow_blank=True)
    inviteToken = serializers.CharField(max_length=128, required=False, allow_blank=True)
    role = serializers.CharField(max_length=20, required=False, allow_blank=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=128)
    newPassword = serializers.CharField(min_length=8)


class AiChatSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000, required=False, allow_blank=True)
    query = serializers.CharField(max_length=2000, required=False, allow_blank=True)
    documentId = serializers.CharField(max_length=64, required=False, allow_blank=True)
    userId = serializers.CharField(max_length=64, required=False, allow_blank=True)


class CreateInvitationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    invitedEmail = serializers.EmailField(required=False)
    documentId = serializers.CharField(max_length=64, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=['VIEWER', 'OWNER'], default='VIEWER')


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(required=False, allow_blank=True)


class DocumentVersionSerializer(serializers.ModelSerializer):
    versionNumber = serializers.IntegerField(source='version_number')
    uploadedAt = serializers.DateTimeField(source='uploaded_at')
    uploadedBy = serializers.CharField(source='uploaded_by.id', default='')
    uploaderName = serializers.CharField(source='uploader_name')
    sha256Hash = serializers.CharField(source='sha256_hash')
    fileSizeBytes = serializers.IntegerField(source='file_size_bytes')
    changeSummary = serializers.CharField(source='change_summary')

    class Meta:
        model = DocumentVersion
        fields = [
            'id', 'versionNumber', 'uploadedAt', 'uploadedBy',
            'uploaderName', 'sha256Hash', 'fileSizeBytes', 'changeSummary'
        ]


class DocumentGrantSerializer(serializers.ModelSerializer):
    documentId = serializers.CharField(source='document.id', read_only=True)
    userId = serializers.CharField(source='user.id', read_only=True)
    userEmail = serializers.CharField(source='user_email', read_only=True)
    userName = serializers.CharField(source='user_name', read_only=True)
    userRole = serializers.CharField(source='user_role', read_only=True)
    grantedAt = serializers.DateTimeField(source='granted_at', read_only=True)
    grantedBy = serializers.CharField(source='granted_by', read_only=True)
    expiresAt = serializers.DateTimeField(source='expires_at', required=False, allow_null=True)
    revokedAt = serializers.DateTimeField(source='revoked_at', read_only=True)
    revokedBy = serializers.CharField(source='revoked_by', read_only=True)

    class Meta:
        model = DocumentGrant
        fields = [
            'id', 'documentId', 'userId', 'userEmail', 'userName',
            'userRole', 'permission', 'grantedAt', 'grantedBy',
            'expiresAt', 'status', 'revokedAt', 'revokedBy'
        ]


class VaultDocumentSerializer(serializers.ModelSerializer):
    mimeType = serializers.CharField(source='mime_type')
    fileSizeBytes = serializers.IntegerField(source='file_size_bytes')
    ownerId = serializers.CharField(source='owner.id', read_only=True)
    ownerName = serializers.CharField(source='owner_name', read_only=True)
    ownerEmail = serializers.CharField(source='owner_email', read_only=True)
    sha256Hash = serializers.CharField(source='sha256_hash')
    watermarkEnabled = serializers.BooleanField(source='watermark_enabled')
    downloadRestricted = serializers.BooleanField(source='download_restricted')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    versions = DocumentVersionSerializer(many=True, read_only=True)
    grants = DocumentGrantSerializer(many=True, read_only=True)
    grantsCount = serializers.SerializerMethodField()
    fileBase64 = serializers.CharField(source='file_content', read_only=True, required=False)

    class Meta:
        model = VaultDocument
        fields = [
            'id', 'title', 'description', 'filename', 'mimeType',
            'fileSizeBytes', 'classification', 'ownerId', 'ownerName',
            'ownerEmail', 'sha256Hash', 'watermarkEnabled',
            'downloadRestricted', 'tags', 'createdAt', 'updatedAt',
            'versions', 'grants', 'grantsCount', 'fileBase64'
        ]

    def get_grantsCount(self, obj):
        return obj.grants.filter(status='ACTIVE').count()


class AuditRecordSerializer(serializers.ModelSerializer):
    actorId = serializers.CharField(source='actor_id')
    actorName = serializers.CharField(source='actor_name')
    actorEmail = serializers.CharField(source='actor_email')
    actorRole = serializers.CharField(source='actor_role')
    targetResourceId = serializers.CharField(source='target_resource_id', required=False, allow_blank=True)
    targetResourceName = serializers.CharField(source='target_resource_name', required=False, allow_blank=True)
    ipAddress = serializers.CharField(source='ip_address')
    userAgent = serializers.CharField(source='user_agent', required=False, allow_blank=True)

    class Meta:
        model = AuditRecord
        fields = [
            'id', 'timestamp', 'actorId', 'actorName', 'actorEmail',
            'actorRole', 'action', 'targetResourceId', 'targetResourceName',
            'severity', 'ipAddress', 'userAgent', 'outcome', 'details'
        ]


class AdminNotificationSerializer(serializers.ModelSerializer):
    actorId = serializers.CharField(source='actor_id')
    actorName = serializers.CharField(source='actor_name')
    actorEmail = serializers.CharField(source='actor_email')
    actorRole = serializers.CharField(source='actor_role')
    targetResourceId = serializers.CharField(source='target_resource_id', required=False, allow_blank=True)
    targetResourceName = serializers.CharField(source='target_resource_name', required=False, allow_blank=True)
    pendingUserId = serializers.CharField(source='pending_user_id', required=False, allow_blank=True)
    approvalStatus = serializers.CharField(source='approval_status', required=False, allow_blank=True)

    class Meta:
        model = AdminNotification
        fields = [
            'id', 'type', 'title', 'message', 'timestamp', 'read',
            'actorId', 'actorName', 'actorEmail', 'actorRole',
            'targetResourceId', 'targetResourceName', 'pendingUserId',
            'approvalStatus', 'details'
        ]


class SecurityPolicySerializer(serializers.ModelSerializer):
    threatRef = serializers.CharField(source='threat_ref')

    class Meta:
        model = SecurityPolicy
        fields = ['id', 'name', 'description', 'enabled', 'category', 'threatRef']


class ThreatAlertSerializer(serializers.ModelSerializer):
    sourceIp = serializers.CharField(source='source_ip')
    mitigationStatus = serializers.CharField(source='mitigation_status')
    threatCategory = serializers.CharField(source='threat_category')

    class Meta:
        model = ThreatAlert
        fields = ['id', 'timestamp', 'severity', 'title', 'description', 'sourceIp', 'mitigationStatus', 'threatCategory']
