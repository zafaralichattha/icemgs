import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
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
  const { projectData, saveProject } = useProject();
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
      // Guest user — show alert and redirect to login
      alert('Please login or register to save your project and generate the full estimation report. Your project data will be preserved.');
      navigate('/login');
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
      console.error("Failed to save project", error);
      alert("Failed to save project. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
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
              className="px-6 py-2 text-gray-600 hover:text-gray-900"
            >
              Save & Exit
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
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
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-900 font-medium">You are using ICEMGS as a guest</p>
              <p className="text-sm text-amber-800 mt-1">
                You can fill out the entire project form, but you'll need to <Link to="/login" className="text-blue-600 underline font-semibold">login</Link> or <Link to="/register" className="text-blue-600 underline font-semibold">register</Link> to save your project and generate the full estimation report.
              </p>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          {/* Mobile view */}
          <div className="md:hidden bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Step {safeCurrentStep} of 6</p>
              <h3 className="text-base font-bold text-gray-800">{steps[safeCurrentStep - 1]?.name}</h3>
            </div>
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      safeCurrentStep >= step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
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
                    className={`h-1 w-12 mx-2 ${
                      safeCurrentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8 mb-6">
          {safeCurrentStep === 6 ? (
            <StepReview onSubmit={handleSubmit} />
          ) : (
            <CurrentStepComponent onNext={handleNext} />
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
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