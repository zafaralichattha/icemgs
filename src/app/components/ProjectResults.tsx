import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { projectService, bomService, aiPredictionService } from '../services/api.service';
import { Building2, Download, TrendingUp, FileText, DollarSign, Menu, Hammer, Sparkles, Home, Layers, Brain, Loader2 } from 'lucide-react';

interface CostBreakdown {
  grayStructure: number;
  finishing: number;
  labor: number;
  total: number;
}

interface MaterialItem {
  name: string;
  quantity: string;
  unit: string;
  rate: number;
  cost: number;
  category?: string;
}

interface ProjectResultsProps {
  onMenuClick: () => void;
}

export default function ProjectResults({ onMenuClick }: ProjectResultsProps) {
  const { id } = useParams();
  const { loadProject, projectData } = useProject();
  const [costs, setCosts] = useState<CostBreakdown>({ grayStructure: 0, finishing: 0, labor: 0, total: 0 });
  const [grayMaterials, setGrayMaterials] = useState<MaterialItem[]>([]);
  const [finishingMaterials, setFinishingMaterials] = useState<MaterialItem[]>([]);
  const [projectDetails, setProjectDetails] = useState<any>(null);

  // AI Prediction states
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predictionQuality] = useState<'economy'|'standard'|'premium'|'luxury'>('standard');
  const [predictionMonths] = useState<string>('12');
  const [predictionActiveTab, setPredictionActiveTab] = useState<'forecast'|'risks'|'breakdown'|'recommendations'>('forecast');
  const [predictionError, setPredictionError] = useState('');
  const [expandedRec, setExpandedRec] = useState<number|null>(null);

  useEffect(() => {
    if (id) {
      loadProject(id);
      fetchCostsFromDatabase(id);
      fetchProjectDetails(id);
    }
  }, [id]);

  const fetchAIPrediction = async (details: any, qualityTier: string, monthsStr: string) => {
    if (!details) return;
    setPredictionLoading(true);
    setPredictionError('');
    try {
      const plotMarlas = parseFloat(details.plot_marlas) || parseFloat(details.plot_area) || 5;
      const numFloors = parseInt(details.num_floors) || 1;
      const constructionType = details.construction_type === 'complete' || details.construction_type === 'full' ? 'full' : 'gray';
      const location = details.location || 'Lahore';
      const marlaSize = parseFloat(details.marla_size) || 225;
      const months = parseInt(monthsStr) || 12;

      const res = await aiPredictionService.predict({
        plot_area: plotMarlas,
        num_floors: numFloors,
        construction_type: constructionType,
        quality: qualityTier as any,
        location: location,
        marla_size: marlaSize,
        prediction_months: months,
      });
      setPredictionResult(res);
    } catch (e: any) {
      console.error('AI prediction failed', e);
      setPredictionError(e?.response?.data?.error || e?.message || 'Prediction failed');
    } finally {
      setPredictionLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const details = await projectService.getById(projectId);
      setProjectDetails(details);
      // Run prediction immediately on load
      fetchAIPrediction(details, predictionQuality, predictionMonths);
    } catch (err) {
      console.error('Failed to fetch project details', err);
    }
  };

  const fetchCostsFromDatabase = async (projectId: string) => {
    try {
      // 1. Trigger backend to recalculate costs and return them
      const costData = await projectService.calculateCosts(projectId);
      
      setCosts({
        grayStructure: parseFloat(costData.gray_structure_cost),
        finishing: parseFloat(costData.finishing_cost),
        labor: parseFloat(costData.labor_cost),
        total: parseFloat(costData.total_cost)
      });

      // 2. Fetch the Bill of Materials that the backend just generated
      const boms = await bomService.getByProject(projectId);
      
      const grayMats: MaterialItem[] = [];
      const finishMats: MaterialItem[] = [];
      
      boms.forEach((bom: any) => {
        const item: MaterialItem = {
          name: bom.material_detail?.name || bom.material,
          quantity: parseFloat(bom.quantity).toString(),
          unit: bom.unit,
          rate: parseFloat(bom.rate),
          cost: parseFloat(bom.total_cost),
          category: bom.material_detail?.category_display || bom.category_display || ''
        };
        
        if (bom.category === 'gray_structure') {
          grayMats.push(item);
        } else {
          finishMats.push(item);
        }
      });
      
      setGrayMaterials(grayMats);
      setFinishingMaterials(finishMats);
      
    } catch (err) {
      console.error("Failed to fetch costs from database", err);
    }
  };

  const handleDownloadPDF = async () => {
    if (!id) {
      alert('No project ID found');
      return;
    }

    try {
      // Show loading state
      const downloadButton = document.querySelector('button[aria-label="download-pdf"]') as HTMLButtonElement;
      if (downloadButton) {
        downloadButton.disabled = true;
        downloadButton.textContent = 'Generating PDF...';
      }

      // Call API to get PDF
      const pdfBlob = await projectService.downloadPDF(id);

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ICEMGS_Report_${projectData.plotDetails.location || 'Project'}_${id.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Reset button state
      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.innerHTML = '<svg class="w-5 h-5" ...>...</svg> Download Report';
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF report. Please try again or ensure you have saved the project.');
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-PK')}`;
  };

  const calculateTotal = (materials: MaterialItem[]) => {
    return materials.reduce((sum, item) => sum + item.cost, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
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
          <div className="flex gap-4">
            <button
              onClick={handleDownloadPDF}
              aria-label="download-pdf"
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Download Report
            </button>
            <Link to="/dashboard">
              <button className="px-6 py-2 text-gray-600 hover:text-gray-900">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl mb-2">Construction Estimation Report</h1>
          <p className="text-xl text-gray-600">
            Project: {projectData.plotDetails.location}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {projectData.plotDetails.plotMarlas} marlas ({projectData.plotDetails.plotArea} sq ft) •
            {' '}{projectData.plotDetails.numberOfFloors} floor{parseInt(projectData.plotDetails.numberOfFloors) > 1 ? 's' : ''} •
            {' '}{projectData.constructionType === 'complete' ? 'Complete Construction' : 'Gray Structure Only'}
          </p>
        </div>

        {/* Cost Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5" />
              <h3 className="text-sm opacity-90">Total Cost</h3>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(costs.total)}</p>
            <p className="text-xs opacity-75 mt-1">
              {formatCurrency(Math.round(costs.total / (parseFloat(projectData.plotDetails.plotArea) * parseInt(projectData.plotDetails.numberOfFloors))))} per sq ft
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Hammer className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm text-gray-600">Gray Structure</h3>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(costs.grayStructure)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {((costs.grayStructure / costs.total) * 100).toFixed(1)}% of total
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm text-gray-600">Finishing</h3>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(costs.finishing)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {costs.finishing > 0 ? `${((costs.finishing / costs.total) * 100).toFixed(1)}% of total` : 'Not included'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <h3 className="text-sm text-gray-600">Labor</h3>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(costs.labor)}</p>
            <p className="text-xs text-gray-500 mt-1">
              25% of material cost
            </p>
          </div>
        </div>

        {/* Project Details & Floor Summary */}
        {projectDetails && (
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Floor & Room Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Home className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl">Floor & Room Summary</h2>
              </div>
              {(projectDetails.floors || []).length > 0 ? (
                <div className="space-y-4">
                  {(projectDetails.floors || []).map((floor: any, fi: number) => {
                    const activeRooms = (floor.rooms || []).filter((r: any) => r.size !== 'none');
                    return (
                      <div key={fi} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">
                          {floor.floor_type_display || `Floor ${floor.floor_number}`}
                        </h4>
                        {activeRooms.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {activeRooms.map((room: any, ri: number) => (
                              <span key={ri} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200">
                                {(room.room_type_display || room.room_type || '').replace('_', ' ')} ({(room.size || '').charAt(0).toUpperCase() + (room.size || '').slice(1)})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No rooms configured</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No floor data available</p>
              )}
            </div>

            {/* Gray Structure & Finishing Specs */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-6 h-6 text-gray-600" />
                <h2 className="text-2xl">Specifications</h2>
              </div>
              {projectDetails.gray_structure_details && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Gray Structure</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {projectDetails.gray_structure_details.foundation_type && (
                      <><span className="text-gray-500">Foundation:</span><span className="capitalize">{projectDetails.gray_structure_details.foundation_type.replace(/-/g, ' ')}</span></>
                    )}
                    {projectDetails.gray_structure_details.cement_type && (
                      <><span className="text-gray-500">Cement:</span><span className="uppercase">{projectDetails.gray_structure_details.cement_type.replace(/-/g, ' ')}</span></>
                    )}
                    {projectDetails.gray_structure_details.steel_grade && (
                      <><span className="text-gray-500">Steel:</span><span className="capitalize">{projectDetails.gray_structure_details.steel_grade.replace(/-/g, ' ')}</span></>
                    )}
                    {projectDetails.gray_structure_details.brick_type && (
                      <><span className="text-gray-500">Brick:</span><span className="capitalize">{projectDetails.gray_structure_details.brick_type.replace(/-/g, ' ')}</span></>
                    )}
                    {projectDetails.gray_structure_details.wall_thickness && (
                      <><span className="text-gray-500">Wall:</span><span className="capitalize">{projectDetails.gray_structure_details.wall_thickness.replace(/-/g, ' ')}</span></>
                    )}
                  </div>
                </div>
              )}
              {projectDetails.finishing_details && projectData.constructionType === 'complete' && (
                <div>
                  <h4 className="font-semibold text-purple-700 mb-2">Finishing</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {projectDetails.finishing_details.floor_tiles && (
                      <><span className="text-gray-500">Flooring:</span><span className="capitalize">{projectDetails.finishing_details.floor_tiles}</span></>
                    )}
                    {projectDetails.finishing_details.paint && (
                      <><span className="text-gray-500">Paint:</span><span className="capitalize">{projectDetails.finishing_details.paint}</span></>
                    )}
                    {projectDetails.finishing_details.doors && (
                      <><span className="text-gray-500">Doors:</span><span className="capitalize">{projectDetails.finishing_details.doors}</span></>
                    )}
                    {projectDetails.finishing_details.windows && (
                      <><span className="text-gray-500">Windows:</span><span className="capitalize">{projectDetails.finishing_details.windows}</span></>
                    )}
                    {projectDetails.finishing_details.electrical && (
                      <><span className="text-gray-500">Electrical:</span><span className="capitalize">{projectDetails.finishing_details.electrical}</span></>
                    )}
                    {projectDetails.finishing_details.plumbing && (
                      <><span className="text-gray-500">Plumbing:</span><span className="capitalize">{projectDetails.finishing_details.plumbing}</span></>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Cost Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl mb-4">Cost Breakdown</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Gray Structure</span>
                  <span>{formatCurrency(costs.grayStructure)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-gray-500 to-gray-700 h-3 rounded-full"
                    style={{ width: `${(costs.grayStructure / costs.total) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {((costs.grayStructure / costs.total) * 100).toFixed(1)}% of total
                </p>
              </div>

              {costs.finishing > 0 && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Finishing</span>
                    <span>{formatCurrency(costs.finishing)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-700 h-3 rounded-full"
                      style={{ width: `${(costs.finishing / costs.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {((costs.finishing / costs.total) * 100).toFixed(1)}% of total
                  </p>
                </div>
              )}

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Labor</span>
                  <span>{formatCurrency(costs.labor)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-700 h-3 rounded-full"
                    style={{ width: `${(costs.labor / costs.total) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {((costs.labor / costs.total) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
          </div>

          {/* Future Cost Predictions - AI cost prediction card */}
          <div className="bg-slate-900 text-white rounded-xl shadow-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-1.5">
                    AI Cost Prediction
                    <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 border border-purple-800">Gemini 2.0</span>
                  </h2>
                  <p className="text-xs text-slate-400">Intelligent market analysis & forecasting</p>
                </div>
              </div>
              
              {predictionResult && (
                <div className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  {predictionResult.engine}
                </div>
              )}
            </div>



            {predictionError && (
              <div className="p-3 bg-red-950/50 border border-red-900/50 text-red-300 rounded-lg text-sm mb-4">
                {predictionError}
              </div>
            )}

            {predictionLoading && !predictionResult && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
                <p className="text-sm font-medium">Generating AI Cost Forecast...</p>
                <p className="text-xs text-slate-500 mt-1">Analyzing local raw materials & inflation indices</p>
              </div>
            )}

            {predictionResult && (
              <div className="space-y-4">
                {/* Savings Banner */}
                {predictionResult.savings_if_start_now > 0 && (
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-xs text-emerald-200">
                      <strong>Start building now</strong> to save an estimated{' '}
                      <span className="text-emerald-400 font-bold">
                        Rs. {predictionResult.savings_if_start_now.toLocaleString('en-PK')}
                      </span>{' '}
                      over the next {predictionMonths} months.
                    </p>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
                  {([
                    ['forecast', 'Forecast'],
                    ['risks', 'Risks'],
                    ['breakdown', 'Breakdown'],
                    ['recommendations', 'Tips']
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPredictionActiveTab(key)}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                        predictionActiveTab === key
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="bg-slate-950/40 rounded-lg p-4 border border-slate-800/50">
                  {/* Forecast Tab */}
                  {predictionActiveTab === 'forecast' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Inflation Projection</h4>
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {predictionResult.monthly_predictions.slice(0, 6).map((p: any, i: number) => {
                          const maxCost = Math.max(...predictionResult.monthly_predictions.map((x: any) => x.predicted_cost));
                          const minCost = predictionResult.current_estimate.total_cost;
                          const pct = ((p.predicted_cost - minCost) / (maxCost - minCost || 1)) * 100;
                          return (
                            <div key={i} className="group text-xs border border-slate-850 p-2 rounded hover:bg-slate-900/40 transition-colors">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-slate-300 font-medium">{p.label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500">M{p.month}</span>
                                  <span className="font-semibold text-purple-300">
                                    Rs. {p.predicted_cost.toLocaleString('en-PK')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                    style={{ width: `${Math.max(5, pct)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-red-400 w-12 text-right">+{p.inflation_rate}%</span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {p.key_factor}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {predictionResult.market_insights && (
                        <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                          <p className="italic">"{predictionResult.market_insights.summary}"</p>
                          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/40">
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Forecast Trend</span>
                              <span className="text-white capitalize font-medium">{predictionResult.market_insights.overall_trend}</span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Best Time to Start</span>
                              <span className="text-white font-medium">{predictionResult.market_insights.best_time_to_build}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Risks Tab */}
                  {predictionActiveTab === 'risks' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Inflation Risk Factors</h4>
                      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                        {predictionResult.risk_factors.map((r: any, i: number) => (
                          <div key={i} className="p-2.5 rounded border border-slate-800 bg-slate-900/20 text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold text-slate-200">{r.factor}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                r.impact === 'high' ? 'bg-red-950 text-red-400 border border-red-900' :
                                r.impact === 'medium' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                                'bg-green-950 text-green-400 border border-green-900'
                              }`}>
                                {r.impact}
                              </span>
                            </div>
                            <p className="text-slate-400 text-[11px] mb-1.5 leading-relaxed">{r.description}</p>
                            <div className="flex items-center gap-2 text-[10px]">
                              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    r.impact === 'high' ? 'bg-red-500' : r.impact === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(r.potential_increase_pct * 7, 100)}%` }}
                                />
                              </div>
                              <span className="text-slate-400 font-medium">+{r.potential_increase_pct}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Breakdown Tab */}
                  {predictionActiveTab === 'breakdown' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Category Forecast (6M)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead>
                            <tr className="border-b border-slate-850">
                              <th className="text-left py-1 text-[10px] text-slate-500 uppercase">Category</th>
                              <th className="text-right py-1 text-[10px] text-slate-500 uppercase">Current</th>
                              <th className="text-right py-1 text-[10px] text-slate-500 uppercase">6 Months</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {predictionResult.cost_breakdown.map((c: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-900/20">
                                <td className="py-2 text-slate-200">{c.category}</td>
                                <td className="py-2 text-right">Rs. {c.current_cost.toLocaleString('en-PK')}</td>
                                <td className="py-2 text-right text-purple-300 font-medium">Rs. {c.predicted_cost_6m.toLocaleString('en-PK')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Tips Tab */}
                  {predictionActiveTab === 'recommendations' && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Actionable Advice</h4>
                      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                        {predictionResult.recommendations.map((r: any, i: number) => (
                          <div
                            key={i}
                            className="rounded border border-slate-800 bg-slate-900/20 text-xs overflow-hidden cursor-pointer"
                            onClick={() => setExpandedRec(expandedRec === i ? null : i)}
                          >
                            <div className="p-2.5 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                              <div>
                                <p className="font-semibold text-slate-200">{r.title}</p>
                                <p className="text-[10px] text-emerald-400 mt-0.5 font-medium">
                                  Potential Savings: Rs. {r.potential_savings.toLocaleString('en-PK')}
                                </p>
                              </div>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase text-white ${
                                r.priority === 'high' ? 'bg-red-600' :
                                r.priority === 'medium' ? 'bg-amber-600' : 'bg-blue-600'
                              }`}>
                                {r.priority}
                              </span>
                            </div>
                            {expandedRec === i && (
                              <div className="p-2.5 bg-slate-900/60 border-t border-slate-850 text-slate-400 text-[11px] leading-relaxed">
                                {r.description}
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

        {/* GRAY STRUCTURE BILL OF MATERIALS */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Hammer className="w-6 h-6 text-gray-700" />
            <h2 className="text-2xl">Gray Structure - Bill of Materials</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Material</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Unit</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Rate (Rs.)</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Cost (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {grayMaterials.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3 text-sm">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{parseFloat(item.quantity).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                    <td className="px-4 py-3 text-sm text-right">{item.rate.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">{item.cost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td colSpan={5} className="px-4 py-3 text-right font-semibold">Total:</td>
                  <td className="px-4 py-3 text-right font-bold text-lg">{formatCurrency(calculateTotal(grayMaterials))}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6 pt-6 border-t-4 border-gray-800">
            <div className="flex justify-between items-center bg-gray-800 text-white p-4 rounded-lg">
              <span className="text-xl font-bold">Gray Structure Total:</span>
              <span className="text-2xl font-bold">{formatCurrency(costs.grayStructure)}</span>
            </div>
          </div>
        </div>

        {/* FINISHING BILL OF MATERIALS */}
        {projectData.constructionType === 'complete' && finishingMaterials.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-purple-700" />
              <h2 className="text-2xl">Finishing - Bill of Materials</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Material</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Unit</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Rate (Rs.)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Cost (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {finishingMaterials.map((item, index) => (
                    <tr key={index} className="hover:bg-purple-50">
                      <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                      <td className="px-4 py-3 text-sm">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{parseFloat(item.quantity).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.rate.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{item.cost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-purple-50 border-t-2 border-purple-300">
                    <td colSpan={5} className="px-4 py-3 text-right font-semibold">Total:</td>
                    <td className="px-4 py-3 text-right font-bold text-lg">{formatCurrency(calculateTotal(finishingMaterials))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 pt-6 border-t-4 border-purple-800">
              <div className="flex justify-between items-center bg-purple-800 text-white p-4 rounded-lg">
                <span className="text-xl font-bold">Finishing Total:</span>
                <span className="text-2xl font-bold">{formatCurrency(costs.finishing)}</span>
              </div>
            </div>
          </div>
        )}

        {projectData.constructionType === 'gray-only' && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Gray Structure Only Selected</h3>
                <p className="text-sm text-blue-700">
                  Finishing materials are not included in this estimate. Add finishing work separately when ready.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}