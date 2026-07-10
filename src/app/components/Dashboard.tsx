import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { projectService } from '../services/api.service';
import { Building2, Plus, FolderOpen, Trash2, Eye, Menu } from 'lucide-react';

interface SavedProject {
  id: string;
  savedAt: string;
  plotDetails: {
    plotLength: string;
    plotWidth: string;
    location: string;
  };
  completedSteps: number[];
  constructionType?: string;
}

interface DashboardProps {
  onMenuClick: () => void;
}

export default function Dashboard({ onMenuClick }: DashboardProps) {
  const { user } = useAuth();
  const { resetProject, loadProject, getAllProjects } = useProject();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const backendProjects = await getAllProjects();
      const mappedProjects: SavedProject[] = backendProjects.map(bp => {
        // A project is complete if it was submitted through all steps.
        // lda_compliant is set when the user completes step 5 (Compliance) and submits,
        // total_cost > 0 is set when backend calculates costs,
        // status 'completed'/'in_progress' is set explicitly.
        const hasCost = bp.total_cost && parseFloat(bp.total_cost) > 0;
        const isSubmitted = bp.status === 'completed' || bp.status === 'in_progress';
        const hasCompliance = bp.lda_compliant === true;
        const isComplete = hasCost || isSubmitted || hasCompliance;
        
        return {
          id: bp.id,
          savedAt: bp.updated_at || bp.created_at || new Date().toISOString(),
          plotDetails: {
            plotLength: bp.plot_marlas || 'N/A',
            plotWidth: 'Marlas',
            location: bp.name || bp.location || 'Untitled Project',
          },
          completedSteps: isComplete ? [1,2,3,4,5,6,7] : [1,2,3],
          constructionType: bp.construction_type_display || (bp.construction_type === 'full' ? 'Full Construction' : 'Gray Structure')
        };
      });
        
      setProjects(mappedProjects.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewProject = () => {
    resetProject();
    navigate('/project/new');
  };

  const handleContinueProject = async (id: string) => {
    await loadProject(id);
    navigate('/project/new');
  };

  const handleViewResults = (id: string) => {
    navigate(`/project/${id}/results`);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await projectService.delete(id);
      loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-lg mr-2"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="text-xl">ICEMGS - Dashboard</span>
          </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-2xl sm:text-4xl mb-4">Dashboard</h1>
          <p className="text-base sm:text-xl text-gray-600">
            Start a new construction estimation project or continue with your saved projects.
          </p>
        </div>

        {/* New Project Button */}
        <div className="mb-12">
          <button
            onClick={handleNewProject}
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-6 h-6" />
            Start New Project
          </button>
        </div>

        {/* Saved Projects */}
        <div>
          <h2 className="text-2xl mb-6">Your Projects</h2>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-2">No projects yet</p>
              <p className="text-gray-500">Start your first construction estimation project</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg mb-1">
                        {project.plotDetails.location}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {project.plotDetails.plotLength} {project.plotDetails.plotWidth}
                      </p>
                    </div>
                    {project.constructionType && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {project.constructionType}
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="text-gray-900">
                        {Math.round((project.completedSteps.length / 7) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(project.completedSteps.length / 7) * 100}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">
                    Last saved: {new Date(project.savedAt).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleContinueProject(project.id)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Continue
                    </button>
                    {project.completedSteps.length === 7 && (
                      <button
                        onClick={() => handleViewResults(project.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        title="View Results"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      title="Delete Project"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}