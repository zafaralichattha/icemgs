import { useState, useEffect } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface StepComplianceProps {
  onNext: () => void;
}

export default function StepCompliance({ onNext }: StepComplianceProps) {
  const { projectData, updateProjectData, markStepComplete } = useProject();
  const [formData, setFormData] = useState(projectData.compliance);
  const [complianceStatus, setComplianceStatus] = useState<{
    frontSetback: boolean;
    rearSetback: boolean;
    sideSetbacks: boolean;
    height: boolean;
    coverage: boolean;
  }>({
    frontSetback: true,
    rearSetback: true,
    sideSetbacks: true,
    height: true,
    coverage: true
  });

  useEffect(() => {
    checkCompliance();
  }, [formData, projectData.plotDetails]);

  const checkCompliance = () => {
    const floors = parseInt(projectData.plotDetails.numberOfFloors);

    // LDA standard requirements (simplified)
    const minFrontSetback = 10; // feet
    const minRearSetback = 10; // feet
    const minSideSetback = 5; // feet per side
    const maxHeightPerFloor = 12; // feet
    const maxCoverageRatio = 60; // percentage

    const frontSetback = parseFloat(formData.frontSetback) || 0;
    const rearSetback = parseFloat(formData.rearSetback) || 0;
    const sideSetbacks = parseFloat(formData.sideSetbacks) || 0;
    const maxHeight = parseFloat(formData.maxHeight) || (floors * maxHeightPerFloor);
    const coverageRatio = parseFloat(formData.coverageRatio) || 60;

    setComplianceStatus({
      frontSetback: frontSetback >= minFrontSetback,
      rearSetback: rearSetback >= minRearSetback,
      sideSetbacks: sideSetbacks >= minSideSetback,
      height: maxHeight <= (floors * maxHeightPerFloor + 3),
      coverage: coverageRatio <= maxCoverageRatio
    });

    // Auto-fill recommended values if empty
    if (!formData.frontSetback) {
      setFormData(prev => ({ ...prev, frontSetback: minFrontSetback.toString() }));
    }
    if (!formData.rearSetback) {
      setFormData(prev => ({ ...prev, rearSetback: minRearSetback.toString() }));
    }
    if (!formData.sideSetbacks) {
      setFormData(prev => ({ ...prev, sideSetbacks: minSideSetback.toString() }));
    }
    if (!formData.maxHeight) {
      setFormData(prev => ({ ...prev, maxHeight: (floors * maxHeightPerFloor).toString() }));
    }
    if (!formData.coverageRatio) {
      setFormData(prev => ({ ...prev, coverageRatio: '55' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProjectData('compliance', formData);
    markStepComplete(5);
    onNext();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const allCompliant = Object.values(complianceStatus).every(status => status);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl mb-2">LDA Building Rules Check</h2>
        <p className="text-gray-600">
          Make sure your construction plan follows Lahore Development Authority bylaws
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* LDA Bylaw Requirements Box */}
        <div className="bg-indigo-50 border-2 border-blue-300 rounded-lg p-5">
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-indigo-900 mb-2">LDA Building Bylaws - Minimum Requirements</h3>
              <p className="text-sm text-indigo-800">These are the minimum legal requirements for construction in Lahore:</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg p-3 border border-indigo-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <span className="font-semibold text-gray-900">Front Space:</span>
              </div>
              <p className="text-sm text-gray-700 pl-4">Minimum <strong>10 feet</strong> from road</p>
              <p className="text-xs text-gray-600 pl-4 mt-1">Empty space in front for parking/garden</p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-indigo-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <span className="font-semibold text-gray-900">Back Space:</span>
              </div>
              <p className="text-sm text-gray-700 pl-4">Minimum <strong>10 feet</strong> from back</p>
              <p className="text-xs text-gray-600 pl-4 mt-1">Empty space at the back</p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-indigo-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <span className="font-semibold text-gray-900">Side Spaces:</span>
              </div>
              <p className="text-sm text-gray-700 pl-4">Minimum <strong>5 feet</strong> on each side</p>
              <p className="text-xs text-gray-600 pl-4 mt-1">Empty space on left & right</p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-indigo-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <span className="font-semibold text-gray-900">Building Height:</span>
              </div>
              <p className="text-sm text-gray-700 pl-4">Maximum <strong>12 feet per floor</strong></p>
              <p className="text-xs text-gray-600 pl-4 mt-1">Plus 3 feet for roof/parapet</p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-indigo-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <span className="font-semibold text-gray-900">Ground Coverage:</span>
              </div>
              <p className="text-sm text-gray-700 pl-4">Maximum <strong>60%</strong> of plot</p>
              <p className="text-xs text-gray-600 pl-4 mt-1">40% must remain open/green</p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-indigo-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <span className="font-semibold text-gray-900">Purpose:</span>
              </div>
              <p className="text-sm text-gray-700 pl-4">Safety & ventilation</p>
              <p className="text-xs text-gray-600 pl-4 mt-1">Sunlight, air, fire safety</p>
            </div>
          </div>
        </div>

        {/* Overall Compliance Status */}
        <div className={`border-2 rounded-lg p-4 ${allCompliant ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'}`}>
          <div className="flex items-center gap-3 mb-3">
            {allCompliant ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-green-900">✓ All Requirements Met</h3>
              </>
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <h3 className="font-semibold text-amber-900">⚠ Compliance Issues Detected</h3>
              </>
            )}
          </div>
          <p className="text-sm">
            {allCompliant
              ? 'Your construction plan follows all LDA building rules.'
              : 'Please adjust the values below to meet LDA requirements.'}
          </p>
        </div>

        {/* Front Setback */}
        <div>
          <label className="block mb-2">
            <span className="font-semibold">Front Space (from road)</span> <span className="text-red-600">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-2">How much empty space to leave in front (minimum 10 feet)</p>
          <input
            type="number"
            value={formData.frontSetback}
            onChange={(e) => handleChange('frontSetback', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
              complianceStatus.frontSetback ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}
            step="0.1"
            placeholder="10"
          />
          <p className={`text-sm mt-1 font-medium ${complianceStatus.frontSetback ? 'text-green-600' : 'text-red-600'}`}>
            {complianceStatus.frontSetback 
              ? '✓ Meets LDA requirement (minimum 10 feet)' 
              : '✗ Must be at least 10 feet - Increase the value'}
          </p>
        </div>

        {/* Rear Setback */}
        <div>
          <label className="block mb-2">
            <span className="font-semibold">Back Space (from back boundary)</span> <span className="text-red-600">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-2">How much empty space to leave at the back (minimum 10 feet)</p>
          <input
            type="number"
            value={formData.rearSetback}
            onChange={(e) => handleChange('rearSetback', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
              complianceStatus.rearSetback ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}
            step="0.1"
            placeholder="10"
          />
          <p className={`text-sm mt-1 font-medium ${complianceStatus.rearSetback ? 'text-green-600' : 'text-red-600'}`}>
            {complianceStatus.rearSetback 
              ? '✓ Meets LDA requirement (minimum 10 feet)' 
              : '✗ Must be at least 10 feet - Increase the value'}
          </p>
        </div>

        {/* Side Setbacks */}
        <div>
          <label className="block mb-2">
            <span className="font-semibold">Side Spaces (on each side)</span> <span className="text-red-600">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-2">How much empty space on left and right sides (minimum 5 feet each)</p>
          <input
            type="number"
            value={formData.sideSetbacks}
            onChange={(e) => handleChange('sideSetbacks', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
              complianceStatus.sideSetbacks ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}
            step="0.1"
            placeholder="5"
          />
          <p className={`text-sm mt-1 font-medium ${complianceStatus.sideSetbacks ? 'text-green-600' : 'text-red-600'}`}>
            {complianceStatus.sideSetbacks 
              ? '✓ Meets LDA requirement (minimum 5 feet per side)' 
              : '✗ Must be at least 5 feet per side - Increase the value'}
          </p>
        </div>

        {/* Maximum Height */}
        <div>
          <label className="block mb-2">
            <span className="font-semibold">Maximum Building Height</span> <span className="text-red-600">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-2">
            Total height of your building in feet (maximum {parseInt(projectData.plotDetails.numberOfFloors) * 12 + 3} feet for {projectData.plotDetails.numberOfFloors} floor{parseInt(projectData.plotDetails.numberOfFloors) > 1 ? 's' : ''})
          </p>
          <input
            type="number"
            value={formData.maxHeight}
            onChange={(e) => handleChange('maxHeight', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
              complianceStatus.height ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}
            step="0.1"
            placeholder={(parseInt(projectData.plotDetails.numberOfFloors) * 12).toString()}
          />
          <p className={`text-sm mt-1 font-medium ${complianceStatus.height ? 'text-green-600' : 'text-red-600'}`}>
            {complianceStatus.height 
              ? `✓ Meets LDA requirement (max ${parseInt(projectData.plotDetails.numberOfFloors) * 12 + 3} feet for ${projectData.plotDetails.numberOfFloors} floor${parseInt(projectData.plotDetails.numberOfFloors) > 1 ? 's' : ''})` 
              : `✗ Too high - Maximum allowed is ${parseInt(projectData.plotDetails.numberOfFloors) * 12 + 3} feet`}
          </p>
        </div>

        {/* Ground Coverage Ratio */}
        <div>
          <label className="block mb-2">
            <span className="font-semibold">Ground Coverage Percentage</span> <span className="text-red-600">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-2">What percentage of ground will be covered by building (maximum 60%)</p>
          <input
            type="number"
            value={formData.coverageRatio}
            onChange={(e) => handleChange('coverageRatio', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
              complianceStatus.coverage ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}
            step="0.1"
            max="100"
            placeholder="55"
          />
          <p className={`text-sm mt-1 font-medium ${complianceStatus.coverage ? 'text-green-600' : 'text-red-600'}`}>
            {complianceStatus.coverage 
              ? '✓ Meets LDA requirement (maximum 60%)' 
              : '✗ Must not exceed 60% - Reduce the value'}
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-900">
                <strong>Why these rules?</strong> LDA bylaws ensure proper sunlight, fresh air, and safety for all residents. 
                These spaces also help during emergencies like fires and provide better living conditions.
                The system will automatically create a floor plan that follows these rules.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
        >
          Continue to Review & Results
        </button>
      </form>
    </div>
  );
}
