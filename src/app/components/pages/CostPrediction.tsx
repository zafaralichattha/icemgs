import { useState } from 'react';
import { TrendingUp, Menu, Building2, Brain, Sparkles, AlertTriangle, Lightbulb, BarChart3, Shield, ArrowUpRight, ArrowDownRight, Minus, Loader2, ChevronDown, ChevronUp, MapPin, Layers, Hammer, Crown } from 'lucide-react';
import { aiPredictionService, AIPredictionResult } from '../../services/api.service';

interface CostPredictionProps { onMenuClick: () => void; }

export default function CostPrediction({ onMenuClick }: CostPredictionProps) {
  const [plotArea, setPlotArea] = useState('5');
  const [floors, setFloors] = useState('1');
  const [constructionType, setConstructionType] = useState<'gray'|'full'>('gray');
  const [quality, setQuality] = useState<'economy'|'standard'|'premium'|'luxury'>('standard');
  const [location, setLocation] = useState('Lahore');
  const [marlaSize, setMarlaSize] = useState('225');
  const [predictionMonths, setPredictionMonths] = useState('12');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIPredictionResult|null>(null);
  const [activeTab, setActiveTab] = useState<'forecast'|'risks'|'breakdown'|'recommendations'>('forecast');
  const [expandedRec, setExpandedRec] = useState<number|null>(null);
  const [error, setError] = useState('');

  const formatPKR = (v: number) => {
    if (v >= 10000000) return `Rs. ${(v/10000000).toFixed(2)} Cr`;
    if (v >= 100000) return `Rs. ${(v/100000).toFixed(2)} Lac`;
    return `Rs. ${v.toLocaleString()}`;
  };

  const handlePredict = async () => {
    if (!plotArea || parseFloat(plotArea) <= 0) { setError('Enter valid plot area'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const res = await aiPredictionService.predict({
        plot_area: parseFloat(plotArea), num_floors: parseInt(floors),
        construction_type: constructionType, quality, location,
        marla_size: parseFloat(marlaSize), prediction_months: parseInt(predictionMonths),
      });
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Prediction failed');
    } finally { setLoading(false); }
  };

  const trendIcon = (t: string) => t === 'rising' ? <ArrowUpRight className="w-4 h-4 text-red-500"/> : t === 'falling' ? <ArrowDownRight className="w-4 h-4 text-green-500"/> : <Minus className="w-4 h-4 text-yellow-500"/>;
  const impactColor = (i: string) => i === 'high' ? 'bg-red-100 text-red-700 border-red-200' : i === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200';
  const priorityColor = (p: string) => p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)'}}>
      {/* Header */}
      <header className="sticky top-0 z-10" style={{background:'rgba(15,12,41,0.85)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div className="w-full max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onMenuClick} className="p-2 hover:bg-white/10 rounded-lg"><Menu className="w-6 h-6 text-gray-300"/></button>
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center"><Building2 className="w-5 h-5 text-white"/></div>
          <span className="text-lg text-white/90 font-medium">ICEMGS</span>
          <span className="text-white/30 mx-1">|</span>
          <span className="text-xs sm:text-sm text-purple-300">AI Cost Prediction</span>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{background:'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(59,130,246,0.3))',border:'1px solid rgba(139,92,246,0.3)'}}>
            <Brain className="w-4 h-4 text-purple-400"/><span className="text-sm text-purple-300">Powered by AI</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-3" style={{background:'linear-gradient(135deg,#fff 0%,#c4b5fd 50%,#818cf8 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>AI Cost Prediction</h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">Intelligent construction cost forecasting with market analysis, risk assessment, and actionable recommendations</p>
        </div>

        {/* Input Form */}
        <div className="rounded-2xl p-6 mb-8" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(10px)'}}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#7c3aed,#3b82f6)'}}><Sparkles className="w-5 h-5 text-white"/></div>
            <div><h2 className="text-xl text-white font-semibold">Project Parameters</h2><p className="text-xs text-gray-400">Configure your project for AI analysis</p></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Plot Area */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-purple-400"/>Plot Area (Marlas)</label>
              <input type="number" value={plotArea} onChange={e=>setPlotArea(e.target.value)} placeholder="e.g., 5"
                className="w-full px-4 py-2.5 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)'}}/>
            </div>
            {/* Marla Size */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">Marla Size (sq ft)</label>
              <select value={marlaSize} onChange={e=>setMarlaSize(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{background:'#1e1b4b',border:'1px solid rgba(255,255,255,0.12)',colorScheme:'dark'}}>
                <option className="bg-[#1e1b4b] text-white" value="225">225 (Lahore)</option>
                <option className="bg-[#1e1b4b] text-white" value="250">250 (KPK)</option>
                <option className="bg-[#1e1b4b] text-white" value="272.25">272.25 (Govt)</option>
              </select>
            </div>
            {/* Floors */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-blue-400"/>Floors</label>
              <select value={floors} onChange={e=>setFloors(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{background:'#1e1b4b',border:'1px solid rgba(255,255,255,0.12)',colorScheme:'dark'}}>
                <option className="bg-[#1e1b4b] text-white" value="1">1 Floor</option>
                <option className="bg-[#1e1b4b] text-white" value="2">2 Floors</option>
                <option className="bg-[#1e1b4b] text-white" value="3">3 Floors</option>
              </select>
            </div>
            {/* Location */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-green-400"/>City</label>
              <select value={location} onChange={e=>setLocation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{background:'#1e1b4b',border:'1px solid rgba(255,255,255,0.12)',colorScheme:'dark'}}>
                {['Lahore','Islamabad','Karachi','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta'].map(c=><option className="bg-[#1e1b4b] text-white" key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Construction Type */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 flex items-center gap-1.5"><Hammer className="w-3.5 h-3.5 text-orange-400"/>Construction Type</label>
              <div className="flex gap-2">
                {(['gray','full'] as const).map(t=>(
                  <button key={t} onClick={()=>setConstructionType(t)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${constructionType===t?'text-white shadow-lg':'text-gray-400 hover:text-white'}`}
                    style={constructionType===t?{background:'linear-gradient(135deg,#7c3aed,#3b82f6)'}:{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}>
                    {t==='gray'?'Gray Structure':'Full Construction'}
                  </button>
                ))}
              </div>
            </div>
            {/* Quality */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 flex items-center gap-1.5"><Crown className="w-3.5 h-3.5 text-yellow-400"/>Quality</label>
              <select value={quality} onChange={e=>setQuality(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{background:'#1e1b4b',border:'1px solid rgba(255,255,255,0.12)',colorScheme:'dark'}}>
                <option className="bg-[#1e1b4b] text-white" value="economy">Economy</option>
                <option className="bg-[#1e1b4b] text-white" value="standard">Standard</option>
                <option className="bg-[#1e1b4b] text-white" value="premium">Premium</option>
                <option className="bg-[#1e1b4b] text-white" value="luxury">Luxury</option>
              </select>
            </div>
            {/* Timeline */}
            <div>
              <label className="text-sm text-gray-300 mb-1.5 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-emerald-400"/>Prediction Timeline</label>
              <select value={predictionMonths} onChange={e=>setPredictionMonths(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{background:'#1e1b4b',border:'1px solid rgba(255,255,255,0.12)',colorScheme:'dark'}}>
                <option className="bg-[#1e1b4b] text-white" value="6">6 Months</option>
                <option className="bg-[#1e1b4b] text-white" value="12">12 Months</option>
                <option className="bg-[#1e1b4b] text-white" value="18">18 Months</option>
                <option className="bg-[#1e1b4b] text-white" value="24">24 Months</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">{error}</p>}

          <button onClick={handlePredict} disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-lg transition-all duration-300 hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-3"
            style={{background:'linear-gradient(135deg,#7c3aed 0%,#3b82f6 50%,#06b6d4 100%)'}}>
            {loading ? <><Loader2 className="w-5 h-5 animate-spin"/>Analyzing with AI...</> : <><Brain className="w-5 h-5"/>Generate AI Prediction</>}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-in fade-in">
            {/* Engine Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm" style={{background: result.ai_powered?'rgba(16,185,129,0.15)':'rgba(245,158,11,0.15)', border:`1px solid ${result.ai_powered?'rgba(16,185,129,0.3)':'rgba(245,158,11,0.3)'}`}}>
                {result.ai_powered ? <Sparkles className="w-4 h-4 text-emerald-400"/> : <BarChart3 className="w-4 h-4 text-amber-400"/>}
                <span className={result.ai_powered?'text-emerald-300':'text-amber-300'}>{result.engine}</span>
              </div>
            </div>

            {/* Current Estimate Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                {label:'Total Cost',val:result.current_estimate.total_cost,color:'from-violet-500 to-purple-600',big:true},
                {label:'Gray Structure',val:result.current_estimate.gray_structure_cost,color:'from-blue-500 to-cyan-500'},
                {label:'Finishing',val:result.current_estimate.finishing_cost,color:'from-emerald-500 to-green-500'},
                {label:'Labor',val:result.current_estimate.labor_cost,color:'from-orange-500 to-amber-500'},
                {label:'Per Sq Ft',val:result.current_estimate.per_sqft_rate,color:'from-pink-500 to-rose-500',isSqft:true},
              ].map((c,i)=>(
                <div key={i} className={`rounded-xl p-4 ${c.big?'col-span-2 md:col-span-1':''}`} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}}>
                  <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                  <p className={`text-lg font-bold bg-gradient-to-r ${c.color} bg-clip-text`} style={{WebkitTextFillColor:'transparent'}}>{c.isSqft?`Rs. ${c.val.toLocaleString()}`:formatPKR(c.val)}</p>
                </div>
              ))}
            </div>

            {/* Savings Banner */}
            {result.savings_if_start_now > 0 && (
              <div className="rounded-xl p-4 flex items-center gap-4" style={{background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(59,130,246,0.15))',border:'1px solid rgba(16,185,129,0.25)'}}>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-6 h-6 text-emerald-400"/></div>
                <div><p className="text-emerald-300 font-semibold">Start Now & Save</p><p className="text-sm text-gray-300">Building now saves you <span className="text-emerald-400 font-bold">{formatPKR(result.savings_if_start_now)}</span> over {predictionMonths} months</p></div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-1 p-1 rounded-xl scrollbar-none" style={{background:'rgba(255,255,255,0.05)'}}>
              {([['forecast','📈 Forecast'],['risks','⚠️ Risks'],['breakdown','📊 Breakdown'],['recommendations','💡 Tips']] as const).map(([key,label])=>(
                <button key={key} onClick={()=>setActiveTab(key as any)}
                  className={`flex-1 min-w-[100px] whitespace-nowrap flex-shrink-0 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab===key?'text-white shadow-lg':'text-gray-400 hover:text-gray-200'}`}
                  style={activeTab===key?{background:'linear-gradient(135deg,#7c3aed,#3b82f6)'}:{}}>{label}</button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="rounded-2xl p-6" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}>

              {/* Forecast Tab */}
              {activeTab === 'forecast' && (
                <div>
                  <h3 className="text-lg text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-400"/>Monthly Cost Forecast</h3>
                  {/* Chart-like visual */}
                  <div className="space-y-2 mb-6">
                    {result.monthly_predictions.map((p,i) => {
                      const maxCost = Math.max(...result.monthly_predictions.map(x=>x.predicted_cost));
                      const minCost = result.current_estimate.total_cost;
                      const pct = ((p.predicted_cost - minCost) / (maxCost - minCost || 1)) * 100;
                      return (
                        <div key={i} className="group rounded-lg p-3 transition-all hover:bg-white/5" style={{border:'1px solid rgba(255,255,255,0.05)'}}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500 w-8">M{p.month}</span>
                              <span className="text-sm text-gray-300">{p.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{background:`rgba(${p.confidence>70?'16,185,129':p.confidence>50?'245,158,11':'239,68,68'},0.15)`,color:p.confidence>70?'#6ee7b7':p.confidence>50?'#fcd34d':'#fca5a5'}}>{p.confidence}% conf</span>
                              <span className="text-sm text-white font-semibold">{formatPKR(p.predicted_cost)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.08)'}}>
                              <div className="h-full rounded-full transition-all" style={{width:`${Math.max(5,pct)}%`,background:`linear-gradient(90deg,#7c3aed,${pct>60?'#ef4444':'#3b82f6'})`}}/>
                            </div>
                            <span className="text-xs text-gray-500 w-16 text-right">+{p.inflation_rate}%/yr</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{p.key_factor}</p>
                        </div>
                      );
                    })}
                  </div>
                  {/* Market Insights */}
                  <div className="rounded-xl p-4 mt-4" style={{background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.2)'}}>
                    <h4 className="text-sm text-purple-300 font-semibold mb-2">Market Insights</h4>
                    <p className="text-sm text-gray-300 mb-2">{result.market_insights.summary}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div className="rounded-lg p-3" style={{background:'rgba(255,255,255,0.05)'}}>
                        <p className="text-xs text-gray-500">Trend</p>
                        <p className="text-sm text-white capitalize flex items-center gap-1">{trendIcon(result.market_insights.overall_trend)} {result.market_insights.overall_trend}</p>
                      </div>
                      <div className="rounded-lg p-3" style={{background:'rgba(255,255,255,0.05)'}}>
                        <p className="text-xs text-gray-500">Inflation</p>
                        <p className="text-sm text-white">{result.market_insights.inflation_forecast}</p>
                      </div>
                      <div className="rounded-lg p-3" style={{background:'rgba(255,255,255,0.05)'}}>
                        <p className="text-xs text-gray-500">Best Time</p>
                        <p className="text-sm text-white">{result.market_insights.best_time_to_build}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Risks Tab */}
              {activeTab === 'risks' && (
                <div>
                  <h3 className="text-lg text-white font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-400"/>Risk Assessment</h3>
                  <div className="space-y-3">
                    {result.risk_factors.map((r,i) => (
                      <div key={i} className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-400"/>
                            <span className="text-white font-medium">{r.factor}</span>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full border ${impactColor(r.impact)}`}>{r.impact}</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{r.description}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.08)'}}>
                            <div className="h-full rounded-full" style={{width:`${Math.min(r.potential_increase_pct*8,100)}%`,background:r.impact==='high'?'#ef4444':r.impact==='medium'?'#f59e0b':'#22c55e'}}/>
                          </div>
                          <span className="text-xs text-gray-400">+{r.potential_increase_pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Breakdown Tab */}
              {activeTab === 'breakdown' && (
                <div>
                  <h3 className="text-lg text-white font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-400"/>Cost Breakdown</h3>
                  <div className="overflow-hidden rounded-xl" style={{border:'1px solid rgba(255,255,255,0.1)'}}>
                    <table className="w-full">
                      <thead><tr style={{background:'rgba(255,255,255,0.05)'}}>
                        <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Category</th>
                        <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">Current</th>
                        <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">6 Month</th>
                        <th className="text-center text-xs text-gray-400 font-medium px-4 py-3">Trend</th>
                      </tr></thead>
                      <tbody>
                        {result.cost_breakdown.map((c,i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors" style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                            <td className="px-4 py-3 text-sm text-white">{c.category}</td>
                            <td className="px-4 py-3 text-sm text-gray-300 text-right">{formatPKR(c.current_cost)}</td>
                            <td className="px-4 py-3 text-sm text-gray-300 text-right">{formatPKR(c.predicted_cost_6m)}</td>
                            <td className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1 text-xs capitalize">{trendIcon(c.trend)}{c.trend}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && (
                <div>
                  <h3 className="text-lg text-white font-semibold mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-400"/>Smart Recommendations</h3>
                  <div className="space-y-3">
                    {result.recommendations.map((r,i) => (
                      <div key={i} className="rounded-xl overflow-hidden cursor-pointer transition-all"
                        style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}
                        onClick={()=>setExpandedRec(expandedRec===i?null:i)}>
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-8 rounded-full ${priorityColor(r.priority)}`}/>
                            <div>
                              <p className="text-white font-medium">{r.title}</p>
                              <p className="text-xs text-gray-500">Potential savings: <span className="text-emerald-400 font-semibold">{formatPKR(r.potential_savings)}</span></p>
                            </div>
                          </div>
                          {expandedRec===i ? <ChevronUp className="w-5 h-5 text-gray-400"/> : <ChevronDown className="w-5 h-5 text-gray-400"/>}
                        </div>
                        {expandedRec===i && (
                          <div className="px-4 pb-4 pt-0">
                            <div className="ml-5 pl-3 border-l-2 border-purple-500/30">
                              <p className="text-sm text-gray-300">{r.description}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}