import urllib.request
import json
import time
import sys

def log(msg):
    print(msg)
    sys.stdout.flush()

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def get(url):
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def run_tests():
    ts = int(time.time())
    unique_phone = f"+919876{ts % 1000000:06d}"
    unique_email = f"e2e.{ts}@trustvault.com"

    log("=" * 60)
    log(f"TrustVault Django REST Backend End-to-End Verification")
    log(f"Testing with Phone: {unique_phone}, Email: {unique_email}")
    log("=" * 60)

    # 1. Send OTP
    log("\n1. Requesting Mobile OTP...")
    status_code, res = post('http://127.0.0.1:8000/api/auth/send-otp', {
        'phone': unique_phone,
        'role': 'VIEWER'
    })
    log(f"   Status: {status_code}, Provider: {res.get('provider')}")
    log(f"   Dev OTP: {res.get('devOtp')}")
    assert status_code == 200, f"Expected 200, got {status_code}"
    otp = res.get('devOtp')

    # 2. Verify OTP
    log("\n2. Verifying OTP...")
    status_code, res = post('http://127.0.0.1:8000/api/auth/verify-otp', {
        'phone': unique_phone,
        'otp': otp
    })
    log(f"   Status: {status_code}, Token: {res.get('verificationToken')[:20]}...")
    assert status_code == 200
    token = res.get('verificationToken')

    # 3. Register user
    log("\n3. Registering Viewer Account (Pending Approval)...")
    status_code, res = post('http://127.0.0.1:8000/api/auth/register', {
        'name': f'E2E Viewer {ts}',
        'email': unique_email,
        'phone': unique_phone,
        'role': 'VIEWER',
        'password': 'StrongPassword@2026',
        'otpVerificationToken': token
    })
    log(f"   Status: {status_code}, User Status: {res.get('user', {}).get('status')}")
    assert status_code == 201
    assert res.get('user', {}).get('status') == 'PENDING_APPROVAL'
    user_id = res.get('user', {}).get('id')

    # 4. Attempt Login while Pending
    log("\n4. Attempting Login while PENDING_APPROVAL...")
    status_code, res = post('http://127.0.0.1:8000/api/auth/login', {
        'email': unique_email,
        'password': 'StrongPassword@2026'
    })
    log(f"   Status: {status_code} (Must be 403 Forbidden)")
    log(f"   Notice: {res.get('error')[:60]}...")
    assert status_code == 403

    # 5. Check Pending Users List
    log("\n5. Checking Admin Pending Users Queue...")
    status_code, res = get('http://127.0.0.1:8000/api/auth/pending-users')
    pending_emails = [u['email'] for u in res.get('pendingUsers', [])]
    log(f"   Pending count: {len(pending_emails)}, contains new user: {unique_email in pending_emails}")
    assert unique_email in pending_emails

    # 6. Admin Approves User
    log("\n6. Approving User as Security Administrator...")
    status_code, res = post('http://127.0.0.1:8000/api/auth/approve', {
        'targetUserId': user_id,
        'approverName': 'John Doe'
    })
    log(f"   Status: {status_code}, Activated Status: {res.get('user', {}).get('status')}")
    assert status_code == 200
    assert res.get('user', {}).get('status') == 'ACTIVE'

    # 7. Login after Approval
    log("\n7. Logging in as newly ACTIVATED user...")
    status_code, res = post('http://127.0.0.1:8000/api/auth/login', {
        'email': unique_email,
        'password': 'StrongPassword@2026'
    })
    log(f"   Status: {status_code}, Logged In User: {res.get('user', {}).get('name')}")
    assert status_code == 200
    assert res.get('success') is True

    # 8. Check Append-Only Audit Records
    log("\n8. Verifying Append-Only Audit Trail...")
    status_code, audit_records = get('http://127.0.0.1:8000/api/audit')
    log(f"   Audit entries recorded: {len(audit_records)}")
    latest_actions = [a['action'] for a in audit_records[:5]]
    log(f"   Recent actions: {latest_actions}")
    assert len(audit_records) > 0

    # 9. Check Admin Notifications
    log("\n9. Verifying Admin Notifications Stream...")
    status_code, notifs = get('http://127.0.0.1:8000/api/notifications')
    log(f"   Notifications count: {len(notifs)}")
    log(f"   Latest: {notifs[0]['title']} - {notifs[0]['message'][:60]}...")
    assert len(notifs) > 0

    log("\n" + "=" * 60)
    log("ALL 9 BACKEND END-TO-END CHECKS PASSED PERFECTLY!")
    log("=" * 60)

if __name__ == '__main__':
    run_tests()
