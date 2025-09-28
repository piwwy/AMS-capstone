import React, { useState, useEffect } from 'react';
import { Shield, Users, Lock, Eye, Download, AlertTriangle, CheckCircle } from 'lucide-react';

interface User {
  id: number;
  username: string;
  role: string;
  department: string;
}

interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  table_name: string;
  record_id: number;
  timestamp: string;
  ip_address: string;
  details: string;
}

interface SecurityAuditProps {
  user: User;
}

const SecurityAudit: React.FC<SecurityAuditProps> = ({ user }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [securityMetrics, setSecurityMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    failedLogins: 0,
    securityScore: 95
  });

  useEffect(() => {
    loadAuditLogs();
    loadSecurityMetrics();
  }, []);

  const loadAuditLogs = () => {
    // Simulated data - replace with actual API call
    setAuditLogs([
      {
        id: 1,
        user_id: 1,
        username: 'admin',
        action: 'CREATE',
        table_name: 'expenses',
        record_id: 123,
        timestamp: '2024-01-15 10:30:00',
        ip_address: '192.168.1.100',
        details: 'Created new expense record for office supplies'
      },
      {
        id: 2,
        user_id: 2,
        username: 'finance_manager',
        action: 'UPDATE',
        table_name: 'budgets',
        record_id: 45,
        timestamp: '2024-01-15 09:15:00',
        ip_address: '192.168.1.101',
        details: 'Updated budget allocation for Q1'
      },
      {
        id: 3,
        user_id: 3,
        username: 'accountant',
        action: 'DELETE',
        table_name: 'revenue_transactions',
        record_id: 67,
        timestamp: '2024-01-14 16:45:00',
        ip_address: '192.168.1.102',
        details: 'Deleted duplicate revenue transaction'
      }
    ]);
  };

  const loadSecurityMetrics = () => {
    setSecurityMetrics({
      totalUsers: 15,
      activeUsers: 8,
      failedLogins: 2,
      securityScore: 95
    });
  };

  const exportAuditReport = () => {
    alert('Exporting audit trail report...');
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'LOGIN': return 'bg-purple-100 text-purple-800';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const rolePermissions = {
    admin: {
      modules: ['All Modules'],
      actions: ['Create', 'Read', 'Update', 'Delete', 'Approve', 'Export'],
      restrictions: ['None']
    },
    finance_manager: {
      modules: ['Budget', 'Revenue', 'Expenses', 'Funds', 'Reports'],
      actions: ['Create', 'Read', 'Update', 'Approve', 'Export'],
      restrictions: ['Cannot delete audit logs']
    },
    accountant: {
      modules: ['Revenue', 'Expenses', 'Payables', 'Receivables'],
      actions: ['Create', 'Read', 'Update', 'Export'],
      restrictions: ['Cannot approve own transactions', 'Limited delete access']
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security, Access & Audit Trail</h1>
          <p className="text-gray-600">Govern user permissions and maintain a full history of all financial transactions</p>
        </div>
        <button
          onClick={exportAuditReport}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Audit Report
        </button>
      </div>

      {/* Module Overview */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Module Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Purpose</h3>
            <p className="text-sm text-gray-600">Govern user permissions and maintain a full history of all financial transactions</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Key Processes</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Role-based access controls</li>
              <li>• Segregation of duties</li>
              <li>• Change-log of approvals, postings, and payments</li>
              <li>• Audit-ready data exports</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Integrations</h3>
            <p className="text-sm text-gray-600">Underpins every module—ensuring data integrity and compliance</p>
          </div>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{securityMetrics.totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{securityMetrics.activeUsers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed Logins</p>
              <p className="text-2xl font-bold text-gray-900">{securityMetrics.failedLogins}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Security Score</p>
              <p className="text-2xl font-bold text-gray-900">{securityMetrics.securityScore}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Role-Based Access Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Role-Based Access Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(rolePermissions).map(([role, permissions]) => (
            <div key={role} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 capitalize flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                {role.replace('_', ' ')}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Modules</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {permissions.modules.map((module, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {module}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Actions</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {permissions.actions.map((action, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Restrictions</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {permissions.restrictions.map((restriction, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        {restriction}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Audit Trail</h2>
          <p className="text-sm text-gray-600 mt-1">Complete history of all system activities</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Record ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-full mr-3">
                        <Users className="w-4 h-4 text-gray-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">{log.username}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.table_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.record_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.ip_address}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Security Checks</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-900">Password Policy Enforced</span>
                </div>
                <span className="text-xs text-green-600 font-medium">ACTIVE</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-900">Role-Based Access Control</span>
                </div>
                <span className="text-xs text-green-600 font-medium">ACTIVE</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-900">Audit Logging</span>
                </div>
                <span className="text-xs text-green-600 font-medium">ACTIVE</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-gray-900">Two-Factor Authentication</span>
                </div>
                <span className="text-xs text-yellow-600 font-medium">OPTIONAL</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Compliance Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-900">Data Integrity</span>
                <span className="text-xs text-green-600 font-medium">COMPLIANT</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-900">Segregation of Duties</span>
                <span className="text-xs text-green-600 font-medium">ENFORCED</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-900">Audit Trail Completeness</span>
                <span className="text-xs text-green-600 font-medium">100%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-900">Backup & Recovery</span>
                <span className="text-xs text-green-600 font-medium">CONFIGURED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAudit;