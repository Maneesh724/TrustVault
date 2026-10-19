import { Plugin } from 'vite';
import {
  otpBackendService,
  registrationBackendService,
  loginBackendService,
  approvalBackendService,
  backendStore,
  AUTH_CONFIG,
} from './authBackend';

export function trustvaultAuthApiPlugin(): Plugin {
  return {
    name: 'trustvault-auth-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api/auth/')) {
          return next();
        }

        // Helper to parse JSON body
        const getBody = async (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch (e) {
                reject(new Error('Invalid JSON payload'));
              }
            });
            req.on('error', reject);
          });
        };

        // Helper to send JSON responses
        const sendJson = (statusCode: number, data: any, headers?: Record<string, string>) => {
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          if (headers) {
            for (const [key, value] of Object.entries(headers)) {
              res.setHeader(key, value);
            }
          }
          res.end(JSON.stringify(data));
        };

        // Extract cookie helper
        const parseCookies = (): Record<string, string> => {
          const cookieHeader = req.headers.cookie || '';
          const list: Record<string, string> = {};
          cookieHeader.split(';').forEach((cookie) => {
            const parts = cookie.split('=');
            if (parts.length === 2) {
              list[parts[0].trim()] = decodeURIComponent(parts[1].trim());
            }
          });
          return list;
        };

        try {
          // 1. Send OTP
          if (url === '/api/auth/send-otp' && req.method === 'POST') {
            const body = await getBody();
            const result = await otpBackendService.requestOtp(body.phone, body.role || 'VIEWER');
            return sendJson(200, result);
          }

          // 2. Verify OTP
          if (url === '/api/auth/verify-otp' && req.method === 'POST') {
            const body = await getBody();
            const result = await otpBackendService.verifyOtp(body.phone, body.otp);
            return sendJson(200, result);
          }

          // 3. Register Account
          if (url === '/api/auth/register' && req.method === 'POST') {
            const body = await getBody();
            const result = await registrationBackendService.register({
              name: body.name,
              email: body.email,
              phone: body.phone,
              role: body.role,
              password: body.password,
              department: body.department,
              otpVerificationToken: body.otpVerificationToken,
              adminProvisioningToken: body.adminProvisioningToken,
            });
            return sendJson(201, result);
          }

          // 4. Login
          if (url === '/api/auth/login' && req.method === 'POST') {
            const body = await getBody();
            const result = await loginBackendService.login(body.email, body.password);

            // Set secure session cookie
            const cookieVal = `${AUTH_CONFIG.SESSION_COOKIE_NAME}=${result.sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`;
            return sendJson(200, result, { 'Set-Cookie': cookieVal });
          }

          // 5. Get Session Info (Enforces live status check on existing sessions)
          if (url === '/api/auth/me' && req.method === 'GET') {
            const cookies = parseCookies();
            const sessionId = cookies[AUTH_CONFIG.SESSION_COOKIE_NAME];
            if (!sessionId) {
              return sendJson(401, { authenticated: false, message: 'No active session' });
            }
            const user = loginBackendService.validateSession(sessionId);
            if (!user) {
              return sendJson(401, {
                authenticated: false,
                message: 'Session expired or account status no longer active',
              });
            }
            return sendJson(200, { authenticated: true, user });
          }

          // 6. Logout
          if (url === '/api/auth/logout' && req.method === 'POST') {
            const cookies = parseCookies();
            const sessionId = cookies[AUTH_CONFIG.SESSION_COOKIE_NAME];
            if (sessionId) {
              loginBackendService.terminateSession(sessionId);
            }
            const clearCookie = `${AUTH_CONFIG.SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
            return sendJson(200, { success: true, message: 'Logged out' }, { 'Set-Cookie': clearCookie });
          }

          // 7. Get Pending Users (for approvers)
          if (url === '/api/auth/pending-users' && req.method === 'GET') {
            const pending = backendStore.users.filter((u) => u.status === 'PENDING_APPROVAL');
            return sendJson(200, { success: true, pendingUsers: pending });
          }

          // 8. Approve Account
          if (url === '/api/auth/approve' && req.method === 'POST') {
            const body = await getBody();
            const result = await approvalBackendService.approveAccount(
              body.targetUserId,
              body.approverName || 'Security Administrator'
            );
            return sendJson(200, result);
          }

          // 9. Reject Account
          if (url === '/api/auth/reject' && req.method === 'POST') {
            const body = await getBody();
            const result = await approvalBackendService.rejectAccount(
              body.targetUserId,
              body.rejectorName || 'Security Administrator'
            );
            return sendJson(200, result);
          }

          // Not found under /api/auth
          return sendJson(404, { error: 'Auth API endpoint not found' });
        } catch (err: any) {
          const statusCode =
            err.message?.includes('Rate limit') ? 429 :
            err.message?.includes('Privilege Escalation') ? 403 :
            err.message?.includes('Pending Authorization') ? 403 :
            err.message?.includes('Suspended') ? 403 :
            err.message?.includes('already registered') ? 409 :
            err.message?.includes('Invalid') ? 400 : 500;

          return sendJson(statusCode, {
            success: false,
            error: err.message || 'Server error',
          });
        }
      });
    },
  };
}
