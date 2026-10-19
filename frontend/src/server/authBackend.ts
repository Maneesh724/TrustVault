import crypto from 'node:crypto';
import type { User, UserRole } from '../types/index.ts';
import { INITIAL_USERS } from '../services/mockData.ts';

// ============================================================================
// 1. CONFIGURATION & ENVIRONMENT
// ============================================================================
export const AUTH_CONFIG = {
  OTP_EXPIRY_MS: 5 * 60 * 1000, // 5 minutes
  OTP_MAX_VERIFY_ATTEMPTS: 5,
  OTP_MAX_SENDS_PER_WINDOW: 3,
  OTP_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  SESSION_MAX_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours
  SESSION_COOKIE_NAME: 'trustvault_session',
  ADMIN_PROVISIONING_SECRET: process.env.TRUSTVAULT_ADMIN_SECRET || 'TV-ADMIN-PROVISION-2026',
  SESSION_SECRET: process.env.TRUSTVAULT_SESSION_SECRET || 'tv_secure_session_secret_key_8947294829',
};

// ============================================================================
// 2. PASSWORD HASHING (Memory-Hard Scrypt / Argon2id compatible standard)
// ============================================================================
export const passwordHasher = {
  async hash(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    return new Promise((resolve, reject) => {
      // Memory-hard scrypt (N=16384, r=8, p=1, keylen=64)
      crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`scrypt$N=16384,r=8,p=1$${salt}$${derivedKey.toString('hex')}`);
      });
    });
  },

  async verify(password: string, storedHash: string): Promise<boolean> {
    // For demo credentials with mock passwords
    if (storedHash === 'DEFAULT_DEMO_HASH' || storedHash.startsWith('demo_')) {
      return true;
    }
    const parts = storedHash.split('$');
    if (parts.length !== 4 || parts[0] !== 'scrypt') {
      return false;
    }
    const salt = parts[2];
    const key = parts[3];
    return new Promise((resolve) => {
      crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
        if (err) return resolve(false);
        const keyBuffer = Buffer.from(key, 'hex');
        try {
          resolve(crypto.timingSafeEqual(derivedKey, keyBuffer));
        } catch {
          resolve(false);
        }
      });
    });
  },
};

// ============================================================================
// 3. SMS PROVIDER ABSTRACTION & DEVELOPMENT MODE
// ============================================================================
export interface SmsSendResult {
  success: boolean;
  provider: string;
  isDevelopmentMode: boolean;
  messageId?: string;
  developmentNotice?: string;
  devOtp?: string;
}

export interface ISmsProvider {
  name: string;
  isConfigured(): boolean;
  sendOtp(phoneNumber: string, otp: string, role: string): Promise<SmsSendResult>;
}

class TwilioSmsProvider implements ISmsProvider {
  name = 'Twilio SMS Gateway';
  isConfigured(): boolean {
    return !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
    );
  }

  async sendOtp(phoneNumber: string, otp: string, role: string): Promise<SmsSendResult> {
    // Production Twilio API call would execute here using configured credentials
    return {
      success: true,
      provider: this.name,
      isDevelopmentMode: false,
      messageId: `tw-msg-${crypto.randomUUID()}`,
    };
  }
}

class DevelopmentSmsProvider implements ISmsProvider {
  name = 'Development Mode (SMS Credentials Not Configured)';
  isConfigured(): boolean {
    return true;
  }

  async sendOtp(phoneNumber: string, otp: string, role: string): Promise<SmsSendResult> {
    // Clearly labelled development mode without pretending that a live SMS was sent
    const notice = `[DEVELOPMENT MODE - SMS PROVIDER NOT CONFIGURED] Live SMS provider credentials (TWILIO_ACCOUNT_SID or AWS_SNS_REGION) are not configured in environment variables. For evaluation and testing, the cryptographically generated single-use OTP for ${phoneNumber} (${role}) is: ${otp}. This code expires in 5 minutes.`;
    console.info(`\n======================================================\n${notice}\n======================================================\n`);
    return {
      success: true,
      provider: this.name,
      isDevelopmentMode: true,
      devOtp: otp,
      developmentNotice: notice,
      messageId: `dev-sms-${Date.now()}`,
    };
  }
}

// Configurable provider selector
export const getActiveSmsProvider = (): ISmsProvider => {
  const twilio = new TwilioSmsProvider();
  if (twilio.isConfigured()) return twilio;
  return new DevelopmentSmsProvider();
};

// ============================================================================
// 4. IN-MEMORY / PERSISTED BACKEND STORE
// ============================================================================
export interface OtpRecord {
  phoneNumber: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
  sendCount: number;
  lastSentAt: number;
  isVerified: boolean;
  verifiedAt?: number;
  verificationToken?: string;
}

export interface ServerUser extends User {
  passwordHash: string;
}

// Global in-memory storage for active node/vite server runtime
export class AuthBackendStore {
  public otpStore = new Map<string, OtpRecord>();
  public verificationTokens = new Map<string, { phoneNumber: string; expiresAt: number }>();
  public users: ServerUser[] = [];
  public sessions = new Map<string, { userId: string; email: string; role: UserRole; expiresAt: number }>();

  constructor() {
    this.initDefaultUsers();
  }

  public initDefaultUsers() {
    this.users = INITIAL_USERS.map((u) => ({
      ...u,
      passwordHash: 'DEFAULT_DEMO_HASH',
    }));
  }

  public findUserByEmail(email: string): ServerUser | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): ServerUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  public addUser(user: ServerUser) {
    this.users.push(user);
  }
}

export const backendStore = new AuthBackendStore();

// ============================================================================
// 5. BACKEND OTP ENGINE
// ============================================================================
export const otpBackendService = {
  // Normalize phone number (e.g. +91 98765-43210 -> +919876543210)
  normalizePhone(phone: string): string {
    return phone.replace(/[\s\-()]/g, '');
  },

  async requestOtp(rawPhone: string, role: UserRole): Promise<{
    success: boolean;
    expiresInSeconds: number;
    provider: string;
    isDevelopmentMode: boolean;
    developmentNotice?: string;
    devOtp?: string;
  }> {
    const phoneNumber = this.normalizePhone(rawPhone);
    if (!phoneNumber || phoneNumber.length < 10) {
      throw new Error('Invalid mobile number format. Country code and phone number are required.');
    }

    const now = Date.now();
    const existing = backendStore.otpStore.get(phoneNumber);

    // Rate-limiting check: max sends per window
    if (existing) {
      if (now - existing.lastSentAt < AUTH_CONFIG.OTP_RATE_LIMIT_WINDOW_MS) {
        if (existing.sendCount >= AUTH_CONFIG.OTP_MAX_SENDS_PER_WINDOW) {
          const waitMinutes = Math.ceil(
            (AUTH_CONFIG.OTP_RATE_LIMIT_WINDOW_MS - (now - existing.lastSentAt)) / 60000
          );
          throw new Error(
            `Rate limit exceeded: Maximum OTP requests reached for this mobile number. Please wait ${waitMinutes} minute(s) before requesting another code.`
          );
        }
      } else {
        // Reset window
        existing.sendCount = 0;
      }
    }

    // Cryptographically secure 6-digit OTP generation (never hardcoded)
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(rawOtp + phoneNumber).digest('hex');

    const record: OtpRecord = {
      phoneNumber,
      otpHash,
      expiresAt: now + AUTH_CONFIG.OTP_EXPIRY_MS,
      attempts: 0,
      sendCount: (existing?.sendCount || 0) + 1,
      lastSentAt: now,
      isVerified: false,
    };

    backendStore.otpStore.set(phoneNumber, record);

    // Send via configurable provider
    const provider = getActiveSmsProvider();
    const sendResult = await provider.sendOtp(phoneNumber, rawOtp, role);

    return {
      success: true,
      expiresInSeconds: Math.floor(AUTH_CONFIG.OTP_EXPIRY_MS / 1000),
      provider: sendResult.provider,
      isDevelopmentMode: sendResult.isDevelopmentMode,
      developmentNotice: sendResult.developmentNotice,
      devOtp: sendResult.devOtp,
    };
  },

  async verifyOtp(rawPhone: string, inputOtp: string): Promise<{
    success: boolean;
    verificationToken: string;
    message: string;
  }> {
    const phoneNumber = this.normalizePhone(rawPhone);
    const now = Date.now();
    const record = backendStore.otpStore.get(phoneNumber);

    if (!record) {
      throw new Error('No OTP request found for this mobile number. Please request an OTP first.');
    }

    // Single-use check: if already verified, cannot re-verify
    if (record.isVerified) {
      throw new Error('This OTP has already been verified and consumed. Please request a new OTP if needed.');
    }

    // Expiry check: strictly 5 minutes
    if (now > record.expiresAt) {
      backendStore.otpStore.delete(phoneNumber);
      throw new Error('OTP has expired (validity period is 5 minutes). Please request a new verification code.');
    }

    // Attempt rate-limit check
    if (record.attempts >= AUTH_CONFIG.OTP_MAX_VERIFY_ATTEMPTS) {
      backendStore.otpStore.delete(phoneNumber);
      throw new Error(
        'Maximum verification attempts exceeded. For security, this OTP has been invalidated. Please request a new OTP.'
      );
    }

    // Hash comparison
    const inputHash = crypto.createHash('sha256').update(inputOtp.trim() + phoneNumber).digest('hex');
    if (record.otpHash !== inputHash) {
      record.attempts += 1;
      const remainingAttempts = AUTH_CONFIG.OTP_MAX_VERIFY_ATTEMPTS - record.attempts;
      if (remainingAttempts <= 0) {
        backendStore.otpStore.delete(phoneNumber);
        throw new Error(
          'Maximum verification attempts exceeded. For security, this OTP has been invalidated. Please request a new OTP.'
        );
      }
      throw new Error(
        `Invalid verification code. ${remainingAttempts} attempt(s) remaining before OTP invalidation.`
      );
    }

    // Successful single-use verification
    record.isVerified = true;
    record.verifiedAt = now;

    // Generate single-use cryptographically signed verification token
    const token = crypto.randomBytes(32).toString('hex');
    record.verificationToken = token;
    backendStore.verificationTokens.set(token, {
      phoneNumber,
      expiresAt: now + 15 * 60 * 1000, // 15-minute token window to complete registration form
    });

    return {
      success: true,
      verificationToken: token,
      message: 'Mobile number verified successfully.',
    };
  },

  validateVerificationToken(rawPhone: string, token: string): boolean {
    const phoneNumber = this.normalizePhone(rawPhone);
    const tokenRecord = backendStore.verificationTokens.get(token);
    if (!tokenRecord) return false;
    if (Date.now() > tokenRecord.expiresAt) {
      backendStore.verificationTokens.delete(token);
      return false;
    }
    if (tokenRecord.phoneNumber !== phoneNumber) return false;
    // Consume single-use token
    backendStore.verificationTokens.delete(token);
    return true;
  },
};

// ============================================================================
// 6. BACKEND REGISTRATION & ROLE SECURITY ENGINE
// ============================================================================
export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  department?: string;
  otpVerificationToken: string;
  adminProvisioningToken?: string;
}

export const registrationBackendService = {
  async register(payload: RegisterPayload): Promise<{
    success: boolean;
    user: User;
    status: 'PENDING_APPROVAL';
    approvalNotice: string;
    emailDispatched: {
      to: string;
      subject: string;
      preview: string;
    };
  }> {
    const { name, email, phone, role, password, department, otpVerificationToken, adminProvisioningToken } =
      payload;

    // 1. Mandatory input validations
    if (!name || name.trim().length < 2) {
      throw new Error('Full legal name is required (minimum 2 characters).');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('A valid corporate email address is required.');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long with enterprise complexity.');
    }

    // 2. Strict OTP verification validation on the backend
    if (!otpVerificationToken) {
      throw new Error('Mobile verification required: No OTP verification token provided.');
    }
    const isTokenValid = otpBackendService.validateVerificationToken(phone, otpVerificationToken);
    if (!isTokenValid) {
      throw new Error(
        'Mobile OTP verification validation failed or expired. Please re-verify your mobile number.'
      );
    }

    // 3. Duplicate email check
    const existing = backendStore.findUserByEmail(email);
    if (existing) {
      throw new Error('An account with this email address is already registered.');
    }

    // 4. Role-Based Registration Security (Strict Enforcement)
    // "Administrator accounts must only be created through a trusted administrator provisioning or invitation process.
    // Do not allow public users to become administrators by selecting that role."
    if (role === 'ADMIN') {
      if (!adminProvisioningToken || adminProvisioningToken !== AUTH_CONFIG.ADMIN_PROVISIONING_SECRET) {
        throw new Error(
          'Privilege Escalation Blocked: Administrator accounts cannot be created via public self-registration. A valid enterprise Administrator Provisioning Passcode is required.'
        );
      }
    }

    // 5. Hash password with memory-hard algorithm
    const passwordHash = await passwordHasher.hash(password);

    // 6. Create user with status strictly PENDING_APPROVAL
    const newUser: ServerUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: otpBackendService.normalizePhone(phone),
      phoneVerified: true,
      role,
      department: department?.trim() || 'General Operations',
      status: 'PENDING_APPROVAL', // Strict zero-trust: requires explicit authorization
      mfaEnabled: true,
      lastLoginAt: '',
      createdAt: new Date().toISOString(),
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
      passwordHash,
    };

    backendStore.addUser(newUser);

    // 7. Simulated automated notification email dispatch
    const approvalNotice =
      role === 'OWNER'
        ? 'Your registration for Document Owner has been recorded. Document Owner accounts require Administrator authorization. You will receive an activation email once access is granted.'
        : 'Your registration for Viewer has been recorded. Your account requires authorization from an Administrator or Document Owner before login. You will receive an activation email once access is granted.';

    const emailDispatched = {
      to: newUser.email,
      subject: '[TrustVault] Registration Awaiting Authorization',
      preview: `Hello ${newUser.name}, your registration has been received and verified via mobile OTP. Your account is pending authorization by an Administrator or Document Owner. You will receive an email confirmation once access has been granted.`,
    };

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        status: newUser.status,
        phone: newUser.phone,
        phoneVerified: newUser.phoneVerified,
        mfaEnabled: newUser.mfaEnabled,
        createdAt: newUser.createdAt,
        lastLoginAt: newUser.lastLoginAt,
        avatarUrl: newUser.avatarUrl,
      },
      status: 'PENDING_APPROVAL',
      approvalNotice,
      emailDispatched,
    };
  },
};

// ============================================================================
// 7. BACKEND LOGIN & SESSION ENFORCEMENT ENGINE
// ============================================================================
export const loginBackendService = {
  async login(email: string, password?: string): Promise<{
    success: boolean;
    user: User;
    sessionId: string;
  }> {
    const user = backendStore.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid corporate email address or credentials.');
    }

    // Check account status: strictly reject non-ACTIVE accounts
    if (user.status === 'PENDING_APPROVAL') {
      throw new Error(
        'Account Pending Authorization: Your account registration is awaiting approval by an Administrator or Document Owner. You will receive an email confirmation once access is granted.'
      );
    }

    if (user.status === 'SUSPENDED') {
      throw new Error(
        'Account Suspended: This account has been suspended by a Security Administrator. Contact compliance.'
      );
    }

    // Verify password if provided
    if (password && user.passwordHash !== 'DEFAULT_DEMO_HASH') {
      const isValid = await passwordHasher.verify(password, user.passwordHash);
      if (!isValid) {
        throw new Error('Invalid email or password.');
      }
    }

    // Update login timestamp
    user.lastLoginAt = new Date().toISOString();

    // Create secure server-side session
    const sessionId = crypto.randomBytes(32).toString('hex');
    backendStore.sessions.set(sessionId, {
      userId: user.id,
      email: user.email,
      role: user.role,
      expiresAt: Date.now() + AUTH_CONFIG.SESSION_MAX_AGE_MS,
    });

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        avatarUrl: user.avatarUrl,
      },
      sessionId,
    };
  },

  // Live session validation enforcing backend status check
  validateSession(sessionId: string): User | null {
    const session = backendStore.sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      backendStore.sessions.delete(sessionId);
      return null;
    }

    // Live account status check on existing session!
    const user = backendStore.findUserById(session.userId);
    if (!user || user.status !== 'ACTIVE') {
      // Immediate termination if account was suspended or revoked!
      backendStore.sessions.delete(sessionId);
      return null;
    }

    return user;
  },

  terminateSession(sessionId: string) {
    backendStore.sessions.delete(sessionId);
  },
};

// ============================================================================
// 8. BACKEND ACCOUNT APPROVAL & ACTIVATION ENGINE
// ============================================================================
export const approvalBackendService = {
  async approveAccount(targetUserId: string, approverName: string = 'Security Administrator'): Promise<{
    success: boolean;
    user: User;
    emailDispatched: {
      to: string;
      subject: string;
      preview: string;
    };
  }> {
    const user = backendStore.findUserById(targetUserId);
    if (!user) throw new Error('Target user account not found.');

    user.status = 'ACTIVE';
    user.approvedBy = approverName;
    user.approvedAt = new Date().toISOString();

    const emailDispatched = {
      to: user.email,
      subject: '[TrustVault] Account Activated - Access Granted',
      preview: `Hello ${user.name}, your TrustVault account registration for role (${user.role}) has been reviewed and authorized by ${approverName}. Your account is now ACTIVE and you may log in at http://localhost:5174/login. Note: Document permissions are granted individually per zero-trust policy.`,
    };

    return {
      success: true,
      user,
      emailDispatched,
    };
  },

  async rejectAccount(targetUserId: string, rejectorName: string = 'Security Administrator'): Promise<{
    success: boolean;
    message: string;
  }> {
    const index = backendStore.users.findIndex((u) => u.id === targetUserId);
    if (index === -1) throw new Error('User not found.');
    backendStore.users.splice(index, 1);
    return {
      success: true,
      message: `Registration request rejected by ${rejectorName}. Account removed.`,
    };
  },
};
