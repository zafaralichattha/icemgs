"""
URL configuration for ICEMGS backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from estimation.views import GoogleLogin

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/auth/google/', include('allauth.socialaccount.providers.google.urls')),
    path('api/auth/google/login/', GoogleLogin.as_view(), name='google_login'),
    # Dummy URL to satisfy allauth when auto-signup triggers redirect logic
    path('accounts/social/signup/', lambda request: None, name='socialaccount_signup'),
    path('api/', include('estimation.urls')),
]

# Serve media files (profile pictures, etc.)
# For high-traffic production, switch to S3/Cloudinary
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Admin site customization
admin.site.site_header = "ICEMGS Administration"
admin.site.site_title = "ICEMGS Admin Portal"
admin.site.index_title = "Welcome to ICEMGS Admin Portal"
