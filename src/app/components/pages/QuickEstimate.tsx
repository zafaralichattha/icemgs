import { useState } from 'react';
import { Calculator, DollarSign, Menu, Building2, Info, TrendingUp } from 'lucide-react';

interface QuickEstimateProps {
  onMenuClick: () => void;
}

export default function QuickEstimate({ onMenuClick }: QuickEstimateProps) {
  const [inputType, setInputType] = useState<'dimensions' | 'marlas'>('dimensions');
  const [plotLength, setPlotLength] = useState('');
  const [plotWidth, setPlotWidth] = useState('');
  const [plotMarlas, setPlotMarlas] = useState('');
  const [marlaSize, setMarlaSize] = useState('225');
  const [floors, setFloors] = useState('1');
  const [quality, setQuality] = useState('standard');
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<{
    plotArea: number;
    coveredArea: number;
    totalBuiltArea: number;
    ratePerSqFt: number;
  } | null>(null);

  const RATES: Record<string, number> = {
    economy: 2800,
    standard: 3500,
    premium: 4500,
    luxury: 6000,
  };

  const RATE_LABELS: Record<string, string> = {
    economy: 'Basic gray structure with economy-grade materials',
    standard: 'Standard gray structure with quality materials',
    premium: 'Premium gray structure with upgraded materials',
    luxury: 'Luxury gray structure with partial finishing',
  };

  const calculateEstimate = () => {
    let plotArea = 0;

    if (inputType === 'dimensions') {
      if (!plotLength || !plotWidth) {
        alert('Please enter plot dimensions');
        return;
      }
      plotArea = parseFloat(plotLength) * parseFloat(plotWidth);
    } else {
      if (!plotMarlas) {
        alert('Please enter plot area in marlas');
        return;
      }
      plotArea = parseFloat(plotMarlas) * parseFloat(marlaSize);
    }

    const floorsNum = parseInt(floors);

    // 65% of plot area is usable covered area (35% goes to setbacks, corridors, stairs)
    const coverageRatio = 0.65;
    const coveredArea = plotArea * coverageRatio;
    const totalBuiltArea = coveredArea * floorsNum;

    const ratePerSqFt = RATES[quality] || RATES.standard;

    const total = Math.round(totalBuiltArea * ratePerSqFt);
    setEstimatedCost(total);
    setBreakdown({
      plotArea: Math.round(plotArea),
      coveredArea: Math.round(coveredArea),
      totalBuiltArea: Math.round(totalBuiltArea),
      ratePerSqFt,
    });
  };

  const formatPKR = (value: number) => {
    if (value >= 10000000) {
      return `Rs. ${(value / 10000000).toFixed(2)} Crore`;
    }
    if (value >= 100000) {
      return `Rs. ${(value / 100000).toFixed(2)} Lakh`;
    }
    return `Rs. ${value.toLocaleString('en-PK')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="w-full max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-lg mr-2"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="text-xl">ICEMGS - Quick Estimate</span>
          </div>
        </div>
      </header>

      <div className="w-full max-w-4xl mx-auto p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl mb-2">Quick Cost Estimator</h1>
          <p className="text-base sm:text-xl text-gray-600">
            Get instant gray structure cost estimates based on current market rates
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h2 className="text-xl sm:text-2xl">Enter Plot Details</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6 border-b pb-4">
            <button
              type="button"
              onClick={() => setInputType('dimensions')}
              className={`w-full sm:flex-1 py-2.5 text-center rounded-lg font-semibold transition-colors ${
                inputType === 'dimensions'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Use Dimensions (Length & Width)
            </button>
            <button
              type="button"
              onClick={() => setInputType('marlas')}
              className={`w-full sm:flex-1 py-2.5 text-center rounded-lg font-semibold transition-colors ${
                inputType === 'marlas'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Use Marlas
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {inputType === 'dimensions' ? (
              <>
                <div>
                  <label className="block mb-2">Plot Length (feet)</label>
                  <input
                    type="number"
                    value={plotLength}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || parseFloat(val) >= 0) {
                        setPlotLength(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault();
                      }
                    }}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 25"
                  />
                </div>

                <div>
                  <label className="block mb-2">Plot Width (feet)</label>
                  <input
                    type="number"
                    value={plotWidth}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || parseFloat(val) >= 0) {
                        setPlotWidth(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault();
                      }
                    }}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 45"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block mb-2">Plot Area (Marlas)</label>
                  <input
                    type="number"
                    value={plotMarlas}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || parseFloat(val) >= 0) {
                        setPlotMarlas(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault();
                      }
                    }}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 5"
                  />
                </div>

                <div>
                  <label className="block mb-2">Marla Size (sq ft)</label>
                  <select
                    value={marlaSize}
                    onChange={(e) => setMarlaSize(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="225">225 sq ft (Lahore Standard)</option>
                    <option value="250">250 sq ft (KPK/Others)</option>
                    <option value="272.25">272.25 sq ft (Govt Standard)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block mb-2">Number of Floors</label>
              <select
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1 Floor (Ground Only)</option>
                <option value="2">2 Floors (Ground + 1st)</option>
                <option value="3">3 Floors (Ground + 1st + 2nd)</option>
              </select>
            </div>

            <div>
              <label className="block mb-2">Construction Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="economy">Economy</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="luxury">Luxury</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">{RATE_LABELS[quality]}</p>
            </div>
          </div>

          <button
            onClick={calculateEstimate}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 text-lg"
          >
            Calculate Estimate
          </button>

          {estimatedCost !== null && breakdown && (
            <div className="mt-8 space-y-4">
              {/* Main result */}
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl">
                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  <h3 className="text-lg sm:text-2xl text-green-900">Estimated Gray Structure Cost</h3>
                </div>
                <p className="text-2xl sm:text-4xl text-green-600 mb-2 font-bold">
                  {formatPKR(estimatedCost)}
                </p>
                <p className="text-xs sm:text-sm text-green-800 font-medium">
                  ({estimatedCost.toLocaleString('en-PK')} PKR)
                </p>
              </div>

              {/* Calculation breakdown */}
              <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Calculation Breakdown
                </h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-gray-600">Plot Area</p>
                    <p className="font-semibold text-blue-900">{breakdown.plotArea} sq ft</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-gray-600">Covered Area (65%)</p>
                    <p className="font-semibold text-blue-900">{breakdown.coveredArea} sq ft</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-gray-600">Total Built Area ({floors} floor{parseInt(floors) > 1 ? 's' : ''})</p>
                    <p className="font-semibold text-blue-900">{breakdown.totalBuiltArea} sq ft</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-gray-600">Rate per sq ft ({quality})</p>
                    <p className="font-semibold text-blue-900">Rs. {breakdown.ratePerSqFt.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-3">
                  Formula: {breakdown.coveredArea} sq ft × {floors} floor{parseInt(floors) > 1 ? 's' : ''} × Rs. {breakdown.ratePerSqFt.toLocaleString()} = Rs. {estimatedCost.toLocaleString('en-PK')}
                </p>
              </div>

              {/* Scope note */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-900">
                      <strong>Gray Structure Estimate Only.</strong> This includes foundation, bricks, cement, steel, plaster, roof slab, and basic labor. 
                      Finishing costs (tiles, paint, doors, windows, electrical, plumbing, sanitary) are additional and typically add 40-60% on top.
                    </p>
                    <p className="text-sm text-amber-800 mt-2">
                      For a detailed room-by-room breakdown with finishing, <strong>create a full project</strong> from the sidebar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rate cards */}
        <div className="mt-6 grid md:grid-cols-4 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-900">
              <strong>Economy</strong>
            </p>
            <p className="text-lg font-bold text-gray-700">Rs. 2,800/sq ft</p>
            <p className="text-xs text-gray-500 mt-1">Basic materials</p>
          </div>
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Standard</strong>
            </p>
            <p className="text-lg font-bold text-blue-700">Rs. 3,500/sq ft</p>
            <p className="text-xs text-blue-600 mt-1">Quality materials</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-900">
              <strong>Premium</strong>
            </p>
            <p className="text-lg font-bold text-purple-700">Rs. 4,500/sq ft</p>
            <p className="text-xs text-purple-600 mt-1">Upgraded materials</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>Luxury</strong>
            </p>
            <p className="text-lg font-bold text-amber-700">Rs. 6,000/sq ft</p>
            <p className="text-xs text-amber-600 mt-1">Gray + partial finishing</p>
          </div>
        </div>

        {/* Market context */}
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500">
            <strong>📊 Rate Basis:</strong> Rates are based on Lahore construction market averages (2025-2026) for residential projects. 
            Actual costs may vary ±10-15% based on specific location, material availability, and contractor rates.
            A 65% coverage factor is applied to account for setbacks, corridors, and circulation space as per LDA bylaws.
          </p>
        </div>
      </div>
    </div>
  );
}