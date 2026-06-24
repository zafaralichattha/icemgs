import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Menu, DollarSign, Edit2, Save, X, Shield } from 'lucide-react';
import { materialService } from '../services/api.service';

interface MaterialPrice {
  id: string;
  name: string;
  rate: number;
  unit: string;
  category?: string;
  quality?: 'standard' | 'good' | 'premium';
  lastUpdated: string;
}

interface MaterialRatesProps {
  onMenuClick: () => void;
}

export default function MaterialRates({ onMenuClick }: MaterialRatesProps) {
  const { user } = useAuth();
  const [materialPrices, setMaterialPrices] = useState<MaterialPrice[]>([]);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    loadMaterialPrices();
  }, []);

  const loadMaterialPrices = async () => {
    try {
      const dbMaterials = await materialService.getAll();
      const mappedMaterials: MaterialPrice[] = dbMaterials.map((m: any) => ({
        id: m.id,
        name: m.name,
        rate: parseFloat(m.rate),
        unit: m.unit,
        category: m.category_display || m.category,
        quality: m.quality,
        lastUpdated: m.updated_at || m.created_at || new Date().toISOString()
      }));
      setMaterialPrices(mappedMaterials);
    } catch (err) {
      console.error('Failed to load materials:', err);
    }
  };

  const handleEditClick = (material: MaterialPrice) => {
    setEditingMaterial(material.id);
    setEditRate(material.rate);
  };

  const handleSaveClick = async (id: string) => {
    try {
      await materialService.update(id, { rate: editRate } as any);
      const updated = materialPrices.map(m => 
        m.id === id ? { ...m, rate: editRate, lastUpdated: new Date().toISOString() } : m
      );
      setMaterialPrices(updated);
      setEditingMaterial(null);
    } catch (error) {
      alert("Failed to update rate.");
      console.error(error);
    }
  };

  const handleCancelClick = () => {
    setEditingMaterial(null);
    setEditRate(0);
  };

  const categories = ['All', 'Cement', 'Steel', 'Bricks', 'Sand', 'Gravel',
                      'Floor Tiles', 'Wall Tiles', 'Paint', 'Doors', 'Windows', 
                      'Electrical', 'Plumbing', 'Sanitary', 'Cabinets', 'Other'];

  const filteredMaterials = activeCategory === 'All' 
    ? materialPrices 
    : materialPrices.filter(m => m.category === activeCategory);

  const getQualityBadge = (quality?: string) => {
    if (!quality) return null;
    const colors = {
      standard: 'bg-blue-100 text-blue-800',
      good: 'bg-green-100 text-green-800',
      premium: 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[quality as keyof typeof colors]}`}>
        {quality.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
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
          <div className="flex items-center gap-2 sm:gap-4">
            {user?.role === 'admin' && (
              <div className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1 bg-red-100 rounded-lg" title="Admin Mode">
                <Shield className="w-4 h-4 text-red-600" />
                <span className="text-xs sm:text-sm font-medium text-red-800 hidden sm:inline">Admin Mode</span>
              </div>
            )}
            <Link to="/dashboard">
              <button className="px-2 sm:px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-900">
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl mb-2 flex items-center gap-2 sm:gap-3">
            <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
            Material Rates
          </h1>
          <p className="text-gray-600">
            {user?.role === 'admin' 
              ? 'View and update current material prices (Admin Only)' 
              : 'View current material prices used in cost estimation'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Category</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Materials Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Material Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Quality</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Rate (PKR)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Unit</th>
                  {user?.role === 'admin' && (
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMaterials.map((material, index) => (
                  <tr key={material.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{material.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{material.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getQualityBadge(material.quality)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingMaterial === material.id ? (
                        <input
                          type="number"
                          value={editRate}
                          onChange={(e) => setEditRate(parseFloat(e.target.value))}
                          className="w-32 px-3 py-2 border border-blue-500 rounded-lg text-right font-semibold"
                          autoFocus
                        />
                      ) : (
                        <span className="text-lg font-semibold text-gray-900">
                          {material.rate.toLocaleString('en-PK')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{material.unit}</span>
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {editingMaterial === material.id ? (
                            <>
                              <button
                                onClick={() => handleSaveClick(material.id)}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelClick}
                                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEditClick(material)}
                              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              title="Edit Rate"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {user?.role !== 'admin' && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Admin Access Required</h3>
                <p className="text-sm text-blue-800">
                  Only administrators can update material rates. These rates are used to calculate project costs. 
                  Contact your system administrator if you need to request rate changes.
                </p>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'admin' && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <DollarSign className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Rate Management Instructions</h3>
                <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                  <li>Click <strong>Edit</strong> button to modify any material rate</li>
                  <li>Enter the new rate in Pakistani Rupees (PKR)</li>
                  <li>Click <strong>Save</strong> to confirm or <strong>Cancel</strong> to discard changes</li>
                  <li>All new project estimates will use the updated rates immediately</li>
                  <li>Existing saved projects retain their original cost calculations</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}