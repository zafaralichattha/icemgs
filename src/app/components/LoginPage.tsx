import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Mail, Lock, AlertCircle, Menu } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

interface LoginPageProps {
  onMenuClick: () => void;
}

export default function LoginPage({ onMenuClick }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const authContext = useAuth();
  const { login, isAuthenticated } = authContext;
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const success = await login(email, password);
      
      if (success) {
        console.log('✅ Login successful');
        navigate('/dashboard');
      } else {
        console.log('❌ Login failed');
        setError('Invalid email or password');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      let errorMessage = 'Invalid email or password';
      
      // Extract detailed error message
      if (err.response?.data) {
        const data = err.response.data;
        if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
          errorMessage = data.non_field_errors[0];
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object') {
          // Get the first error message from any field
          const firstError = Object.values(data)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
      } else if (err.message && err.message !== 'Request failed with status code 400') {
        errorMessage = err.message;
      }
      
      console.log('Final error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setError('');
      // credentialResponse.credential is the id_token JWT — sent to /auth/google-id/
      const success = await authContext.googleLogin(credentialResponse.credential);
      if (!success) {
        setError('Google login failed. Please try again.');
      }
      // Navigation handled by the isAuthenticated useEffect
    } catch (err: any) {
      console.error('Google Auth Backend Error:', err.response?.data || err);
      setError('Failed to authenticate with Google: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Login was unsuccessful. Please try again.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <button
        onClick={onMenuClick}
        className="fixed top-4 left-4 p-2 bg-white hover:bg-gray-100 rounded-lg shadow-md z-10"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Building2 className="w-10 h-10 text-blue-600" />
            <span className="text-2xl">ICEMGS</span>
          </Link>
          <h1 className="text-3xl mb-2">Welcome Back</h1>
          <p className="text-gray-600">Login to access your construction projects</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          {/* Google Sign In — uses id_token credential flow (reliable on all platforms) */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              width="368"
              text="continue_with"
              shape="rectangular"
              theme="outline"
            />
          </div>

          <div className="text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}