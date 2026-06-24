import { useState } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { Hammer, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

interface StepGrayStructureProps {
  onNext: () => void;
}

export default function StepGrayStructure({ onNext }: StepGrayStructureProps) {
  const { projectData, updateProjectData, markStepComplete } = useProject();
  const [formData, setFormData] = useState(projectData.grayStructure);
  const [constructionType, setConstructionType] = useState(projectData.constructionType || 'complete');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.foundationType) newErrors.foundationType = 'Please select foundation type';
    if (!formData.wallMaterial) newErrors.wallMaterial = 'Please select wall material';
    if (!formData.brickType) newErrors.brickType = 'Please select brick type';
    if (!formData.roofType) newErrors.roofType = 'Please select roof type';
    if (!formData.steelGrade) newErrors.steelGrade = 'Please select steel quality';
    if (!formData.cementType) newErrors.cementType = 'Please select cement type';
    if (!formData.plasterType) newErrors.plasterType = 'Please select plaster type';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      updateProjectData('grayStructure', formData);
      updateProjectData('constructionType', constructionType);
      markStepComplete(3);
      
      // If gray-only, skip finishing step
      if (constructionType === 'gray-only') {
        markStepComplete(4); // Also mark finishing as complete
      }
      
      onNext();
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl mb-2">Gray Structure (Basic Construction)</h2>
        <p className="text-gray-600">
          Select materials for foundation, walls, and roof
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Construction Type Selection */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <label className="block mb-3">
            <span className="font-semibold text-blue-900">What do you want to build?</span>
            <span className="text-red-600"> *</span>
          </label>
          <div className="space-y-3">
            <label className={`flex items-start gap-3 p-3 bg-white rounded-lg border-2 cursor-pointer hover:border-blue-500 transition-colors ${
              constructionType === 'gray-only' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
            }`}>
              <input
                type="radio"
                name="constructionType"
                value="gray-only"
                checked={constructionType === 'gray-only'}
                onChange={(e) => setConstructionType(e.target.value as 'gray-only' | 'complete')}
                className="mt-1"
              />
              <div>
                <div className="font-semibold text-gray-900">Basic Structure Only</div>
                <div className="text-sm text-gray-600">
                  Just walls, roof, and basic plaster (no tiles, paint, or fittings)
                </div>
              </div>
            </label>
            
            <label className={`flex items-start gap-3 p-3 bg-white rounded-lg border-2 cursor-pointer hover:border-blue-500 transition-colors ${
              constructionType === 'complete' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
            }`}>
              <input
                type="radio"
                name="constructionType"
                value="complete"
                checked={constructionType === 'complete'}
                onChange={(e) => setConstructionType(e.target.value as 'gray-only' | 'complete')}
                className="mt-1"
              />
              <div>
                <div className="font-semibold text-gray-900">Complete House</div>
                <div className="text-sm text-gray-600">
                  Finished house with tiles, paint, doors, windows, and all fittings
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Foundation Type */}
        <div>
          <Label className="block mb-3">
            Foundation (Base) Type <span className="text-red-600">*</span>
          </Label>
          <p className="text-sm text-gray-600 mb-3">The base that holds your entire building</p>
          <Select
            value={formData.foundationType}
            onValueChange={(value) => handleChange('foundationType', value)}
          >
            <SelectTrigger className={`w-full ${
              errors.foundationType ? 'border-red-500' : ''
            }`}>
              <SelectValue placeholder="Select foundation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rcc">Concrete Foundation - Most common, Best for normal soil</SelectItem>
              <SelectItem value="strip">Strip Foundation - Good for strong soil conditions</SelectItem>
              <SelectItem value="raft">Raft Foundation - For weak or soft soil</SelectItem>
            </SelectContent>
          </Select>
          {errors.foundationType && <p className="text-red-600 text-sm mt-1">{errors.foundationType}</p>}
        </div>

        {/* Wall Material */}
        <div>
          <Label className="block mb-3">
            Wall Material <span className="text-red-600">*</span>
          </Label>
          <p className="text-sm text-gray-600 mb-3">What your walls will be made of</p>
          <Select
            value={formData.wallMaterial}
            onValueChange={(value) => handleChange('wallMaterial', value)}
          >
            <SelectTrigger className={`w-full ${
              errors.wallMaterial ? 'border-red-500' : ''
            }`}>
              <SelectValue placeholder="Select wall material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brick">Red Clay Bricks - Traditional & most commonly used</SelectItem>
              <SelectItem value="block">Concrete Blocks - Quick to build, good strength</SelectItem>
              <SelectItem value="aac">Lightweight Blocks (AAC) - Modern, lightweight, insulated</SelectItem>
            </SelectContent>
          </Select>
          {errors.wallMaterial && <p className="text-red-600 text-sm mt-1">{errors.wallMaterial}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Wall Thickness (Standardized) */}
          <div>
            <Label className="block mb-3">
              Wall Thickness
            </Label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-1">Standard Recommended Thickness Applied</p>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                <li><strong>9 inches</strong> for Outer Walls (Security & Weathering)</li>
                <li><strong>4.5 inches</strong> for Inner Dividers (Space Saving)</li>
              </ul>
            </div>
          </div>

          {/* Brick Type */}
          <div>
            <Label className="block mb-3">
              Brick Quality <span className="text-red-600">*</span>
            </Label>
            <p className="text-sm text-gray-600 mb-3">Type of bricks for walls</p>
            <Select
              value={formData.brickType}
              onValueChange={(value) => handleChange('brickType', value)}
            >
              <SelectTrigger className={`w-full ${
                errors.brickType ? 'border-red-500' : ''
              }`}>
                <SelectValue placeholder="Select brick quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Awwal Bricks - Premium quality (most common)</SelectItem>
                <SelectItem value="fly-ash">Fly Ash Bricks - Eco-friendly & smooth</SelectItem>
              </SelectContent>
            </Select>
            {errors.brickType && <p className="text-red-600 text-sm mt-1">{errors.brickType}</p>}
          </div>
        </div>

        {/* Roof Type */}
        <div>
          <Label className="block mb-3">
            Roof Type <span className="text-red-600">*</span>
          </Label>
          <p className="text-sm text-gray-600 mb-3">The concrete slab on top of each floor</p>
          <Select
            value={formData.roofType}
            onValueChange={(value) => handleChange('roofType', value)}
          >
            <SelectTrigger className={`w-full ${
              errors.roofType ? 'border-red-500' : ''
            }`}>
              <SelectValue placeholder="Select roof type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rcc-slab">Standard Roof (6 inch) - For single floor house</SelectItem>
              <SelectItem value="rcc-slab-thick">Strong Roof (9 inch) - For two or more floors (recommended)</SelectItem>
            </SelectContent>
          </Select>
          {errors.roofType && <p className="text-red-600 text-sm mt-1">{errors.roofType}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Steel Grade */}
          <div>
            <Label className="block mb-3">
              Steel (Sariya) Quality <span className="text-red-600">*</span>
            </Label>
            <p className="text-sm text-gray-600 mb-3">Steel bars used in pillars and roof</p>
            <Select
              value={formData.steelGrade}
              onValueChange={(value) => handleChange('steelGrade', value)}
            >
              <SelectTrigger className={`w-full ${
                errors.steelGrade ? 'border-red-500' : ''
              }`}>
                <SelectValue placeholder="Select steel quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grade-40">Standard Quality (Grade 40) - Basic strength</SelectItem>
                <SelectItem value="grade-60">Good Quality (Grade 60) - Recommended for most homes</SelectItem>
              </SelectContent>
            </Select>
            {errors.steelGrade && <p className="text-red-600 text-sm mt-1">{errors.steelGrade}</p>}
          </div>

          {/* Cement Type */}
          <div>
            <Label className="block mb-3">
              Cement Type <span className="text-red-600">*</span>
            </Label>
            <p className="text-sm text-gray-600 mb-3">Type of cement for construction</p>
            <Select
              value={formData.cementType}
              onValueChange={(value) => handleChange('cementType', value)}
            >
              <SelectTrigger className={`w-full ${
                errors.cementType ? 'border-red-500' : ''
              }`}>
                <SelectValue placeholder="Select cement type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opc-43">Regular Cement (OPC 43) - Good for general construction</SelectItem>
                <SelectItem value="opc-53">Strong Cement (OPC 53) - Better strength, sets faster</SelectItem>
              </SelectContent>
            </Select>
            {errors.cementType && <p className="text-red-600 text-sm mt-1">{errors.cementType}</p>}
          </div>
        </div>

        {/* Plaster Type */}
        <div>
          <Label className="block mb-3">
            Wall Plaster (Finish) <span className="text-red-600">*</span>
          </Label>
          <p className="text-sm text-gray-600 mb-3">Smooth coating applied on walls</p>
          <Select
            value={formData.plasterType}
            onValueChange={(value) => handleChange('plasterType', value)}
          >
            <SelectTrigger className={`w-full ${
              errors.plasterType ? 'border-red-500' : ''
            }`}>
              <SelectValue placeholder="Select plaster type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cement">Cement Plaster - Most common, durable & affordable</SelectItem>
              <SelectItem value="gypsum">Gypsum Plaster - Very smooth finish, more expensive</SelectItem>
            </SelectContent>
          </Select>
          {errors.plasterType && <p className="text-red-600 text-sm mt-1">{errors.plasterType}</p>}
        </div>

        {/* Spiral Stairs */}
        <div>
          <Label className="block mb-3">
            Spiral Stairs (Optional)
          </Label>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.spiralStairs}
                onChange={(e) => handleChange('spiralStairs', e.target.checked as any)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-medium text-gray-900">Include Spiral Stairs (e.g., for roof access)</span>
            </label>
            <p className="text-sm text-gray-600 mt-1 ml-7">
              Steel/iron spiral stairs for compact vertical access.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Hammer className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-900 mb-2">
                <strong>Gray Structure includes:</strong>
              </p>
              <ul className="text-sm text-amber-900 space-y-1 list-disc list-inside">
                <li>Digging and foundation work</li>
                <li>Pillars (columns) and beams</li>
                <li>Brick walls construction</li>
                <li>Concrete roof slabs</li>
                <li>Plaster on walls (inside & outside)</li>
                <li>Basic waterproofing</li>
              </ul>
            </div>
          </div>
        </div>

        {constructionType === 'gray-only' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> You've selected "Basic Structure Only". 
                  Your estimate will NOT include tiles, paint, doors, windows, or fittings. 
                  You can add these later or hire separately.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {constructionType === 'gray-only' 
            ? 'Continue to Compliance Check' 
            : 'Continue to Finishing Materials'}
        </button>
      </form>
    </div>
  );
}