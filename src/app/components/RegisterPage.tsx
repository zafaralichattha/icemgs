import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Mail, Lock, User, AlertCircle, Menu } from 'lucide-react';

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

  const handleGoogleLogin = () => {
    const backendBase = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : window.location.origin;
    window.location.href = `${backendBase}/api/auth/google/redirect/`;
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

  const inputClass = "w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/60 focus:ring-2 focus:ring-indigo-400 focus:border-transparent backdrop-blur-sm transition-all";

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12 page-enter">
      {/* Animated Background */}
      <div className="absolute inset-0 animated-gradient-bg"></div>
      <div className="absolute top-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl float-animation"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl float-animation" style={{ animationDelay: '3s' }}></div>

      <button
        onClick={onMenuClick}
        className="fixed top-4 left-4 p-2 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl shadow-lg z-10 border border-white/20 transition-all"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      <div className="relative max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">ICEMGS</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-white">{step === 'register' ? 'Create Account' : 'Verify Email'}</h1>
          <p className="text-indigo-200">
            {step === 'register' ? 'Start estimating your construction project' : `Enter the code sent to ${email}`}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/15 shadow-2xl">
          {step === 'register' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 flex items-start gap-2 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label className="block mb-2 text-sm font-medium text-indigo-100">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-300" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-indigo-100">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-indigo-100">I am a</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent backdrop-blur-sm transition-all"
              >
                <option value="homeowner" className="text-gray-900">Homeowner</option>
                <option value="contractor" className="text-gray-900">Contractor/Builder</option>
                <option value="student" className="text-gray-900">Architecture Student</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-indigo-100">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-indigo-100">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-300" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold hover:-translate-y-0.5"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/15"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 text-indigo-300">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-white text-gray-800 font-medium border-0 rounded-xl hover:bg-gray-100 flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>
          </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 flex items-start gap-2 backdrop-blur-sm">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              <div>
                <label className="block mb-2 text-sm font-medium text-indigo-100">Verification Code</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-300" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={`${inputClass} text-center tracking-widest text-xl`}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
              >
                {loading ? 'Verifying...' : 'Verify and Login'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep('register')}
                className="w-full py-3 bg-white/10 text-indigo-200 rounded-xl hover:bg-white/20 transition-all border border-white/20"
              >
                Back to Registration
              </button>

              <div className="text-center pt-2">
                {resendMessage && (
                  <p className="text-emerald-400 text-sm mb-2">{resendMessage}</p>
                )}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="text-indigo-300 hover:text-white text-sm disabled:text-indigo-500 transition-colors"
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Didn't receive a code? Resend"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-indigo-200">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-300 hover:text-white font-semibold transition-colors underline underline-offset-2">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}