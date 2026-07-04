import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Users, DollarSign, Package, TrendingUp, Edit2, Save, Menu, Lock, Unlock } from 'lucide-react';
import { UserPlus, X, Trash2 } from 'lucide-react';
import { userService, projectService, materialService } from '../services/api.service';

interface MaterialPrice {
  id: string;
  name: string;
  rate: number | string;
  unit: string;
  category?: string;
  quality?: string;
  updated_at?: string;
  is_price_locked: boolean;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'contractor' | 'student' | 'homeowner';
}

interface AdminDashboardState {
  newUser: UserData;
  showAddUser: boolean;
}

interface AdminDashboardProps {
  onMenuClick: () => void;
}

export default function AdminDashboard({ onMenuClick }: AdminDashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'materials' | 'projects'>('overview');
  const [materialPrices, setMaterialPrices] = useState<MaterialPrice[]>([]);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState<UserData | null>(null);
  const [adminDashboardState, setAdminDashboardState] = useState<AdminDashboardState>({
    newUser: { id: '', name: '', email: '', password: '', role: 'homeowner' },
    showAddUser: false
  });
  const [isSyncing, setIsSyncing] = useState(false);


  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Load materials from Django Database
      const dbMaterials = await materialService.getAll();
      
      // Transform backend `Material` interface to match local state if needed
      // `rate` comes as string decimal, we can keep it as string or parse
      const mappedMaterials: MaterialPrice[] = dbMaterials.map(m => ({
        id: m.id,
        name: m.name,
        rate: parseFloat(m.rate),
        unit: m.unit,
        category: m.category,
        quality: m.quality,
        updated_at: m.updated_at,
        is_price_locked: m.is_price_locked || false
      }));
      setMaterialPrices(mappedMaterials);
    } catch (err) {
      console.error("Failed to load materials from DB", err);
    }

    // Load users
    try {
      const dbUsers = await userService.getAll();
      const mappedUsers: UserData[] = dbUsers.map((u: any) => ({
        id: u.id.toString(),
        name: u.last_name ? `${u.first_name} ${u.last_name}`.trim() : (u.first_name || ''),
        email: u.email || '',
        password: '',
        role: u.role || 'homeowner'
      }));
      setUsers(mappedUsers);
    } catch (err) {
      console.error("Failed to load users from DB", err);
    }

    // Load projects
    try {
      const dbProjects = await projectService.getAll();
      setProjects(dbProjects);
    } catch (err) {
      console.error("Failed to load projects from DB", err);
    }
  };

  const handleUpdatePrice = async (id: string, newRate: number) => {
    try {
      await materialService.update(id, { rate: newRate.toString() });
      const updated = materialPrices.map(m => 
        m.id === id ? { ...m, rate: newRate, updated_at: new Date().toISOString() } : m
      );
      setMaterialPrices(updated);
      setEditingMaterial(null);
    } catch (error) {
      alert("Failed to update rate. Make sure you are an admin.");
      console.error(error);
    }
  };

  const handleSyncPrices = async () => {
    if (confirm("This will overwrite all rates with the latest data from external trusted sources. Are you sure?")) {
      setIsSyncing(true);
      try {
        const result = await materialService.syncMarketPrices();
        await loadData();
        
        let message = `Successfully synced ${result.updated_count} market prices from trusted sources!`;
        if (result.locked_count && result.locked_count > 0) {
          message += `\n\n🔒 ${result.locked_count} locked material(s) were skipped and kept their current prices.`;
        }
        if (result.failed_items && result.failed_items.length > 0) {
          message += `\n\nHowever, the following items could not be found on the external website:\n- ${result.failed_items.join('\n- ')}\n\nPlease notify the developer to update the scraping logic for these specific items.`;
        }
        alert(message);
      } catch (error) {
        alert("Failed to sync prices. Check server logs.");
        console.error(error);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser(user.id);
    setEditUserData({ ...user });
  };

  const handleSaveUser = async () => {
    if (!editUserData) return;
    
    try {
      const nameParts = editUserData.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await userService.update(editUserData.id, {
        first_name: firstName,
        last_name: lastName,
        role: editUserData.role,
        is_active: true
      } as any);
      
      await loadData();
      setEditingUser(null);
      setEditUserData(null);
    } catch (err) {
      alert('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === '1' || userId === user?.id?.toString()) {
      alert('Cannot delete the system administrator or your own account!');
      return;
    }
    
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userService.delete(userId);
        
        // Let backend handle cascading deletes for projects
        await loadData();
      } catch (err) {
        alert('Failed to delete user.');
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await projectService.delete(projectId);
        await loadData();
      } catch (err) {
        alert('Failed to delete project.');
      }
    }
  };

  const handleAddUser = async () => {
    if (!adminDashboardState.newUser.name || !adminDashboardState.newUser.email || !adminDashboardState.newUser.password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const nameParts = adminDashboardState.newUser.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await userService.create({
        email: adminDashboardState.newUser.email,
        first_name: firstName,
        last_name: lastName,
        role: adminDashboardState.newUser.role as any,
        password: adminDashboardState.newUser.password
      } as any);

      setAdminDashboardState({ 
        newUser: { id: '', name: '', email: '', password: '', role: 'homeowner' },
        showAddUser: false 
      });
      
      await loadData();
      alert('User added successfully');
    } catch (err: any) {
      alert(err.response?.data?.email?.[0] || 'Failed to add user. Email might already exist.');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditUserData(null);
  };

  const handleToggleLock = async (materialId: string, currentlyLocked: boolean) => {
    try {
      await materialService.togglePriceLock(materialId, !currentlyLocked);
      setMaterialPrices(prev =>
        prev.map(m =>
          m.id === materialId ? { ...m, is_price_locked: !currentlyLocked } : m
        )
      );
    } catch (error) {
      alert('Failed to toggle price lock. Make sure you are an admin.');
      console.error(error);
    }
  };


  const stats = {
    totalUsers: users.length,
    totalProjects: projects.length,
    completedProjects: projects.filter((p: any) => p.status === 'completed').length,
    activeUsers: users.filter(u => u.role !== 'admin').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="w-full max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-purple-700 rounded-lg mr-2"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <Building2 className="w-8 h-8" />
            <span className="text-xl">ICEMGS Admin Panel</span>
          </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-8 flex overflow-x-auto gap-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-w-[100px] whitespace-nowrap flex-shrink-0 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors ${
              activeTab === 'overview' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 min-w-[100px] whitespace-nowrap flex-shrink-0 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors ${
              activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex-1 min-w-[120px] whitespace-nowrap flex-shrink-0 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors ${
              activeTab === 'materials' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Material Prices
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 min-w-[100px] whitespace-nowrap flex-shrink-0 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors ${
              activeTab === 'projects' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Projects
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h1 className="text-3xl mb-8">Admin Dashboard</h1>
            
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
                <Users className="w-10 h-10 mb-3 opacity-80" />
                <p className="text-3xl mb-1">{stats.totalUsers}</p>
                <p className="opacity-90">Total Users</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
                <Building2 className="w-10 h-10 mb-3 opacity-80" />
                <p className="text-3xl mb-1">{stats.totalProjects}</p>
                <p className="opacity-90">Total Projects</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
                <Package className="w-10 h-10 mb-3 opacity-80" />
                <p className="text-3xl mb-1">{stats.completedProjects}</p>
                <p className="opacity-90">Completed Projects</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
                <TrendingUp className="w-10 h-10 mb-3 opacity-80" />
                <p className="text-3xl mb-1">{stats.activeUsers}</p>
                <p className="opacity-90">Active Users</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {projects.slice(0, 5).map((project: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{project.name || project.location || 'Untitled Project'}</p>
                      <p className="text-sm text-gray-600">
                        {project.plot_area} sq ft • {project.owner_email || 'N/A'}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl">User Management</h2>
              <button
                onClick={() => setAdminDashboardState({ ...adminDashboardState, showAddUser: true })}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <UserPlus className="w-5 h-5" />
                Add New User
              </button>
            </div>

            {/* Add User Modal */}
            {adminDashboardState.showAddUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl">Add New User</h3>
                    <button onClick={() => setAdminDashboardState({ ...adminDashboardState, showAddUser: false })}>
                      <X className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 text-sm">Full Name</label>
                      <input
                        type="text"
                        value={adminDashboardState.newUser.name}
                        onChange={(e) => setAdminDashboardState({ ...adminDashboardState, newUser: { ...adminDashboardState.newUser, name: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm">Email</label>
                      <input
                        type="email"
                        value={adminDashboardState.newUser.email}
                        onChange={(e) => setAdminDashboardState({ ...adminDashboardState, newUser: { ...adminDashboardState.newUser, email: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm">Password</label>
                      <input
                        type="password"
                        value={adminDashboardState.newUser.password}
                        onChange={(e) => setAdminDashboardState({ ...adminDashboardState, newUser: { ...adminDashboardState.newUser, password: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Minimum 6 characters"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm">Role</label>
                      <select
                        value={adminDashboardState.newUser.role}
                        onChange={(e) => setAdminDashboardState({ ...adminDashboardState, newUser: { ...adminDashboardState.newUser, role: e.target.value as 'admin' | 'contractor' | 'student' | 'homeowner' } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="homeowner">Homeowner</option>
                        <option value="contractor">Contractor</option>
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleAddUser}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Add User
                      </button>
                      <button
                        onClick={() => setAdminDashboardState({ ...adminDashboardState, showAddUser: false })}
                        className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit User Modal */}
            {editingUser && editUserData && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl">Edit User</h3>
                    <button onClick={handleCancelEdit}>
                      <X className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 text-sm">Full Name</label>
                      <input
                        type="text"
                        value={editUserData.name}
                        onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm">Email</label>
                      <input
                        type="email"
                        value={editUserData.email}
                        onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm">Password</label>
                      <input
                        type="password"
                        value={editUserData.password}
                        onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter new password or leave unchanged"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm">Role</label>
                      <select
                        value={editUserData.role}
                        onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value as 'admin' | 'contractor' | 'student' | 'homeowner' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        disabled={editUserData.id === 'admin-001'}
                      >
                        <option value="homeowner">Homeowner</option>
                        <option value="contractor">Contractor</option>
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                      </select>
                      {editUserData.id === 'admin-001' && (
                        <p className="text-xs text-gray-500 mt-1">System admin role cannot be changed</p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleSaveUser}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((userData) => (
                    <tr key={userData.id}>
                      <td className="px-4 py-3">{userData.name}</td>
                      <td className="px-4 py-3">{userData.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          userData.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          userData.role === 'contractor' ? 'bg-blue-100 text-blue-800' :
                          userData.role === 'student' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {userData.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{userData.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(userData)}
                            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {userData.id !== 'admin-001' && (
                            <button
                              onClick={() => handleDeleteUser(userData.id)}
                              className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Material Prices Tab */}
        {activeTab === 'materials' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl">Material Price Management</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSyncPrices}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <TrendingUp className="w-5 h-5" />
                  {isSyncing ? "Syncing..." : "Sync from Trusted Source"}
                </button>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>All prices in PKR</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Material</th>
                    <th className="px-4 py-3 text-left">Current Rate</th>
                    <th className="px-4 py-3 text-left">Unit</th>
                    <th className="px-4 py-3 text-left">Last Updated</th>
                    <th className="px-4 py-3 text-center">Locked</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {materialPrices.map((material) => (
                    <tr key={material.id} className={material.is_price_locked ? 'bg-yellow-50' : ''}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {material.is_price_locked && <Lock className="w-4 h-4 text-yellow-600" />}
                          {material.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingMaterial === material.id ? (
                          <input
                            type="number"
                            defaultValue={material.rate}
                            className="w-32 px-3 py-1 border border-gray-300 rounded"
                            id={`rate-${material.id}`}
                          />
                        ) : (
                          `Rs. ${material.rate.toLocaleString()}`
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{material.unit}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {material.updated_at ? new Date(material.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleLock(material.id, material.is_price_locked)}
                          className={`p-2 rounded transition-colors ${
                            material.is_price_locked
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          title={material.is_price_locked ? 'Unlock price (allow API sync)' : 'Lock price (prevent API sync)'}
                        >
                          {material.is_price_locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {editingMaterial === material.id ? (
                          <button
                            onClick={() => {
                              const input = document.getElementById(`rate-${material.id}`) as HTMLInputElement;
                              handleUpdatePrice(material.id, parseFloat(input.value));
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingMaterial(material.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

         {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl mb-6">All Projects</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any) => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4 relative">
                  <div className="flex justify-between items-start mb-2 pr-8">
                    <h3 className="text-lg font-medium">{project.name || project.location || 'Untitled'}</h3>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors absolute top-4 right-4"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p>Plot: {project.plot_marlas || project.plot_area} {project.plot_unit || 'marla'}</p>
                    <p>Floors: {project.num_floors}</p>
                    <p>Type: {project.construction_type_display || project.construction_type}</p>
                    <p>Owner: {project.owner_email || 'N/A'}</p>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{project.status_display || project.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Created: {project.created_at ? new Date(project.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}