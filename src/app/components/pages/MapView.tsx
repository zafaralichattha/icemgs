import { useState } from 'react';
import { MapPin, Navigation, Layers, Compass, Building2, Menu, Rocket, Clock, Bell, CheckCircle2 } from 'lucide-react';

interface MapViewProps {
  onMenuClick: () => void;
}

export default function MapView({ onMenuClick }: MapViewProps) {
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setEmailSubmitted(true);
      setTimeout(() => setEmailSubmitted(false), 4000);
      setEmail('');
    }
  };

  const plannedFeatures = [
    {
      icon: MapPin,
      title: 'Plot Location Mapping',
      description: 'Pin your exact plot location on an interactive map to get location-specific cost estimations and material availability.',
      color: 'from-red-500 to-rose-600',
    },
    {
      icon: Navigation,
      title: 'Nearby Suppliers',
      description: 'Discover construction material suppliers, hardware stores, and contractors near your project site with distance and pricing info.',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Layers,
      title: 'Site Terrain Analysis',
      description: 'Analyze the terrain and soil type of your plot location to get accurate foundation recommendations and cost adjustments.',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Compass,
      title: 'LDA Zone Compliance',
      description: 'Automatically check your plot against LDA housing society zones, setback requirements, and building height restrictions.',
      color: 'from-purple-500 to-violet-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-lg mr-2"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="text-xl">ICEMGS - Map View</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 sm:p-12 mb-10">
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          {/* Decorative map pin icons */}
          <div className="absolute top-6 right-8 opacity-10">
            <MapPin className="w-32 h-32 sm:w-48 sm:h-48" />
          </div>
          <div className="absolute bottom-4 left-8 opacity-5">
            <Compass className="w-24 h-24" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm mb-6">
              <Rocket className="w-4 h-4" />
              <span>Coming Soon</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
              Interactive Map
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                System
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-8">
              We're building a powerful map integration that will let you visualize your construction plots, 
              find nearby suppliers, and analyze terrain — all within ICEMGS.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Expected: Q3 2026</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-600 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-green-400" />
                <span>Google Maps Integration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Planned Features Grid */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Planned Map Features</h2>
          <p className="text-gray-600 mb-8">Here's what we're working on to enhance your construction planning experience.</p>

          <div className="grid sm:grid-cols-2 gap-6">
            {plannedFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>

                  {/* Status badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      <Clock className="w-3 h-3" />
                      In Development
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notification CTA */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-10">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Stay Updated</h3>
            <p className="text-gray-600 mb-6">
              Want to know when the map feature goes live? Enter your email and we'll notify you as soon as it's ready.
            </p>

            {emailSubmitted ? (
              <div className="flex items-center justify-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 transition-all duration-300">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">You're on the list! We'll notify you when the map feature launches.</span>
              </div>
            ) : (
              <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap"
                >
                  Notify Me
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Timeline / Roadmap Teaser */}
        <div className="mt-10 bg-white rounded-xl border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Development Roadmap</h3>
          <div className="space-y-6">
            {[
              { phase: 'Phase 1', title: 'Basic Map Integration', desc: 'Embed interactive map with plot pin functionality.', status: 'in-progress' },
              { phase: 'Phase 2', title: 'Supplier Discovery', desc: 'Nearby material suppliers and pricing overlays.', status: 'planned' },
              { phase: 'Phase 3', title: 'Terrain & Soil Analysis', desc: 'Automated terrain type detection for foundation planning.', status: 'planned' },
              { phase: 'Phase 4', title: 'Regulatory Compliance', desc: 'LDA zone map overlay with auto-compliance checks.', status: 'planned' },
            ].map((item, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    item.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-600 ring-4 ring-blue-50'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div className={`w-0.5 h-8 mt-1 ${item.status === 'in-progress' ? 'bg-blue-200' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.phase}</span>
                    {item.status === 'in-progress' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        In Progress
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-semibold text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
