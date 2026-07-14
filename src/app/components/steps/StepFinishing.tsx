import { useState, useEffect } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { Paintbrush, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

interface StepFinishingProps {
  onNext: () => void;
}

export default function StepFinishing({ onNext }: StepFinishingProps) {
  const { projectData, updateProjectData, markStepComplete } = useProject();
  const [formData, setFormData] = useState(projectData.finishing);
  const [skipFinishing, setSkipFinishing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user selected gray-only construction
  useEffect(() => {
    if (projectData.constructionType === 'gray-only') {
      setSkipFinishing(true);
    }
  }, [projectData.constructionType]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.flooringType) newErrors.flooringType = 'Please select flooring type';
    if (!formData.paintQuality) newErrors.paintQuality = 'Please select paint quality';
    if (!formData.tilesQuality) newErrors.tilesQuality = 'Please select tiles quality';
    if (!formData.doorType) newErrors.doorType = 'Please select door type';
    if (!formData.windowType) newErrors.windowType = 'Please select window type';
    if (!formData.electricalFittings) newErrors.electricalFittings = 'Please select electrical fittings';
    if (!formData.plumbingQuality) newErrors.plumbingQuality = 'Please select plumbing quality';
    if (!formData.sanitaryQuality) newErrors.sanitaryQuality = 'Please select sanitary quality';
    if (!formData.kitchenCabinets) newErrors.kitchenCabinets = 'Please select kitchen cabinets';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!skipFinishing && !validateForm()) {
      return;
    }
    
    if (!skipFinishing) {
      updateProjectData('finishing', formData);
    }
    
    markStepComplete(4);
    onNext();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // If gray-only, skip this step
  if (skipFinishing) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl mb-2">Finishing Materials</h2>
          <p className="text-gray-600">
            Finishing materials are not included in basic structure
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-indigo-900 mb-2">Basic Structure Only</p>
              <p className="text-sm text-indigo-900">
                You've chosen to estimate basic structure only. This step is skipped. 
                Your estimate includes only foundation, walls, pillars, roof, and plaster.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Continue to Compliance Check
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl mb-2">Finishing Materials</h2>
        <p className="text-gray-600">
          Select tiles, paint, doors, windows, and fittings for your house
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Flooring Type */}
        <div>
          <Label className="block mb-3">
            Floor Tiles Type <span className="text-red-600">*</span>
          </Label>
          <p className="text-sm text-gray-600 mb-3">What type of tiles for floors</p>
          <Select
            value={formData.flooringType}
            onValueChange={(value) => handleChange('flooringType', value)}
          >
            <SelectTrigger className={`w-full ${
              errors.flooringType ? 'border-red-500' : ''
            }`}>
              <SelectValue placeholder="Select floor tiles type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tiles">Regular Tiles - Standard quality, most affordable</SelectItem>
              <SelectItem value="porcelain">Porcelain Tiles - Good quality, long-lasting</SelectItem>
              <SelectItem value="marble">Marble - Premium, elegant look</SelectItem>
            </SelectContent>
          </Select>
          {errors.flooringType && <p className="text-red-600 text-sm mt-1">{errors.flooringType}</p>}
        </div>

        {/* Paint Quality */}
        <div>
          <Label className="block mb-3">
            Wall Paint Quality <span className="text-red-600">*</span>
          </Label>
          <p className="text-sm text-gray-600 mb-3">Quality of paint for walls</p>
          <Select
            value={formData.paintQuality}
            onValueChange={(value) => handleChange('paintQuality', value)}
          >
            <SelectTrigger className={`w-full ${
              errors.paintQuality ? 'border-red-500' : ''
            }`}>
              <SelectValue placeholder="Select paint quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emulsion">Basic Paint (Emulsion) - Standard quality, affordable</SelectItem>
              <SelectItem value="plastic">Good Paint (Plastic) - Washable, long-lasting</SelectItem>
              <SelectItem value="imported">Premium Paint - High quality, best finish</SelectItem>
            </SelectContent>
          </Select>
          {errors.paintQuality && <p className="text-red-600 text-sm mt-1">{errors.paintQuality}</p>}
        </div>

        {/* Tiles Quality */}
        <div>
          <Label className="block mb-3">
            Bathroom/Kitchen Tiles <span className="text-red-600">*</span>
          </Label>
          <p className="text-sm text-gray-600 mb-3">Tiles for walls in bathroom and kitchen</p>
          <Select
            value={formData.tilesQuality}
            onValueChange={(value) => handleChange('tilesQuality', value)}
          >
            <SelectTrigger className={`w-full ${
              errors.tilesQuality ? 'border-red-500' : ''
            }`}>
              <SelectValue placeholder="Select tiles quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard Tiles - Basic quality, affordable</SelectItem>
              <SelectItem value="premium">Good Quality Tiles - Better finish and durability</SelectItem>
              <SelectItem value="imported">Premium Tiles - Best quality, elegant designs</SelectItem>
            </SelectContent>
          </Select>
          {errors.tilesQuality && <p className="text-red-600 text-sm mt-1">{errors.tilesQuality}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Door Type */}
          <div>
            <Label className="block mb-3">
              Doors Type <span className="text-red-600">*</span>
            </Label>
            <p className="text-sm text-gray-600 mb-3">Material for doors</p>
            <Select
              value={formData.doorType}
              onValueChange={(value) => handleChange('doorType', value)}
            >
              <SelectTrigger className={`w-full ${
                errors.doorType ? 'border-red-500' : ''
              }`}>
                <SelectValue placeholder="Select door type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flush">Flush Doors - Basic, affordable</SelectItem>
                <SelectItem value="wooden">Solid Wood Doors - Good quality, durable</SelectItem>
                <SelectItem value="fiber">Fiber Doors - Modern, low maintenance</SelectItem>
              </SelectContent>
            </Select>
            {errors.doorType && <p className="text-red-600 text-sm mt-1">{errors.doorType}</p>}
          </div>

          {/* Window Type */}
          <div>
            <Label className="block mb-3">
              Windows Type <span className="text-red-600">*</span>
            </Label>
            <p className="text-sm text-gray-600 mb-3">Material for windows</p>
            <Select
              value={formData.windowType}
              onValueChange={(value) => handleChange('windowType', value)}
            >
              <SelectTrigger className={`w-full ${
                errors.windowType ? 'border-red-500' : ''
              }`}>
                <SelectValue placeholder="Select window type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aluminum">Aluminum Windows - Standard, affordable</SelectItem>
                <SelectItem value="upvc">UPVC Windows - Modern, energy efficient</SelectItem>
                <SelectItem value="wooden">Wooden Windows - Traditional look</SelectItem>
              </SelectContent>
            </Select>
            {errors.windowType && <p className="text-red-600 text-sm mt-1">{errors.windowType}</p>}
          </div>
        </div>

        {/* Electrical Fittings */}
        <div>
          <Label className="block mb-3">
            Electrical Items (Switches/Sockets) <span className="text-red-600">*</span>
          </Label>
          <p className="text-sm text-gray-600 mb-3">Quality of switches, sockets, and wiring</p>
          <Select
            value={formData.electricalFittings}
            onValueChange={(value) => handleChange('electricalFittings', value)}
          >
            <SelectTrigger className={`w-full ${
              errors.electricalFittings ? 'border-red-500' : ''
            }`}>
              <SelectValue placeholder="Select electrical fittings quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard Quality - Basic, reliable</SelectItem>
              <SelectItem value="premium">Good Quality - Better finish, durable</SelectItem>
              <SelectItem value="luxury">Premium Quality - Best brands, modern designs</SelectItem>
            </SelectContent>
          </Select>
          {errors.electricalFittings && <p className="text-red-600 text-sm mt-1">{errors.electricalFittings}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Plumbing Quality */}
          <div>
            <Label className="block mb-3">
              Plumbing (Pipes) Quality <span className="text-red-600">*</span>
            </Label>
            <p className="text-sm text-gray-600 mb-3">Water supply pipes quality</p>
            <Select
              value={formData.plumbingQuality}
              onValueChange={(value) => handleChange('plumbingQuality', value)}
            >
              <SelectTrigger className={`w-full ${
                errors.plumbingQuality ? 'border-red-500' : ''
              }`}>
                <SelectValue placeholder="Select plumbing quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Pipes - Basic quality</SelectItem>
                <SelectItem value="premium">Good Quality Pipes - Better, long-lasting</SelectItem>
              </SelectContent>
            </Select>
            {errors.plumbingQuality && <p className="text-red-600 text-sm mt-1">{errors.plumbingQuality}</p>}
          </div>

          {/* Sanitary Quality */}
          <div>
            <Label className="block mb-3">
              Bathroom Fittings <span className="text-red-600">*</span>
            </Label>
            <p className="text-sm text-gray-600 mb-3">Toilet, basin, taps quality</p>
            <Select
              value={formData.sanitaryQuality}
              onValueChange={(value) => handleChange('sanitaryQuality', value)}
            >
              <SelectTrigger className={`w-full ${
                errors.sanitaryQuality ? 'border-red-500' : ''
              }`}>
                <SelectValue placeholder="Select bathroom fittings quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Quality - Basic, affordable</SelectItem>
                <SelectItem value="premium">Good Quality - Better brands</SelectItem>
                <SelectItem value="luxury">Premium Quality - Best brands, modern</SelectItem>
              </SelectContent>
            </Select>
            {errors.sanitaryQuality && <p className="text-red-600 text-sm mt-1">{errors.sanitaryQuality}</p>}
          </div>
        </div>

        {/* Kitchen Cabinets */}
        <div>
          <Label className="block mb-3">
            Kitchen Cabinets <span className="text-red-600">*</span>
          </Label>
          <p className="text-sm text-gray-600 mb-3">Kitchen storage cabinets</p>
          <Select
            value={formData.kitchenCabinets}
            onValueChange={(value) => handleChange('kitchenCabinets', value)}
          >
            <SelectTrigger className={`w-full ${
              errors.kitchenCabinets ? 'border-red-500' : ''
            }`}>
              <SelectValue placeholder="Select kitchen cabinets type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic Cabinets - Simple design, affordable</SelectItem>
              <SelectItem value="modular">Modular Cabinets - Better quality, organized</SelectItem>
              <SelectItem value="premium">Premium Cabinets - High-end, best finish</SelectItem>
            </SelectContent>
          </Select>
          {errors.kitchenCabinets && <p className="text-red-600 text-sm mt-1">{errors.kitchenCabinets}</p>}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Paintbrush className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-900 mb-2">
                <strong>Finishing includes:</strong>
              </p>
              <ul className="text-sm text-amber-900 space-y-1 list-disc list-inside">
                <li>Floor tiles installation</li>
                <li>Wall paint (2 coats)</li>
                <li>Bathroom & kitchen tiles</li>
                <li>All doors and windows</li>
                <li>Electrical switches & sockets</li>
                <li>Water pipes & fittings</li>
                <li>Bathroom fixtures (toilet, basin, taps)</li>
                <li>Kitchen cabinets</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Continue to Compliance Check
        </button>
      </form>
    </div>
  );
}