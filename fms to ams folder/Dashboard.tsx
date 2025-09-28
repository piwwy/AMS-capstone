// components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Mail,
  Heart,
  ArrowUpRight,
  Activity,
  Plus
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  role: string;
  department: string;
}

interface DashboardProps {
  user: User;
  onNavigate?: (moduleId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [analytics, setAnalytics] = useState({
    totalAlumni: 0,
    activeAlumni: 0,
    recentGraduates: 0,
    employmentRate: 0,
    upcomingEvents: 0,
    totalDonations: 0,
    jobPlacements: 0,
    surveyResponses: 0
  });

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, type: 'alumni', description: 'New alumni registration - John Doe (Class of 2023)', time: '2 hours ago', icon: Users },
    { id: 2, type: 'event', description: 'Alumni Homecoming 2024 - 150 attendees registered', time: '4 hours ago', icon: Calendar },
    { id: 3, type: 'job', description: 'New job posting: Software Engineer at Tech Corp', time: '6 hours ago', icon: Briefcase },
    { id: 4, type: 'donation', description: 'Donation received: ₱25,000 from Maria Santos', time: '1 day ago', icon: Heart },
    { id: 5, type: 'survey', description: 'Career Survey 2024 - 89 responses collected', time: '2 days ago', icon: TrendingUp }
  ]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalytics({
        totalAlumni: 2847,
        activeAlumni: 1923,
        recentGraduates: 342,
        employmentRate: 87.5,
        upcomingEvents: 8,
        totalDonations: 1250000,
        jobPlacements: 156,
        surveyResponses: 234
      });
      setIsLoading(false);
    }, 800);
  }, []);

  const statCards = [
    {
      title: 'Total Alumni',
      value: analytics.totalAlumni.toLocaleString(),
      change: '+5.2%',
      changeType: 'positive',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Active Alumni',
      value: analytics.activeAlumni.toLocaleString(),
      change: '+8.1%',
      changeType: 'positive',
      icon: Activity,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
        },
    {
      title: 'Employment Rate',
      value: `${analytics.employmentRate}%`,
      change: '+2.3%',
      changeType: 'positive',
      icon: Briefcase,
      gradient: 'from-purple-500 to-violet-600',
      bgGradient: 'from-purple-50 to-violet-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Total Donations',
      value: `₱${(analytics.totalDonations / 1000000).toFixed(1)}M`,
      change: '+12.7%',
      changeType: 'positive',
      icon: Heart,
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-50 to-rose-50',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600'
    }
  ];

  const quickActions = [
    { 
      id: 'alumni_profiles',
      title: 'Add Alumni', 
      description: 'Register new alumni', 
      icon: Users, 
      gradient: 'from-blue-500 to-cyan-600',
      hoverGradient: 'hover:from-blue-600 hover:to-cyan-700'
    },
    { 
      id: 'event_create',
      title: 'Create Event', 
      description: 'Schedule new event', 
      icon: Calendar, 
      gradient: 'from-green-500 to-emerald-600',
      hoverGradient: 'hover:from-green-600 hover:to-emerald-700'
    },
    { 
      id: 'job_post_form',
      title: 'Post Job', 
      description: 'Add job opportunity', 
      icon: Briefcase, 
      gradient: 'from-purple-500 to-violet-600',
      hoverGradient: 'hover:from-purple-600 hover:to-violet-700'
    },
    { 
      id: 'newsletter',
      title: 'Send Newsletter', 
      description: 'Create newsletter', 
      icon: Mail, 
      gradient: 'from-orange-500 to-amber-600',
      hoverGradient: 'hover:from-orange-600 hover:to-amber-700'
    }
  ];

  const handleQuickAction = (actionId: string) => {
    if (onNavigate) {
      onNavigate(actionId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Welcome back, {user.username}
          </h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your alumni community today.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Period</p>
            <p className="font-semibold text-gray-900 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-full">
            <Activity className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Live</span>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-3">{stat.value}</p>
                  <div className="flex items-center">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600 mr-1" />
                    <span className="text-sm font-medium text-emerald-600">
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">from last month</span>
                  </div>
                </div>
                <div className={`p-3 ${stat.iconBg} rounded-xl`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
              
              {/* Decorative gradient overlay */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-full -translate-y-16 translate-x-16`}></div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Activity className="w-4 h-4" />
            <span>Most used actions</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => handleQuickAction(action.id)}
                className={`group relative overflow-hidden bg-gradient-to-r ${action.gradient} ${action.hoverGradient} p-6 rounded-xl text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left`}
              >
                <div className="relative z-10">
                  <Icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alumni Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Alumni Overview</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Activity className="w-4 h-4" />
              <span>Real-time updates</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Recent Graduates</h3>
              <p className="text-2xl font-bold text-blue-600 mb-1">{analytics.recentGraduates}</p>
              <p className="text-sm text-gray-500">Class of 2024</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Job Placements</h3>
              <p className="text-2xl font-bold text-green-600 mb-1">{analytics.jobPlacements}</p>
              <p className="text-sm text-gray-500">This year</p>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Alumni Engagement</h3>
            <p className="text-3xl font-bold text-blue-600 mb-1">67.5%</p>
            <p className="text-sm text-gray-500">active participation</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Event Attendance</h3>
            <p className="text-3xl font-bold text-green-600 mb-1">89.2%</p>
            <p className="text-sm text-gray-500">average attendance</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Career Growth</h3>
            <p className="text-3xl font-bold text-purple-600 mb-1">+15.3%</p>
            <p className="text-sm text-gray-500">salary increase</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Donation Rate</h3>
            <p className="text-3xl font-bold text-pink-600 mb-1">23.8%</p>
            <p className="text-sm text-gray-500">alumni donors</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;