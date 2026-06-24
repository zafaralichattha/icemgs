import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import BackendStatusBanner from './components/BackendStatusBanner';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import ProjectForm from './components/ProjectForm';
import ProjectResults from './components/ProjectResults';
import QuickEstimate from './components/pages/QuickEstimate';
import CostPrediction from './components/pages/CostPrediction';
import Analytics from './components/pages/Analytics';
import MaterialRates from './components/MaterialRates';
import ProfilePage from './components/pages/ProfilePage';
import HouseMapCreator from './components/pages/HouseMapCreator';
import AuthCallback from './components/AuthCallback';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '2619981238-ps5gcukhl6sr8m37faomjmeeba0sr4oh.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={clientId}>
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ProjectProvider>
            <div className="flex flex-col min-h-screen">
              <BackendStatusBanner />
              <div className="flex flex-1">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1">
                <Routes>
                  <Route path="/" element={<LandingPage onMenuClick={() => setSidebarOpen(true)} />} />
                  <Route path="/login" element={<LoginPage onMenuClick={() => setSidebarOpen(true)} />} />
                  <Route path="/register" element={<RegisterPage onMenuClick={() => setSidebarOpen(true)} />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/quick-estimate" element={<QuickEstimate onMenuClick={() => setSidebarOpen(true)} />} />
                  <Route path="/cost-prediction" element={<CostPrediction onMenuClick={() => setSidebarOpen(true)} />} />
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Dashboard onMenuClick={() => setSidebarOpen(true)} />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <ProfilePage onMenuClick={() => setSidebarOpen(true)} />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <PrivateRoute>
                        <Analytics onMenuClick={() => setSidebarOpen(true)} />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/house-map"
                    element={
                      <PrivateRoute>
                        <HouseMapCreator onMenuClick={() => setSidebarOpen(true)} />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboard onMenuClick={() => setSidebarOpen(true)} />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/project/new"
                    element={
                      <PrivateRoute>
                        <ErrorBoundary>
                          <ProjectForm onMenuClick={() => setSidebarOpen(true)} />
                        </ErrorBoundary>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/project/:id/results"
                    element={
                      <PrivateRoute>
                        <ProjectResults onMenuClick={() => setSidebarOpen(true)} />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/material-rates"
                    element={
                      <PrivateRoute>
                        <MaterialRates onMenuClick={() => setSidebarOpen(true)} />
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </div>
            </div>
            </div>
          </ProjectProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
    </GoogleOAuthProvider>
  );
}

export default App;