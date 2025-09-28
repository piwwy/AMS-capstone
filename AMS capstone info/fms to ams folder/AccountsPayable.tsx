import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertCircle, Clock, DollarSign } from 'lucide-react';

interface User {
  id: number;
  username: string;
  role: string;
  department: string;
}

interface AccountsPayableRecord {
  id: number;
  vendor_id: number;
  vendor_name: string;
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

interface Vendor {
  id: number;
  vendor_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

interface AccountsPayableProps {
  user: User;
}

const AccountsPayable: React.FC<AccountsPayableProps> = ({ user }) => {
  const [payables, setPayables] = useState<AccountsPayableRecord[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPayable, setEditingPayable] = useState<AccountsPayableRecord | null>(null);
  const [formData, setFormData] = useState({
    vendor_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    loadPayables();
    loadVendors();
  }, []);

  const loadPayables = () => {
    // Simulated data - replace with actual API call
    setPayables([
      {
        id: 1,
        vendor_id: 1,
        vendor_name: 'Power Company',
        invoice_number: 'INV-2024-001',
        invoice_date: '2024-01-15',
        due_date: '2024-02-15',
        amount: 1500.00,
        paid_amount: 0,
        description: 'Monthly electricity bill',
        status: 'pending',
        created_by_name: 'accountant',
        created_at: '2024-01-15'
      },
      {
        id: 2,
        vendor_id: 2,
        vendor_name: 'Office Supplies Co.',
        invoice_number: 'INV-2024-002',
        invoice_date: '2024-01-10',
        due_date: '2024-01-25',
        amount: 750.00,
        paid_amount: 750.00,
        description: 'Office supplies and stationery',
        status: 'paid',
        created_by_name: 'accountant',
        created_at: '2024-01-10'
      },
      {
        id: 3,
        vendor_id: 3,
        vendor_name: 'Maintenance Services',
        invoice_number: 'INV-2024-003',
        invoice_date: '2024-01-05',
        due_date: '2024-01-20',
        amount: 2000.00,
        paid_amount: 0,
        description: 'Building maintenance and repairs',
        status: 'overdue',
        created_by_name: 'accountant',
        created_at: '2024-01-05'
      }
    ]);
  };

  const loadVendors = () => {
    // Simulated data - replace with actual API call
    setVendors([
      {
        id: 1,
        vendor_name: 'Power Company',
        contact_person: 'John Smith',
        email: 'billing@powerco.com',
        phone: '555-0101',
        address: '123 Electric Ave, City, State 12345',
        is_active: true
      },
      {
        id: 2,
        vendor_name: 'Office Supplies Co.',
        contact_person: 'Jane Doe',
        email: 'sales@officesupplies.com',
        phone: '555-0102',
        address: '456 Supply St, City, State 12345',
        is_active: true
      },
      {
        id: 3,
        vendor_name: 'Maintenance Services',
        contact_person: 'Mike Johnson',
        email: 'service@maintenance.com',
        phone: '555-0103',
        address: '789 Repair Rd, City, State 12345',
        is_active: true
      }
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedVendor = vendors.find(v => v.id === parseInt(formData.vendor_id));
    
    if (editingPayable) {
      // Update existing payable
      setPayables(payables.map(payable => 
        payable.id === editingPayable.id 
          ? { 
              ...payable, 
              ...formData,
              vendor_id: parseInt(formData.vendor_id),
              amount: parseFloat(formData.amount),
              vendor_name: selectedVendor?.vendor_name || ''
            }
          : payable
      ));
    } else {
      // Create new payable
      const newPayable: AccountsPayableRecord = {
        id: Date.now(),
        ...formData,
        vendor_id: parseInt(formData.vendor_id),
        amount: parseFloat(formData.amount),
        vendor_name: selectedVendor?.vendor_name || '',
        paid_amount: 0,
        status: 'pending',
        created_by_name: user.username,
        created_at: new Date().toISOString()
      };
      setPayables([...payables, newPayable]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      vendor_id: '',
      invoice_number: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      amount: '',
      description: ''
    });
    setEditingPayable(null);
    setShowModal(false);
  };

  const handleEdit = (payable: AccountsPayableRecord) => {
    setEditingPayable(payable);
    setFormData({
      vendor_id: payable.vendor_id.toString(),
      invoice_number: payable.invoice_number,
      invoice_date: payable.invoice_date,
      due_date: payable.due_date,
      amount: payable.amount.toString(),
      description: payable.description
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this payable record?')) {
      setPayables(payables.filter(payable => payable.id !== id));
    }
  };

  const markAsPaid = (id: number) => {
    setPayables(payables.map(payable => 
      payable.id === id 
        ? { ...payable, status: 'paid', paid_amount: payable.amount }
        : payable
    ));
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

  const totalPayables = payables.reduce((sum, payable) => sum + payable.amount, 0);
  const totalPaid = payables.reduce((sum, payable) => sum + payable.paid_amount, 0);
  const totalOutstanding = totalPayables - totalPaid;
  const overdueCount = payables.filter(p => p.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts Payable</h1>
          <p className="text-gray-600">Manage vendor invoices and payments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payables</p>
              <p className="text-2xl font-bold text-gray-900">₱{totalPayables.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <DollarSign className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">₱{totalPaid.toLocaleString()}</p>
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

      {/* Payables Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Payable Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
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
              {payables.map((payable) => {
                const daysUntilDue = getDaysUntilDue(payable.due_date);
                return (
                  <tr key={payable.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payable.invoice_number}</p>
                        <p className="text-sm text-gray-500">{payable.description}</p>
                        <p className="text-xs text-gray-400">Invoice Date: {payable.invoice_date}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{payable.vendor_name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">₱{payable.amount.toLocaleString()}</p>
                        {payable.paid_amount > 0 && (
                          <p className="text-xs text-green-600">Paid: ₱{payable.paid_amount.toLocaleString()}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-900">{payable.due_date}</p>
                        {payable.status !== 'paid' && (
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
                        {getStatusIcon(payable.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payable.status)}`}>
                          {payable.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {payable.status !== 'paid' && (
                          <button
                            onClick={() => markAsPaid(payable.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Mark as Paid"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(payable)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(payable.id)}
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

      {/* Add/Edit Payable Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingPayable ? 'Edit Payable' : 'Add New Payable'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <select
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({...formData, vendor_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.vendor_name}
                    </option>
                  ))}
                </select>
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
                  {editingPayable ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPayable;