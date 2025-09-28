import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

import Reports from './components/Reports';

import SecurityAudit from './components/SecurityAudit';
import UserManagement from './components/UserManagement';
import ApiService from './services/api';
// AMS modules
import { 
  AlumniDirectory, AlumniProfiles, AlumniRequests,
  GradCohorts, EmploymentOutcomes, TrackingAnalytics,
  JobBoard, JobPostForm, PlacementLogs,
  EventsCalendar, EventCreate, EventAttendance,
  Campaigns, Donations, DonorLedger,
  Newsletter, Announcements, MailingLists,
  Surveys, SurveyResponses, SurveyInsights,
  DataExports
} from './components/ams';

// If you used CalendarIcon:
import { Calendar as CalendarIcon } from 'lucide-react';

import { 
  LayoutDashboard, 
  Calculator, 
  TrendingUp, 
  CreditCard, 
  FileText, 
  Receipt, 
  PiggyBank, 
  ShoppingCart,
  Building,
  BarChart3,
  Shield,
  ChevronDown,
  ChevronRight,
  LogOut,
  Search,
  Bell,
  Settings,
  User,
  AlertCircle
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  role: string;
  department: string;
}

interface SubModule {
  id: string;
  name: string;
  component: React.ComponentType<any>;
}

interface Module {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  component?: React.ComponentType<any>;
  subModules?: SubModule[];
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [expandedModules, setExpandedModules] = useState<string[]>(['overview']);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Payment Received',
      message: 'Student STU001 paid ₱25,000 tuition fees',
      type: 'success',
      time: '5 minutes ago',
      read: false
    },
    {
      id: 2,
      title: 'Expense Approval Required',
      message: 'Office supplies expense of ₱3,500 needs approval',
      type: 'warning',
      time: '15 minutes ago',
      read: false
    },
    {
      id: 3,
      title: 'Budget Alert',
      message: 'Utilities budget is 85% utilized',
      type: 'info',
      time: '1 hour ago',
      read: true
    },
    {
      id: 4,
      title: 'Overdue Invoice',
      message: 'Student STU003 has overdue payment of ₱18,000',
      type: 'error',
      time: '2 hours ago',
      read: false
    }
  ]);

const modules: Module[] = [
  {
    id: 'overview',
    name: 'Overview',
    icon: LayoutDashboard,
    subModules: [
      { id: 'dashboard', name: 'Dashboard', component: Dashboard }
    ]
  },
  {
    id: 'alumni',
    name: 'Alumni Information',
    icon: User,
    subModules: [
      { id: 'alumni-directory', name: 'Directory', component: AlumniDirectory },
      { id: 'alumni-profiles', name: 'Profiles', component: AlumniProfiles },
      { id: 'alumni-requests', name: 'Update Requests', component: AlumniRequests }
    ]
  },
  {
    id: 'graduate-tracking',
    name: 'Graduate Tracking',
    icon: BarChart3,
    subModules: [
      { id: 'grad-cohorts', name: 'Cohorts', component: GradCohorts },
      { id: 'employment-outcomes', name: 'Employment Outcomes', component: EmploymentOutcomes },
      { id: 'analytics', name: 'Analytics', component: TrackingAnalytics }
    ]
  },
  {
    id: 'jobs',
    name: 'Job Posting & Placement',
    icon: TrendingUp,
    subModules: [
      { id: 'job-board', name: 'Job Board', component: JobBoard },
      { id: 'job-post', name: 'Post a Job', component: JobPostForm },
      { id: 'placement-logs', name: 'Placement Logs', component: PlacementLogs }
    ]
  },
  {
    id: 'events',
    name: 'Event Management',
    icon: CalendarIcon, // any lucide icon you already import
    subModules: [
      { id: 'events-calendar', name: 'Calendar', component: EventsCalendar },
      { id: 'event-create', name: 'Create Event', component: EventCreate },
      { id: 'event-attendance', name: 'Attendance & Tickets', component: EventAttendance }
    ]
  },
  {
    id: 'donations',
    name: 'Donor & Campaign Tools',
    icon: PiggyBank,
    subModules: [
      { id: 'campaigns', name: 'Campaigns', component: Campaigns },
      { id: 'donations', name: 'Donations', component: Donations },
      { id: 'donor-ledger', name: 'Donor Ledger', component: DonorLedger }
    ]
  },
  {
    id: 'comm',
    name: 'Newsletter & Announcements',
    icon: FileText,
    subModules: [
      { id: 'newsletter', name: 'Newsletter', component: Newsletter },
      { id: 'announcements', name: 'Announcements', component: Announcements },
      { id: 'mailing-lists', name: 'Mailing Lists', component: MailingLists }
    ]
  },
  {
    id: 'feedback',
    name: 'Feedback & Survey',
    icon: AlertCircle,
    subModules: [
      { id: 'surveys', name: 'Surveys', component: Surveys },
      { id: 'responses', name: 'Responses', component: SurveyResponses },
      { id: 'insights', name: 'Insights', component: SurveyInsights }
    ]
  },
  {
    id: 'reports',
    name: 'Reports',
    icon: BarChart3,
    subModules: [
      { id: 'kpis', name: 'KPIs', component: Reports },
      { id: 'exports', name: 'Exports', component: DataExports }
    ]
  },
  {
    id: 'security',
    name: 'Security & Users',
    icon: Shield,
    subModules: [
      { id: 'user-management', name: 'User Management', component: UserManagement },
      { id: 'access-controls', name: 'Access Controls', component: SecurityAudit },
      { id: 'audit-trail', name: 'Audit Trail', component: SecurityAudit }
    ]
  }
];


  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    // Set the API token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      ApiService.setToken(token);
    }
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setActiveModule('dashboard');
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const setActiveModuleHandler = (moduleId: string) => {
    setActiveModule(moduleId);
    setSearchQuery(''); // Clear search when navigating
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      // Search through modules and sub-modules
      const searchResults = [];
      
      modules.forEach(module => {
        // Check main module name
        if (module.name.toLowerCase().includes(query.toLowerCase())) {
          searchResults.push({
            type: 'module',
            id: module.id,
            name: module.name,
            path: module.id
          });
        }
        
        // Check sub-modules
        if (module.subModules) {
          module.subModules.forEach(subModule => {
            if (subModule.name.toLowerCase().includes(query.toLowerCase())) {
              searchResults.push({
                type: 'submodule',
                id: subModule.id,
                name: subModule.name,
                parent: module.name,
                path: subModule.id
              });
            }
          });
        }
      });
      
      // Auto-navigate to first result if exact match
      if (searchResults.length > 0) {
        const exactMatch = searchResults.find(result => 
          result.name.toLowerCase() === query.toLowerCase()
        );
        
        if (exactMatch) {
          setActiveModule(exactMatch.path);
          setSearchQuery('');
        }
      }
    }
  };

  const markNotificationAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const getCurrentComponent = () => {
    for (const module of modules) {
      if (module.subModules) {
        const subModule = module.subModules.find(sub => sub.id === activeModule);
        if (subModule) {
          return subModule.component;
        }
      }
    }
    return Dashboard; // Default fallback
  };

  const CurrentComponent = getCurrentComponent();

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Enhanced Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 shadow-lg flex flex-col">
        {/* Logo Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center">
              <img 
                src="/logosms.png" 
                alt="AMS Logo" 
                className="w-12 h-12 object-contain" 
              />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900">AMS</h1>
              <p className="text-sm text-gray-500">Alumni Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1">
            {modules.map((module) => {
              const Icon = module.icon;
              const isExpanded = expandedModules.includes(module.id);
              const hasSubModules = module.subModules && module.subModules.length > 0;

              return (
                <div key={module.id}>
                  {/* Main Module */}
                  <div
                    className={`mx-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      hasSubModules 
                        ? 'hover:bg-gray-50' 
                        : activeModule === module.id 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : 'hover:bg-gray-50'
                    }`}
                    onClick={() => hasSubModules ? toggleModule(module.id) : setActiveModuleHandler(module.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${
                          !hasSubModules && activeModule === module.id ? 'text-white' : 'text-gray-600'
                        }`} />
                        <span className={`font-medium text-sm ${
                          !hasSubModules && activeModule === module.id ? 'text-white' : 'text-gray-700'
                        }`}>
                          {module.name}
                        </span>
                      </div>
                      {hasSubModules && (
                        <div className="text-gray-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sub Modules */}
                  {hasSubModules && isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {module.subModules?.map((subModule) => (
                        <div
                          key={subModule.id}
                          className={`mx-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            activeModule === subModule.id
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                              : 'hover:bg-blue-50 text-gray-600 hover:text-blue-700'
                          }`}
                          onClick={() => setActiveModuleHandler(subModule.id)}
                        >
                          <span className="text-sm font-medium">{subModule.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{currentUser.username}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser.role.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {modules.find(m => m.subModules?.some(sub => sub.id === activeModule))?.name || 
                 modules.find(m => m.id === activeModule)?.name || 'Dashboard'}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">System Online</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
                
                {/* Search Results Dropdown */}
                {searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {modules.filter(module => 
                      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      module.subModules?.some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    ).map(module => (
                      <div key={module.id}>
                        {module.name.toLowerCase().includes(searchQuery.toLowerCase()) && (
                          <div
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                            onClick={() => {
                              if (module.subModules && module.subModules.length > 0) {
                                setActiveModule(module.subModules[0].id);
                              }
                              setSearchQuery('');
                            }}
                          >
                            <div className="font-medium text-gray-900">{module.name}</div>
                            <div className="text-sm text-gray-500">Main Module</div>
                          </div>
                        )}
                        {module.subModules?.filter(sub => 
                          sub.name.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map(subModule => (
                          <div
                            key={subModule.id}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                            onClick={() => {
                              setActiveModule(subModule.id);
                              setSearchQuery('');
                            }}
                          >
                            <div className="font-medium text-gray-900">{subModule.name}</div>
                            <div className="text-sm text-gray-500">{module.name}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                    {!modules.some(module => 
                      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      module.subModules?.some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    ) && (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        No results found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <button 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={clearAllNotifications}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No notifications</p>
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${
                                  !notification.read ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {notification.time}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Settings */}
              <div className="relative">
                <button 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setShowSettings(!showSettings)}
                >
                <Settings className="w-5 h-5" />
                </button>
                
                {/* Settings Dropdown */}
                {showSettings && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Settings</h3>
                    </div>
                    
                    <div className="py-2">
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                        onClick={() => {
                          setActiveModule('user-management');
                          setShowSettings(false);
                        }}
                      >
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">User Management</span>
                      </button>
                      
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                        onClick={() => {
                          setActiveModule('access-controls');
                          setShowSettings(false);
                        }}
                      >
                        <Shield className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Security Settings</span>
                      </button>
                      
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                        onClick={() => {
                          setActiveModule('audit-trail');
                          setShowSettings(false);
                        }}
                      >
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Audit Logs</span>
                      </button>
                      
                      <div className="border-t border-gray-100 my-2"></div>
                      
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                        onClick={() => {
                          alert('System preferences opened');
                          setShowSettings(false);
                        }}
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">System Preferences</span>
                      </button>
                      
                      <button
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                        onClick={() => {
                          alert('Help & Support opened');
                          setShowSettings(false);
                        }}
                      >
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Help & Support</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Click outside handlers */}
          <div 
            onClick={() => {
              setShowNotifications(false);
              setShowSettings(false);
            }}
          >
          <CurrentComponent 
            user={currentUser} 
            currentUser={currentUser}
            onNavigate={setActiveModuleHandler} 
          />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;