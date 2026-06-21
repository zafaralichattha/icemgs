from pathlib import Path
from decouple import config
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production-2024')

DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,testserver', cast=lambda v: [s.strip() for s in v.split(',')])
# Support Django test client default host and local development
if 'testserver' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('testserver')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',

    # Third-party apps
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'dj_rest_auth',
    'dj_rest_auth.registration',

    # Local apps
    'estimation',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'icemgs_backend.middleware.ExceptionLoggingMiddleware',
]

ROOT_URLCONF = 'icemgs_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR.parent / 'dist'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'icemgs_backend.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='icemgs_db'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default='postgres'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Karachi'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR.parent / 'dist',
]
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'estimation.User'

# Authentication backends — required for allauth email login + admin
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# Django REST Framework
# NOTE: SessionAuthentication is intentionally excluded. The frontend uses
# Token-based auth (Authorization: Token <key>), so CSRF enforcement by
# SessionAuthentication is unnecessary and breaks mobile browsers that
# block or strip SameSite cookies on cross-origin requests.
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'EXCEPTION_HANDLER': 'estimation.views.custom_exception_handler',
}

# CORS Settings
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://localhost:3000',
    cast=lambda v: [s.strip() for s in v.split(',')]
)
CORS_ALLOW_CREDENTIALS = True
# Allow all .onrender.com subdomains in production
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://.*\.onrender\.com$',
]

# Django Allauth — email-only, no username field
SITE_ID = 1
ACCOUNT_USER_MODEL_USERNAME_FIELD = None   # <-- critical: tells allauth your model has no username
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_VERIFICATION = 'none'       # <-- changed from 'optional' to 'none' so token is always returned
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_ADAPTER = 'estimation.adapters.AccountAdapter'
SOCIALACCOUNT_ADAPTER = 'estimation.adapters.SocialAccountAdapter'
SOCIALACCOUNT_EMAIL_AUTHENTICATION = True
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT = True

# Google OAuth Settings
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
        'APP': {
            'client_id': config('GOOGLE_CLIENT_ID', default=''),
            'secret': config('GOOGLE_CLIENT_SECRET', default=''),
            'key': ''
        }
    }
}

# dj_rest_auth — must explicitly disable username, enable email
REST_AUTH = {
    'USE_JWT': False,
    'SESSION_LOGIN': True,
    'USERNAME_REQUIRED': False,           # <-- added
    'EMAIL_REQUIRED': True,               # <-- added
    'REGISTER_SERIALIZER': 'estimation.serializers.CustomRegisterSerializer',
    'LOGIN_SERIALIZER': 'estimation.serializers.CustomLoginSerializer',  # <-- email-based login
}

# Email Configuration
# Uses SMTP when real credentials are provided, otherwise falls back to console output.
# To enable real email delivery:
#   1. Go to https://myaccount.google.com/apppasswords
#   2. Generate an App Password for "Mail"
#   3. Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in .env
_email_user = config('EMAIL_HOST_USER', default='')
_email_password = config('EMAIL_HOST_PASSWORD', default='')
_has_real_email_creds = bool(_email_user and _email_password and _email_password != 'your-email-password')

_sendgrid_key = config('SENDGRID_API_KEY', default='')
_brevo_key = config('BREVO_API_KEY', default='')

if _sendgrid_key:
    # Use SendGrid HTTP API to bypass Render's SMTP blocks
    INSTALLED_APPS.append('anymail')
    EMAIL_BACKEND = "anymail.backends.sendgrid.EmailBackend"
    ANYMAIL = {
        "SENDGRID_API_KEY": _sendgrid_key,
    }
elif _brevo_key:
    # Use Brevo HTTP API to bypass Render's SMTP blocks
    INSTALLED_APPS.append('anymail')
    EMAIL_BACKEND = "anymail.backends.brevo.EmailBackend"
    ANYMAIL = {
        "BREVO_API_KEY": _brevo_key,
    }
else:
    EMAIL_BACKEND = config(
        'EMAIL_BACKEND',
        default='django.core.mail.backends.smtp.EmailBackend' if _has_real_email_creds else 'django.core.mail.backends.console.EmailBackend'
    )

EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = _email_user
EMAIL_HOST_PASSWORD = _email_password
EMAIL_TIMEOUT = config('EMAIL_TIMEOUT', default=30, cast=int)
# For Brevo HTTP API, the from-email must be a verified sender in your Brevo account.
# Brevo auto-verifies the login email (aef655001@smtp-brevo.com won't work as FROM).
# Use the email configured as a verified sender in Brevo dashboard.
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default=_email_user or 'mastermathstwelve@gmail.com')
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# CSRF Trusted Origins — required for Django 4.x in production
_csrf_defaults = 'http://localhost:5173,http://localhost:3000,http://localhost:8000'
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default=_csrf_defaults,
    cast=lambda v: [s.strip() for s in v.split(',')]
)
# Auto-add Render domains to CSRF trusted origins
for origin in list(CORS_ALLOWED_ORIGINS):
    if origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(origin)

# Production security settings
if not DEBUG:
    # Render handles SSL termination at the proxy level.
    # SECURE_SSL_REDIRECT must be False to prevent infinite redirect loops.
    SECURE_SSL_REDIRECT = False
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    # SameSite=None is required for cross-origin cookie delivery (e.g.
    # separate frontend/backend Render services). Combined with Secure=True
    # this is safe and lets mobile browsers correctly receive cookies.
    SESSION_COOKIE_SAMESITE = 'None'
    CSRF_COOKIE_SAMESITE = 'None'
    CSRF_COOKIE_HTTPONLY = False  # Allow JS to read the CSRF cookie if needed
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Google Gemini AI Configuration (for AI Cost Prediction)
GEMINI_API_KEY = config('GEMINI_API_KEY', default='')

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'estimation': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}