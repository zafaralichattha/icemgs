"""
Automated admin/superuser creation for production environments (e.g. Render)
where shell access is not available.

Reads ADMIN_EMAIL and ADMIN_PASSWORD from environment variables.
Creates the user if they don't exist, or promotes them if they do.
Also creates the required allauth EmailAddress record so dj_rest_auth login works.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'icemgs_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()
admin_email = os.environ.get('ADMIN_EMAIL')
admin_password = os.environ.get('ADMIN_PASSWORD')

if admin_email and admin_password:
    email_clean = admin_email.strip().lower()
    
    if not User.objects.filter(email__iexact=email_clean).exists():
        user = User.objects.create_superuser(email=email_clean, password=admin_password)
        print(f"[create_admin] Superuser CREATED for {email_clean}")
    else:
        user = User.objects.get(email__iexact=email_clean)
        modified = False
        
        if not user.is_superuser:
            user.is_superuser = True
            modified = True
        if not user.is_staff:
            user.is_staff = True
            modified = True
        if user.role != 'admin':
            user.role = 'admin'
            modified = True
        if not user.is_active:
            user.is_active = True
            modified = True
        
        # Reset password in case it was changed or set incorrectly
        user.set_password(admin_password)
        user.save()
        
        if modified:
            print(f"[create_admin] User {email_clean} PROMOTED to superuser.")
        else:
            print(f"[create_admin] Superuser {email_clean} already exists. Password reset.")

    # Ensure allauth EmailAddress record exists (required for dj_rest_auth login)
    try:
        from allauth.account.models import EmailAddress
        email_obj, created = EmailAddress.objects.get_or_create(
            user=user,
            email=email_clean,
            defaults={'verified': True, 'primary': True}
        )
        if not created:
            # Make sure existing record is verified and primary
            if not email_obj.verified or not email_obj.primary:
                email_obj.verified = True
                email_obj.primary = True
                email_obj.save()
                print(f"[create_admin] EmailAddress for {email_clean} updated to verified+primary.")
        else:
            print(f"[create_admin] EmailAddress record CREATED for {email_clean}.")
    except Exception as e:
        print(f"[create_admin] Warning: Could not create EmailAddress: {e}")

    # Ensure auth token exists
    token, created = Token.objects.get_or_create(user=user)
    if created:
        print(f"[create_admin] Auth token CREATED for {email_clean}.")
    
    print(f"[create_admin] Admin setup complete for {email_clean}.")
else:
    print("[create_admin] ADMIN_EMAIL and/or ADMIN_PASSWORD not set. Skipping.")
