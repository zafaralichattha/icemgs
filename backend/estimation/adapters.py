"""
Custom allauth adapters for ICEMGS.
These are required because our User model uses email-only authentication (no username field).
"""
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


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
        try:
            sociallogin.user.full_clean()
        except Exception as e:
            with open('error_log.txt', 'a') as f:
                f.write(f"FULL_CLEAN_ERROR: {str(e)}\n")
            raise e
        return super().save_user(request, sociallogin, form)
