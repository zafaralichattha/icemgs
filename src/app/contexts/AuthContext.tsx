import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../services/api.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    email: string;
    password1: string;
    password2: string;
    first_name: string;
    last_name: string;
    role: 'homeowner' | 'contractor' | 'student';
    phone_number?: string;
    company_name?: string;
  }) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  resendOtp: (email: string) => Promise<string>;
  googleLogin: (accessToken: string) => Promise<boolean>;
  loginWithToken: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User> | FormData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = authService.getStoredToken();
      const storedUser = authService.getStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error: any) {
          // If it's a network error (backend not running), keep stored credentials
          if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
            console.warn('Backend server not available. Using stored credentials.');
            // Keep the user logged in with stored data
          } else {
            // For other errors (401, etc.), clear credentials
            console.error('Token validation failed:', error);
            setToken(null);
            setUser(null);
            await authService.logout();
          }
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { token: authToken, user: userData } = await authService.login(email, password);
      setToken(authToken);
      setUser(userData);
      return true;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        console.error('❌ Backend server is not running. Please start the Django server.');
        alert('⚠️ Backend server is not available.\n\nPlease start the Django backend:\n1. Open terminal\n2. cd backend\n3. python manage.py runserver\n\nSee BACKEND_SETUP_INSTRUCTIONS.md for details.');
      } else {
        console.error('Login failed:', error);
        // Re-throw error so caller can handle specific error messages
        throw error;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password1: string;
    password2: string;
    first_name: string;
    last_name: string;
    role: 'homeowner' | 'contractor' | 'student';
    phone_number?: string;
    company_name?: string;
  }): Promise<any> => {
    setLoading(true);
    try {
      const result = await authService.register(data);
      if (result.requiresVerification) {
        return result;
      }
      setToken(result.token || null);
      setUser(result.user || null);
      return result;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        console.error('❌ Backend server is not running. Please start the Django server.');
        alert('⚠️ Backend server is not available.\n\nPlease start the Django backend:\n1. Open terminal\n2. cd backend\n3. python manage.py runserver\n\nSee BACKEND_SETUP_INSTRUCTIONS.md for details.');
      } else {
        console.error('Registration failed:', error);
        // Re-throw error so caller can handle specific error messages
        throw error;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
    try {
      const data = await authService.verifyEmail(email, otp);
      if (data && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  };

  const googleLogin = async (accessToken: string) => {
    try {
      const data = await authService.googleLogin(accessToken);
      if (data && data.key) {
        setToken(data.key);
        if (data.user) setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  // Used by AuthCallback after a server-side Google OAuth redirect.
  // Directly sets React state so PrivateRoute sees isAuthenticated=true
  // immediately, without waiting for a page reload.
  const loginWithToken = async (authToken: string): Promise<boolean> => {
    try {
      localStorage.setItem('auth_token', authToken);
      const userData = await authService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      return true;
    } catch (error) {
      console.error('loginWithToken failed:', error);
      localStorage.removeItem('auth_token');
      return false;
    }
  };

  const resendOtp = async (email: string): Promise<string> => {
    try {
      const result = await authService.resendOtp(email);
      return result.message || 'A new verification code has been sent.';
    } catch (error: any) {
      console.error('Resend OTP failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const updateUser = async (data: Partial<User> | FormData) => {
    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        verifyOtp,
        resendOtp,
        googleLogin,
        loginWithToken,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}