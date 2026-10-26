"""
Django settings for trustvault_backend project.
Zero-Trust Enterprise Document Vault — Production & Local Hybrid Configuration
"""

from pathlib import Path
import os

# Load .env file if it exists locally
env_path = Path(__file__).resolve().parent.parent / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, value = line.partition('=')
                os.environ[key.strip()] = value.strip()

# Build paths inside the project: BASE_DIR is backend root
BASE_DIR = Path(__file__).resolve().parent.parent

# 1. Environment & Debug Flag
DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 'yes')

# 2. Cryptographic Secret Key
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    if DEBUG:
        # Development fallback only
        SECRET_KEY = 'django-insecure-p0@+)9tj6vdbg^d=2u0c+7o2v+7!!3l*2a4)$s8%4eavm*@d76'
    else:
        raise ValueError("CRITICAL SECURITY ERROR: DJANGO_SECRET_KEY environment variable is required in production.")

# 3. Allowed Hosts
ALLOWED_HOSTS = ['*']

# 4. Applications Definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'vault_api',
]

# 5. Middleware Pipeline
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
]

# WhiteNoise for production static asset serving (if available)
try:
    import whitenoise
    MIDDLEWARE.append('whitenoise.middleware.WhiteNoiseMiddleware')
except ImportError:
    pass

MIDDLEWARE.extend([
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # Headless SPA REST API: CSRF evaluated via session cookies and origin headers
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
])

ROOT_URLCONF = 'trustvault_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'trustvault_backend.wsgi.application'

# 6. Database Configuration (Zero-Downtime Hybrid: PostgreSQL if DATABASE_URL is set, SQLite otherwise)
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    try:
        import dj_database_url
        DATABASES = {
            'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600, ssl_require=True)
        }
    except ImportError:
        # Fallback to local SQLite if dj_database_url is missing locally
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# 7. Custom User Model
AUTH_USER_MODEL = 'vault_api.CustomUser'

# 8. Password Hashing (Argon2id first, PBKDF2 fallback)
PASSWORD_HASHERS = [
    'vault_api.hashers.OptimizedArgon2PasswordHasher',
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

# 9. Password Validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# 10. Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# 11. Static Files (Admin & DRF styles)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# 12. Private Vault Media Storage (Encrypted / UUID files)
MEDIA_ROOT = BASE_DIR / 'vault_storage'
MEDIA_URL = '/media/'

# 13. CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "https://trust-vault-9c688.web.app",
    "https://trust-vault-9c688.firebaseapp.com",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
cors_origins_env = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if cors_origins_env:
    for o in cors_origins_env.split(','):
        cleaned_origin = o.strip()
        if cleaned_origin and cleaned_origin not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(cleaned_origin)

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-session-id',
]

# 14. CSRF Trusted Origins
csrf_origins_env = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
if csrf_origins_env:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in csrf_origins_env.split(',') if o.strip()]
else:
    CSRF_TRUSTED_ORIGINS = [
        'https://*.onrender.com',
        'https://trust-vault-9c688.web.app',
        'https://trust-vault-9c688.firebaseapp.com',
    ]

# 15. REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}

# 16. Session Cookie Policy (Cross-site HTTPS for Firebase & Render)
SESSION_COOKIE_NAME = 'trustvault_session'
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SECURE = True

# 17. HTTPS & Proxy Security (Render / Production)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# 18. Email Configuration (Gmail / Brevo SMTP or HTTPS API fallback)
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp-relay.brevo.com' if os.environ.get('BREVO_API_KEY') or 'brevo' in os.environ.get('EMAIL_HOST_USER', '').lower() else 'smtp.gmail.com')

raw_port = os.environ.get('EMAIL_PORT', '587').strip().strip('"').strip("'")
try:
    EMAIL_PORT = int(raw_port) if raw_port else 587
except (ValueError, TypeError):
    EMAIL_PORT = 587

EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').strip().lower() in ('true', '1', 'yes')
EMAIL_USE_SSL = os.environ.get('EMAIL_USE_SSL', 'False').strip().lower() in ('true', '1', 'yes')
if EMAIL_PORT == 465 or EMAIL_USE_SSL:
    EMAIL_USE_SSL = True
    EMAIL_USE_TLS = False

EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '').strip()
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '').replace(' ', '').strip().strip('"').strip("'")
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL') or EMAIL_HOST_USER
EMAIL_TIMEOUT = 15  # 15s allowance for TLS handshake

# 19. AI Security Assistant (Optional)
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
