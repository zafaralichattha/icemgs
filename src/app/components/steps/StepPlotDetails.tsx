import { useState, useEffect } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { MapPin, Home } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

interface StepPlotDetailsProps {
  onNext: () => void;
}

export default function StepPlotDetails({ onNext }: StepPlotDetailsProps) {
  const { projectData, updateProjectData, markStepComplete } = useProject();
  const [formData, setFormData] = useState({
    ...projectData.plotDetails,
    plotLength: (projectData.plotDetails as any).plotLength || '',
    plotWidth: (projectData.plotDetails as any).plotWidth || '',
  });
  const [inputType, setInputType] = useState<'dimensions' | 'marlas'>(
    ((projectData.plotDetails as any).plotLength && (projectData.plotDetails as any).plotWidth) ? 'dimensions' : 'marlas'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-calculate plot area and marlas when length, width, or marla size changes in 'dimensions' mode
  useEffect(() => {
    if (inputType === 'dimensions' && formData.plotLength && formData.plotWidth && formData.marlaSize) {
      const length = parseFloat(formData.plotLength);
      const width = parseFloat(formData.plotWidth);
      const marlaSize = parseFloat(formData.marlaSize);
      if (!isNaN(length) && !isNaN(width) && !isNaN(marlaSize) && marlaSize > 0) {
        const area = length * width;
        const marlas = (area / marlaSize).toFixed(2);
        setFormData(prev => ({
          ...prev,
          plotArea: area.toFixed(2),
          plotMarlas: marlas
        }));
      }
    }
  }, [formData.plotLength, formData.plotWidth, formData.marlaSize, inputType]);

  // Auto-calculate plot area when marlas or marla size changes in 'marlas' mode
  useEffect(() => {
    if (inputType === 'marlas' && formData.plotMarlas && formData.marlaSize) {
      const marlas = parseFloat(formData.plotMarlas);
      const marlaSize = parseFloat(formData.marlaSize);
      if (!isNaN(marlas) && !isNaN(marlaSize)) {
        const area = (marlas * marlaSize).toFixed(2);
        setFormData(prev => ({ ...prev, plotArea: area }));
      }
    }
  }, [formData.plotMarlas, formData.marlaSize, inputType]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (inputType === 'dimensions') {
      if (!formData.plotLength || parseFloat(formData.plotLength) <= 0) {
        newErrors.plotLength = 'Plot length is required and must be positive';
      }
      if (!formData.plotWidth || parseFloat(formData.plotWidth) <= 0) {
        newErrors.plotWidth = 'Plot width is required and must be positive';
      }
    } else {
      if (!formData.plotMarlas || parseFloat(formData.plotMarlas) <= 0) {
        newErrors.plotMarlas = 'Plot size in marlas is required and must be positive';
      }
    }

    if (!formData.marlaSize) {
      newErrors.marlaSize = 'Marla size must be selected';
    }
    if (!formData.numberOfFloors || parseInt(formData.numberOfFloors) < 1) {
      newErrors.numberOfFloors = 'Number of floors must be at least 1';
    }
    if (!formData.location || formData.location.trim() === '') {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      updateProjectData('plotDetails', formData);
      markStepComplete(1);
      onNext();
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getLdaMaxFloors = (marlas: string): number => {
    const num = parseFloat(marlas);
    if (isNaN(num) || num <= 0) return 7;
    if (num < 10) return 3; // < 10 Marlas -> 3 Floors (~38ft)
    if (num < 20) return 4; // 10 to < 20 Marlas -> 4 Floors (~48ft)
    return 7; // >= 20 Marlas -> up to 7 Floors (~90ft)
  };

  const maxFloorsAllowed = getLdaMaxFloors(formData.plotMarlas);

  // Auto-adjust if selected floors exceed new limit
  useEffect(() => {
    const currentSelected = parseInt(formData.numberOfFloors);
    if (!isNaN(currentSelected) && currentSelected > maxFloorsAllowed) {
      setFormData(prev => ({ ...prev, numberOfFloors: maxFloorsAllowed.toString() }));
    }
  }, [maxFloorsAllowed]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl mb-2">Plot Details</h2>
        <p className="text-gray-600">
          Enter your plot size in marlas and basic information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Type Selector */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6 border-b pb-4">
          <button
            type="button"
            onClick={() => setInputType('dimensions')}
            className={`w-full sm:flex-1 py-2.5 text-center rounded-lg font-semibold transition-colors ${
              inputType === 'dimensions'
                ? 'bg-indigo-600 text-white shadow-sm'
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
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Use Marlas
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {inputType === 'dimensions' ? (
            <>
              <div>
                <label className="block mb-2">
                  Plot Length (feet) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={formData.plotLength}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) >= 0) {
                      handleChange('plotLength', val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                  min="0"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
                    errors.plotLength ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 25"
                  step="0.01"
                />
                {errors.plotLength && <p className="text-red-600 text-sm mt-1">{errors.plotLength}</p>}
              </div>

              <div>
                <label className="block mb-2">
                  Plot Width (feet) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={formData.plotWidth}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) >= 0) {
                      handleChange('plotWidth', val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                  min="0"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
                    errors.plotWidth ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 45"
                  step="0.01"
                />
                {errors.plotWidth && <p className="text-red-600 text-sm mt-1">{errors.plotWidth}</p>}
              </div>
            </>
          ) : (
            <div>
              <label className="block mb-2">
                Plot Size (Marlas) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.plotMarlas}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) >= 0) {
                      handleChange('plotMarlas', val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                  min="0"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
                    errors.plotMarlas ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 5, 10, 20"
                  step="0.01"
                />
              </div>
              {errors.plotMarlas && <p className="text-red-600 text-sm mt-1">{errors.plotMarlas}</p>}
            </div>
          )}

          <div>
            <Label className="block mb-2">
              Marla Size (sq ft) <span className="text-red-600">*</span>
            </Label>
            <Select
              value={formData.marlaSize}
              onValueChange={(value) => handleChange('marlaSize', value)}
            >
              <SelectTrigger className={`w-full ${
                errors.marlaSize ? 'border-red-500' : ''
              }`}>
                <SelectValue placeholder="Select marla size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="225">225 sq ft - Standard in some areas</SelectItem>
                <SelectItem value="250">250 sq ft - Common</SelectItem>
                <SelectItem value="272">272.25 sq ft - Standard Lahore</SelectItem>
                <SelectItem value="275">275 sq ft - Alternative</SelectItem>
              </SelectContent>
            </Select>
            {errors.marlaSize && <p className="text-red-600 text-sm mt-1">{errors.marlaSize}</p>}
            <p className="text-sm text-gray-500 mt-1">
              Standard marla size in Lahore is 272.25 sq ft
            </p>
          </div>
        </div>

        <div>
          <label className="block mb-2">Total Plot Area (sq ft)</label>
          <input
            type="text"
            value={formData.plotArea}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg"
            placeholder="Automatically calculated"
          />
          <p className="text-sm text-gray-500 mt-1">
            {inputType === 'dimensions' ? (
              <>
                Calculated as: {formData.plotLength || '0'} ft × {formData.plotWidth || '0'} ft = {formData.plotArea || '0'} sq ft ({formData.plotMarlas || '0'} Marlas)
              </>
            ) : (
              <>
                Calculated as: {formData.plotMarlas || '0'} marlas × {formData.marlaSize || '272'} sq ft = {formData.plotArea || '0'} sq ft
              </>
            )}
          </p>
        </div>

        {formData.plotMarlas && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-900">
              <strong>LDA Rule Applied:</strong> For {formData.plotMarlas} Marlas, the maximum allowed height is {maxFloorsAllowed === 3 ? '~38ft (3 floors)' : maxFloorsAllowed === 4 ? '~48ft (4 floors)' : '~90ft (7 floors)'}. Your floor options are restricted accordingly.
            </p>
          </div>
        )}

        <div>
          <Label className="block mb-2">
            Number of Floors <span className="text-red-600">*</span>
          </Label>
          <Select
            value={formData.numberOfFloors}
            onValueChange={(value) => handleChange('numberOfFloors', value)}
          >
            <SelectTrigger className={`w-full ${
              errors.numberOfFloors ? 'border-red-500' : ''
            }`}>
              <SelectValue placeholder="Select number of floors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Floor - Ground Only</SelectItem>
              {maxFloorsAllowed >= 2 && <SelectItem value="2">2 Floors - Ground + 1st</SelectItem>}
              {maxFloorsAllowed >= 3 && <SelectItem value="3">3 Floors - Ground + 1st + 2nd</SelectItem>}
              {maxFloorsAllowed >= 4 && <SelectItem value="4">4 Floors - Ground + 3 Upper Floors</SelectItem>}
              {maxFloorsAllowed >= 5 && <SelectItem value="5">5 Floors</SelectItem>}
              {maxFloorsAllowed >= 6 && <SelectItem value="6">6 Floors</SelectItem>}
              {maxFloorsAllowed >= 7 && <SelectItem value="7">7 Floors</SelectItem>}
            </SelectContent>
          </Select>
          {errors.numberOfFloors && <p className="text-red-600 text-sm mt-1">{errors.numberOfFloors}</p>}
          <p className="text-sm text-gray-500 mt-1">
            You will configure rooms for each floor in the next step
          </p>
        </div>

        <div>
          <label className="block mb-2">
            Location <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., DHA Phase 5, Lahore"
            />
          </div>
          {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-900">
            <strong>Note:</strong> The marla is a traditional unit of area used in Pakistan and India. 
            The standard marla in Lahore is 272.25 sq ft (equivalent to 9 sq yards or 25.29 sq meters).
          </p>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Save & Continue to Room Details
        </button>
      </form>
    </div>
  );
}