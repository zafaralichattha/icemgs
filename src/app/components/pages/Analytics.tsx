import { useEffect, useState } from 'react';
import { BarChart3, DollarSign, FolderOpen, TrendingUp, Menu, Building2 } from 'lucide-react';
import { projectService } from '../../services/api.service';

interface AnalyticsProps {
  onMenuClick: () => void;
}

export default function Analytics({ onMenuClick }: AnalyticsProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalEstimatedCost: 0,
    avgCostPerSqFt: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const allProjects = await projectService.getAll();
      setProjects(allProjects);

      const completed = allProjects.filter((p: any) => p.status === 'completed' || (p.total_cost && parseFloat(p.total_cost) > 0));
      
      let totalCost = 0;
      let totalArea = 0;
      
      allProjects.forEach((project: any) => {
        const area = parseFloat(project.total_built_area || project.plot_area || 0);
        const cost = parseFloat(project.total_cost || 0);
        if (cost > 0) {
          totalCost += cost;
          totalArea += area;
        }
      });

      setStats({
        totalProjects: allProjects.length,
        completedProjects: completed.length,
        totalEstimatedCost: Math.round(totalCost),
        avgCostPerSqFt: totalArea > 0 ? Math.round(totalCost / totalArea) : 0
      });
    } catch (err) {
      console.error('Failed to load analytics', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="w-full max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-lg mr-2"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="text-xl">ICEMGS - Analytics</span>
          </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl mb-2">Analytics Dashboard</h1>
          <p className="text-base sm:text-xl text-gray-600">
            Overview of your construction projects and costs
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
            <FolderOpen className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl mb-1">{stats.totalProjects}</p>
            <p className="opacity-90">Total Projects</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
            <BarChart3 className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl mb-1">{stats.completedProjects}</p>
            <p className="opacity-90">Completed</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
            <DollarSign className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-2xl mb-1">Rs. {(stats.totalEstimatedCost / 1000000).toFixed(2)}M</p>
            <p className="opacity-90">Total Estimated</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
            <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-3xl mb-1">Rs. {stats.avgCostPerSqFt}</p>
            <p className="opacity-90">Avg Cost/Sq Ft</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl mb-6">Project History</h2>
          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl">No projects yet</p>
              <p className="text-gray-400">Start your first project to see analytics</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const floors = project.num_floors || 1;
                const estimatedCost = parseFloat(project.total_cost || 0);
                const isComplete = estimatedCost > 0 || project.status === 'completed';
                const progress = isComplete ? 100 : 45; // Simulated progress for drafts

                return (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg">{project.name || project.location || 'Untitled Project'}</h3>
                        <p className="text-sm text-gray-600">
                          {project.plot_marlas ? `${project.plot_marlas} Marlas` : `${project.plot_area} sq ft`} • {floors} floor(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg text-blue-600">
                          Rs. {estimatedCost > 0 ? estimatedCost.toLocaleString() : 'Pending'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(project.updated_at || project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{Math.round(progress)}% complete</p>
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