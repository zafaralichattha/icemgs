import { useState } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, MapPin, Home, Hammer, Paintbrush, Shield, Loader2, LogIn } from 'lucide-react';

interface StepReviewProps {
  onSubmit: () => Promise<void> | void;
}

export default function StepReview({ onSubmit }: StepReviewProps) {
  const { projectData } = useProject();
  const { isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit();
    } catch (error: any) {
      console.error('Submit error:', error);
      const msg = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || 'Failed to save project. Please check your data and try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl mb-2">Review & Submit</h2>
        <p className="text-gray-600">
          Please review all information before generating your estimation and floor plan
        </p>
      </div>

      <div className="space-y-6">
        {/* Plot Details */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg">Plot Details</h3>
            <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Plot Dimensions:</span>
              <p>{projectData.plotDetails.plotArea} sq ft ({projectData.plotDetails.plotMarlas} Marlas)</p>
            </div>
            <div>
              <span className="text-gray-600">Total Area:</span>
              <p>{projectData.plotDetails.plotArea} sq ft</p>
            </div>
            <div>
              <span className="text-gray-600">Number of Floors:</span>
              <p>{projectData.plotDetails.numberOfFloors}</p>
            </div>
            <div>
              <span className="text-gray-600">Location:</span>
              <p>{projectData.plotDetails.location}</p>
            </div>
          </div>
        </div>

        {/* Room Details */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg">Room Configuration</h3>
            <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Floors:</span>
              <p>{projectData.plotDetails.numberOfFloors}</p>
            </div>
            <div>
              <span className="text-gray-600">Total Rooms:</span>
              <p>{projectData.roomDetails.floors.reduce((sum, f) => sum + f.rooms.length, 0)}</p>
            </div>
            <div>
              <span className="text-gray-600">Floors Configured:</span>
              <p>{projectData.roomDetails.floors.length}</p>
            </div>
            <div>
              <span className="text-gray-600">Ground Floor Rooms:</span>
              <p>{projectData.roomDetails.floors[0]?.rooms.length ?? 0}</p>
            </div>
            <div>
              <span className="text-gray-600">Bedrooms:</span>
              <p>{projectData.roomDetails.floors.reduce((sum, f) => sum + f.rooms.filter(r => r.type === 'bedroom').length, 0)}</p>
            </div>
            <div>
              <span className="text-gray-600">Bathrooms:</span>
              <p>{projectData.roomDetails.floors.reduce((sum, f) => sum + f.rooms.filter(r => r.type === 'bathroom').length, 0)}</p>
            </div>
          </div>
        </div>

        {/* Gray Structure */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Hammer className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg">Gray Structure Materials</h3>
            <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Foundation:</span>
              <p className="capitalize">{projectData.grayStructure.foundationType.replace('-', ' ')}</p>
            </div>
            <div>
              <span className="text-gray-600">Wall Material:</span>
              <p className="capitalize">{projectData.grayStructure.wallMaterial}</p>
            </div>
            <div>
              <span className="text-gray-600">Roof Type:</span>
              <p className="capitalize">{projectData.grayStructure.roofType.replace('-', ' ')}</p>
            </div>
            <div>
              <span className="text-gray-600">Steel Grade:</span>
              <p className="capitalize">{projectData.grayStructure.steelGrade.replace('-', ' ')}</p>
            </div>
            <div>
              <span className="text-gray-600">Cement Type:</span>
              <p className="uppercase">{projectData.grayStructure.cementType.replace('-', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Finishing */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Paintbrush className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg">Finishing Materials</h3>
            <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Flooring:</span>
              <p className="capitalize">{projectData.finishing.flooringType}</p>
            </div>
            <div>
              <span className="text-gray-600">Paint Quality:</span>
              <p className="capitalize">{projectData.finishing.paintQuality}</p>
            </div>
            <div>
              <span className="text-gray-600">Tiles Quality:</span>
              <p className="capitalize">{projectData.finishing.tilesQuality}</p>
            </div>
            <div>
              <span className="text-gray-600">Doors:</span>
              <p className="capitalize">{projectData.finishing.doorType}</p>
            </div>
            <div>
              <span className="text-gray-600">Windows:</span>
              <p className="capitalize">{projectData.finishing.windowType}</p>
            </div>
            <div>
              <span className="text-gray-600">Electrical:</span>
              <p className="capitalize">{projectData.finishing.electricalFittings}</p>
            </div>
            <div>
              <span className="text-gray-600">Plumbing:</span>
              <p className="capitalize">{projectData.finishing.plumbingQuality}</p>
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg">LDA Compliance</h3>
            <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Front Setback:</span>
              <p>{projectData.compliance.frontSetback} feet</p>
            </div>
            <div>
              <span className="text-gray-600">Rear Setback:</span>
              <p>{projectData.compliance.rearSetback} feet</p>
            </div>
            <div>
              <span className="text-gray-600">Side Setbacks:</span>
              <p>{projectData.compliance.sideSetbacks} feet (each)</p>
            </div>
            <div>
              <span className="text-gray-600">Max Height:</span>
              <p>{projectData.compliance.maxHeight} feet</p>
            </div>
            <div>
              <span className="text-gray-600">Coverage Ratio:</span>
              <p>{projectData.compliance.coverageRatio}%</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-green-900 text-lg">Ready to Generate</h3>
          </div>
          <p className="text-sm text-green-900 mb-4">
            All information has been collected. Click the button below to generate your 
            construction cost estimation and 2D floor plan.
          </p>
          <ul className="text-sm text-green-900 space-y-2">
            <li>✓ Detailed Bill of Materials (BOM)</li>
            <li>✓ Gray Structure Cost Breakdown</li>
            <li>✓ Finishing Cost Breakdown</li>
            <li>✓ 2D Floor Plan (LDA Compliant)</li>
            <li>✓ Future Cost Predictions</li>
            <li>✓ Downloadable PDF Reports</li>
          </ul>
        </div>

        {submitError && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p className="text-red-800 text-sm font-medium">❌ Error: {submitError}</p>
            <p className="text-red-600 text-xs mt-1">Please check your data and try again.</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isSubmitting}
          className={`w-full py-4 text-white rounded-lg text-lg flex items-center justify-center gap-2 ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving Project...
            </>
          ) : isAuthenticated ? (
            'Generate Estimation & Floor Plan'
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Login to Generate Estimation
            </>
          )}
        </button>
      </div>
    </div>
  );
}
