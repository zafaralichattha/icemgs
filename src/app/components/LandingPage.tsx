import { Link, useNavigate } from 'react-router-dom';
import { Building2, Calculator, Map, FileText, TrendingUp, Shield, DollarSign, Users, Menu, LayoutDashboard, PlusCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';

interface LandingPageProps {
  onMenuClick: () => void;
}

export default function LandingPage({ onMenuClick }: LandingPageProps) {
  const { isAuthenticated, user } = useAuth();
  const { resetProject } = useProject();
  const navigate = useNavigate();

  const handleStartProject = () => {
    resetProject();
    navigate('/project/new');
  };

  const features = [
    { icon: Calculator, title: 'Automated Estimation', desc: 'Accurate cost calculations for both gray and finished structures with detailed material breakdown.', color: 'from-indigo-500 to-purple-600' },
    { icon: Map, title: 'Smart Map Generation', desc: 'Automatically generates 2D floor plans based on your plot dimensions and requirements.', color: 'from-purple-500 to-pink-500' },
    { icon: Shield, title: 'LDA Compliance', desc: 'Ensures your construction plan follows local building laws with automated compliance checks.', color: 'from-cyan-500 to-blue-500' },
    { icon: FileText, title: 'Bill of Materials', desc: 'Detailed BOM with exact quantities of bricks, cement, steel, and all required materials.', color: 'from-amber-500 to-orange-500' },
    { icon: TrendingUp, title: 'AI Cost Prediction', desc: 'AI-powered future cost prediction to help you plan your budget effectively.', color: 'from-emerald-500 to-teal-500' },
    { icon: DollarSign, title: 'Export Reports', desc: 'Download detailed reports and maps as PDF or Excel for your records and contractors.', color: 'from-rose-500 to-pink-600' },
  ];

  const audiences = [
    { icon: Users, title: 'Homeowners', desc: 'Plan your dream home with accurate cost estimates before starting construction.', gradient: 'from-blue-500 to-indigo-600' },
    { icon: Building2, title: 'Small Contractors', desc: 'Provide professional estimates to clients quickly and accurately.', gradient: 'from-purple-500 to-violet-600' },
    { icon: FileText, title: 'Architecture Students', desc: 'Learn about construction costs and building regulations practically.', gradient: 'from-pink-500 to-rose-600' },
    { icon: Shield, title: 'Admins', desc: 'Manage users, update material prices, and oversee all projects.', gradient: 'from-teal-500 to-cyan-600' },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4ff] page-enter">
      {/* Header */}
      <header className="glass-card sticky top-0 z-10 border-b border-white/20">
        <div className="w-full max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-indigo-50 rounded-xl mr-2 transition-colors"
            >
              <Menu className="w-6 h-6 text-indigo-600" />
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">ICEMGS</span>
          </div>
          <div className="flex gap-2 sm:gap-4 items-center">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-indigo-600 hidden sm:inline font-medium">
                  Welcome, {user?.first_name || 'User'}
                </span>
                <Link to="/dashboard">
                  <button className="px-2.5 py-1.5 sm:px-5 sm:py-2 text-sm sm:text-base text-indigo-600 hover:text-indigo-800 flex items-center gap-1 sm:gap-2 hover:bg-indigo-50 rounded-xl transition-all" title="Dashboard">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                </Link>
                <button
                  onClick={handleStartProject}
                  className="px-2.5 py-1.5 sm:px-5 sm:py-2 text-sm sm:text-base bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-200 flex items-center gap-1 sm:gap-2 transition-all duration-300 hover:-translate-y-0.5"
                  title="New Project"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">New Project</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button className="px-3 py-1.5 sm:px-5 sm:py-2 text-sm sm:text-base text-indigo-600 hover:text-indigo-800 font-medium hover:bg-indigo-50 rounded-xl transition-all">
                    Login
                  </button>
                </Link>
                <Link to="/register">
                  <button className="px-3 py-1.5 sm:px-5 sm:py-2 text-sm sm:text-base bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300 hover:-translate-y-0.5">
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 animated-gradient-bg opacity-95"></div>
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl float-animation"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl float-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-indigo-200 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered Construction Estimation
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight text-white">
            Intelligent Construction
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Estimation & Map Generator
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-indigo-200 mb-10 max-w-3xl mx-auto leading-relaxed">
            Automated construction cost estimation and 2D floor plan generation 
            that strictly follows LDA bylaws. Perfect for homeowners, contractors, and architecture students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartProject}
              className="group px-8 py-4 bg-white text-indigo-700 rounded-2xl hover:shadow-2xl hover:shadow-white/20 text-lg font-bold transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              {isAuthenticated ? "Create New Project" : "Start Your Project"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link to="/quick-estimate" className="px-8 py-4 bg-white/10 backdrop-blur text-white rounded-2xl hover:bg-white/20 text-lg font-semibold transition-all duration-300 border border-white/20 text-center">
              Quick Estimate
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Everything you need to estimate, plan, and manage your construction projects</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="glass-card p-6 rounded-2xl card-hover group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Target Audience */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Who Is This For?</h2>
          <p className="text-lg text-gray-600">Designed for everyone in the construction industry</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {audiences.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="glass-card p-6 rounded-2xl text-center card-hover group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden mx-4 sm:mx-auto max-w-5xl mb-20 rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative px-8 py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Estimate?</h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-xl mx-auto">
            Start your construction project today with AI-powered estimation and smart floor plan generation.
          </p>
          <button
            onClick={handleStartProject}
            className="group px-8 py-4 bg-white text-indigo-700 rounded-2xl hover:shadow-2xl text-lg font-bold transition-all duration-300 hover:-translate-y-1 inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">ICEMGS</span>
          </div>
          <p className="text-indigo-300">&copy; 2026 ICEMGS - Intelligent Construction Estimation & Map Generator System</p>
          <p className="text-indigo-400/60 text-sm mt-2">Created by Zafar Ali Chatha</p>
        </div>
      </footer>
    </div>
  );
}