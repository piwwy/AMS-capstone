import React, { useState, useEffect } from 'react';
import { Plus, ArrowUpDown, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface User {
  id: number;
  username: string;
  role: string;
  department: string;
}

interface Fund {
  id: number;
  fund_name: string;
  fund_type: string;
  balance: number;
  description: string;
  is_active: boolean;
}

interface FundTransaction {
  id: number;
  fund_id: number;
  fund_name: string;
  transaction_type: string;
  amount: number;
  from_fund_id?: number;
  to_fund_id?: number;
  description: string;
  reference_number: string;
  transaction_date: string;
  created_by_name: string;
  created_at: string;
}

interface FundManagementProps {
  user: User;
}

const FundManagement: React.FC<FundManagementProps> = ({ user }) => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'deposit' | 'withdrawal' | 'transfer'>('deposit');
  const [formData, setFormData] = useState({
    fund_id: '',
    amount: '',
    from_fund_id: '',
    to_fund_id: '',
    description: '',
    reference_number: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadFunds();
    loadTransactions();
  }, []);

  const loadFunds = () => {
    // Simulated data - replace with actual API call
    setFunds([
      {
        id: 1,
        fund_name: 'Operating Fund',
        fund_type: 'operational',
        balance: 500000.00,
        description: 'Daily operational expenses',
        is_active: true
      },
      {
        id: 2,
        fund_name: 'Capital Fund',
        fund_type: 'capital',
        balance: 200000.00,
        description: 'Capital improvements and equipment',
        is_active: true
      },
      {
        id: 3,
        fund_name: 'Emergency Fund',
        fund_type: 'emergency',
        balance: 100000.00,
        description: 'Emergency reserves',
        is_active: true
      },
      {
        id: 4,
        fund_name: 'Scholarship Fund',
        fund_type: 'scholarship',
        balance: 75000.00,
        description: 'Student scholarships',
        is_active: true
      }
    ]);
  };

  const loadTransactions = () => {
    // Simulated data - replace with actual API call
    setTransactions([
      {
        id: 1,
        fund_id: 1,
        fund_name: 'Operating Fund',
        transaction_type: 'deposit',
        amount: 25000.00,
        description: 'Monthly government grant',
        reference_number: 'TXN-001',
        transaction_date: '2024-01-15',
        created_by_name: 'finance_manager',
        created_at: '2024-01-15'
      },
      {
        id: 2,
        fund_id: 2,
        fund_name: 'Capital Fund',
        transaction_type: 'withdrawal',
        amount: 15000.00,
        description: 'Laboratory equipment purchase',
        reference_number: 'TXN-002',
        transaction_date: '2024-01-14',
        created_by_name: 'finance_manager',
        created_at: '2024-01-14'
      }
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedFund = funds.find(f => f.id === parseInt(formData.fund_id));
    const amount = parseFloat(formData.amount);
    
    // Update fund balances
    if (modalType === 'deposit') {
      setFunds(funds.map(fund => 
        fund.id === parseInt(formData.fund_id) 
          ? { ...fund, balance: fund.balance + amount }
          : fund
      ));
    } else if (modalType === 'withdrawal') {
      setFunds(funds.map(fund => 
        fund.id === parseInt(formData.fund_id) 
          ? { ...fund, balance: fund.balance - amount }
          : fund
      ));
    } else if (modalType === 'transfer') {
      setFunds(funds.map(fund => {
        if (fund.id === parseInt(formData.from_fund_id)) {
          return { ...fund, balance: fund.balance - amount };
        } else if (fund.id === parseInt(formData.to_fund_id)) {
          return { ...fund, balance: fund.balance + amount };
        }
        return fund;
      }));
    }
    
    // Add transaction record
    const newTransaction: FundTransaction = {
      id: Date.now(),
      fund_id: parseInt(formData.fund_id),
      fund_name: selectedFund?.fund_name || '',
      transaction_type: modalType,
      amount: amount,
      from_fund_id: modalType === 'transfer' ? parseInt(formData.from_fund_id) : undefined,
      to_fund_id: modalType === 'transfer' ? parseInt(formData.to_fund_id) : undefined,
      description: formData.description,
      reference_number: formData.reference_number,
      transaction_date: formData.transaction_date,
      created_by_name: user.username,
      created_at: new Date().toISOString()
    };
    
    setTransactions([newTransaction, ...transactions]);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      fund_id: '',
      amount: '',
      from_fund_id: '',
      to_fund_id: '',
      description: '',
      reference_number: '',
      transaction_date: new Date().toISOString().split('T')[0]
    });
    setShowModal(false);
  };

  const openModal = (type: 'deposit' | 'withdrawal' | 'transfer') => {
    setModalType(type);
    setShowModal(true);
  };

  const getFundTypeColor = (type: string) => {
    switch (type) {
      case 'operational': return 'bg-blue-100 text-blue-800';
      case 'capital': return 'bg-green-100 text-green-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'scholarship': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'withdrawal': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'transfer': return <ArrowUpDown className="w-4 h-4 text-blue-600" />;
      default: return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const totalBalance = funds.reduce((sum, fund) => sum + fund.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fund Management</h1>
          <p className="text-gray-600">Manage institutional funds and allocations</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => openModal('deposit')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Deposit
          </button>
          <button
            onClick={() => openModal('withdrawal')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            Withdrawal
          </button>
          <button
            onClick={() => openModal('transfer')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Transfer
          </button>
        </div>
      </div>

      {/* Fund Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Fund Overview</h2>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Balance</p>
            <p className="text-2xl font-bold text-gray-900">₱{totalBalance.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {funds.map((fund) => (
            <div key={fund.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{fund.fund_name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getFundTypeColor(fund.fund_type)}`}>
                  {fund.fund_type}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">₱{fund.balance.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">{fund.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fund
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
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
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{transaction.fund_name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTransactionIcon(transaction.transaction_type)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {transaction.transaction_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className={`text-sm font-medium ${
                      transaction.transaction_type === 'deposit' ? 'text-green-600' : 
                      transaction.transaction_type === 'withdrawal' ? 'text-red-600' : 
                      'text-blue-600'
                    }`}>
                      {transaction.transaction_type === 'deposit' ? '+' : 
                       transaction.transaction_type === 'withdrawal' ? '-' : ''}
                      ₱{transaction.amount.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.transaction_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.created_by_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {modalType === 'deposit' ? 'Deposit Funds' : 
               modalType === 'withdrawal' ? 'Withdraw Funds' : 
               'Transfer Funds'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {modalType === 'transfer' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Fund
                    </label>
                    <select
                      value={formData.from_fund_id}
                      onChange={(e) => setFormData({...formData, from_fund_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select source fund</option>
                      {funds.map(fund => (
                        <option key={fund.id} value={fund.id}>
                          {fund.fund_name} (₱{fund.balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Fund
                    </label>
                    <select
                      value={formData.to_fund_id}
                      onChange={(e) => setFormData({...formData, to_fund_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select destination fund</option>
                      {funds.map(fund => (
                        <option key={fund.id} value={fund.id}>
                          {fund.fund_name} (₱{fund.balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fund
                  </label>
                  <select
                    value={formData.fund_id}
                    onChange={(e) => setFormData({...formData, fund_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select fund</option>
                    {funds.map(fund => (
                      <option key={fund.id} value={fund.id}>
                        {fund.fund_name} (₱{fund.balance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
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
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    modalType === 'deposit' ? 'bg-green-600 hover:bg-green-700' :
                    modalType === 'withdrawal' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {modalType === 'deposit' ? 'Deposit' : 
                   modalType === 'withdrawal' ? 'Withdraw' : 
                   'Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundManagement;