import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { Building2, Check, Info, Menu } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState(projectData.currentStep || 1);
  const navigate = useNavigate();

  // Sync current step with project data
  useEffect(() => {
    if (projectData.currentStep && projectData.currentStep !== currentStep) {
      setCurrentStep(projectData.currentStep);
    }
  }, [projectData.currentStep]);

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
    }
  };

  const handleSubmit = async () => {
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
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
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
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
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
            Remember to save your progress using the "Save & Exit" button before leaving. You can continue later from where you left off.
          </p>
        </div>
      </div>
    </div>
  );
}