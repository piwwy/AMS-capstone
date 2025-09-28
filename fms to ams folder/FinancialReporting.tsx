import React, { useState } from 'react';
import { Download, FileText, BarChart3, TrendingUp, Calendar, Filter, PieChart } from 'lucide-react';

interface User {
  id: number;
  username: string;
  role: string;
  department: string;
}

interface FinancialReportingProps {
  user: User;
}

const FinancialReporting: React.FC<FinancialReportingProps> = ({ user }) => {
  const [selectedReport, setSelectedReport] = useState('income_statement');
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: '2024-12-31'
  });

  const reportTypes = [
    {
      id: 'income_statement',
      name: 'P&L Statement',
      description: 'Profit and Loss statement',
      icon: TrendingUp,
      category: 'statutory'
    },
    {
      id: 'balance_sheet',
      name: 'Balance Sheet',
      description: 'Assets, liabilities, and equity',
      icon: BarChart3,
      category: 'statutory'
    },
    {
      id: 'cash_flow',
      name: 'Cash Flow Statement',
      description: 'Cash inflows and outflows',
      icon: TrendingUp,
      category: 'statutory'
    },
    {
      id: 'budget_variance',
      name: 'Budget vs Actual Analysis',
      description: 'Budget variance comparison',
      icon: BarChart3,
      category: 'management'
    },
    {
      id: 'audit_report',
      name: 'Audit Reports & Disclosures',
      description: 'Compliance and audit documentation',
      icon: FileText,
      category: 'compliance'
    },
    {
      id: 'dashboard',
      name: 'Drill-down Dashboards',
      description: 'Interactive financial dashboards',
      icon: PieChart,
      category: 'management'
    }
  ];

  const generateReport = () => {
    alert(`Generating ${reportTypes.find(r => r.id === selectedReport)?.name} report for ${dateRange.start} to ${dateRange.end}`);
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    alert(`Exporting report as ${format.toUpperCase()}`);
  };

  // Sample data for demonstration
  const sampleData = {
    income_statement: {
      revenue: {
        'Tuition Fees': 2500000,
        'Laboratory Fees': 150000,
        'Library Fines': 25000,
        'Government Grants': 500000
      },
      expenses: {
        'Utilities': 120000,
        'Supplies': 85000,
        'Maintenance': 150000,
        'Salaries': 950000
      }
    },
    balance_sheet: {
      assets: {
        'Cash': 850000,
        'Accounts Receivable': 250000,
        'Equipment': 1500000,
        'Buildings': 5000000
      },
      liabilities: {
        'Accounts Payable': 150000,
        'Loans Payable': 750000
      },
      equity: {
        'Retained Earnings': 6700000
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

  const getReportsByCategory = (category: string) => {
    return reportTypes.filter(report => report.category === category);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reporting & Compliance</h1>
          <p className="text-gray-600">Generate statutory, management, and ad-hoc reports; ensure regulatory adherence</p>
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

      {/* Module Overview */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Module Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Purpose</h3>
            <p className="text-sm text-gray-600">Generate statutory, management, and ad-hoc reports; ensure regulatory adherence</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Key Processes</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• P&L, balance sheet, cash-flow statements</li>
              <li>• Budget vs. actual analysis</li>
              <li>• Audit reports & disclosures</li>
              <li>• Drill-down dashboards</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Integrations</h3>
            <p className="text-sm text-gray-600">Consolidates data from all modules</p>
          </div>
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

      {/* Report Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statutory Reports */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statutory Reports</h3>
          <div className="space-y-3">
            {getReportsByCategory('statutory').map((report) => {
              const Icon = report.icon;
              return (
                <div
                  key={report.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedReport === report.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <div className="flex items-center mb-2">
                    <Icon className={`w-5 h-5 mr-2 ${
                      selectedReport === report.id ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Management Reports */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Management Reports</h3>
          <div className="space-y-3">
            {getReportsByCategory('management').map((report) => {
              const Icon = report.icon;
              return (
                <div
                  key={report.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedReport === report.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <div className="flex items-center mb-2">
                    <Icon className={`w-5 h-5 mr-2 ${
                      selectedReport === report.id ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compliance Reports */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Reports</h3>
          <div className="space-y-3">
            {getReportsByCategory('compliance').map((report) => {
              const Icon = report.icon;
              return (
                <div
                  key={report.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedReport === report.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <div className="flex items-center mb-2">
                    <Icon className={`w-5 h-5 mr-2 ${
                      selectedReport === report.id ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              );
            })}
          </div>
        </div>
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

export default FinancialReporting;