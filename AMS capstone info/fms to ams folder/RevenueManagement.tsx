import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, TrendingUp, DollarSign, CreditCard, Calendar } from 'lucide-react';

interface User {
  id: number;
  username: string;
  role: string;
  department: string;
}

interface RevenueTransaction {
  id: number;
  revenue_source_id: number;
  source_name: string;
  source_type: string;
  student_id: string;
  amount: number;
  transaction_date: string;
  payment_method: string;
  reference_number: string;
  description: string;
  status: string;
  created_by_name: string;
  created_at: string;
}

interface RevenueSource {
  id: number;
  source_name: string;
  source_type: string;
  description: string;
  is_active: boolean;
}

interface RevenueManagementProps {
  user: User;
}

const RevenueManagement: React.FC<RevenueManagementProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([]);
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RevenueTransaction | null>(null);
  const [formData, setFormData] = useState({
    revenue_source_id: '',
    student_id: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    description: ''
  });

  useEffect(() => {
    loadTransactions();
    loadRevenueSources();
  }, []);

  const loadTransactions = () => {
    // Simulated data - replace with actual API call
    setTransactions([
      {
        id: 1,
        revenue_source_id: 1,
        source_name: 'Tuition Fees',
        source_type: 'tuition',
        student_id: 'STU001',
        amount: 2500.00,
        transaction_date: '2024-01-15',
        payment_method: 'bank_transfer',
        reference_number: 'TXN001',
        description: 'Spring semester tuition payment',
        status: 'completed',
        created_by_name: 'finance_manager',
        created_at: '2024-01-15'
      },
      {
        id: 2,
        revenue_source_id: 2,
        source_name: 'Laboratory Fees',
        source_type: 'fees',
        student_id: 'STU002',
        amount: 150.00,
        transaction_date: '2024-01-14',
        payment_method: 'cash',
        reference_number: 'TXN002',
        description: 'Chemistry lab fees',
        status: 'completed',
        created_by_name: 'accountant',
        created_at: '2024-01-14'
      }
    ]);
  };

  const loadRevenueSources = () => {
    // Simulated data - replace with actual API call
    setRevenueSources([
      { id: 1, source_name: 'Tuition Fees', source_type: 'tuition', description: 'Student tuition payments', is_active: true },
      { id: 2, source_name: 'Laboratory Fees', source_type: 'fees', description: 'Laboratory usage fees', is_active: true },
      { id: 3, source_name: 'Library Fines', source_type: 'fees', description: 'Late return fines', is_active: true },
      { id: 4, source_name: 'Government Grants', source_type: 'grants', description: 'Government funding', is_active: true }
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedSource = revenueSources.find(s => s.id === parseInt(formData.revenue_source_id));
    
    if (editingTransaction) {
      // Update existing transaction
      setTransactions(transactions.map(transaction => 
        transaction.id === editingTransaction.id 
          ? { 
              ...transaction, 
              ...formData,
              revenue_source_id: parseInt(formData.revenue_source_id),
              amount: parseFloat(formData.amount),
              source_name: selectedSource?.source_name || '',
              source_type: selectedSource?.source_type || ''
            }
          : transaction
      ));
      alert('Revenue transaction updated successfully!');
    } else {
      // Create new transaction
      const newTransaction: RevenueTransaction = {
        id: Date.now(),
        ...formData,
        revenue_source_id: parseInt(formData.revenue_source_id),
        amount: parseFloat(formData.amount),
        source_name: selectedSource?.source_name || '',
        source_type: selectedSource?.source_type || '',
        status: 'completed',
        created_by_name: user.username,
        created_at: new Date().toISOString()
      };
      setTransactions([...transactions, newTransaction]);
      alert('Revenue transaction added successfully!');
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      revenue_source_id: '',
      student_id: '',
      amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      reference_number: '',
      description: ''
    });
    setEditingTransaction(null);
    setShowModal(false);
  };

  const handleEdit = (transaction: RevenueTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      revenue_source_id: transaction.revenue_source_id.toString(),
      student_id: transaction.student_id,
      amount: transaction.amount.toString(),
      transaction_date: transaction.transaction_date,
      payment_method: transaction.payment_method,
      reference_number: transaction.reference_number,
      description: transaction.description
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(transactions.filter(transaction => transaction.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <DollarSign className="w-4 h-4" />;
      case 'bank_transfer': return <CreditCard className="w-4 h-4" />;
      case 'check': return <CreditCard className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const totalRevenue = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthlyRevenue = transactions.filter(t => 
    new Date(t.transaction_date).getMonth() === new Date().getMonth()
  ).reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Management</h1>
          <p className="text-gray-600 mb-6">
            The Revenue Management module handles all income-related processes within the school — including tuition billing, collections, donations, and miscellaneous fees. It ensures income is accurately tracked, collected, and forecasted for long-term financial sustainability.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Key Functions */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🔧</span>
                Key Functions
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <div>
                    <p className="font-medium text-gray-900">Student Billing & Collection</p>
                    <p className="text-sm text-gray-600">Tracks tuition, fees, and payments</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <div>
                    <p className="font-medium text-gray-900">Receipts & Acknowledgments</p>
                    <p className="text-sm text-gray-600">Issues receipts and updates records</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <div>
                    <p className="font-medium text-gray-900">Revenue Forecasting</p>
                    <p className="text-sm text-gray-600">Predicts future income based on trends</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <div>
                    <p className="font-medium text-gray-900">Scholarship & Discount Handling</p>
                    <p className="text-sm text-gray-600">Applies and manages income adjustments</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <div>
                    <p className="font-medium text-gray-900">Delinquency Tracking</p>
                    <p className="text-sm text-gray-600">Flags overdue balances</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <div>
                    <p className="font-medium text-gray-900">Cash & Bank Reconciliation</p>
                    <p className="text-sm text-gray-600">Matches revenue with banking records</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* AI Analytics */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🤖</span>
                Powered by AI Analytics
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <p className="text-sm text-gray-700">Predicts students at risk of late payment</p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <p className="text-sm text-gray-700">Forecasts revenue based on enrollment and payment history</p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <p className="text-sm text-gray-700">Detects declining revenue streams</p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <p className="text-sm text-gray-700">Recommends data-driven actions for financial planning</p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-white rounded-lg border border-purple-100">
                <p className="text-sm text-gray-700 font-medium">
                  With AI integration, the school gains smarter insights, faster decisions, and stronger financial control.
                </p>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Revenue
        </button>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₱{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600">+12.5% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">₱{monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-blue-600">Current month revenue</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-purple-600">Total transactions</span>
          </div>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        {/* Blue Header */}
        <div className="bg-blue-600 text-white p-6">
          <h2 className="text-xl font-semibold">Revenue Overview</h2>
        </div>
        
        {/* Revenue Metrics */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Revenue */}
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">TOTAL REVENUE</h3>
              <p className="text-3xl font-bold text-gray-900">₱{totalRevenue.toLocaleString()}</p>
            </div>
            
            {/* Unpaid Revenue */}
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">UNPAID REVENUE</h3>
              <p className="text-3xl font-bold text-gray-900">₱0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Revenue Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
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
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.reference_number}</p>
                      <p className="text-sm text-gray-500">{transaction.description}</p>
                      <p className="text-xs text-gray-400">Student: {transaction.student_id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-gray-900">{transaction.source_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{transaction.source_type}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">₱{transaction.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{transaction.transaction_date}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getPaymentMethodIcon(transaction.payment_method)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {transaction.payment_method.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-800"
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

      {/* Add/Edit Revenue Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTransaction ? 'Edit Revenue Transaction' : 'Add New Revenue'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Revenue Source
                </label>
                <select
                  value={formData.revenue_source_id}
                  onChange={(e) => setFormData({...formData, revenue_source_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select revenue source</option>
                  {revenueSources.map(source => (
                    <option key={source.id} value={source.id}>
                      {source.source_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID
                </label>
                <input
                  type="text"
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
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
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="credit_card">Credit Card</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                  {editingTransaction ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueManagement;