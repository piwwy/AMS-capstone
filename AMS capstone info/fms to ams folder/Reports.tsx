import React, { useState } from 'react';
import { Download, FileText, BarChart3, TrendingUp, Calendar, Filter } from 'lucide-react';

interface User {
  id: number;
  username: string;
  role: string;
  department: string;
}

interface ReportsProps {
  user: User;
}

const Reports: React.FC<ReportsProps> = ({ user }) => {
  const [selectedReport, setSelectedReport] = useState('income_statement');
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: '2024-12-31'
  });

  const reportTypes = [
    {
      id: 'income_statement',
      name: 'Income Statement',
      description: 'Revenue and expense summary',
      icon: TrendingUp
    },
    {
      id: 'balance_sheet',
      name: 'Balance Sheet',
      description: 'Assets, liabilities, and equity',
      icon: BarChart3
    },
    {
      id: 'cash_flow',
      name: 'Cash Flow Statement',
      description: 'Cash inflows and outflows',
      icon: TrendingUp
    },
    {
      id: 'budget_variance',
      name: 'Budget Variance Report',
      description: 'Budget vs actual comparison',
      icon: BarChart3
    },
    {
      id: 'revenue_analysis',
      name: 'Revenue Analysis',
      description: 'Detailed revenue breakdown',
      icon: TrendingUp
    },
    {
      id: 'expense_analysis',
      name: 'Expense Analysis',
      description: 'Detailed expense breakdown',
      icon: BarChart3
    }
  ];

  const generateReport = () => {
    // Simulate report generation
    alert(`Generating ${reportTypes.find(r => r.id === selectedReport)?.name} report for ${dateRange.start} to ${dateRange.end}`);
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    // Simulate export
    alert(`Exporting report as ${format.toUpperCase()}`);
  };

  // Sample data for demonstration
  const sampleData = {
    income_statement: {
      revenue: {
        'Tuition Fees': 125000,
        'Laboratory Fees': 15000,
        'Library Fines': 2500,
        'Government Grants': 50000
      },
      expenses: {
        'Utilities': 12000,
        'Supplies': 8500,
        'Maintenance': 15000,
        'Salaries': 95000
      }
    },
    balance_sheet: {
      assets: {
        'Cash': 85000,
        'Accounts Receivable': 25000,
        'Equipment': 150000,
        'Buildings': 500000
      },
      liabilities: {
        'Accounts Payable': 15000,
        'Loans Payable': 75000
      },
      equity: {
        'Retained Earnings': 670000
      }
    },
    cash_flow: {
      operating: {
        'Net Income': 62500,
        'Depreciation': 15000,
        'Changes in Working Capital': -5000
      },
      investing: {
        'Equipment Purchase': -25000,
        'Building Improvements': -50000
      },
      financing: {
        'Loan Repayment': -10000
      }
    }
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'income_statement':
        const income = sampleData.income_statement;
        const totalRevenue = Object.values(income.revenue).reduce((sum, val) => sum + val, 0);
        const totalExpenses = Object.values(income.expenses).reduce((sum, val) => sum + val, 0);
        const netIncome = totalRevenue - totalExpenses;

        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h3>
              <div className="space-y-3">
                {Object.entries(income.revenue).map(([item, amount]) => (
                  <div key={item} className="flex justify-between items-center">
                    <span className="text-gray-700">{item}</span>
                    <span className="font-medium text-green-600">₱{amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Revenue</span>
                    <span className="text-green-600">₱{totalRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses</h3>
              <div className="space-y-3">
                {Object.entries(income.expenses).map(([item, amount]) => (
                  <div key={item} className="flex justify-between items-center">
                    <span className="text-gray-700">{item}</span>
                    <span className="font-medium text-red-600">₱{amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Expenses</span>
                    <span className="text-red-600">₱{totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Net Income</span>
                <span className={`text-xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₱{netIncome.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        );

      case 'balance_sheet':
        const balance = sampleData.balance_sheet;
        const totalAssets = Object.values(balance.assets).reduce((sum, val) => sum + val, 0);
        const totalLiabilities = Object.values(balance.liabilities).reduce((sum, val) => sum + val, 0);
        const totalEquity = Object.values(balance.equity).reduce((sum, val) => sum + val, 0);

        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets</h3>
              <div className="space-y-3">
                {Object.entries(balance.assets).map(([item, amount]) => (
                  <div key={item} className="flex justify-between items-center">
                    <span className="text-gray-700">{item}</span>
                    <span className="font-medium">₱{amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Assets</span>
                    <span>₱{totalAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Liabilities</h3>
                <div className="space-y-3">
                  {Object.entries(balance.liabilities).map(([item, amount]) => (
                    <div key={item} className="flex justify-between items-center">
                      <span className="text-gray-700">{item}</span>
                      <span className="font-medium text-red-600">₱{amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Liabilities</span>
                      <span className="text-red-600">₱{totalLiabilities.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Equity</h3>
                <div className="space-y-3">
                  {Object.entries(balance.equity).map(([item, amount]) => (
                    <div key={item} className="flex justify-between items-center">
                      <span className="text-gray-700">{item}</span>
                      <span className="font-medium text-blue-600">₱{amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Equity</span>
                      <span className="text-blue-600">₱{totalEquity.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Report Preview</h3>
            <p className="text-gray-600">
              Select a report type and date range, then click "Generate Report" to view the data.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600">Generate and export financial reports</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => exportReport('pdf')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </button>
          <button
            onClick={() => exportReport('excel')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </button>
          <button
            onClick={() => exportReport('csv')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </button>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Report Configuration</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {reportTypes.map(report => (
                <option key={report.id} value={report.id}>
                  {report.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={generateReport}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                selectedReport === report.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <div className="flex items-center mb-3">
                <Icon className={`w-6 h-6 mr-3 ${
                  selectedReport === report.id ? 'text-blue-600' : 'text-gray-500'
                }`} />
                <h3 className="font-semibold text-gray-900">{report.name}</h3>
              </div>
              <p className="text-sm text-gray-600">{report.description}</p>
            </div>
          );
        })}
      </div>

      {/* Report Content */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {reportTypes.find(r => r.id === selectedReport)?.name}
          </h2>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-1" />
            {dateRange.start} to {dateRange.end}
          </div>
        </div>
        
        {renderReportContent()}
      </div>
    </div>
  );
};

export default Reports;