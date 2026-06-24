import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';

/**
 * Handles the redirect from the server-side Google OAuth callback.
 * URL: /auth/callback?token=<DRF_TOKEN>
 * Stores the token, fetches user data, then navigates to /dashboard.
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error from backend:', error);
      setErrorMsg(`Google login failed: ${error}. Redirecting to login...`);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!token) {
      setErrorMsg('No token received. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // Store token and fetch user
    localStorage.setItem('auth_token', token);

    authService.getCurrentUser()
      .then((user) => {
        localStorage.setItem('user', JSON.stringify(user));
        // Trigger AuthContext to re-read from localStorage
        window.dispatchEvent(new Event('auth-token-set'));
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        console.error('Failed to fetch user after Google login:', err);
        setErrorMsg('Login succeeded but failed to load user. Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
      });
  }, [searchParams, navigate]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-red-600 font-medium">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing Google sign in...</p>
      </div>
    </div>
  );
}
