import { Link } from 'react-router-dom';
import { Building2, Calculator, Map, FileText, TrendingUp, Shield, DollarSign, Users, Menu, LayoutDashboard, PlusCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LandingPageProps {
  onMenuClick: () => void;
}

export default function LandingPage({ onMenuClick }: LandingPageProps) {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-lg mr-2"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="text-xl">ICEMGS</span>
          </div>
          <div className="flex gap-2 sm:gap-4 items-center">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">
                  Welcome, {user?.first_name || 'User'}
                </span>
                <Link to="/dashboard">
                  <button className="px-2.5 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base text-blue-600 hover:text-blue-800 flex items-center gap-1 sm:gap-2" title="Dashboard">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                </Link>
                <Link to="/project/new">
                  <button className="px-2.5 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 sm:gap-2" title="New Project">
                    <PlusCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">New Project</span>
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button className="px-3 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base text-blue-600 hover:text-blue-800">
                    Login
                  </button>
                </Link>
                <Link to="/register">
                  <button className="px-3 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
          Intelligent Construction Estimation & Map Generator
        </h1>
        <p className="text-base sm:text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
          Automated construction cost estimation and 2D floor plan generation 
          that strictly follows LDA bylaws. Perfect for homeowners, contractors, and architecture students.
        </p>
        <Link to={isAuthenticated ? "/project/new" : "/register"}>
          <button className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg">
            {isAuthenticated ? "Create New Project" : "Start Your Project"}
          </button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Calculator className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl mb-2">Automated Estimation</h3>
            <p className="text-gray-600">
              Accurate cost calculations for both gray and finished structures with detailed material breakdown.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Map className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl mb-2">Smart Map Generation</h3>
            <p className="text-gray-600">
              Automatically generates 2D floor plans based on your plot dimensions and requirements.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Shield className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl mb-2">LDA Compliance</h3>
            <p className="text-gray-600">
              Ensures your construction plan follows local building laws with automated compliance checks.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <FileText className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl mb-2">Bill of Materials</h3>
            <p className="text-gray-600">
              Detailed BOM with exact quantities of bricks, cement, steel, and all required materials.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl mb-2">AI Cost Prediction</h3>
            <p className="text-gray-600">
              AI-powered future cost prediction to help you plan your budget effectively.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <DollarSign className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl mb-2">Export Reports</h3>
            <p className="text-gray-600">
              Download detailed reports and maps as PDF or Excel for your records and contractors.
            </p>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl mb-8">Who Is This For?</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-xl mb-2">Homeowners</h3>
            <p className="text-gray-600">
              Plan your dream home with accurate cost estimates before starting construction.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-xl mb-2">Small Contractors</h3>
            <p className="text-gray-600">
              Provide professional estimates to clients quickly and accurately.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-xl mb-2">Architecture Students</h3>
            <p className="text-gray-600">
              Learn about construction costs and building regulations practically.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-xl mb-2">Admins</h3>
            <p className="text-gray-600">
              Manage users, update material prices, and oversee all projects.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; 2026 ICEMGS - Intelligent Construction Estimation & Map Generator System</p>
          <p className="text-gray-400 text-sm mt-2">Created by Zafar Ali Chatha</p>
        </div>
      </footer>
    </div>
  );
}