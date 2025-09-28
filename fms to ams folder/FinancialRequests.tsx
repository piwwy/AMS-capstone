import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface User {
  id: number;
  username: string;
  role: string;
  department: string;
}

interface FinancialRequest {
  id: number;
  request_type: string;
  requestor_id: number;
  requestor_name: string;
  department: string;
  amount: number;
  description: string;
  justification: string;
  priority: string;
  status: string;
  approved_by_name: string;
  approved_at: string;
  created_at: string;
}

interface FinancialRequestsProps {
  user: User;
}

const FinancialRequests: React.FC<FinancialRequestsProps> = ({ user }) => {
  const [requests, setRequests] = useState<FinancialRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<FinancialRequest | null>(null);
  const [formData, setFormData] = useState({
    request_type: 'purchase',
    department: user.department,
    amount: '',
    description: '',
    justification: '',
    priority: 'medium'
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    // Simulated data - replace with actual API call
    setRequests([
      {
        id: 1,
        request_type: 'purchase',
        requestor_id: 2,
        requestor_name: 'finance_manager',
        department: 'Finance',
        amount: 5000.00,
        description: 'New computer equipment for finance department',
        justification: 'Current computers are outdated and affecting productivity',
        priority: 'high',
        status: 'pending',
        approved_by_name: '',
        approved_at: '',
        created_at: '2024-01-15'
      },
      {
        id: 2,
        request_type: 'expense',
        requestor_id: 3,
        requestor_name: 'accountant',
        department: 'Finance',
        amount: 1200.00,
        description: 'Professional development training',
        justification: 'Required for compliance with new accounting standards',
        priority: 'medium',
        status: 'approved',
        approved_by_name: 'admin',
        approved_at: '2024-01-16',
        created_at: '2024-01-14'
      },
      {
        id: 3,
        request_type: 'fund_transfer',
        requestor_id: 2,
        requestor_name: 'finance_manager',
        department: 'Finance',
        amount: 10000.00,
        description: 'Transfer funds to emergency reserve',
        justification: 'Building emergency fund as per policy requirements',
        priority: 'low',
        status: 'rejected',
        approved_by_name: 'admin',
        approved_at: '2024-01-13',
        created_at: '2024-01-12'
      }
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRequest) {
      // Update existing request
      setRequests(requests.map(request => 
        request.id === editingRequest.id 
          ? { 
              ...request, 
              ...formData,
              amount: parseFloat(formData.amount)
            }
          : request
      ));
    } else {
      // Create new request
      const newRequest: FinancialRequest = {
        id: Date.now(),
        ...formData,
        amount: parseFloat(formData.amount),
        requestor_id: user.id,
        requestor_name: user.username,
        status: 'pending',
        approved_by_name: '',
        approved_at: '',
        created_at: new Date().toISOString()
      };
      setRequests([...requests, newRequest]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      request_type: 'purchase',
      department: user.department,
      amount: '',
      description: '',
      justification: '',
      priority: 'medium'
    });
    setEditingRequest(null);
    setShowModal(false);
  };

  const handleEdit = (request: FinancialRequest) => {
    if (request.requestor_id === user.id || user.role === 'admin') {
      setEditingRequest(request);
      setFormData({
        request_type: request.request_type,
        department: request.department,
        amount: request.amount.toString(),
        description: request.description,
        justification: request.justification,
        priority: request.priority
      });
      setShowModal(true);
    }
  };

  const handleDelete = (id: number) => {
    const request = requests.find(r => r.id === id);
    if (request && (request.requestor_id === user.id || user.role === 'admin')) {
      if (confirm('Are you sure you want to delete this request?')) {
        setRequests(requests.filter(request => request.id !== id));
      }
    }
  };

  const handleApproval = (id: number, status: 'approved' | 'rejected') => {
    if (user.role === 'admin' || user.role === 'finance_manager') {
      setRequests(requests.map(request => 
        request.id === id 
          ? { 
              ...request, 
              status: status,
              approved_by_name: user.username,
              approved_at: new Date().toISOString()
            }
          : request
      ));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const totalAmount = requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Requests</h1>
          <p className="text-gray-600">Submit and manage financial requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{totalRequests}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingRequests}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{approvedRequests}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Approved</p>
              <p className="text-2xl font-bold text-gray-900">₱{totalAmount.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Request History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requestor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
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
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {request.request_type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-500">{request.description}</p>
                      <p className="text-xs text-gray-400">{request.created_at}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-gray-900">{request.requestor_name}</p>
                      <p className="text-sm text-gray-500">{request.department}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">₱{request.amount.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(request.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {request.status === 'pending' && (user.role === 'admin' || user.role === 'finance_manager') && (
                        <>
                          <button
                            onClick={() => handleApproval(request.id, 'approved')}
                            className="text-green-600 hover:text-green-800"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApproval(request.id, 'rejected')}
                            className="text-red-600 hover:text-red-800"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {(request.requestor_id === user.id || user.role === 'admin') && (
                        <button
                          onClick={() => handleEdit(request)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {(request.requestor_id === user.id || user.role === 'admin') && (
                        <button
                          onClick={() => handleDelete(request.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
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

      {/* Add/Edit Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingRequest ? 'Edit Request' : 'New Financial Request'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Type
                </label>
                <select
                  value={formData.request_type}
                  onChange={(e) => setFormData({...formData, request_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="purchase">Purchase Request</option>
                  <option value="expense">Expense Authorization</option>
                  <option value="fund_transfer">Fund Transfer</option>
                  <option value="budget_adjustment">Budget Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Justification
                </label>
                <textarea
                  value={formData.justification}
                  onChange={(e) => setFormData({...formData, justification: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Explain why this request is necessary..."
                  required
                />
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
                  {editingRequest ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialRequests;