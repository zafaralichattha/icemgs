"""
Custom allauth adapters for ICEMGS.
These are required because our User model uses email-only authentication (no username field).
"""
import logging
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

adapter_logger = logging.getLogger(__name__)


class AccountAdapter(DefaultAccountAdapter):
    """
    Custom adapter that prevents allauth from trying to set/populate 
    the 'username' field which does not exist on our custom User model.
    """

    def save_user(self, request, user, form, commit=True):
        """
        Save the user without touching the username field.
        """
        data = form.cleaned_data
        user.email = data.get('email', '').strip().lower()
        user.first_name = data.get('first_name', '')
        user.last_name = data.get('last_name', '')

        if 'password1' in data:
            user.set_password(data['password1'])
        else:
            user.set_unusable_password()

        self.populate_username(request, user)

        if commit:
            user.save()
        return user

    def populate_username(self, request, user):
        """
        Our model has no username field — do nothing.
        """
        pass

    def clean_username(self, username, shallow=False):
        """
        Our model has no username — return empty string so nothing breaks.
        """
        return ''

    def login(self, request, user):
        """
        Prevent 500 error when dj_rest_auth attempts to log in an inactive user during registration.
        """
        if not user.is_active:
            return
        super().login(request, user)

    def respond_user_inactive(self, request, user):
        """
        Override to prevent 500 from reverse('account_inactive') which doesn't
        exist in our REST API setup. Return None so the registration flow
        continues without crashing.
        """
        return None

    def pre_login(self, request, user, **kwargs):
        """
        Override to skip the default pre_login for inactive users.
        The default calls respond_user_inactive → reverse('account_inactive')
        which causes a 500 in REST-only projects. During registration, the user
        is intentionally inactive until OTP verification.
        """
        if not user.is_active:
            return None
        return super().pre_login(request, user, **kwargs)



class SocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Custom social adapter to handle Google OAuth without username.
    """

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        # Ensure no username is set
        if hasattr(user, 'username'):
            user.username = None
        return user

    def save_user(self, request, sociallogin, form=None):
        """Save social login user, ensuring they are active (no OTP needed for OAuth)."""
        try:
            # Ensure user is active for social logins (skip OTP)
            sociallogin.user.is_active = True
            sociallogin.user.full_clean()
        except Exception as e:
            adapter_logger.error(f"Social account save_user full_clean error: {type(e).__name__}: {e}")
            raise e
        user = super().save_user(request, sociallogin, form)
        adapter_logger.info(f"Social account user saved: {user.email}, active={user.is_active}")
        return user

    def pre_social_login(self, request, sociallogin):
        """
        Auto-connect social account to existing user with same email.
        This handles the case where a user registered with email/password
        and later tries to log in with Google using the same email.
        """
        email = sociallogin.user.email
        if not email:
            return

        from estimation.models import User
        try:
            existing_user = User.objects.get(email__iexact=email)
            if not sociallogin.is_existing:
                sociallogin.connect(request, existing_user)
                adapter_logger.info(f"Auto-connected social account for existing user: {email}")
        except User.DoesNotExist:
            pass
        except Exception as e:
            adapter_logger.error(f"Error in pre_social_login for {email}: {type(e).__name__}: {e}")

