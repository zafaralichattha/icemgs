import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'icemgs_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
admin_email = os.environ.get('ADMIN_EMAIL')
admin_password = os.environ.get('ADMIN_PASSWORD')

if admin_email and admin_password:
    email_clean = admin_email.strip().lower()
    if not User.objects.filter(email__iexact=email_clean).exists():
        User.objects.create_superuser(email=email_clean, password=admin_password)
        print(f"Superuser created successfully for {email_clean}")
    else:
        # Promote existing user to superuser if they already exist
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
        
        if modified:
            user.save()
            print(f"User {email_clean} promoted/activated to superuser successfully.")
        else:
            print(f"Superuser {email_clean} already exists and is fully active.")
else:
    print("ADMIN_EMAIL and ADMIN_PASSWORD environment variables not set. Skipping superuser setup.")
