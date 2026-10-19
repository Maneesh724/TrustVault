import test from 'node:test';
import assert from 'node:assert/strict';
import {
  otpBackendService,
  registrationBackendService,
  loginBackendService,
  approvalBackendService,
  backendStore,
} from '../src/server/authBackend.ts';

test('TrustVault Authentication & Zero-Trust Security Test Suite', async (t) => {
  // Reset store before test suite
  backendStore.initDefaultUsers();
  backendStore.otpStore.clear();
  backendStore.verificationTokens.clear();
  backendStore.sessions.clear();

  // ==========================================================================
  // Test 1: OTP Expiry Enforcement (5-minute TTL)
  // ==========================================================================
  await t.test('1. OTP Expiry: Should reject OTP after 5 minutes has elapsed', async () => {
    const testPhone = '+919876543201';
    const otpRes = await otpBackendService.requestOtp(testPhone, 'VIEWER');
    assert.equal(otpRes.success, true);
    assert.ok(otpRes.devOtp, 'Development OTP should be returned in development mode');

    // Simulate OTP expiration by manually winding the expiresAt timestamp into the past
    const record = backendStore.otpStore.get(otpBackendService.normalizePhone(testPhone));
    assert.ok(record, 'OTP record should exist in backend store');
    record.expiresAt = Date.now() - 1000; // 1 second in the past

    // Attempt to verify expired OTP
    await assert.rejects(
      async () => {
        await otpBackendService.verifyOtp(testPhone, otpRes.devOtp!);
      },
      {
        message: /OTP has expired \(validity period is 5 minutes\)/,
      },
      'Expired OTP must be rejected by backend'
    );
  });

  // ==========================================================================
  // Test 2: Invalid OTP & Attempt Rate Limiting (Single-Use & Max 5 Attempts)
  // ==========================================================================
  await t.test('2. Invalid OTP: Should decrement attempts and invalidate after 5 failed tries', async () => {
    const testPhone = '+919876543202';
    const otpRes = await otpBackendService.requestOtp(testPhone, 'VIEWER');
    assert.equal(otpRes.success, true);

    // 1st failed attempt
    await assert.rejects(
      async () => {
        await otpBackendService.verifyOtp(testPhone, '000000');
      },
      {
        message: /Invalid verification code\. 4 attempt\(s\) remaining/,
      }
    );

    // 2nd, 3rd, 4th failed attempts
    for (let i = 3; i >= 1; i--) {
      await assert.rejects(
        async () => {
          await otpBackendService.verifyOtp(testPhone, '111111');
        },
        {
          message: new RegExp(`Invalid verification code\\. ${i} attempt\\(s\\) remaining`),
        }
      );
    }

    // 5th failed attempt -> Invalidation
    await assert.rejects(
      async () => {
        await otpBackendService.verifyOtp(testPhone, '222222');
      },
      {
        message: /Maximum verification attempts exceeded/,
      }
    );

    // After invalidation, record should be expunged
    assert.equal(
      backendStore.otpStore.has(otpBackendService.normalizePhone(testPhone)),
      false,
      'Invalidated OTP record must be expunged from memory'
    );
  });

  // ==========================================================================
  // Test 3: Administrator Privilege Escalation Prevention
  // ==========================================================================
  await t.test('3. Role Security: Public user cannot self-register as Administrator', async () => {
    const testPhone = '+919876543203';
    const otpRes = await otpBackendService.requestOtp(testPhone, 'ADMIN');
    const verifyRes = await otpBackendService.verifyOtp(testPhone, otpRes.devOtp!);
    assert.ok(verifyRes.verificationToken);

    // Attempt to register as ADMIN without provisioning passcode
    await assert.rejects(
      async () => {
        await registrationBackendService.register({
          name: 'Attacker Impersonator',
          email: 'attacker@evilcorp.com',
          phone: testPhone,
          role: 'ADMIN',
          password: 'EnterprisePassword123!',
          department: 'Executive',
          otpVerificationToken: verifyRes.verificationToken,
          adminProvisioningToken: undefined, // Missing token!
        });
      },
      {
        message: /Privilege Escalation Blocked: Administrator accounts cannot be created via public self-registration/,
      },
      'Public self-registration as ADMIN must be blocked'
    );

    // Verify attacker account was NOT created
    assert.equal(backendStore.findUserByEmail('attacker@evilcorp.com'), undefined);
  });

  // ==========================================================================
  // Test 4: Pending-Account Login Rejection & Approval Gate
  // ==========================================================================
  await t.test('4. Account Approval: Must reject login for PENDING_APPROVAL and permit login only after approval', async () => {
    const testPhone = '+919876543204';
    const testEmail = 'marcus.vance@trustvault.internal';

    // Step A: Request and verify OTP
    const otpRes = await otpBackendService.requestOtp(testPhone, 'VIEWER');
    const verifyRes = await otpBackendService.verifyOtp(testPhone, otpRes.devOtp!);

    // Step B: Register account
    const regRes = await registrationBackendService.register({
      name: 'Marcus Vance',
      email: testEmail,
      phone: testPhone,
      role: 'VIEWER',
      password: 'StrongVaultPassword2026!',
      department: 'Compliance Governance',
      otpVerificationToken: verifyRes.verificationToken,
    });

    assert.equal(regRes.status, 'PENDING_APPROVAL');
    assert.ok(regRes.emailDispatched.subject.includes('Awaiting Authorization'));

    // Step C: Attempt to log in BEFORE approval -> MUST BE REJECTED
    await assert.rejects(
      async () => {
        await loginBackendService.login(testEmail, 'StrongVaultPassword2026!');
      },
      {
        message: /Account Pending Authorization: Your account registration is awaiting approval/,
      },
      'Pending account must not be permitted to authenticate'
    );

    // Step D: Authorized Administrator approves the account
    const approveRes = await approvalBackendService.approveAccount(regRes.user.id, 'John Doe (Administrator)');
    assert.equal(approveRes.success, true);
    assert.equal(approveRes.user.status, 'ACTIVE');
    assert.ok(approveRes.emailDispatched.subject.includes('Account Activated'));

    // Step E: Attempt to log in AFTER approval -> MUST SUCCEED
    const loginRes = await loginBackendService.login(testEmail, 'StrongVaultPassword2026!');
    assert.equal(loginRes.success, true);
    assert.equal(loginRes.user.email, testEmail);
    assert.ok(loginRes.sessionId, 'Secure session ID must be generated upon successful login');

    // Step F: Validate live session check
    const sessionUser = loginBackendService.validateSession(loginRes.sessionId);
    assert.ok(sessionUser);
    assert.equal(sessionUser?.id, regRes.user.id);
  });
});
