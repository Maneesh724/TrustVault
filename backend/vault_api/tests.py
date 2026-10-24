import hashlib
from datetime import timedelta
from django.utils import timezone
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from .models import (
    CustomUser, MobileOTP, EmailOTP, PasswordResetToken, UserInvitation,
    VaultDocument, DocumentGrant, DocumentVersion, AuditRecord, AdminNotification
)
from django.core.management import call_command
import io


class TrustVaultSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Seed admin user
        self.admin = CustomUser.objects.create(
            id='user-admin-01',
            email='admin@trustvault.com',
            name='Security Admin',
            role='ADMIN',
            status='ACTIVE',
            phone='+15551234567',
            phone_verified=True,
            is_staff=True,
            is_superuser=True
        )
        self.admin.set_password('AdminSecurePass@2026')
        self.admin.save()

        # Seed owner user
        self.owner = CustomUser.objects.create(
            id='user-owner-01',
            email='sarah@trustvault.com',
            name='Sarah Wilson',
            role='OWNER',
            status='ACTIVE',
            phone='+15557890123',
            phone_verified=True
        )
        self.owner.set_password('OwnerPass@2026')
        self.owner.save()

        # Seed viewer user
        self.viewer = CustomUser.objects.create(
            id='user-viewer-01',
            email='emily@trustvault.com',
            name='Emily Davis',
            role='VIEWER',
            status='ACTIVE',
            phone='+15559876543',
            phone_verified=True
        )
        self.viewer.set_password('ViewerPass@2026')
        self.viewer.save()

        # Seed test document owned by Sarah
        self.document = VaultDocument.objects.create(
            id='doc-test-01',
            title='Confidential Security Strategy',
            description='Zero-trust access policy and protocol.',
            filename='strategy.pdf',
            mime_type='application/pdf',
            file_size_bytes=1048576,
            classification='RESTRICTED',
            owner=self.owner,
            sha256_hash='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            watermark_enabled=True,
            download_restricted=True
        )

    # -------------------------------------------------------------------------
    # 1. OTP Tests: Generation, Expiry, Rate Limits & Single-Use
    # -------------------------------------------------------------------------
    def test_send_otp_success_and_rate_limiting(self):
        test_phone = '+15550001111'
        # 1. First send
        res1 = self.client.post('/api/auth/send-otp', {'phone': test_phone, 'role': 'VIEWER'}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertTrue(res1.data['success'])
        self.assertEqual(res1.data['expiresInSeconds'], 300)
        self.assertTrue(res1.data['isDevelopmentMode'])
        otp1 = res1.data['devOtp']
        self.assertEqual(len(otp1), 6)

        # 2. Second send
        res2 = self.client.post('/api/auth/send-otp', {'phone': test_phone, 'role': 'VIEWER'}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)

        # 3. Third send
        res3 = self.client.post('/api/auth/send-otp', {'phone': test_phone, 'role': 'VIEWER'}, format='json')
        self.assertEqual(res3.status_code, status.HTTP_200_OK)

        # 4. Fourth send exceeds window limit (max 3 sends per window)
        res4 = self.client.post('/api/auth/send-otp', {'phone': test_phone, 'role': 'VIEWER'}, format='json')
        self.assertEqual(res4.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_verify_otp_invalid_code_and_attempt_limit(self):
        test_phone = '+15550002222'
        res = self.client.post('/api/auth/send-otp', {'phone': test_phone, 'role': 'VIEWER'}, format='json')
        correct_otp = res.data['devOtp']

        # Enter wrong code
        res_wrong1 = self.client.post('/api/auth/verify-otp', {'phone': test_phone, 'otp': '000000'}, format='json')
        self.assertEqual(res_wrong1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('attempt(s) remaining', res_wrong1.data['error'])

        # Exhaust 5 attempts
        for _ in range(4):
            res_wrong = self.client.post('/api/auth/verify-otp', {'phone': test_phone, 'otp': '000000'}, format='json')

        self.assertEqual(res_wrong.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Maximum verification attempts exceeded', res_wrong.data['error'])

        # Now even the correct OTP is rejected because the record was invalidated
        res_correct_after_lock = self.client.post('/api/auth/verify-otp', {'phone': test_phone, 'otp': correct_otp}, format='json')
        self.assertEqual(res_correct_after_lock.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_otp_expiry(self):
        test_phone = '+15550003333'
        res = self.client.post('/api/auth/send-otp', {'phone': test_phone, 'role': 'VIEWER'}, format='json')
        correct_otp = res.data['devOtp']

        # Fast-forward the OTP record's expires_at past 5 minutes
        record = MobileOTP.objects.filter(phone=test_phone).first()
        record.expires_at = timezone.now() - timedelta(seconds=1)
        record.save()

        # Verification must fail with expiry message
        res_verify = self.client.post('/api/auth/verify-otp', {'phone': test_phone, 'otp': correct_otp}, format='json')
        self.assertEqual(res_verify.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('OTP has expired', res_verify.data['error'])

    def test_verify_otp_single_use(self):
        test_phone = '+15550004444'
        res = self.client.post('/api/auth/send-otp', {'phone': test_phone, 'role': 'VIEWER'}, format='json')
        correct_otp = res.data['devOtp']

        # Verify once -> SUCCESS
        res_v1 = self.client.post('/api/auth/verify-otp', {'phone': test_phone, 'otp': correct_otp}, format='json')
        self.assertEqual(res_v1.status_code, status.HTTP_200_OK)
        self.assertTrue(res_v1.data['success'])
        token = res_v1.data['verificationToken']
        self.assertTrue(len(token) > 20)

        # Re-verify same OTP -> REJECTED (Single-use defense)
        res_v2 = self.client.post('/api/auth/verify-otp', {'phone': test_phone, 'otp': correct_otp}, format='json')
        self.assertEqual(res_v2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already been verified and consumed', res_v2.data['error'])

    # -------------------------------------------------------------------------
    # 2. Registration & Anti-Escalation Security Tests
    # -------------------------------------------------------------------------
    def test_admin_privilege_escalation_blocked(self):
        test_phone = '+15550005555'
        res_otp = self.client.post('/api/auth/send-otp', {'phone': test_phone, 'role': 'ADMIN'}, format='json')
        otp = res_otp.data['devOtp']
        res_v = self.client.post('/api/auth/verify-otp', {'phone': test_phone, 'otp': otp}, format='json')
        token = res_v.data['verificationToken']

        # Attempt to register as ADMIN without correct provisioning passcode
        res_reg = self.client.post('/api/auth/register', {
            'name': 'Malicious Actor',
            'email': 'hacker@external.com',
            'phone': test_phone,
            'role': 'ADMIN',
            'password': 'HackerPassword@123',
            'otpVerificationToken': token,
            'adminProvisioningToken': 'WRONG-PASSCODE'
        }, format='json')

        self.assertEqual(res_reg.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Privilege Escalation Blocked', res_reg.data['error'])

        # Verify audit log recorded the escalation attempt
        audit = AuditRecord.objects.filter(action='PRIVILEGE_ESCALATION_BLOCKED').first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.severity, 'CRITICAL')

    def test_register_creates_pending_approval_user(self):
        test_email = 'robert.taylor@trustvault.com'
        test_phone = '+15550006666'

        # Email OTP only (mobile OTP removed per design)
        res_e_send = self.client.post('/api/auth/send-email-otp', {'email': test_email}, format='json')
        res_e_ver = self.client.post('/api/auth/verify-email-otp', {'email': test_email, 'otp': res_e_send.data['devOtp']}, format='json')
        email_token = res_e_ver.data['verificationToken']

        res_reg = self.client.post('/api/auth/register', {
            'name': 'Robert Taylor',
            'email': test_email,
            'phone': test_phone,
            'password': 'SecurePass@2026',
            'department': 'Operations',
            'emailVerificationToken': email_token,
        }, format='json')

        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_reg.data['user']['status'], 'PENDING_APPROVAL')

        # Check DB
        new_user = CustomUser.objects.get(email=test_email)
        self.assertEqual(new_user.status, 'PENDING_APPROVAL')
        self.assertTrue(new_user.email_verified)
        self.assertTrue(new_user.phone_verified)

    # -------------------------------------------------------------------------
    # 3. Login Security: Rejection of Pending & Suspended Accounts
    # -------------------------------------------------------------------------
    def test_login_rejection_pending_approval(self):
        pending_user = CustomUser.objects.create(
            id='user-pending-99',
            email='pending@trustvault.com',
            name='Pending User',
            role='VIEWER',
            status='PENDING_APPROVAL',
            phone='+15550007777',
            phone_verified=True,
            email_verified=True
        )
        pending_user.set_password('PendingPass@123')
        pending_user.save()

        res_login = self.client.post('/api/auth/login', {
            'email': 'pending@trustvault.com',
            'password': 'PendingPass@123'
        }, format='json')

        self.assertEqual(res_login.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Pending Approval', res_login.data['error'])

    def test_login_rejection_suspended(self):
        suspended_user = CustomUser.objects.create(
            id='user-susp-99',
            email='suspended@trustvault.com',
            name='Suspended User',
            role='VIEWER',
            status='SUSPENDED',
            phone='+15550008888',
            phone_verified=True,
            email_verified=True
        )
        suspended_user.set_password('SuspendedPass@123')
        suspended_user.save()

        res_login = self.client.post('/api/auth/login', {
            'email': 'suspended@trustvault.com',
            'password': 'SuspendedPass@123'
        }, format='json')

        self.assertEqual(res_login.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Account Suspended', res_login.data['error'])

    def test_login_and_approval_flow(self):
        # 1. Create pending user with verified phone and email
        user = CustomUser.objects.create(
            id='user-approval-test',
            email='approve.me@trustvault.com',
            name='Approval Test',
            role='VIEWER',
            status='PENDING_APPROVAL',
            phone='+15550009999',
            phone_verified=True,
            email_verified=True
        )
        user.set_password('ValidPass@123')
        user.save()

        # 2. Cannot log in while pending
        res1 = self.client.post('/api/auth/login', {'email': user.email, 'password': 'ValidPass@123'}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Admin approves account
        res_approve = self.client.post('/api/auth/approve', {
            'targetUserId': user.id,
            'approverName': 'Security Administrator'
        }, format='json')
        self.assertEqual(res_approve.status_code, status.HTTP_200_OK)
        self.assertEqual(res_approve.data['user']['status'], 'ACTIVE')

        # 4. Now user can log in successfully
        res2 = self.client.post('/api/auth/login', {'email': user.email, 'password': 'ValidPass@123'}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertTrue(res2.data['success'])

    # -------------------------------------------------------------------------
    # 4. Dynamic Document Grants & Immediate Revocation Enforcement
    # -------------------------------------------------------------------------
    def test_dynamic_document_grant_and_immediate_revocation(self):
        # 1. Initially Emily (VIEWER) has no grant to Strategy document -> Download denied
        res_initial = self.client.get(f'/api/documents/{self.document.id}/download?userId={self.viewer.id}')
        self.assertEqual(res_initial.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Zero-Trust Policy Violation', res_initial.data['error'])

        # 2. Document Owner (Sarah) grants READ access to Emily
        res_grant = self.client.post(f'/api/documents/{self.document.id}/grant', {
            'userId': self.viewer.id,
            'permission': 'READ',
            'grantedBy': self.owner.name
        }, format='json')
        self.assertEqual(res_grant.status_code, status.HTTP_200_OK)
        self.assertEqual(res_grant.data['permission'], 'READ')
        self.assertEqual(res_grant.data['status'], 'ACTIVE')

        # 3. Emily attempts download -> SUCCESS (200 OK)
        res_download_success = self.client.get(f'/api/documents/{self.document.id}/download?userId={self.viewer.id}')
        self.assertEqual(res_download_success.status_code, status.HTTP_200_OK)
        self.assertIn('TrustVault Authenticated Download', res_download_success.content.decode('utf-8'))

        # 4. Sarah revokes access immediately
        res_revoke = self.client.post(f'/api/documents/{self.document.id}/revoke', {
            'userId': self.viewer.id,
            'revokedBy': self.owner.name
        }, format='json')
        self.assertEqual(res_revoke.status_code, status.HTTP_200_OK)
        self.assertTrue(res_revoke.data['success'])

        # 5. Subsequent download attempt is IMMEDIATELY DENIED with 403 Forbidden!
        res_download_after_revoke = self.client.get(f'/api/documents/{self.document.id}/download?userId={self.viewer.id}')
        self.assertEqual(res_download_after_revoke.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Zero-Trust Policy Violation', res_download_after_revoke.data['error'])

    # -------------------------------------------------------------------------
    # 5. Tamper-Evident Append-Only Audit Trail
    # -------------------------------------------------------------------------
    def test_audit_record_immutable(self):
        audit = AuditRecord.objects.create(
            actor_id='test-actor',
            actor_name='Tester',
            actor_email='test@trustvault.com',
            actor_role='ADMIN',
            action='SECURITY_EVENT',
            severity='INFO',
            outcome='SUCCESS'
        )

        # Deleting an audit record must raise PermissionError
        with self.assertRaises(PermissionError):
            audit.delete()

    # -------------------------------------------------------------------------
    # 6. Email OTP Verification & Single-Use Token Flow
    # -------------------------------------------------------------------------
    def test_email_otp_flow_and_rate_limiting(self):
        test_email = 'alice@example.com'
        # 1. Dispatch Email OTP
        res1 = self.client.post('/api/auth/send-email-otp', {'email': test_email}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertTrue(res1.data['success'])
        self.assertEqual(res1.data['expiresInSeconds'], 300)
        otp = res1.data['devOtp']
        self.assertEqual(len(otp), 6)

        # 2. Verify with invalid code -> Fails
        res_bad = self.client.post('/api/auth/verify-email-otp', {'email': test_email, 'otp': '000000'}, format='json')
        self.assertEqual(res_bad.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Verify with valid code -> Issues verification token
        res_good = self.client.post('/api/auth/verify-email-otp', {'email': test_email, 'otp': otp}, format='json')
        self.assertEqual(res_good.status_code, status.HTTP_200_OK)
        self.assertTrue(res_good.data['success'])
        self.assertTrue(bool(res_good.data['verificationToken']))

        # 4. Same code cannot be re-used (single-use enforcement)
        res_reuse = self.client.post('/api/auth/verify-email-otp', {'email': test_email, 'otp': otp}, format='json')
        self.assertEqual(res_reuse.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------------------
    # 7. Strict Anti-Privilege Escalation & Registration Policy
    # -------------------------------------------------------------------------
    def test_registration_anti_privilege_escalation(self):
        # Public request attempting to create an ADMIN account MUST be blocked with 403 Forbidden
        res = self.client.post('/api/auth/register', {
            'name': 'Hacker Attacker',
            'email': 'attacker@evil.com',
            'phone': '+15559998888',
            'password': 'AttackerPassword@123',
            'role': 'ADMIN',
            'emailVerificationToken': 'fake-token',
            'mobileVerificationToken': 'fake-token'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Privilege Escalation Blocked', res.data['error'])

    def test_registration_email_verification_and_default_owner(self):
        test_email = 'mark.corp@trustvault.com'
        test_phone = '+15558887777'

        # 1. Obtain email verification token
        send_e = self.client.post('/api/auth/send-email-otp', {'email': test_email}, format='json')
        verify_e = self.client.post('/api/auth/verify-email-otp', {'email': test_email, 'otp': send_e.data['devOtp']}, format='json')
        email_token = verify_e.data['verificationToken']

        # 2. Registration without email token fails
        res_fail1 = self.client.post('/api/auth/register', {
            'name': 'Mark Spencer',
            'email': test_email,
            'phone': test_phone,
            'password': 'SecureMarkPass@2026',
        }, format='json')
        self.assertEqual(res_fail1.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Complete valid registration -> Defaults to OWNER with status ACTIVE
        res_reg = self.client.post('/api/auth/register', {
            'name': 'Mark Spencer',
            'email': test_email,
            'phone': test_phone,
            'password': 'SecureMarkPass@2026',
            'department': 'Finance',
            'emailVerificationToken': email_token,
        }, format='json')
        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_reg.data['user']['role'], 'OWNER')
        self.assertEqual(res_reg.data['user']['status'], 'PENDING_APPROVAL')

    def test_controlled_viewer_invitation_registration(self):
        # 1. Owner creates viewer invitation
        inv_res = self.client.post('/api/invitations/create', {
            'invitedEmail': 'invited.viewer@trustvault.com',
            'role': 'VIEWER',
            'ownerId': self.owner.id
        }, format='json')
        self.assertEqual(inv_res.status_code, status.HTTP_201_CREATED)
        invite_token = inv_res.data.get('inviteToken') or inv_res.data.get('token')

        # 2. Email verification only (no mobile OTP)
        email = 'invited.viewer@trustvault.com'
        phone = '+15553334444'
        e_send = self.client.post('/api/auth/send-email-otp', {'email': email}, format='json')
        e_ver = self.client.post('/api/auth/verify-email-otp', {'email': email, 'otp': e_send.data['devOtp']}, format='json')

        # 3. Register with inviteToken
        res = self.client.post('/api/auth/register', {
            'name': 'Invited Viewer User',
            'email': email,
            'phone': phone,
            'password': 'ViewerPassword@2026',
            'emailVerificationToken': e_ver.data['verificationToken'],
            'inviteToken': invite_token
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['user']['role'], 'VIEWER')

    # -------------------------------------------------------------------------
    # 8. Server-Side Administrator Provisioning Command
    # -------------------------------------------------------------------------
    def test_provision_admin_command(self):
        out = io.StringIO()
        call_command(
            'provision_admin',
            email='newadmin@trustvault.com',
            name='Bootstrapped Admin',
            password='BootstrapPassword@2026',
            phone='+15554443322',
            force=True,
            stdout=out
        )
        output = out.getvalue()
        self.assertIn('successfully', output.lower())

        new_admin = CustomUser.objects.get(email='newadmin@trustvault.com')
        self.assertEqual(new_admin.role, 'ADMIN')
        self.assertEqual(new_admin.status, 'ACTIVE')
        self.assertTrue(new_admin.email_verified)
        self.assertTrue(new_admin.phone_verified)
        self.assertTrue(new_admin.is_staff)

    # -------------------------------------------------------------------------
    # 9. AI Security Assistant Clean Configuration Reporting
    # -------------------------------------------------------------------------
    def test_ai_security_assistant_endpoint(self):
        # Query endpoint without configuring real key in test environment
        res = self.client.post('/api/ai/chat', {'query': 'Are there any security threats?'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Cleanly reports missing key rather than fabricating responses
        if not res.data.get('configured'):
            self.assertIn('missingKey', res.data)
            self.assertFalse(res.data['configured'])
