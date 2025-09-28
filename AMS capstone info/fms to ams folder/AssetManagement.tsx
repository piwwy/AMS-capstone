import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building, Calendar, DollarSign, TrendingDown } from 'lucide-react';

interface User {
  id: number;
  username: string;
  role: string;
  department: string;
}

interface Asset {
  id: number;
  asset_name: string;
  asset_category: string;
  serial_number: string;
  purchase_date: string;
  purchase_cost: number;
  current_value: number;
  depreciation_method: string;
  useful_life: number;
  location: string;
  status: string;
  created_by_name: string;
  created_at: string;
}

interface AssetManagementProps {
  user: User;
}

const AssetManagement: React.FC<AssetManagementProps> = ({ user }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    asset_name: '',
    asset_category: 'equipment',
    serial_number: '',
    purchase_date: '',
    purchase_cost: '',
    depreciation_method: 'straight_line',
    useful_life: '5',
    location: '',
    status: 'active'
  });

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = () => {
    // Simulated data - replace with actual API call
    setAssets([
      {
        id: 1,
        asset_name: 'Dell Computer Workstation',
        asset_category: 'equipment',
        serial_number: 'DL-2024-001',
        purchase_date: '2024-01-15',
        purchase_cost: 45000.00,
        current_value: 36000.00,
        depreciation_method: 'straight_line',
        useful_life: 5,
        location: 'Finance Office',
        status: 'active',
        created_by_name: 'admin',
        created_at: '2024-01-15'
      },
      {
        id: 2,
        asset_name: 'Classroom Projector',
        asset_category: 'equipment',
        serial_number: 'PJ-2023-015',
        purchase_date: '2023-08-20',
        purchase_cost: 25000.00,
        current_value: 18750.00,
        depreciation_method: 'straight_line',
        useful_life: 4,
        location: 'Room 101',
        status: 'active',
        created_by_name: 'admin',
        created_at: '2023-08-20'
      }
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAsset) {
      // Update existing asset
      setAssets(assets.map(asset => 
        asset.id === editingAsset.id 
          ? { 
              ...asset, 
              ...formData,
              purchase_cost: parseFloat(formData.purchase_cost),
              useful_life: parseInt(formData.useful_life),
              current_value: parseFloat(formData.purchase_cost) // Initial current value
            }
          : asset
      ));
    } else {
      // Create new asset
      const newAsset: Asset = {
        id: Date.now(),
        ...formData,
        purchase_cost: parseFloat(formData.purchase_cost),
        useful_life: parseInt(formData.useful_life),
        current_value: parseFloat(formData.purchase_cost), // Initial current value
        created_by_name: user.username,
        created_at: new Date().toISOString()
      };
      setAssets([...assets, newAsset]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      asset_name: '',
      asset_category: 'equipment',
      serial_number: '',
      purchase_date: '',
      purchase_cost: '',
      depreciation_method: 'straight_line',
      useful_life: '5',
      location: '',
      status: 'active'
    });
    setEditingAsset(null);
    setShowModal(false);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      asset_name: asset.asset_name,
      asset_category: asset.asset_category,
      serial_number: asset.serial_number,
      purchase_date: asset.purchase_date,
      purchase_cost: asset.purchase_cost.toString(),
      depreciation_method: asset.depreciation_method,
      useful_life: asset.useful_life.toString(),
      location: asset.location,
      status: asset.status
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      setAssets(assets.filter(asset => asset.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'disposed': return 'bg-red-100 text-red-800';
      case 'retired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDepreciation = (asset: Asset) => {
    const yearsOwned = (new Date().getTime() - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365);
    const annualDepreciation = asset.purchase_cost / asset.useful_life;
    const totalDepreciation = Math.min(annualDepreciation * yearsOwned, asset.purchase_cost);
    return totalDepreciation;
  };

  const totalAssets = assets.length;
  const totalValue = assets.reduce((sum, asset) => sum + asset.current_value, 0);
  const totalDepreciation = assets.reduce((sum, asset) => sum + calculateDepreciation(asset), 0);
  const activeAssets = assets.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset & Depreciation Management</h1>
          <p className="text-gray-600">Track capital assets from acquisition → depreciation → disposal</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </button>
      </div>

      {/* Module Overview */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Module Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Purpose</h3>
            <p className="text-sm text-gray-600">Track capital assets from acquisition → depreciation → disposal</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Key Processes</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Asset register maintenance</li>
              <li>• Depreciation schedules</li>
              <li>• Impairment & disposal entries</li>
              <li>• Maintenance cost tracking</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Integrations</h3>
            <p className="text-sm text-gray-600">Posts depreciation to GL; links to Procurement for acquisitions</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900">{totalAssets}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Value</p>
              <p className="text-2xl font-bold text-gray-900">₱{totalValue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Depreciation</p>
              <p className="text-2xl font-bold text-gray-900">₱{totalDepreciation.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Assets</p>
              <p className="text-2xl font-bold text-gray-900">{activeAssets}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Building className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Asset Register</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{asset.asset_name}</p>
                      <p className="text-sm text-gray-500">S/N: {asset.serial_number}</p>
                      <p className="text-xs text-gray-400">Purchased: {asset.purchase_date}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-gray-900 capitalize">{asset.asset_category}</p>
                      <p className="text-xs text-gray-500">{asset.useful_life} years life</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">₱{asset.purchase_cost.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">₱{asset.current_value.toLocaleString()}</p>
                      <p className="text-xs text-red-500">
                        -₱{calculateDepreciation(asset).toLocaleString()} depreciated
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{asset.location}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(asset.status)}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(asset)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Asset Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingAsset ? 'Edit Asset' : 'Add New Asset'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={formData.asset_name}
                  onChange={(e) => setFormData({...formData, asset_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.asset_category}
                  onChange={(e) => setFormData({...formData, asset_category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="equipment">Equipment</option>
                  <option value="furniture">Furniture</option>
                  <option value="building">Building</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="technology">Technology</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({...formData, purchase_cost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Depreciation Method
                  </label>
                  <select
                    value={formData.depreciation_method}
                    onChange={(e) => setFormData({...formData, depreciation_method: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="straight_line">Straight Line</option>
                    <option value="declining_balance">Declining Balance</option>
                    <option value="units_of_production">Units of Production</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Useful Life (Years)
                  </label>
                  <input
                    type="number"
                    value={formData.useful_life}
                    onChange={(e) => setFormData({...formData, useful_life: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="disposed">Disposed</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingAsset ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManagement;