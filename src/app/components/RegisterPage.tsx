import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Mail, Lock, User, AlertCircle, Menu } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

interface RegisterPageProps {
  onMenuClick: () => void;
}

export default function RegisterPage({ onMenuClick }: RegisterPageProps) {
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState('homeowner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const authContext = useAuth();
  const { register, verifyOtp, resendOtp, isAuthenticated } = authContext;
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0) return;
    setResendMessage('');
    setError('');
    try {
      const message = await resendOtp(email);
      setResendMessage(message);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend code. Please try again.');
    }
  }, [email, resendCooldown, resendOtp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const parts = name.trim().split(' ');
      const firstName = parts[0];
      const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
      
      console.log('🔄 Attempting registration:', { email, firstName, lastName, role });
      
      const result = await register({
        email,
        password1: password,
        password2: confirmPassword,
        first_name: firstName,
        last_name: lastName,
        role: role as 'homeowner' | 'contractor' | 'student',
      });
      
      if (result && result.requiresVerification) {
        console.log('✅ Registration successful, awaiting OTP verification');
        setStep('verify');
      } else if (result) {
        console.log('✅ Registration successful');
        navigate('/dashboard');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Registration error details:', err);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.email) {
        errorMessage = Array.isArray(err.response.data.email) 
          ? err.response.data.email[0] 
          : err.response.data.email;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      console.log('Final error message:', errorMessage);
      setError(errorMessage);
    }
    
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setError('');
      const success = await authContext.googleLogin(credentialResponse.credential);
      if (!success) {
        setError('Google registration failed. Please try again.');
      }
    } catch (err: any) {
      setError('Failed to authenticate with Google: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-up was unsuccessful. Please try again.');
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!otp || otp.length < 5) {
      setError('Please enter a valid verification code');
      setLoading(false);
      return;
    }

    try {
      const success = await verifyOtp(email, otp);
      if (success) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please check the code and try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
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
          <h1 className="text-3xl mb-2">{step === 'register' ? 'Create Account' : 'Verify Email'}</h1>
          <p className="text-gray-600">
            {step === 'register' ? 'Start estimating your construction project' : `Enter the code sent to ${email}`}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {step === 'register' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
              <label className="block mb-2">I am a</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="homeowner">Homeowner</option>
                <option value="contractor">Contractor/Builder</option>
                <option value="student">Architecture Student</option>
              </select>
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
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width="368"
                text="signup_with"
                shape="rectangular"
                theme="outline"
              />
            </div>
          </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label className="block mb-2">Verification Code</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-widest text-xl"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify and Login'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep('register')}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Back to Registration
              </button>

              <div className="text-center pt-2">
                {resendMessage && (
                  <p className="text-green-600 text-sm mb-2">{resendMessage}</p>
                )}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="text-blue-600 hover:underline text-sm disabled:text-gray-400 disabled:no-underline"
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Didn't receive a code? Resend"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}