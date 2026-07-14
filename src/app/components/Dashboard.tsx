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
    <div className="min-h-screen bg-[#f0f4ff] page-enter">
      {/* Header */}
      <header className="glass-card border-b border-white/20 sticky top-0 z-10">
        <div className="w-full max-w-7xl mx-auto px-4 py-4">
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
            <span className="text-gray-400 mx-2">—</span>
            <span className="text-gray-600 font-medium">Dashboard</span>
          </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-2xl sm:text-4xl mb-4 font-bold text-gray-900">
            Welcome back{user?.first_name ? `, ${user.first_name}` : ''} 👋
          </h1>
          <p className="text-base sm:text-xl text-gray-600">
            Start a new construction estimation project or continue with your saved projects.
          </p>
        </div>

        {/* New Project Button */}
        <div className="mb-12">
          <button
            onClick={handleNewProject}
            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:shadow-xl hover:shadow-indigo-200 transition-all duration-300 hover:-translate-y-1 font-semibold"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            Start New Project
          </button>
        </div>

        {/* Saved Projects */}
        <div>
          <h2 className="text-2xl mb-6 font-bold text-gray-900">Your Projects</h2>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-10 h-10 text-indigo-400" />
              </div>
              <p className="text-xl text-gray-700 mb-2 font-semibold">No projects yet</p>
              <p className="text-gray-500">Start your first construction estimation project</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const progress = Math.round((project.completedSteps.length / 7) * 100);
                return (
                  <div key={project.id} className="glass-card rounded-2xl p-6 card-hover group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg mb-1 font-bold text-gray-900">
                          {project.plotDetails.location}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {project.plotDetails.plotLength} {project.plotDetails.plotWidth}
                        </p>
                      </div>
                      {project.constructionType && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border border-indigo-200/50">
                          {project.constructionType}
                        </span>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500 font-medium">Progress</span>
                        <span className="text-indigo-600 font-bold">{progress}%</span>
                      </div>
                      <div className="w-full bg-indigo-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="progress-gradient h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 mb-4">
                      Last saved: {new Date(project.savedAt).toLocaleDateString()}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleContinueProject(project.id)}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300 font-medium text-sm"
                      >
                        Continue
                      </button>
                      {project.completedSteps.length === 7 && (
                        <button
                          onClick={() => handleViewResults(project.id)}
                          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200 transition-all duration-300"
                          title="View Results"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-200 hover:border-transparent"
                        title="Delete Project"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}