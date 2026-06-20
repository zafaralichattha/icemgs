import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2,
  Home,
  Plus,
  TrendingUp,
  LogOut,
  Shield,
  Users,
  User,
  DollarSign,
  BarChart3,
  Calculator,
  Box,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    onClose();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

    const menuItems = [
    { icon: Home, label: 'Home', path: '/', show: true, id: 'home' },
    { icon: Home, label: 'Dashboard', path: '/dashboard', show: isAuthenticated, id: 'dashboard' },
    { icon: Plus, label: 'New Project', path: '/project/new', show: isAuthenticated, id: 'new-project' },
    { icon: User, label: 'Profile', path: '/profile', show: isAuthenticated, id: 'profile' },
    { icon: Calculator, label: 'Quick Estimate', path: '/quick-estimate', show: true, id: 'quick-estimate' },
    { icon: TrendingUp, label: 'Cost Prediction', path: '/cost-prediction', show: true, id: 'cost-prediction' },
    { icon: DollarSign, label: 'Material Rates', path: '/material-rates', show: isAuthenticated, id: 'material-rates' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics', show: isAuthenticated, id: 'analytics' },
    { icon: Box, label: 'House Map', path: '/house-map', show: isAuthenticated, id: 'house-map' },
  ];

  const adminItems = [
    { icon: Shield, label: 'Admin Panel', path: '/admin', show: user?.role === 'admin', id: 'admin-panel' },
    { icon: Users, label: 'Manage Users', path: '/admin?tab=users', show: user?.role === 'admin', id: 'manage-users' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl tracking-wide">ICEMGS</h1>
                <p className="text-xs text-gray-400">Construction Estimator</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* User Profile */}
        {isAuthenticated && user && (
          <div className="px-4 py-4 border-b border-gray-700">
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-lg">
                  {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.email}
                </p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              if (!item.show) return null;
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}

            {/* Admin Section */}
            {user?.role === 'admin' && (
              <>
                <div className="my-4 px-4">
                  <div className="border-t border-gray-700"></div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mt-4 mb-2">
                    Admin Tools
                  </p>
                </div>
                {adminItems.map((item) => {
                  if (!item.show) return null;
                  const Icon = item.icon;
                  const active = isActive(item.path.split('?')[0]);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-700">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => handleNavigate('/login')}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => handleNavigate('/register')}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                Register
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 text-center">
            © 2026 ICEMGS
          </p>
        </div>
      </aside>
    </>
  );
}