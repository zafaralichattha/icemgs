import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { guestEstimateService } from '../services/api.service';
import { Building2, Check, Info, Menu, LogIn } from 'lucide-react';
import StepPlotDetails from './steps/StepPlotDetails';
import StepRoomDetails from './steps/StepRoomDetails';
import StepGrayStructure from './steps/StepGrayStructure';
import StepFinishing from './steps/StepFinishing';
import StepCompliance from './steps/StepCompliance';
import StepReview from './steps/StepReview';

interface ProjectFormProps {
  onMenuClick: () => void;
}

export default function ProjectForm({ onMenuClick }: ProjectFormProps) {
  const { projectData, saveProject, setGuestResults } = useProject();
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(projectData.currentStep || 1);
  const navigate = useNavigate();

  // Sync current step with project data
  useEffect(() => {
    if (projectData.currentStep && projectData.currentStep !== currentStep) {
      setCurrentStep(projectData.currentStep);
    }
  }, [projectData.currentStep]);

  // Scroll to top of window when step changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  const steps = [
    { id: 1, name: 'Plot Details', component: StepPlotDetails },
    { id: 2, name: 'Room Details', component: StepRoomDetails },
    { id: 3, name: 'Gray Structure', component: StepGrayStructure },
    { id: 4, name: 'Finishing', component: StepFinishing },
    { id: 5, name: 'Compliance', component: StepCompliance },
    { id: 6, name: 'Review & Submit', component: StepReview },
  ];

  // Ensure currentStep is within valid range
  const safeCurrentStep = Math.max(1, Math.min(currentStep, 6));
  const CurrentStepComponent = (steps[safeCurrentStep - 1]?.component || StepPlotDetails) as React.ComponentType<{ onNext: () => void }>;

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      // Guest user — call guest estimate API (no data saved to DB)
      try {
        const apiData = {
          name: `Guest Estimate - ${projectData.plotDetails.location || 'Untitled'}`,
          construction_type: projectData.constructionType === 'complete' ? 'full' : 'gray',
          plot_area: parseFloat(projectData.plotDetails.plotArea) || 0,
          plot_unit: 'marla',
          location: projectData.plotDetails.location || '',
          plot_marlas: projectData.plotDetails.plotMarlas ? parseFloat(projectData.plotDetails.plotMarlas) : null,
          marla_size: projectData.plotDetails.marlaSize ? parseInt(projectData.plotDetails.marlaSize) : null,
          num_floors: parseInt(projectData.plotDetails.numberOfFloors) || 1,
          gray_structure_details: {
            foundation_type: projectData.grayStructure.foundationType,
            wall_material: projectData.grayStructure.wallMaterial,
            wall_thickness: projectData.grayStructure.wallThickness,
            roof_type: projectData.grayStructure.roofType,
            steel_grade: projectData.grayStructure.steelGrade,
            cement_type: projectData.grayStructure.cementType,
            brick_type: projectData.grayStructure.brickType,
            plaster_type: projectData.grayStructure.plasterType,
            spiral_stairs: projectData.grayStructure.spiralStairs || false,
          },
          finishing_details: {
            floor_tiles: projectData.finishing.flooringType,
            paint: projectData.finishing.paintQuality,
            wall_tiles: projectData.finishing.tilesQuality,
            doors: projectData.finishing.doorType,
            windows: projectData.finishing.windowType,
            electrical: projectData.finishing.electricalFittings,
            plumbing: projectData.finishing.plumbingQuality,
            sanitary: projectData.finishing.sanitaryQuality,
            cabinets: projectData.finishing.kitchenCabinets,
          },
          lda_compliant: true,
          front_setback: projectData.compliance.frontSetback,
          rear_setback: projectData.compliance.rearSetback,
          side_setbacks: projectData.compliance.sideSetbacks,
          max_height: projectData.compliance.maxHeight,
          coverage_ratio: projectData.compliance.coverageRatio,
          floors: projectData.roomDetails.floors.map((f: any) => ({
            floor_number: f.floorNumber - 1,
            floor_type: f.floorNumber === 1 ? 'ground' : f.floorNumber === 2 ? 'first' : f.floorNumber === 3 ? 'second' : f.floorNumber === 4 ? 'third' : 'ground',
            total_area: 0,
            rooms: f.rooms.map((r: any) => {
              let mappedType = r.type;
              if (r.type === 'drawing') mappedType = 'drawing_room';
              else if (r.type === 'dining') mappedType = 'dining_room';
              else if (r.type === 'store') mappedType = 'store_room';
              else if (r.type === 'lounge') mappedType = 'living_room';
              return { room_type: mappedType, size: r.size, custom_name: r.type, has_parapet_walls: r.hasParapetWalls || false };
            }),
          })),
        };
        const result = await guestEstimateService.estimate(apiData);
        setGuestResults(result);
        navigate('/project/guest/results');
      } catch (error) {
        console.error('Failed to generate guest estimate', error);
        alert('Failed to generate estimate. Please try again.');
      }
      return;
    }

    try {
      // Save the project and mark as completed
      const projectId = await saveProject();
      // Navigate to results page
      if (projectId) {
        navigate(`/project/${projectId}/results`);
      }
    } catch (error) {
      console.error('Failed to save project', error);
      alert('Failed to save project. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4ff] page-enter">
      <header className="glass-card border-b border-white/20 sticky top-0 z-10">
        <div className="w-full max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-indigo-50 rounded-xl mr-2 transition-colors"
            >
              <Menu className="w-6 h-6 text-indigo-600" />
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">ICEMGS</span>
          </div>
          {isAuthenticated ? (
            <button
              onClick={async () => {
                try {
                  await saveProject();
                  navigate('/dashboard');
                } catch (error) {
                  console.error("Failed to save project", error);
                  alert("Failed to save project. Please try again.");
                }
              }}
              className="px-6 py-2 text-indigo-600 hover:text-indigo-800 font-medium hover:bg-indigo-50 rounded-xl transition-all"
            >
              Save & Exit
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-200 text-sm transition-all duration-300 font-medium"
            >
              <LogIn className="w-4 h-4" />
              Login to Save
            </Link>
          )}
        </div>
      </header>

      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        {/* Guest notice */}
        {!isAuthenticated && (
          <div className="mb-6 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-900 font-medium">You are using ICEMGS as a guest</p>
              <p className="text-sm text-amber-800 mt-1">
                You can fill out the entire project form, but you'll need to <Link to="/login" className="text-indigo-600 underline font-semibold">login</Link> or <Link to="/register" className="text-indigo-600 underline font-semibold">register</Link> to save your project and generate the full estimation report.
              </p>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          {/* Mobile view */}
          <div className="md:hidden glass-card p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">Step {safeCurrentStep} of 6</p>
              <h3 className="text-base font-bold text-gray-800">{steps[safeCurrentStep - 1]?.name}</h3>
            </div>
            <div className="w-24 bg-indigo-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="progress-gradient h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(safeCurrentStep / 6) * 100}%` }}
              />
            </div>
          </div>

          {/* Desktop view */}
          <div className="hidden md:flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      safeCurrentStep >= step.id
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200'
                        : 'bg-indigo-100 text-indigo-400'
                    }`}
                  >
                    {projectData.completedSteps.includes(step.id) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className="text-xs mt-2 text-center max-w-[80px]">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 w-12 mx-2 rounded-full transition-all duration-300 ${
                      safeCurrentStep > step.id ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-indigo-100'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step */}
        <div className="glass-card rounded-2xl p-4 sm:p-8 mb-6">
          {safeCurrentStep === 6 ? (
            <StepReview onSubmit={handleSubmit} />
          ) : (
            <CurrentStepComponent onNext={handleNext} />
          )}
        </div>

        {/* Info Box */}
        <div className="bg-indigo-50/80 backdrop-blur-sm border border-indigo-200/50 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-900">
            {isAuthenticated
              ? 'Remember to save your progress using the "Save & Exit" button before leaving. You can continue later from where you left off.'
              : 'Login or register to save your project progress and access your estimation reports anytime.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}