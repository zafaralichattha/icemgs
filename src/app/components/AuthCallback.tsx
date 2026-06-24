import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Handles the redirect from the server-side Google OAuth callback.
 * URL: /auth/callback?token=<DRF_TOKEN>
 *
 * Uses loginWithToken() from AuthContext which sets both localStorage AND
 * React state atomically — so PrivateRoute sees isAuthenticated=true
 * immediately on the FIRST visit, without needing a page reload.
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
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

    // loginWithToken sets localStorage + React state (token + user) in one call,
    // so PrivateRoute sees isAuthenticated=true before navigate('/dashboard') fires.
    loginWithToken(token).then((success) => {
      if (success) {
        navigate('/dashboard', { replace: true });
      } else {
        setErrorMsg('Login succeeded but failed to load profile. Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
      }
    });
  }, [searchParams, navigate, loginWithToken]);

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
        <p className="text-gray-600 font-medium">Completing Google sign in...</p>
        <p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
      </div>
    </div>
  );
}
