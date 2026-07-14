import { useState } from 'react';
import { Building2, Menu, Rocket, Clock, Layers, Box, Grid3x3, Eye, Ruler, Download, CheckCircle2, Bell, Maximize2, RotateCcw } from 'lucide-react';

interface HouseMapCreatorProps {
  onMenuClick: () => void;
}

export default function HouseMapCreator({ onMenuClick }: HouseMapCreatorProps) {
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

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
      icon: Grid3x3,
      title: '2D Floor Plan Generation',
      description: 'Automatically generate accurate 2D floor plans from your project room configuration — bedrooms, bathrooms, kitchen, and more laid out to scale.',
      color: 'from-blue-500 to-cyan-600',
      tag: 'Core Feature',
    },
    {
      icon: Box,
      title: '3D House Visualization',
      description: 'View a full 3D model of your house design. Walk through rooms, check proportions, and get a realistic feel before construction begins.',
      color: 'from-purple-500 to-violet-600',
      tag: 'Premium',
    },
    {
      icon: Ruler,
      title: 'Dimension Annotations',
      description: 'Every room, wall, and opening will have accurate dimensions shown directly on the map — just like professional architectural drawings.',
      color: 'from-emerald-500 to-green-600',
      tag: 'Built-in',
    },
    {
      icon: Download,
      title: 'Export & Share',
      description: 'Download your house maps as high-resolution PDF, PNG, or share them directly with your architect or contractor.',
      color: 'from-amber-500 to-orange-600',
      tag: 'Export',
    },
    {
      icon: Eye,
      title: 'Multi-Floor View',
      description: 'Switch between floors to see each level\'s layout. Compare ground floor, first floor, and rooftop plans side by side.',
      color: 'from-rose-500 to-pink-600',
      tag: 'Navigation',
    },
    {
      icon: Maximize2,
      title: 'Real-Scale Preview',
      description: 'Maps are generated using actual room dimensions from your project. What you see matches what will be built on site.',
      color: 'from-teal-500 to-cyan-600',
      tag: 'Accuracy',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="w-full max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-lg mr-2"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <Building2 className="w-8 h-8 text-indigo-600" />
            <span className="text-base sm:text-xl">ICEMGS - House Map Creator</span>
          </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto p-4 sm:p-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white p-8 sm:p-12 mb-10">
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

          {/* Decorative icons */}
          <div className="absolute top-6 right-8 opacity-10">
            <Box className="w-32 h-32 sm:w-48 sm:h-48" />
          </div>
          <div className="absolute bottom-4 left-8 opacity-5">
            <Grid3x3 className="w-24 h-24" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-sm mb-6">
              <Rocket className="w-4 h-4" />
              <span>Coming Soon</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
              House Map
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
                Creator
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-8">
              Generate professional 2D floor plans and immersive 3D house models automatically from 
              your project data — no design skills needed.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Expected: Q4 2026</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-600 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-green-400" />
                <span>Auto-generated from your rooms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Preview Concept */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">How It Will Work</h2>
          <p className="text-gray-600 mb-6">Toggle between 2D floor plans and 3D house models — all auto-generated from your project configuration.</p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* View Toggle */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setViewMode('2d')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all ${
                  viewMode === '2d'
                    ? 'bg-white text-indigo-600 border-b-2 border-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
                2D Floor Plan
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all ${
                  viewMode === '3d'
                    ? 'bg-white text-purple-600 border-b-2 border-purple-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Box className="w-5 h-5" />
                3D House Model
              </button>
            </div>

            {/* Preview Area */}
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
              {viewMode === '2d' ? (
                <div className="text-center max-w-lg">
                  {/* Stylized 2D floor plan wireframe preview */}
                  <div className="relative w-full max-w-md mx-auto mb-6">
                    <div className="border-4 border-dashed border-blue-300 rounded-xl p-6 bg-indigo-50/30">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 border-2 border-blue-400 rounded-lg p-3 bg-indigo-100/50 h-24 flex items-center justify-center">
                          <span className="text-xs font-semibold text-indigo-600">Living Room</span>
                        </div>
                        <div className="border-2 border-green-400 rounded-lg p-3 bg-green-100/50 h-24 flex items-center justify-center">
                          <span className="text-xs font-semibold text-green-600">Kitchen</span>
                        </div>
                        <div className="border-2 border-purple-400 rounded-lg p-3 bg-purple-100/50 h-20 flex items-center justify-center">
                          <span className="text-xs font-semibold text-purple-600">Bedroom 1</span>
                        </div>
                        <div className="border-2 border-purple-400 rounded-lg p-3 bg-purple-100/50 h-20 flex items-center justify-center">
                          <span className="text-xs font-semibold text-purple-600">Bedroom 2</span>
                        </div>
                        <div className="border-2 border-amber-400 rounded-lg p-3 bg-amber-100/50 h-20 flex items-center justify-center">
                          <span className="text-xs font-semibold text-amber-600">Bath</span>
                        </div>
                      </div>
                      {/* Dimension labels */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-xs text-gray-500 font-mono">32' 0"</div>
                      <div className="absolute -right-8 top-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500 font-mono rotate-90">45' 0"</div>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-blue-700 text-sm font-medium mb-3">
                    <Grid3x3 className="w-4 h-4" />
                    2D Floor Plan Preview
                  </div>
                  <p className="text-gray-600 text-sm">
                    Your rooms will be automatically arranged into a professional floor plan with accurate dimensions, 
                    wall thicknesses, and door/window placements based on your project configuration.
                  </p>
                </div>
              ) : (
                <div className="text-center max-w-lg">
                  {/* Stylized 3D isometric preview */}
                  <div className="relative w-full max-w-md mx-auto mb-6">
                    <div className="relative" style={{ perspective: '600px' }}>
                      <div 
                        className="border-4 border-dashed border-purple-300 rounded-xl p-6 bg-purple-50/30"
                        style={{ transform: 'rotateX(15deg) rotateY(-10deg)' }}
                      >
                        {/* Ground floor */}
                        <div className="border-2 border-purple-400 rounded-lg bg-purple-100/50 p-4 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-purple-600">Ground Floor</span>
                            <span className="text-xs text-purple-400">4 rooms</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 mt-2">
                            {[...Array(4)].map((_, i) => (
                              <div key={i} className="h-6 bg-purple-200/60 rounded" />
                            ))}
                          </div>
                        </div>
                        {/* First floor */}
                        <div className="border-2 border-indigo-400 rounded-lg bg-indigo-100/50 p-4 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-indigo-600">1st Floor</span>
                            <span className="text-xs text-indigo-400">3 rooms</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 mt-2">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="h-6 bg-indigo-200/60 rounded" />
                            ))}
                          </div>
                        </div>
                        {/* Roof */}
                        <div className="border-2 border-slate-400 rounded-lg bg-slate-100/50 p-3">
                          <div className="flex items-center justify-center gap-2">
                            <RotateCcw className="w-3 h-3 text-slate-500" />
                            <span className="text-xs font-semibold text-slate-600">Rooftop + Mumty</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-3">
                    <Box className="w-4 h-4" />
                    3D House Model Preview
                  </div>
                  <p className="text-gray-600 text-sm">
                    Get a fully rendered 3D model of your house with all floors stacked, 
                    walls, and structural elements visible. Rotate, zoom, and explore every angle.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Planned Features Grid */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Planned Features</h2>
          <p className="text-gray-600 mb-8">Everything we're building to turn your project data into beautiful house maps.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

                  {/* Tag badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {feature.tag}
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
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Get Notified When It's Ready</h3>
            <p className="text-gray-600 mb-6">
              We'll let you know as soon as the House Map Creator is live. Be the first to generate your floor plans!
            </p>

            {emailSubmitted ? (
              <div className="flex items-center justify-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 transition-all duration-300">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">You're on the list! We'll notify you when the House Map Creator launches.</span>
              </div>
            ) : (
              <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap"
                >
                  Notify Me
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Development Roadmap */}
        <div className="mt-10 bg-white rounded-xl border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Development Roadmap</h3>
          <div className="space-y-6">
            {[
              { phase: 'Phase 1', title: '2D Floor Plan Engine', desc: 'Auto-generate room layouts from user project data with accurate dimensions.', status: 'in-progress' },
              { phase: 'Phase 2', title: '3D Model Rendering', desc: 'Render 3D house models with walls, floors, and rooftop structures.', status: 'planned' },
              { phase: 'Phase 3', title: 'Export & Download', desc: 'Export floor plans as PDF/PNG and 3D models for sharing with architects.', status: 'planned' },
              { phase: 'Phase 4', title: 'Interactive Editor', desc: 'Drag-and-drop room rearrangement and real-time dimension updates.', status: 'planned' },
            ].map((item, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    item.status === 'in-progress'
                      ? 'bg-purple-100 text-purple-600 ring-4 ring-purple-50'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div className={`w-0.5 h-8 mt-1 ${item.status === 'in-progress' ? 'bg-purple-200' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.phase}</span>
                    {item.status === 'in-progress' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
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
