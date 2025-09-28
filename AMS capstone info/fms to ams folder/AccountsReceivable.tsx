import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertCircle, Clock, DollarSign, User } from 'lucide-react';

interface User {
  id: number;
  username: string;
  role: string;
  department: string;
}

interface AccountsReceivableRecord {
  id: number;
  student_id: string;
  student_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  description: string;
  status: string;
  created_by_name: string;
  created_at: string;
}

interface AccountsReceivableProps {
  user: User;
}

const AccountsReceivable: React.FC<AccountsReceivableProps> = ({ user }) => {
  const [receivables, setReceivables] = useState<AccountsReceivableRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<AccountsReceivableRecord | null>(null);
  const [formData, setFormData] = useState({
    student_id: '',
    student_name: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    loadReceivables();
  }, []);

  const loadReceivables = () => {
    // Simulated data - replace with actual API call
    setReceivables([
      {
        id: 1,
        student_id: 'STU001',
        student_name: 'John Doe',
        invoice_number: 'INV-STU-2024-001',
        invoice_date: '2024-01-15',
        due_date: '2024-02-15',
        amount: 2500.00,
        paid_amount: 2500.00,
        description: 'Spring semester tuition fees',
        status: 'paid',
        created_by_name: 'finance_manager',
        created_at: '2024-01-15'
      },
      {
        id: 2,
        student_id: 'STU002',
        student_name: 'Jane Smith',
        invoice_number: 'INV-STU-2024-002',
        invoice_date: '2024-01-10',
        due_date: '2024-02-10',
        amount: 1800.00,
        paid_amount: 900.00,
        description: 'Spring semester tuition fees',
        status: 'partial',
        created_by_name: 'finance_manager',
        created_at: '2024-01-10'
      },
      {
        id: 3,
        student_id: 'STU003',
        student_name: 'Mike Johnson',
        invoice_number: 'INV-STU-2024-003',
        invoice_date: '2024-01-05',
        due_date: '2024-01-25',
        amount: 3200.00,
        paid_amount: 0,
        description: 'Spring semester tuition and lab fees',
        status: 'overdue',
        created_by_name: 'finance_manager',
        created_at: '2024-01-05'
      },
      {
        id: 4,
        student_id: 'STU004',
        student_name: 'Sarah Wilson',
        invoice_number: 'INV-STU-2024-004',
        invoice_date: '2024-01-20',
        due_date: '2024-02-20',
        amount: 2200.00,
        paid_amount: 0,
        description: 'Spring semester tuition fees',
        status: 'pending',
        created_by_name: 'finance_manager',
        created_at: '2024-01-20'
      }
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingReceivable) {
      // Update existing receivable
      setReceivables(receivables.map(receivable => 
        receivable.id === editingReceivable.id 
          ? { 
              ...receivable, 
              ...formData,
              amount: parseFloat(formData.amount)
            }
          : receivable
      ));
    } else {
      // Create new receivable
      const newReceivable: AccountsReceivableRecord = {
        id: Date.now(),
        ...formData,
        amount: parseFloat(formData.amount),
        paid_amount: 0,
        status: 'pending',
        created_by_name: user.username,
        created_at: new Date().toISOString()
      };
      setReceivables([...receivables, newReceivable]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      student_name: '',
      invoice_number: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      amount: '',
      description: ''
    });
    setEditingReceivable(null);
    setShowModal(false);
  };

  const handleEdit = (receivable: AccountsReceivableRecord) => {
    setEditingReceivable(receivable);
    setFormData({
      student_id: receivable.student_id,
      student_name: receivable.student_name,
      invoice_number: receivable.invoice_number,
      invoice_date: receivable.invoice_date,
      due_date: receivable.due_date,
      amount: receivable.amount.toString(),
      description: receivable.description
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this receivable record?')) {
      setReceivables(receivables.filter(receivable => receivable.id !== id));
    }
  };

  const recordPayment = (id: number, amount: number) => {
    const payment = parseFloat(prompt(`Enter payment amount (Outstanding: ₱${amount.toLocaleString()})`) || '0');
    if (payment > 0 && payment <= amount) {
      setReceivables(receivables.map(receivable => 
        receivable.id === id 
          ? { 
              ...receivable, 
              paid_amount: receivable.paid_amount + payment,
              status: receivable.paid_amount + payment >= receivable.amount ? 'paid' : 'partial'
            }
          : receivable
      ));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'partial': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalReceivables = receivables.reduce((sum, receivable) => sum + receivable.amount, 0);
  const totalCollected = receivables.reduce((sum, receivable) => sum + receivable.paid_amount, 0);
  const totalOutstanding = totalReceivables - totalCollected;
  const overdueCount = receivables.filter(r => r.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts Receivable</h1>
          <p className="text-gray-600">Manage student invoices and payments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Receivables</p>
              <p className="text-2xl font-bold text-gray-900">₱{totalReceivables.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900">₱{totalCollected.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">₱{totalOutstanding.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{overdueCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Receivables Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Receivable Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
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
              {receivables.map((receivable) => {
                const daysUntilDue = getDaysUntilDue(receivable.due_date);
                const outstanding = receivable.amount - receivable.paid_amount;
                return (
                  <tr key={receivable.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-full mr-3">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{receivable.student_name}</p>
                          <p className="text-sm text-gray-500">{receivable.student_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{receivable.invoice_number}</p>
                        <p className="text-sm text-gray-500">{receivable.description}</p>
                        <p className="text-xs text-gray-400">Invoice Date: {receivable.invoice_date}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">₱{receivable.amount.toLocaleString()}</p>
                        {receivable.paid_amount > 0 && (
                          <p className="text-xs text-green-600">Paid: ₱{receivable.paid_amount.toLocaleString()}</p>
                        )}
                        {outstanding > 0 && (
                          <p className="text-xs text-red-600">Outstanding: ₱{outstanding.toLocaleString()}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-900">{receivable.due_date}</p>
                        {receivable.status !== 'paid' && (
                          <p className={`text-xs ${
                            daysUntilDue < 0 ? 'text-red-600' : 
                            daysUntilDue <= 7 ? 'text-yellow-600' : 'text-gray-500'
                          }`}>
                            {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                             daysUntilDue === 0 ? 'Due today' : 
                             `${daysUntilDue} days remaining`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(receivable.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(receivable.status)}`}>
                          {receivable.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {receivable.status !== 'paid' && (
                          <button
                            onClick={() => recordPayment(receivable.id, outstanding)}
                            className="text-green-600 hover:text-green-800"
                            title="Record Payment"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(receivable)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(receivable.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Receivable Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingReceivable ? 'Edit Receivable' : 'Create New Invoice'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  Student Name
                </label>
                <input
                  type="text"
                  value={formData.student_name}
                  onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
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
                  {editingReceivable ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsReceivable;