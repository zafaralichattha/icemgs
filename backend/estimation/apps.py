from django.apps import AppConfig


class EstimationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'estimation'
    verbose_name = 'Construction Estimation'
    tests_module = 'estimation.tests'

    def ready(self):
        """Register signal to clean up related records when a user is deleted,
        including bulk deletions from Django admin that bypass model.delete()."""
        from django.db.models.signals import pre_delete
        from django.dispatch import receiver

        def cleanup_user_related_data(sender, instance, **kwargs):
            """Clean up allauth and token records before user deletion."""
            # Only run for User model
            from .models import User
            if not isinstance(instance, User):
                return

            try:
                from allauth.account.models import EmailAddress
                EmailAddress.objects.filter(user=instance).delete()
            except Exception:
                pass

            try:
                from rest_framework.authtoken.models import Token
                Token.objects.filter(user=instance).delete()
            except Exception:
                pass

            try:
                from .models import OTPVerification
                OTPVerification.objects.filter(user=instance).delete()
            except Exception:
                pass

        # Import User here to connect the signal
        from .models import User
        pre_delete.connect(cleanup_user_related_data, sender=User)
