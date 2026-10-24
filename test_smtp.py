import os
import sys
from pathlib import Path

# Load settings & test sending mail
sys.path.insert(0, str(Path(__file__).resolve().parent / 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trustvault_backend.settings')

import django
django.setup()

from django.conf import settings
from django.core.mail import send_mail

host = getattr(settings, 'EMAIL_HOST', '')
port = getattr(settings, 'EMAIL_PORT', '')
user = getattr(settings, 'EMAIL_HOST_USER', '')
use_tls = getattr(settings, 'EMAIL_USE_TLS', '')
from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '')

out = []
out.append(f"SMTP Config: Host={host}:{port}, STARTTLS={use_tls}, User={user}")

try:
    send_mail(
        subject="[TrustVault Security] Test Verification Code",
        message="Hello,\n\nThis is a confirmation test email from TrustVault Gmail SMTP. Your OTP delivery service is active.\n\n— TrustVault Security",
        from_email=from_email,
        recipient_list=[user],
        fail_silently=False
    )
    out.append("SUCCESS: Test email successfully sent through smtp.gmail.com:587!")
except Exception as e:
    out.append(f"FAILED: {type(e).__name__}: {e}")

with open('test_smtp_result.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(out))

print("\n".join(out), flush=True)
