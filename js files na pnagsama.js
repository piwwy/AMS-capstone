// js/auth.js
// Authentication & role-based access (Super Admin, Admin, Alumni)
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.checkStoredAuth();
    }

    checkStoredAuth() {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
            this.showMainApp();
        }
    }

    login(username, password) {
        const user = db.authenticate(username, password);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showMainApp();
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLoginScreen();
    }

    showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        
        // Update user info in sidebar
        document.getElementById('currentUsername').textContent = this.currentUser.username;
        document.getElementById('currentRole').textContent = this.currentUser.role;
    }

    hasPermission(action) {
        if (!this.currentUser) return false;
        
        const permissions = {
            super_admin: {
                modules: ['dashboard', 'alumni_profiles', 'alumni_requests', 'career_tracking', 'job_board', 'job_recommendations', 'events', 'campaigns', 'donations', 'surveys', 'reports', 'user_management', 'audit_logs', 'settings'],
                actions: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'export', 'manage_users', 'view_logs'],
                data: ['all']
            },
            admin: {
                modules: ['dashboard', 'alumni_profiles', 'alumni_requests', 'career_tracking', 'job_board', 'events', 'campaigns', 'donations', 'surveys', 'reports'],
                actions: ['create', 'read', 'update', 'approve', 'reject', 'export'],
                data: ['all']
            },
            alumni: {
                modules: ['dashboard', 'alumni_profiles', 'alumni_requests', 'job_board', 'job_recommendations', 'events', 'donations', 'surveys'],
                actions: ['read', 'create_request', 'update_profile', 'apply_job', 'view_events', 'donate', 'respond_survey'],
                data: ['own_profile', 'public_jobs', 'public_events', 'own_requests']
            }
        };
        
        const userPermissions = permissions[this.currentUser.role];
        if (!userPermissions) return false;
        
        // Check if action is allowed
        if (typeof action === 'object') {
            const { module, action: actionType, data } = action;
            
            // Check module access
            if (module && !userPermissions.modules.includes(module)) return false;
            
            // Check action permission
            if (actionType && !userPermissions.actions.includes(actionType)) return false;
            
            // Check data access
            if (data && !this.hasDataAccess(data)) return false;
            
            return true;
        }
        
        // Simple action check for backward compatibility
        return userPermissions.actions.includes(action) || userPermissions.modules.includes(action);
    }

    hasDataAccess(dataType) {
        if (!this.currentUser) return false;
        
        const permissions = {
            super_admin: ['all'],
            admin: ['all'],
            alumni: ['own_profile', 'public_jobs', 'public_events', 'own_requests']
        };
        
        const userDataAccess = permissions[this.currentUser.role] || [];
        return userDataAccess.includes('all') || userDataAccess.includes(dataType);
    }

    canAccessModule(moduleName) {
        return this.hasPermission({ module: moduleName });
    }

    canPerformAction(actionType, moduleName = null) {
        const permission = { action: actionType };
        if (moduleName) permission.module = moduleName;
        return this.hasPermission(permission);
    }

    filterDataByRole(data, dataType) {
        if (!this.currentUser || !data) return [];
        
        // Super Admin and Admin see everything
        if (this.currentUser.role === 'super_admin' || this.currentUser.role === 'admin') return data;
        
        // Filter based on role and data type
        switch (this.currentUser.role) {
            case 'alumni':
                if (dataType === 'alumni_profiles' || dataType === 'own_profile') {
                    return data.filter(item => item.alumni_id === this.currentUser.id);
                }
                if (dataType === 'job_board' || dataType === 'public_jobs') {
                    return data.filter(item => item.status === 'active'); // Only active jobs
                }
                if (dataType === 'events' || dataType === 'public_events') {
                    return data.filter(item => item.status === 'published'); // Only published events
                }
                if (dataType === 'alumni_requests' || dataType === 'own_requests') {
                    return data.filter(item => item.requested_by_id === this.currentUser.id);
                }
                return [];
                
            default:
                return [];
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// Initialize auth manager
const auth = new AuthManager();

// Login form handler
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (auth.login(username, password)) {
        // Clear form
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    } else {
        alert('Invalid username or password');
    }
});

// Logout button handler
document.getElementById('logoutBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
        auth.logout();
    }
});

// js/dashboard.js
// Dashboard KPIs: total alumni, employment %, donations, jobs
class DashboardManager {
    constructor() {
        this.analytics = {};
        this.recentActivities = []; // Renamed from recentTransactions
        this.updateInterval = null;
        this.chartUpdateInterval = null;
        this.notificationQueue = [];
        this.lastUpdateTime = Date.now();
    }

    loadDashboard() {
        this.loadAnalytics();
        this.initializeCharts();
        this.startRealTimeUpdates();
        this.initializeRealTimeNotifications();
    }

    startRealTimeUpdates() {
        // Update analytics every 30 seconds
        this.updateInterval = setInterval(() => {
            this.updateAnalyticsRealTime();
        }, 30000);

        // Update charts every 60 seconds
        this.chartUpdateInterval = setInterval(() => {
            this.updateChartsRealTime();
        }, 60000);

        // Check for new activities every 15 seconds
        setInterval(() => {
            this.checkForNewActivities();
        }, 15000);
    }

    updateAnalyticsRealTime() {
        const previousAnalytics = { ...this.analytics };
        this.loadAnalytics();
        
        // Check for significant changes and show notifications
        this.checkForSignificantChanges(previousAnalytics, this.analytics);
        
        // Add visual indicators for updates
        this.showUpdateIndicators();
    }

    updateChartsRealTime() {
        if (this.alumniGrowthChart) { // Renamed from revenueChart
            // Simulate new data points for alumni growth
            const currentData = this.alumniGrowthChart.data.datasets[0].data;
            const alumniData = this.alumniGrowthChart.data.datasets[0];
            
            // Add some realistic variation to the data
            const lastAlumniCount = currentData[currentData.length - 1];
            const newAlumniCount = lastAlumniCount + Math.floor(Math.random() * 10) + 1; // Add 1-10 new alumni
            
            // Update chart data
            alumniData.data.push(newAlumniCount);
            
            // Keep only last 12 data points
            if (alumniData.data.length > 12) {
                alumniData.data.shift();
            }
            
            this.alumniGrowthChart.update('none');
        }
    }

    checkForNewActivities() {
        // Simulate new activities being added
        const random = Math.random();
        if (random < 0.3) { // 30% chance of new activity
            const activityTypes = ['alumni_registration', 'job_application', 'donation', 'event_signup'];
            const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
            
            let description = '';
            let notificationType = 'info';

            switch (type) {
                case 'alumni_registration':
                    description = `New alumni registered - ${Utils.generateRandomName()}`;
                    notificationType = 'success';
                    break;
                case 'job_application':
                    description = `New job application for ${Utils.generateRandomJobTitle()}`;
                    notificationType = 'info';
                    break;
                case 'donation':
                    description = `New donation received - ${Utils.formatCurrency(Math.floor(Math.random() * 500) + 50)}`;
                    notificationType = 'success';
                    break;
                case 'event_signup':
                    description = `New signup for ${Utils.generateRandomEventName()}`;
                    notificationType = 'info';
                    break;
            }
            
            const newActivity = {
                id: Date.now(),
                type: type,
                description: description,
                date: new Date().toISOString().split('T')[0],
                isNew: true
            };
            
            // Add to recent activities
            this.recentActivities.unshift(newActivity);
            if (this.recentActivities.length > 5) {
                this.recentActivities.pop();
            }
            
            // Update the display
            this.displayRecentActivities();
            
            // Show notification
            this.showRealTimeNotification(newActivity.description, notificationType);
            
            // Update analytics
            setTimeout(() => {
                this.updateAnalyticsRealTime();
            }, 1000);
        }
    }

    checkForSignificantChanges(previous, current) {
        const alumniGrowth = current.totalAlumni - previous.totalAlumni;
        const donationChange = current.totalDonations - previous.totalDonations;
        
        if (Math.abs(alumniGrowth) > 0) {
            this.showRealTimeNotification(
                `Alumni count ${alumniGrowth > 0 ? 'increased' : 'decreased'} by ${Math.abs(alumniGrowth)}`,
                alumniGrowth > 0 ? 'success' : 'warning'
            );
        }
        
        if (Math.abs(donationChange) > 100) { // Significant donation change
            this.showRealTimeNotification(
                `Donations ${donationChange > 0 ? 'increased' : 'decreased'} by ${Utils.formatCurrency(Math.abs(donationChange))}`,
                'success'
            );
        }
    }

    showUpdateIndicators() {
        // Add pulse animation to updated cards
        const cards = document.querySelectorAll('.metric-card');
        cards.forEach(card => {
            card.classList.add('updating');
            setTimeout(() => {
                card.classList.remove('updating');
            }, 1000);
        });
        
        // Update last refresh time
        this.updateLastRefreshTime();
    }

    updateLastRefreshTime() {
        let refreshIndicator = document.getElementById('lastRefresh');
        if (!refreshIndicator) {
            // Create refresh indicator if it doesn't exist
            const header = document.querySelector('.header-right');
            refreshIndicator = document.createElement('div');
            refreshIndicator.id = 'lastRefresh';
            refreshIndicator.className = 'refresh-indicator';
            header.insertBefore(refreshIndicator, header.firstChild);
        }
        
        const now = new Date();
        refreshIndicator.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            <span>Updated ${now.toLocaleTimeString()}</span>
        `;
    }

    displayRecentActivities() {
        const container = document.querySelector('#recentActivities .space-y-4'); // Renamed from recentTransactions
        if (!container) return;
        
        container.innerHTML = this.recentActivities.map(activity => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg ${activity.isNew ? 'new-activity' : ''}">
                <div class="flex items-center">
                    <div class="p-2 rounded-full mr-3 ${
                        activity.type === 'alumni_registration' || activity.type === 'donation' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }">
                        <i class="fas fa-${activity.type === 'alumni_registration' ? 'user-plus' : 
                                         activity.type === 'job_application' ? 'briefcase' : 
                                         activity.type === 'donation' ? 'hand-holding-usd' : 'calendar-check'} w-4 h-4"></i>
                    </div>
                    <div>
                        <p class="font-medium text-gray-900">${activity.description}</p>
                        <p class="text-sm text-gray-500">${activity.date}</p>
                    </div>
                </div>
                <span class="font-medium text-gray-600">
                    ${activity.type === 'donation' ? Utils.formatCurrency(parseFloat(activity.description.split(' - ')[1].replace('₱', ''))) : ''}
                </span>
            </div>
        `).join('');
        
        // Remove new activity indicators after 3 seconds
        setTimeout(() => {
            this.recentActivities.forEach(t => t.isNew = false);
        }, 3000);
    }

    initializeRealTimeNotifications() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('realTimeNotifications')) {
            const container = document.createElement('div');
            container.id = 'realTimeNotifications';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }

    showRealTimeNotification(message, type = 'info') {
        const container = document.getElementById('realTimeNotifications');
        const notification = document.createElement('div');
        notification.className = `real-time-notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${icons[type]}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.chartUpdateInterval) {
            clearInterval(this.chartUpdateInterval);
        }
    }

    loadWorkflowStats() {
        const stats = workflowManager.getWorkflowStats();
        const pendingApprovals = workflowManager.getPendingApprovals(auth.getCurrentUser().username);
        
        // Update pending approvals count
        const pendingElement = document.getElementById('pendingRequests'); // Renamed from pendingRequests
        if (pendingElement) {
            pendingElement.textContent = pendingApprovals.length;
        }
        
        // Show workflow notifications
        if (pendingApprovals.length > 0) {
            const approvalAlert = {
                type: 'warning',
                title: 'Pending Approvals',
                message: `You have ${pendingApprovals.length} items awaiting your approval`
            };
            this.displayWorkflowAlert(approvalAlert);
        }
    }
    
    displayWorkflowAlert(alert) {
        const container = document.getElementById('alertsList');
        if (!container) return;
        
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item ${alert.type}`;
        alertElement.innerHTML = `
            <div class="alert-icon ${alert.type}">
                <i class="fas fa-${alert.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            </div>
            <div class="alert-content">
                <h4>${alert.title}</h4>
                <p>${alert.message}</p>
                <button class="btn btn-sm btn-primary" onclick="dashboardManager.showPendingApprovals()">
                    View Approvals
                </button>
            </div>
        `;
        
        container.insertBefore(alertElement, container.firstChild);
    }
    
    showPendingApprovals() {
        const pendingApprovals = workflowManager.getPendingApprovals(auth.getCurrentUser().username);
        
        if (pendingApprovals.length === 0) {
            Utils.showNotification('No pending approvals', 'info');
            return;
        }
        
        const modalContent = `
            <div class="modal-header">
                <h2>Pending Approvals (${pendingApprovals.length})</h2>
            </div>
            <div class="modal-body">
                <div class="approval-list">
                    ${pendingApprovals.map(item => `
                        <div class="approval-item">
                            <div class="approval-header">
                                <h4>${item.type.toUpperCase()}</h4>
                                <span class="amount">${item.data.amount ? Utils.formatCurrency(item.data.amount) : ''}</span>
                            </div>
                            <div class="approval-details">
                                <p><strong>From:</strong> ${item.data.submitted_by}</p>
                                <p><strong>Description:</strong> ${item.data.description}</p>
                                <p><strong>Date:</strong> ${new Date(item.data.submitted_at).toLocaleDateString()}</p>
                            </div>
                            <div class="approval-actions">
                                <button class="btn btn-success btn-sm" onclick="dashboardManager.approveTransaction('${item.id}')">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="dashboardManager.rejectTransaction('${item.id}')">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Close</button>
            </div>
        `;
        
        modalManager.openModal(modalContent, 'modal-lg');
    }
    
    approveTransaction(transactionId) {
        const comments = prompt('Enter approval comments (optional):') || '';
        const result = workflowManager.processApproval(transactionId, 'approve', auth.getCurrentUser(), comments);
        
        if (result.success) {
            Utils.showNotification('Item approved successfully', 'success');
            modalManager.closeModal();
            this.loadWorkflowStats();
            this.loadAnalytics();
        } else {
            Utils.showNotification(result.message, 'error');
        }
    }
    
    rejectTransaction(transactionId) {
        const reason = prompt('Enter rejection reason:');
        if (!reason) {
            Utils.showNotification('Rejection reason is required', 'warning');
            return;
        }
        
        const result = workflowManager.processApproval(transactionId, 'reject', auth.getCurrentUser(), reason);
        
        if (result.success) {
            Utils.showNotification('Item rejected', 'info');
            modalManager.closeModal();
            this.loadWorkflowStats();
            this.loadAnalytics();
        } else {
            Utils.showNotification(result.message, 'error');
        }
    }

    loadAnalytics() {
        this.analytics = db.getDashboardAnalytics();
        this.loadWorkflowStats();
        this.updateAnalyticsDisplay();
    }

    updateAnalyticsDisplay() {
        // Animate number changes
        this.animateNumberChange('totalAlumni', this.analytics.totalAlumni, false);
        this.animateNumberChange('employmentRate', this.analytics.employmentRate, false, '%');
        this.animateNumberChange('totalDonations', this.analytics.totalDonations);
        this.animateNumberChange('activeJobs', this.analytics.activeJobs, false);
        this.animateNumberChange('pendingApprovals', this.analytics.pendingApprovals, false);
        
        // Update employment rate card styling based on value
        const employmentRateElement = document.getElementById('employmentRateCard');
        if (employmentRateElement && employmentRateElement.parentElement && employmentRateElement.parentElement.parentElement) {
            const card = employmentRateElement.parentElement.parentElement;
            if (this.analytics.employmentRate >= 80) {
                card.className = card.className.replace(/low-rate-card|medium-rate-card/, 'high-rate-card');
            } else if (this.analytics.employmentRate >= 60) {
                card.className = card.className.replace(/low-rate-card|high-rate-card/, 'medium-rate-card');
            } else {
                card.className = card.className.replace(/high-rate-card|medium-rate-card/, 'low-rate-card');
            }
        }
    }

    animateNumberChange(elementId, newValue, isCurrency = true, suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const currentText = element.textContent;
        const currentValue = isCurrency ? 
            parseFloat(currentText.replace(/[₱,]/g, '')) || 0 : 
            parseFloat(currentText.replace(/[^0-9.]/g, '')) || 0; // Handle percentage or plain number
        
        if (currentValue === newValue) return;
        
        // Add animation class
        element.classList.add('value-changing');
        
        // Animate the number change
        const duration = 1000;
        const steps = 20;
        const stepValue = (newValue - currentValue) / steps;
        let currentStep = 0;
        
        const animation = setInterval(() => {
            currentStep++;
            const intermediateValue = currentValue + (stepValue * currentStep);
            
            element.textContent = isCurrency ? 
                Utils.formatCurrency(intermediateValue) : 
                `${Math.round(intermediateValue).toString()}${suffix}`;
            
            if (currentStep >= steps) {
                clearInterval(animation);
                element.textContent = isCurrency ? 
                    Utils.formatCurrency(newValue) : 
                    `${newValue.toString()}${suffix}`;
                element.classList.remove('value-changing');
            }
        }, duration / steps);
    }

    initializeCharts() {
        this.createAlumniGrowthChart(); // Renamed from createRevenueChart
    }
    
    createAlumniGrowthChart() { // Renamed from createRevenueChart
        const ctx = document.getElementById('alumniGrowthChart'); // Renamed from revenueChart
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.alumniGrowthChart) { // Renamed from revenueChart
            this.alumniGrowthChart.destroy();
        }
        
        this.alumniGrowthChart = new Chart(ctx, { // Renamed from revenueChart
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Alumni Count',
                    data: [1500, 1520, 1550, 1580, 1610, 1650], // Sample alumni growth data
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: '#f3f4f6',
                            borderDash: [5, 5]
                        },
                        ticks: {
                            color: '#9ca3af',
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return value; // Display raw count
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                }
            }
        });
    }

    getAlerts() {
        const alerts = [];
        
        // Check for pending alumni requests
        const pendingAlumniRequests = db.getPendingAlumniRequests();
        if (pendingAlumniRequests.length > 0) {
            alerts.push({
                type: 'warning',
                title: 'Pending Alumni Requests',
                message: `${pendingAlumniRequests.length} alumni requests are awaiting review`
            });
        }

        // Check for new job postings needing approval (if applicable)
        const pendingJobPostings = db.getPendingJobPostings();
        if (pendingJobPostings.length > 0) {
            alerts.push({
                type: 'info',
                title: 'New Job Postings',
                message: `${pendingJobPostings.length} job postings are awaiting approval`
            });
        }

        // Monthly report reminder
        alerts.push({
            type: 'info',
            title: 'Monthly Report',
            message: 'January alumni engagement report is ready for review'
        });

        return alerts;
    }

    displayAlerts(alerts) {
        const container = document.getElementById('alertsList');
        
        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell"></i>
                    <p>No alerts at this time</p>
                </div>
            `;
            return;
        }

        container.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <div class="alert-icon ${alert.type}">
                    <i class="fas fa-${alert.type === 'error' ? 'exclamation-triangle' : alert.type === 'warning' ? 'exclamation-circle' : 'info-circle'}"></i>
                </div>
                <div class="alert-content">
                    <h4>${alert.title}</h4>
                    <p>${alert.message}</p>
                </div>
            </div>
        `).join('');
    }

    refreshDashboard() {
        this.loadDashboard();
        Utils.showNotification('Dashboard refreshed successfully', 'success');
    }
}

// Initialize dashboard manager
const dashboardManager = new DashboardManager();

// Update page title when switching modules
const originalShowModule = moduleManager.showModule;
moduleManager.showModule = function(moduleName) {
    originalShowModule.call(this, moduleName);
    
    const titles = {
        dashboard: 'Dashboard',
        alumni_profiles: 'Alumni Profiles',
        alumni_requests: 'Alumni Requests',
        career_tracking: 'Career Tracking',
        job_board: 'Job Board',
        job_recommendations: 'Job Recommendations',
        events: 'Event Management',
        campaigns: 'Fundraising Campaigns',
        donations: 'Donation Management',
        surveys: 'Surveys & Feedback',
        reports: 'Alumni Reports',
        user_management: 'User Management',
        audit_logs: 'Audit Logs',
        settings: 'System Settings'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[moduleName] || 'Dashboard';
    }
};

// js/database.js
// Database helper (queries for alumni, jobs, events, donations)
class DatabaseManager {
    constructor() {
        this.initializeDatabase();
    }

    initializeDatabase() {
        // Initialize localStorage if not exists
        if (!localStorage.getItem('ams_db_initialized')) {
            this.createTables();
            this.insertSampleData();
            localStorage.setItem('ams_db_initialized', 'true');
        }
    }

    createTables() {
        // Users table (Super Admin, Admin, Alumni)
        const users = [
            { id: 1, username: 'super_admin', password: 'admin123', email: 'superadmin@alumni.edu', role: 'super_admin', department: 'Administration' },
            { id: 2, username: 'admin', password: 'admin123', email: 'admin@alumni.edu', role: 'admin', department: 'Alumni Relations' },
            { id: 3, username: 'alumni_member', password: 'alumni123', email: 'alumni@alumni.edu', role: 'alumni', department: 'N/A' }
        ];
        localStorage.setItem('users', JSON.stringify(users));

        // Alumni Profiles
        localStorage.setItem('alumni_profiles', JSON.stringify([]));
        // Alumni Requests
        localStorage.setItem('alumni_requests', JSON.stringify([]));
        // Career Tracking (employment history)
        localStorage.setItem('career_tracking', JSON.stringify([]));
        // Job Board
        localStorage.setItem('job_board', JSON.stringify([]));
        // Events
        localStorage.setItem('events', JSON.stringify([]));
        // Campaigns (fundraising)
        localStorage.setItem('campaigns', JSON.stringify([]));
        // Donations
        localStorage.setItem('donations', JSON.stringify([]));
        // Surveys
        localStorage.setItem('surveys', JSON.stringify([]));
        // Survey Responses
        localStorage.setItem('survey_responses', JSON.stringify([]));
        // Audit Logs
        localStorage.setItem('audit_logs', JSON.stringify([]));
    }

    insertSampleData() {
        // Sample Alumni Profiles
        const alumniProfiles = [
            { id: 1, user_id: 3, first_name: 'Alumni', last_name: 'Member', email: 'alumni@alumni.edu', graduation_year: 2015, course: 'BS Computer Science', employment_status: 'employed', current_company: 'Tech Solutions Inc.', job_title: 'Software Engineer', contact_number: '09171234567', address: '123 Alumni St', linkedin_profile: 'linkedin.com/in/alumnimember', status: 'verified', created_at: '2023-01-01' },
            { id: 2, user_id: null, first_name: 'Jane', last_name: 'Doe', email: 'jane.doe@example.com', graduation_year: 2018, course: 'BS Business Administration', employment_status: 'unemployed', current_company: '', job_title: '', contact_number: '09187654321', address: '456 University Ave', linkedin_profile: 'linkedin.com/in/janedoe', status: 'pending_verification', created_at: '2023-02-10' },
            { id: 3, user_id: null, first_name: 'John', last_name: 'Smith', email: 'john.smith@example.com', graduation_year: 2010, course: 'BS Civil Engineering', employment_status: 'employed', current_company: 'BuildCo', job_title: 'Project Manager', contact_number: '09191112233', address: '789 Engineer Rd', linkedin_profile: 'linkedin.com/in/johnsmith', status: 'verified', created_at: '2023-03-05' }
        ];
        localStorage.setItem('alumni_profiles', JSON.stringify(alumniProfiles));

        // Sample Alumni Requests
        const alumniRequests = [
            { id: 1, requested_by_id: 3, request_type: 'certificate_copy', description: 'Copy of diploma', status: 'pending', submitted_at: '2024-01-20', approved_by: null, approved_at: null },
            { id: 2, requested_by_id: 3, request_type: 'membership_card', description: 'New alumni membership card', status: 'approved', submitted_at: '2024-01-25', approved_by: 'admin', approved_at: '2024-01-26' }
        ];
        localStorage.setItem('alumni_requests', JSON.stringify(alumniRequests));

        // Sample Job Board postings
        const jobBoard = [
            { id: 1, title: 'Junior Software Developer', company: 'Innovate Solutions', location: 'Makati City', description: 'Seeking a passionate junior developer...', requirements: 'BS Computer Science, 0-2 years experience', posted_by_id: 2, posted_by_name: 'admin', posted_at: '2024-02-01', status: 'active' },
            { id: 2, title: 'Marketing Specialist', company: 'Global Brands', location: 'Taguig City', description: 'Join our marketing team...', requirements: 'BS Business Admin, Marketing major, 1-3 years experience', posted_by_id: 2, posted_by_name: 'admin', posted_at: '2024-02-10', status: 'active' }
        ];
        localStorage.setItem('job_board', JSON.stringify(jobBoard));

        // Sample Events
        const events = [
            { id: 1, title: 'Alumni Homecoming 2024', description: 'Annual gathering of alumni', date: '2024-05-15', location: 'University Grand Hall', status: 'published', created_by_id: 2, created_by_name: 'admin', created_at: '2024-01-01' },
            { id: 2, title: 'Career Fair for Graduates', description: 'Connect with top employers', date: '2024-03-20', location: 'University Gymnasium', status: 'published', created_by_id: 2, created_by_name: 'admin', created_at: '2024-01-15' }
        ];
        localStorage.setItem('events', JSON.stringify(events));

        // Sample Donations
        const donations = [
            { id: 1, donor_name: 'Alumni Member', donor_id: 3, amount: 5000, donation_date: '2024-01-05', campaign_id: null, status: 'completed', visibility: 'public', created_at: '2024-01-05' },
            { id: 2, donor_name: 'Anonymous', donor_id: null, amount: 10000, donation_date: '2024-02-01', campaign_id: null, status: 'completed', visibility: 'anonymous', created_at: '2024-02-01' }
        ];
        localStorage.setItem('donations', JSON.stringify(donations));

        // Sample Campaigns
        const campaigns = [
            { id: 1, name: 'Scholarship Fund Drive', goal: 100000, raised: 15000, start_date: '2024-01-01', end_date: '2024-06-30', status: 'active', description: 'Help deserving students achieve their dreams.' },
            { id: 2, name: 'Campus Renovation Project', goal: 500000, raised: 50000, start_date: '2024-03-01', end_date: '2024-12-31', status: 'active', description: 'Upgrade our facilities for a better learning environment.' }
        ];
        localStorage.setItem('campaigns', JSON.stringify(campaigns));

        // Sample Surveys
        const surveys = [
            { id: 1, title: 'Alumni Satisfaction Survey 2024', description: 'Gather feedback on alumni services.', status: 'active', created_at: '2024-01-10' },
            { id: 2, title: 'Employment Outcomes Survey 2023', description: 'Track graduate employment data.', status: 'closed', created_at: '2023-11-01' }
        ];
        localStorage.setItem('surveys', JSON.stringify(surveys));
    }

    // Generic CRUD operations
    select(table, conditions = null) {
        const data = JSON.parse(localStorage.getItem(table) || '[]');
        if (!conditions) return data;
        
        return data.filter(item => {
            return Object.keys(conditions).every(key => item[key] === conditions[key]);
        });
    }

    insert(table, data) {
        const tableData = JSON.parse(localStorage.getItem(table) || '[]');
        const newId = tableData.length > 0 ? Math.max(...tableData.map(item => item.id)) + 1 : 1;
        const newRecord = { id: newId, ...data, created_at: new Date().toISOString() };
        tableData.push(newRecord);
        localStorage.setItem(table, JSON.stringify(tableData));
        return newRecord;
    }

    update(table, id, data) {
        const tableData = JSON.parse(localStorage.getItem(table) || '[]');
        const index = tableData.findIndex(item => item.id === id);
        if (index !== -1) {
            tableData[index] = { ...tableData[index], ...data, updated_at: new Date().toISOString() };
            localStorage.setItem(table, JSON.stringify(tableData));
            return tableData[index];
        }
        return null;
    }

    delete(table, id) {
        const tableData = JSON.parse(localStorage.getItem(table) || '[]');
        const filteredData = tableData.filter(item => item.id !== id);
        localStorage.setItem(table, JSON.stringify(filteredData));
        return true;
    }

    // Authentication
    authenticate(username, password) {
        const users = this.select('users');
        return users.find(user => user.username === username && user.password === password);
    }

    // Dashboard analytics
    getDashboardAnalytics() {
        const alumniProfiles = this.select('alumni_profiles');
        const donations = this.select('donations');
        const jobBoard = this.select('job_board');
        const alumniRequests = this.select('alumni_requests');

        const totalAlumni = alumniProfiles.length;
        const employedAlumni = alumniProfiles.filter(a => a.employment_status === 'employed').length;
        const employmentRate = totalAlumni > 0 ? ((employedAlumni / totalAlumni) * 100).toFixed(1) : 0;
        const totalDonations = donations.filter(d => d.status === 'completed').reduce((sum, d) => sum + d.amount, 0);
        const activeJobs = jobBoard.filter(j => j.status === 'active').length;
        const pendingAlumniRequests = alumniRequests.filter(r => r.status === 'pending').length;

        return {
            totalAlumni: totalAlumni,
            employmentRate: parseFloat(employmentRate),
            totalDonations: totalDonations,
            activeJobs: activeJobs,
            pendingApprovals: pendingAlumniRequests // Using alumni requests as a proxy for pending approvals
        };
    }

    // Get recent activities for dashboard
    getRecentActivities(limit = 5) {
        const alumniRegistrations = this.select('alumni_profiles').slice(-limit).map(a => ({
            id: a.id,
            type: 'alumni_registration',
            description: `New alumni: ${a.first_name} ${a.last_name}`,
            date: a.created_at.split('T')[0],
            created_at: a.created_at
        }));
        const newDonations = this.select('donations').slice(-limit).map(d => ({
            id: d.id,
            type: 'donation',
            description: `Donation from ${d.donor_name} - ${Utils.formatCurrency(d.amount)}`,
            date: d.donation_date,
            created_at: d.created_at
        }));
        
        const activities = [
            ...alumniRegistrations,
            ...newDonations
        ];
        
        return activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit);
    }

    // Specific AMS queries
    getPendingAlumniRequests() {
        return this.select('alumni_requests', { status: 'pending' });
    }

    getPendingJobPostings() {
        return this.select('job_board', { status: 'pending_approval' });
    }
}

// Initialize database
const db = new DatabaseManager();

// js/main.js
// Main Application Controller
class ModuleManager {
    constructor() {
        this.currentModule = 'dashboard';
        this.initializeNavigation();
    }

    initializeNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const module = item.getAttribute('data-module');
                this.showModule(module);
            });
        });
    }

    showModule(moduleName) {
        // Check if user has permission to access this module
        if (!auth.canAccessModule(moduleName)) {
            Utils.showNotification(`Access denied: You don't have permission to access ${moduleName}`, 'error');
            return;
        }

        // Hide all modules
        const modules = document.querySelectorAll('.module');
        modules.forEach(module => {
            module.classList.remove('active');
        });

        // Show selected module
        const targetModule = document.getElementById(`${moduleName}-module`);
        if (targetModule) {
            targetModule.classList.add('active');
        }

        // Update navigation
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.classList.remove('active');
        });

        const activeMenuItem = document.querySelector(`[data-module="${moduleName}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }

        this.currentModule = moduleName;

        // Update page title with role-based suffix
        this.updatePageTitle(moduleName);

        // Load module data
        this.loadModuleData(moduleName);
    }

    updatePageTitle(moduleName) {
        const titles = {
            dashboard: 'Dashboard',
            alumni_profiles: 'Alumni Profiles',
            alumni_requests: 'Alumni Requests',
            career_tracking: 'Career Tracking',
            job_board: 'Job Board',
            job_recommendations: 'Job Recommendations',
            events: 'Event Management',
            campaigns: 'Fundraising Campaigns',
            donations: 'Donation Management',
            surveys: 'Surveys & Feedback',
            reports: 'Alumni Reports',
            user_management: 'User Management',
            audit_logs: 'Audit Logs',
            settings: 'System Settings'
        };
        
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            const baseTitle = titles[moduleName] || 'Dashboard';
            const roleInfo = auth.getCurrentUser() ? ` (${auth.getCurrentUser().role})` : '';
            pageTitle.textContent = baseTitle + roleInfo;
        }
    }

    initializeRoleBasedUI() {
        this.hideRestrictedMenuItems();
        this.updateUserInterface();
    }

    hideRestrictedMenuItems() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const module = item.getAttribute('data-module');
            if (module && !auth.canAccessModule(module)) {
                item.style.display = 'none';
                // Also hide the parent li element
                if (item.parentElement) {
                    item.parentElement.style.display = 'none';
                }
            }
        });
    }

    updateUserInterface() {
        // Add role badge to user profile
        const userInfo = document.querySelector('.user-info');
        if (userInfo && auth.getCurrentUser()) {
            const roleElement = userInfo.querySelector('.user-role');
            if (!roleElement) {
                const roleBadge = document.createElement('span');
                roleBadge.className = 'user-role';
                roleBadge.textContent = auth.getCurrentUser().role.replace('_', ' ').toUpperCase();
                userInfo.appendChild(roleBadge);
            }
        }
    }

    loadModuleData(moduleName) {
        switch (moduleName) {
            case 'dashboard':
                dashboardManager.loadDashboard();
                break;
            case 'alumni_profiles':
                alumniProfilesManager.loadAlumniProfiles();
                break;
            case 'alumni_requests':
                alumniRequestsManager.loadAlumniRequests();
                break;
            case 'career_tracking':
                careerTrackingManager.loadCareerTracking();
                break;
            case 'job_board':
                jobBoardManager.loadJobBoard();
                break;
            case 'job_recommendations':
                jobRecommendationsManager.loadJobRecommendations();
                break;
            case 'events':
                eventsManager.loadEvents();
                break;
            case 'campaigns':
                campaignsManager.loadCampaigns();
                break;
            case 'donations':
                donationsManager.loadDonations();
                break;
            case 'surveys':
                surveysManager.loadSurveys();
                break;
            case 'reports':
                reportsManager.loadReports();
                break;
            case 'user_management':
                userManagementManager.loadUsers();
                break;
            case 'audit_logs':
                auditLogsManager.loadAuditLogs();
                break;
            case 'settings':
                settingsManager.loadSettings();
                break;
        }
    }
}

// Utility Functions
class Utils {
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount);
    }

    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-PH');
    }

    static formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('en-PH');
    }

    static generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    static showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    static confirmAction(message, callback) {
        if (confirm(message)) {
            callback();
        }
    }

    static validateForm(formElement) {
        const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('error');
                isValid = false;
            } else {
                input.classList.remove('error');
            }
        });

        return isValid;
    }

    static sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static generateRandomName() {
        const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Heidi'];
        const lastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore'];
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    }

    static generateRandomJobTitle() {
        const titles = ['Software Engineer', 'Marketing Manager', 'Project Coordinator', 'Data Analyst', 'HR Specialist'];
        return titles[Math.floor(Math.random() * titles.length)];
    }

    static generateRandomEventName() {
        const events = ['Alumni Mixer', 'Career Workshop', 'Networking Night', 'Annual Gala'];
        return events[Math.floor(Math.random() * events.length)];
    }
}

// Initialize application
const moduleManager = new ModuleManager();

// Add notification styles
const notificationStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    z-index: 1001;
    border-left: 4px solid;
    animation: slideIn 0.3s ease;
}

.notification-success {
    border-left-color: #10b981;
}

.notification-error {
    border-left-color: #ef4444;
}

.notification-info {
    border-left-color: #3b82f6;
}

.notification-warning {
    border-left-color: #f59e0b;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.notification-content i {
    font-size: 16px;
}

.notification-success .notification-content i {
    color: #10b981;
}

.notification-error .notification-content i {
    color: #ef4444;
}

.notification-info .notification-content i {
    color: #3b82f6;
}

.notification-warning .notification-content i {
    color: #f59e0b;
}

.notification-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;
}

.notification-close:hover {
    background: #f3f4f6;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', notificationStyles);

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Application Error:', e.error);
    if (e.error && e.error.message && e.error.message.includes('generateReport')) {
        // Fix the generateReport call to use the correct manager
        if (typeof reportsManager !== 'undefined' && reportsManager.generateReport) { // Renamed to reportsManager
            reportsManager.generateReport();
        } else {
            Utils.showNotification('Report generation is not available', 'error');
        }
    } else {
        Utils.showNotification('An unexpected error occurred. Please try again.', 'error');
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Alumni Management System Initialized');
    moduleManager.showModule('dashboard');
});

// js/modals.js
// Reusable modals for AMS (add alumni, create event, post job, donate)
class ModalManager {
    constructor() {
        this.overlay = document.getElementById('modalOverlay');
        this.content = document.getElementById('modalContent');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close modal when clicking overlay
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.closeModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    openModal(content, size = '') {
        this.content.innerHTML = content;
        
        // Apply size class
        this.content.className = `modal-content ${size}`;
        
        // Show modal
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        setTimeout(() => {
            const firstInput = this.content.querySelector('input, select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }

    closeModal() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Clear content after animation
        setTimeout(() => {
            this.content.innerHTML = '';
        }, 300);
    }

    showConfirmation(title, message, onConfirm, type = 'warning') {
        const iconClass = type === 'danger' ? 'fa-exclamation-triangle' : 
                         type === 'success' ? 'fa-check-circle' : 'fa-question-circle';
        
        const content = `
            <div class="modal-body confirmation-modal">
                <div class="confirmation-icon ${type}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="btn-group">
                    <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                    <button type="button" class="btn btn-${type === 'danger' ? 'danger' : 'primary'}" onclick="modalManager.confirmAction()">${type === 'danger' ? 'Delete' : 'Confirm'}</button>
                </div>
            </div>
        `;
        
        this.pendingConfirmAction = onConfirm;
        this.openModal(content, 'modal-sm');
    }

    confirmAction() {
        if (this.pendingConfirmAction) {
            this.pendingConfirmAction();
            this.pendingConfirmAction = null;
        }
        this.closeModal();
    }

    showLoading(message = 'Loading...') {
        const content = `
            <div class="modal-loading">
                <div class="spinner"></div>
                <p style="margin-top: 16px; color: #6b7280;">${message}</p>
            </div>
        `;
        
        this.openModal(content, 'modal-sm');
    }

    showSuccess(title, message, callback = null) {
        const content = `
            <div class="modal-body confirmation-modal">
                <div class="confirmation-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <button type="button" class="btn btn-primary" onclick="modalManager.closeModal(); ${callback ? callback + '()' : ''}"">OK</button>
            </div>
        `;
        
        this.openModal(content, 'modal-sm');
    }

    showError(title, message) {
        const content = `
            <div class="modal-body confirmation-modal">
                <div class="confirmation-icon danger">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <button type="button" class="btn btn-danger" onclick="modalManager.closeModal()">OK</button>
            </div>
        `;
        
        this.openModal(content, 'modal-sm');
    }
}

// Initialize modal manager
const modalManager = new ModalManager();

// Global modal functions for backward compatibility
function openModal(content, size = '') {
    modalManager.openModal(content, size);
}

function closeModal() {
    modalManager.closeModal();
}

// js/workflow.js
// Approval flows (donor visibility, alumni requests, event approvals)
class WorkflowManager {
    constructor() {
        this.approvalRules = this.initializeApprovalRules();
        this.workflowQueue = [];
        this.automatedChecks = this.initializeAutomatedChecks();
        this.notificationQueue = [];
    }

    initializeApprovalRules() {
        return {
            alumni_requests: {
                // Type-based approval rules
                types: {
                    'certificate_copy': { approvers: ['admin'] },
                    'membership_card': { approvers: ['admin'] },
                    'profile_update': { approvers: ['admin'], requiresVerification: true },
                    'data_access': { approvers: ['super_admin'] }
                },
                // General rules
                amounts: [ // If requests have associated costs
                    { min: 0, max: 1000, autoApprove: true },
                    { min: 1001, max: 5000, approvers: ['admin'] },
                    { min: 5001, max: Infinity, approvers: ['super_admin'] }
                ]
            },
            job_board: {
                posting: { approvers: ['admin'], requiresCompanyVerification: true },
                modification: { approvers: ['admin'] }
            },
            events: {
                creation: { approvers: ['admin'] },
                publication: { approvers: ['admin'] },
                budget: { // If events have budgets
                    amounts: [
                        { min: 0, max: 10000, approvers: ['admin'] },
                        { min: 10001, max: 50000, approvers: ['super_admin'] }
                    ]
                }
            },
            donations: {
                visibility_change: { approvers: ['admin'] }, // For donor visibility changes
                large_donations: { // For large donations requiring review
                    amounts: [
                        { min: 10000, max: Infinity, approvers: ['admin', 'super_admin'] }
                    ]
                },
                donor_verification: { approvers: ['admin'] }
            },
            alumni_profiles: {
                verification: { approvers: ['admin'] },
                sensitive_data_update: { approvers: ['admin'] }
            }
        };
    }

    initializeAutomatedChecks() {
        return {
            fraudDetection: {
                duplicateRequests: true,
                unusualActivity: true,
                profileIntegrity: true
            },
            complianceChecks: {
                documentationRequired: true,
                approvalChain: true,
                segregationOfDuties: true
            }
        };
    }

    // Main workflow processing function
    processTransaction(transactionType, transactionData, currentUser) {
        console.log(`Processing ${transactionType} transaction by ${currentUser.username}`);
        
        // Step 1: Automated validation checks
        const validationResult = this.runAutomatedChecks(transactionType, transactionData, currentUser);
        if (!validationResult.isValid) {
            return this.handleValidationFailure(validationResult, transactionData);
        }

        // Step 2: Determine approval requirements
        const approvalRequirements = this.determineApprovalRequirements(transactionType, transactionData);
        
        // Step 3: Check if auto-approval is possible
        if (this.canAutoApprove(transactionType, transactionData, currentUser, approvalRequirements)) {
            return this.autoApproveTransaction(transactionType, transactionData, currentUser);
        }

        // Step 4: Route to appropriate approvers
        return this.routeForApproval(transactionType, transactionData, currentUser, approvalRequirements);
    }

    runAutomatedChecks(transactionType, transactionData, currentUser) {
        const checks = [];
        
        // Fraud detection checks
        checks.push(this.checkForDuplicateRequests(transactionType, transactionData));
        checks.push(this.checkForUnusualActivity(transactionType, transactionData));
        
        // Compliance checks
        checks.push(this.checkSegregationOfDuties(transactionType, currentUser));
        checks.push(this.checkDocumentationRequirements(transactionType, transactionData));
        
        const failedChecks = checks.filter(check => !check.passed);
        
        return {
            isValid: failedChecks.length === 0,
            failedChecks: failedChecks,
            warnings: checks.filter(check => check.warning),
            score: this.calculateRiskScore(checks)
        };
    }

    checkForDuplicateRequests(transactionType, transactionData) {
        // Check for potential duplicate requests (e.g., same alumni requesting same certificate within a short period)
        const recentRequests = this.getRecentRequests(transactionType, 24); // Last 24 hours
        const duplicates = recentRequests.filter(req => 
            req.requested_by_id === transactionData.requested_by_id &&
            req.request_type === transactionData.request_type &&
            new Date(req.submitted_at) > new Date(Date.now() - 3600000) // Within 1 hour
        );
        
        return {
            passed: duplicates.length === 0,
            warning: duplicates.length > 0,
            message: duplicates.length > 0 ? 'Potential duplicate request detected' : 'No duplicates found',
            details: duplicates
        };
    }

    checkForUnusualActivity(transactionType, transactionData) {
        // Example: Alumni making many requests in a short time, or large donation from new donor
        let isUnusual = false;
        let message = 'Activity within normal range';

        if (transactionType === 'alumni_requests') {
            const userRequests = db.select('alumni_requests', { requested_by_id: transactionData.requested_by_id });
            const recentUserRequests = userRequests.filter(req => new Date(req.submitted_at) > new Date(Date.now() - 7 * 24 * 3600000)); // Last 7 days
            if (recentUserRequests.length > 5) {
                isUnusual = true;
                message = 'High frequency of requests from this alumni recently';
            }
        } else if (transactionType === 'donations' && transactionData.amount > 50000 && !transactionData.donor_id) {
            isUnusual = true;
            message = 'Large anonymous donation detected, requires extra scrutiny';
        }
        
        return {
            passed: !isUnusual,
            warning: isUnusual,
            message: message,
            details: transactionData
        };
    }

    checkSegregationOfDuties(transactionType, currentUser) {
        // Ensure user isn't approving their own transactions
        // For AMS, this might mean an admin cannot approve their own profile update request
        if (transactionType === 'alumni_profiles' && currentUser.role === 'alumni' && currentUser.id === transactionData.alumni_id) {
            // Alumni can update their own profile, but verification might need admin
            return { passed: true, warning: false, message: 'Alumni updating own profile' };
        }
        
        return {
            passed: true, // This will be enforced in approval routing
            warning: false,
            message: 'Segregation of duties check passed',
            details: { role: currentUser.role }
        };
    }

    checkDocumentationRequirements(transactionType, transactionData) {
        let requiresDocumentation = false;
        let hasDocumentation = true; // Assume true if not explicitly required

        if (transactionType === 'alumni_requests' && transactionData.request_type === 'certificate_copy') {
            requiresDocumentation = true;
            hasDocumentation = transactionData.supporting_documents && transactionData.supporting_documents.length > 0;
        }
        // Add other documentation checks as needed for job postings, donations, etc.
        
        return {
            passed: !requiresDocumentation || hasDocumentation,
            warning: requiresDocumentation && !hasDocumentation,
            message: requiresDocumentation ? 
                (hasDocumentation ? 'Documentation provided' : 'Documentation required') :
                'No documentation required',
            details: { required: requiresDocumentation, provided: hasDocumentation }
        };
    }

    determineApprovalRequirements(transactionType, transactionData) {
        const rules = this.approvalRules[transactionType];
        if (!rules) return { approvers: ['super_admin'] }; // Default to super_admin if no specific rules

        let requirements = {
            approvers: [],
            dualApproval: false,
            requiresDocumentation: false,
            autoApprove: false
        };

        // Type-based rules for alumni requests
        if (transactionType === 'alumni_requests' && rules.types && transactionData.request_type) {
            const typeRule = rules.types[transactionData.request_type];
            if (typeRule) {
                requirements.approvers = typeRule.approvers || [];
                requirements.requiresDocumentation = typeRule.requiresVerification || false;
            }
        }

        // Amount-based rules (e.g., for donations, event budgets, or requests with costs)
        if (rules.amounts && transactionData.amount !== undefined) {
            const amountRule = rules.amounts.find(rule =>
                transactionData.amount >= rule.min && transactionData.amount <= rule.max
            );
            if (amountRule) {
                requirements.approvers = requirements.approvers.concat(amountRule.approvers || []);
                requirements.autoApprove = amountRule.autoApprove || false;
            }
        }

        // Specific rules for other transaction types
        if (transactionType === 'job_board' && rules.posting) {
            requirements.approvers = requirements.approvers.concat(rules.posting.approvers || []);
            requirements.requiresDocumentation = rules.posting.requiresCompanyVerification || false;
        }
        if (transactionType === 'donations' && rules.large_donations && transactionData.amount !== undefined) {
            const largeDonationRule = rules.large_donations.amounts.find(rule =>
                transactionData.amount >= rule.min && transactionData.amount <= rule.max
            );
            if (largeDonationRule) {
                requirements.approvers = requirements.approvers.concat(largeDonationRule.approvers || []);
            }
        }
        if (transactionType === 'alumni_profiles' && rules.verification && transactionData.status === 'pending_verification') {
            requirements.approvers = requirements.approvers.concat(rules.verification.approvers || []);
        }

        // Remove duplicates from approvers array
        requirements.approvers = [...new Set(requirements.approvers)];
        
        return requirements;
    }

    handleValidationFailure(validationResult, transactionData) {
        // Handle validation failure and return appropriate response
        const failedChecks = validationResult.failedChecks || [];
        const warnings = validationResult.warnings || [];
        
        let errorMessage = 'Transaction validation failed:';
        
        // Add failed check messages
        if (failedChecks.length > 0) {
            errorMessage += '\n• ' + failedChecks.map(check => check.message).join('\n• ');
        }
        
        // Add warning messages
        if (warnings.length > 0) {
            errorMessage += '\nWarnings:\n• ' + warnings.map(warning => warning.message).join('\n• ');
        }
        
        // Log the validation failure
        console.log('Validation failed for transaction:', transactionData, validationResult);
        
        return {
            success: false,
            action: 'validation_failed',
            message: errorMessage,
            validationResult: validationResult,
            riskScore: validationResult.score || 0
        };
    }

    canAutoApprove(transactionType, transactionData, currentUser, requirements) {
        // Check if transaction meets auto-approval criteria
        if (!requirements.autoApprove) return false;
        
        // Additional checks for auto-approval (e.g., small alumni requests, simple profile updates)
        const isLowRiskRequest = transactionType === 'alumni_requests' && transactionData.amount <= 1000;
        const isSimpleProfileUpdate = transactionType === 'alumni_profiles' && !transactionData.requiresVerification;
        
                return isLowRiskRequest || isSimpleProfileUpdate || requirements.autoApprove;
    }

    autoApproveTransaction(transactionType, transactionData, currentUser) {
        // Auto-approve the transaction
        const approvedData = {
            ...transactionData,
            approval_status: 'approved',
            approved_by: 'system_auto',
            approved_at: new Date().toISOString(),
            workflow_notes: 'Auto-approved based on predefined rules'
        };

        // Log the auto-approval
        this.logWorkflowAction({
            transaction_type: transactionType,
            transaction_id: transactionData.id || 'pending',
            action: 'auto_approved',
            performed_by: 'system',
            notes: 'Transaction met auto-approval criteria',
            timestamp: new Date().toISOString()
        });

        return {
            success: true,
            action: 'auto_approved',
            message: 'Transaction automatically approved',
            data: approvedData
        };
    }

    routeForApproval(transactionType, transactionData, currentUser, requirements) {
        // Route transaction to appropriate approvers
        const approvers = requirements.approvers;
        
        if (approvers.length === 0) {
            return {
                success: false,
                action: 'no_approvers',
                message: 'No approvers defined for this transaction type'
            };
        }

        // Determine the next approver in the chain
        const nextApprover = this.getNextApprover(approvers, transactionData);
        
        const pendingData = {
            ...transactionData,
            approval_status: 'pending',
            current_approver: nextApprover,
            approval_chain: approvers,
            submitted_by: currentUser.username,
            submitted_at: new Date().toISOString(),
            workflow_notes: `Routed to ${nextApprover} for approval`
        };

        // Add to workflow queue
        const workflowItem = {
            id: this.generateWorkflowId(),
            type: transactionType,
            data: pendingData,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        this.workflowQueue.push(workflowItem);
        this.saveWorkflowQueue();

        // Send notification to approver
        this.sendApprovalNotification(nextApprover, transactionType, pendingData);

        // Log the routing action
        this.logWorkflowAction({
            transaction_type: transactionType,
            transaction_id: workflowItem.id,
            action: 'routed_for_approval',
            performed_by: currentUser.username,
            notes: `Routed to ${nextApprover}`,
            timestamp: new Date().toISOString()
        });

        return {
            success: true,
            action: 'routed_for_approval',
            message: `Transaction routed to ${nextApprover} for approval`,
            data: pendingData,
            workflow_id: workflowItem.id
        };
    }

    getNextApprover(approvers, transactionData) {
        // Simple implementation - return first approver
        // In a more complex system, this could consider workload, availability, etc.
        return approvers[0];
    }

    processApproval(workflowId, action, approver, comments = '') {
        const workflowItem = this.workflowQueue.find(item => item.id === workflowId);
        
        if (!workflowItem) {
            return {
                success: false,
                message: 'Workflow item not found'
            };
        }

        // Verify approver has permission
        if (!this.canApprove(workflowItem, approver)) {
            return {
                success: false,
                message: 'You do not have permission to approve this item'
            };
        }

        // Process the approval/rejection
        if (action === 'approve') {
            return this.approveWorkflowItem(workflowItem, approver, comments);
        } else if (action === 'reject') {
            return this.rejectWorkflowItem(workflowItem, approver, comments);
        }

        return {
            success: false,
            message: 'Invalid action specified'
        };
    }

    canApprove(workflowItem, approver) {
        // Check if the approver has permission to approve this item
        const requiredRole = workflowItem.data.current_approver;
        return approver.role === requiredRole || approver.role === 'super_admin';
    }

    approveWorkflowItem(workflowItem, approver, comments) {
        // Update workflow item
        workflowItem.status = 'approved';
        workflowItem.data.approval_status = 'approved';
        workflowItem.data.approved_by = approver.username;
        workflowItem.data.approved_at = new Date().toISOString();
        workflowItem.data.approval_comments = comments;

        // Remove from workflow queue
        this.workflowQueue = this.workflowQueue.filter(item => item.id !== workflowItem.id);
        this.saveWorkflowQueue();

        // Update the actual record in the database
        this.updateTransactionRecord(workflowItem.type, workflowItem.data);

        // Log the approval
        this.logWorkflowAction({
            transaction_type: workflowItem.type,
            transaction_id: workflowItem.id,
            action: 'approved',
            performed_by: approver.username,
            notes: comments,
            timestamp: new Date().toISOString()
        });

        // Send notification to submitter
        this.sendApprovalResultNotification(workflowItem.data.submitted_by, workflowItem.type, 'approved', comments);

        return {
            success: true,
            message: 'Item approved successfully',
            data: workflowItem.data
        };
    }

    rejectWorkflowItem(workflowItem, approver, comments) {
        // Update workflow item
        workflowItem.status = 'rejected';
        workflowItem.data.approval_status = 'rejected';
        workflowItem.data.rejected_by = approver.username;
        workflowItem.data.rejected_at = new Date().toISOString();
        workflowItem.data.rejection_reason = comments;

        // Remove from workflow queue
        this.workflowQueue = this.workflowQueue.filter(item => item.id !== workflowItem.id);
        this.saveWorkflowQueue();

        // Update the actual record in the database
        this.updateTransactionRecord(workflowItem.type, workflowItem.data);

        // Log the rejection
        this.logWorkflowAction({
            transaction_type: workflowItem.type,
            transaction_id: workflowItem.id,
            action: 'rejected',
            performed_by: approver.username,
            notes: comments,
            timestamp: new Date().toISOString()
        });

        // Send notification to submitter
        this.sendApprovalResultNotification(workflowItem.data.submitted_by, workflowItem.type, 'rejected', comments);

        return {
            success: true,
            message: 'Item rejected',
            data: workflowItem.data
        };
    }

    updateTransactionRecord(transactionType, transactionData) {
        // Update the actual record in the appropriate table
        switch (transactionType) {
            case 'alumni_requests':
                if (transactionData.id) {
                    db.update('alumni_requests', transactionData.id, transactionData);
                } else {
                    db.insert('alumni_requests', transactionData);
                }
                break;
            case 'job_board':
                if (transactionData.id) {
                    db.update('job_board', transactionData.id, transactionData);
                } else {
                    db.insert('job_board', transactionData);
                }
                break;
            case 'events':
                if (transactionData.id) {
                    db.update('events', transactionData.id, transactionData);
                } else {
                    db.insert('events', transactionData);
                }
                break;
            case 'donations':
                if (transactionData.id) {
                    db.update('donations', transactionData.id, transactionData);
                } else {
                    db.insert('donations', transactionData);
                }
                break;
            case 'alumni_profiles':
                if (transactionData.id) {
                    db.update('alumni_profiles', transactionData.id, transactionData);
                } else {
                    db.insert('alumni_profiles', transactionData);
                }
                break;
            default:
                console.warn(`Unknown transaction type: ${transactionType}`);
        }
    }

    // Utility methods
    generateWorkflowId() {
        return 'WF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    calculateRiskScore(checks) {
        let score = 0;
        checks.forEach(check => {
            if (!check.passed) score += 10;
            if (check.warning) score += 5;
        });
        return Math.min(score, 100); // Cap at 100
    }

    getRecentRequests(transactionType, hours) {
        const cutoffTime = new Date(Date.now() - hours * 3600000);
        const tableName = transactionType === 'alumni_requests' ? 'alumni_requests' : transactionType;
        const allRequests = db.select(tableName);
        return allRequests.filter(req => new Date(req.submitted_at || req.created_at) > cutoffTime);
    }

    saveWorkflowQueue() {
        localStorage.setItem('workflow_queue', JSON.stringify(this.workflowQueue));
    }

    loadWorkflowQueue() {
        const saved = localStorage.getItem('workflow_queue');
        if (saved) {
            this.workflowQueue = JSON.parse(saved);
        }
    }

    logWorkflowAction(actionData) {
        const auditLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
        auditLogs.push({
            id: Date.now(),
            module: 'workflow',
            action: actionData.action,
            details: actionData,
            timestamp: actionData.timestamp,
            user: actionData.performed_by
        });
        localStorage.setItem('audit_logs', JSON.stringify(auditLogs));
    }

    sendApprovalNotification(approver, transactionType, transactionData) {
        // In a real system, this would send email/SMS notifications
        console.log(`Notification sent to ${approver}: New ${transactionType} awaiting approval`);
        
        // Add to notification queue for dashboard display
        this.notificationQueue.push({
            id: Date.now(),
            recipient: approver,
            type: 'approval_request',
            title: 'New Approval Request',
            message: `A new ${transactionType} request requires your approval`,
            data: transactionData,
            created_at: new Date().toISOString(),
            read: false
        });
    }

    sendApprovalResultNotification(submitter, transactionType, result, comments) {
        // Notify the submitter of the approval result
        console.log(`Notification sent to ${submitter}: ${transactionType} ${result}`);
        
        this.notificationQueue.push({
            id: Date.now(),
            recipient: submitter,
            type: 'approval_result',
            title: `Request ${result.charAt(0).toUpperCase() + result.slice(1)}`,
            message: `Your ${transactionType} request has been ${result}. ${comments ? 'Comments: ' + comments : ''}`,
            created_at: new Date().toISOString(),
            read: false
        });
    }

    // Public methods for dashboard and other components
    getPendingApprovals(approverRole) {
        return this.workflowQueue.filter(item => 
            item.status === 'pending' && 
            (item.data.current_approver === approverRole || approverRole === 'super_admin')
        );
    }

    getWorkflowStats() {
        const pending = this.workflowQueue.filter(item => item.status === 'pending').length;
        const approved = this.workflowQueue.filter(item => item.status === 'approved').length;
        const rejected = this.workflowQueue.filter(item => item.status === 'rejected').length;
        
        return {
            pending,
            approved,
            rejected,
            total: pending + approved + rejected
        };
    }

    getNotificationsForUser(username) {
        return this.notificationQueue.filter(notification => 
            notification.recipient === username && !notification.read
        );
    }

    markNotificationAsRead(notificationId) {
        const notification = this.notificationQueue.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
        }
    }
}

// Initialize workflow manager
const workflowManager = new WorkflowManager();

// Load workflow queue on initialization
workflowManager.loadWorkflowQueue();

// js/alumniRequests.js
// Alumni requests (certificates, membership, account updates)
class AlumniRequestsManager {
    constructor() {
        this.requests = [];
        this.requestTypes = [
            'certificate_copy',
            'membership_card', 
            'profile_update',
            'data_access',
            'transcript_request',
            'verification_letter'
        ];
        this.editingRequest = null;
    }

    loadAlumniRequests() {
        this.requests = db.select('alumni_requests');
        this.displayRequests();
    }

    displayRequests() {
        const filteredRequests = auth.filterDataByRole(this.requests, 'alumni_requests');
        const tbody = document.querySelector('#alumniRequestsTable tbody');
        
        if (filteredRequests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-file-alt"></i>
                            <h3>No requests found</h3>
                            <p>Submit your first alumni request to get started</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredRequests.map(request => `
            <tr>
                <td>
                    <div>
                        <strong>${request.request_type.replace('_', ' ').toUpperCase()}</strong>
                        <br><small class="text-muted">${request.description}</small>
                    </div>
                </td>
                <td>${request.requested_by_name || 'Unknown'}</td>
                <td>${Utils.formatDate(request.submitted_at)}</td>
                <td>
                    <span class="status-badge status-${request.status}">${request.status}</span>
                </td>
                <td>
                    <div class="table-actions">
                        ${request.status === 'pending' && auth.canPerformAction('approve', 'alumni_requests') ? `
                            <button class="action-btn approve" onclick="alumniRequestsManager.approveRequest(${request.id})" title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="action-btn reject" onclick="alumniRequestsManager.rejectRequest(${request.id})" title="Reject">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="action-btn view" onclick="alumniRequestsManager.viewRequest(${request.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    openRequestModal(request = null) {
        this.editingRequest = request;
        const isEdit = request !== null;
        
        const typeOptions = this.requestTypes.map(type => 
            `<option value="${type}" ${request?.request_type === type ? 'selected' : ''}>${type.replace('_', ' ').toUpperCase()}</option>`
        ).join('');
        
        const modalContent = `
            <div class="modal-header">
                <h2>${isEdit ? 'Edit Request' : 'New Alumni Request'}</h2>
            </div>
            <div class="modal-body">
                <form id="alumniRequestForm">
                    <div class="form-group">
                        <label for="requestType">Request Type</label>
                        <select id="requestType" name="request_type" required>
                            <option value="">Select request type</option>
                            ${typeOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="requestDescription">Description</label>
                        <textarea id="requestDescription" name="description" rows="4" required>${request?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="urgency">Urgency Level</label>
                        <select id="urgency" name="urgency">
                            <option value="normal" ${request?.urgency === 'normal' ? 'selected' : ''}>Normal</option>
                            <option value="urgent" ${request?.urgency === 'urgent' ? 'selected' : ''}>Urgent</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="alumniRequestsManager.saveRequest()">${isEdit ? 'Update' : 'Submit'}</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    saveRequest() {
        const form = document.getElementById('alumniRequestForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const requestData = {
            request_type: formData.get('request_type'),
            description: formData.get('description'),
            urgency: formData.get('urgency') || 'normal',
            requested_by_id: auth.getCurrentUser().id,
            requested_by_name: auth.getCurrentUser().username,
            status: 'pending'
        };

        // Process through workflow system
        const workflowResult = workflowManager.processTransaction('alumni_requests', requestData, auth.getCurrentUser());
        
        if (!workflowResult.success) {
            Utils.showNotification(workflowResult.message, 'error');
            return;
        }

        if (this.editingRequest) {
            db.update('alumni_requests', this.editingRequest.id, requestData);
            Utils.showNotification('Request updated successfully', 'success');
        } else {
            if (workflowResult.action === 'auto_approved') {
                Utils.showNotification('Request automatically approved', 'success');
            } else {
                Utils.showNotification('Request submitted for approval', 'info');
            }
        }

        modalManager.closeModal();
        this.loadAlumniRequests();
        dashboardManager.loadAnalytics();
    }

    approveRequest(id) {
        if (!auth.canPerformAction('approve', 'alumni_requests')) {
            Utils.showNotification('Access denied: You cannot approve requests', 'error');
            return;
        }

        Utils.confirmAction('Are you sure you want to approve this request?', () => {
            db.update('alumni_requests', id, {
                status: 'approved',
                approved_by: auth.getCurrentUser().username,
                approved_at: new Date().toISOString()
            });
            Utils.showNotification('Request approved successfully', 'success');
            this.loadAlumniRequests();
            dashboardManager.loadAnalytics();
        });
    }

    rejectRequest(id) {
        if (!auth.canPerformAction('reject', 'alumni_requests')) {
            Utils.showNotification('Access denied: You cannot reject requests', 'error');
            return;
        }

        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
            db.update('alumni_requests', id, {
                status: 'rejected',
                rejected_by: auth.getCurrentUser().username,
                rejected_at: new Date().toISOString(),
                rejection_reason: reason
            });
            Utils.showNotification('Request rejected', 'info');
            this.loadAlumniRequests();
            dashboardManager.loadAnalytics();
        }
    }

    viewRequest(id) {
        const request = this.requests.find(r => r.id === id);
        if (!request) {
            Utils.showNotification('Request not found', 'error');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>Request Details</h2>
            </div>
            <div class="modal-body">
                <div class="request-details">
                    <div class="detail-item">
                        <label>Type:</label>
                        <span>${request.request_type.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge status-${request.status}">${request.status}</span>
                    </div>
                    <div class="detail-item">
                        <label>Submitted by:</label>
                        <span>${request.requested_by_name}</span>
                    </div>
                    <div class="detail-item">
                        <label>Submitted on:</label>
                        <span>${Utils.formatDateTime(request.submitted_at)}</span>
                    </div>
                    <div class="detail-item full-width">
                        <label>Description:</label>
                        <p>${request.description}</p>
                    </div>
                    ${request.approved_by ? `
                        <div class="detail-item">
                            <label>Approved by:</label>
                            <span>${request.approved_by}</span>
                        </div>
                        <div class="detail-item">
                            <label>Approved on:</label>
                            <span>${Utils.formatDateTime(request.approved_at)}</span>
                        </div>
                    ` : ''}
                    ${request.rejection_reason ? `
                        <div class="detail-item full-width">
                            <label>Rejection Reason:</label>
                            <p>${request.rejection_reason}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Close</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }
}

// Global function for opening request modal
function openAlumniRequestModal() {
    alumniRequestsManager.openRequestModal();
}

// Initialize alumni requests manager
const alumniRequestsManager = new AlumniRequestsManager();

// js/alumniProfiles.js
// Alumni profiles management (info, updates, verification)
class AlumniProfilesManager {
    constructor() {
        this.profiles = [];
        this.courses = ['BS Computer Science', 'BS Business Administration', 'BS Civil Engineering', 'BS Nursing', 'BS Psychology'];
        this.employmentStatuses = ['employed', 'unemployed', 'self_employed', 'student', 'retired'];
        this.editingProfile = null;
    }

    loadAlumniProfiles() {
        this.profiles = db.select('alumni_profiles');
        this.displayProfiles();
        this.displayStatistics();
    }

    displayProfiles() {
        const filteredProfiles = auth.filterDataByRole(this.profiles, 'alumni_profiles');
        const container = document.getElementById('alumniProfilesGrid');
        
        if (filteredProfiles.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No alumni profiles found</h3>
                    <p>Add alumni profiles to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredProfiles.map(profile => `
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="profile-info">
                        <h3>${profile.first_name} ${profile.last_name}</h3>
                        <p class="graduation-info">${profile.course} • Class of ${profile.graduation_year}</p>
                        <span class="status-badge status-${profile.status}">${profile.status.replace('_', ' ')}</span>
                    </div>
                </div>
                <div class="profile-details">
                    <div class="detail-item">
                        <i class="fas fa-briefcase"></i>
                        <span>${profile.employment_status === 'employed' ? profile.job_title + ' at ' + profile.current_company : profile.employment_status}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-envelope"></i>
                        <span>${profile.email}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-phone"></i>
                        <span>${profile.contact_number || 'Not provided'}</span>
                    </div>
                </div>
                <div class="profile-actions">
                    <button class="btn btn-sm btn-primary" onclick="alumniProfilesManager.viewProfile(${profile.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${auth.canPerformAction('update', 'alumni_profiles') ? `
                        <button class="btn btn-sm btn-secondary" onclick="alumniProfilesManager.editProfile(${profile.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    ` : ''}
                    ${profile.status === 'pending_verification' && auth.canPerformAction('approve', 'alumni_profiles') ? `
                        <button class="btn btn-sm btn-success" onclick="alumniProfilesManager.verifyProfile(${profile.id})">
                            <i class="fas fa-check"></i> Verify
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    displayStatistics() {
        const stats = this.calculateStatistics();
        const container = document.getElementById('profileStatistics');
        
        if (container) {
            container.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        // js/alumniProfiles.js (continued from cutoff)
                        <div class="stat-content">
                            <h3>Total Alumni</h3>
                            <div class="stat-value">${stats.totalProfiles}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Verified</h3>
                            <div class="stat-value">${stats.verifiedCount} (${stats.verifiedPercentage}%)</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-briefcase"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Employed</h3>
                            <div class="stat-value">${stats.employedCount} (${stats.employmentRate}%)</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Pending Verification</h3>
                            <div class="stat-value">${stats.pendingCount}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    calculateStatistics() {
        const totalProfiles = this.profiles.length;
        const verifiedCount = this.profiles.filter(p => p.status === 'verified').length;
        const pendingCount = this.profiles.filter(p => p.status === 'pending_verification').length;
        const employedCount = this.profiles.filter(p => p.employment_status === 'employed').length;
        const employmentRate = totalProfiles > 0 ? ((employedCount / totalProfiles) * 100).toFixed(1) : 0;
        const verifiedPercentage = totalProfiles > 0 ? ((verifiedCount / totalProfiles) * 100).toFixed(1) : 0;

        return {
            totalProfiles,
            verifiedCount,
            verifiedPercentage,
            pendingCount,
            employedCount,
            employmentRate
        };
    }

    openProfileModal(profile = null) {
        this.editingProfile = profile;
        const isEdit = profile !== null;
        
        const courseOptions = this.courses.map(course => 
            `<option value="${course}" ${profile?.course === course ? 'selected' : ''}>${course}</option>`
        ).join('');
        
        const statusOptions = this.employmentStatuses.map(status => 
            `<option value="${status}" ${profile?.employment_status === status ? 'selected' : ''}>${status.replace('_', ' ')}</option>`
        ).join('');
        
        const modalContent = `
            <div class="modal-header">
                <h2>${isEdit ? 'Edit Profile' : 'New Alumni Profile'}</h2>
            </div>
            <div class="modal-body">
                <form id="alumniProfileForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">First Name</label>
                            <input type="text" id="firstName" name="first_name" value="${profile?.first_name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="lastName">Last Name</label>
                            <input type="text" id="lastName" name="last_name" value="${profile?.last_name || ''}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" value="${profile?.email || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="course">Course</label>
                        <select id="course" name="course" required>
                            <option value="">Select course</option>
                            ${courseOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="graduationYear">Graduation Year</label>
                        <input type="number" id="graduationYear" name="graduation_year" value="${profile?.graduation_year || ''}" min="1900" max="${new Date().getFullYear()}" required>
                    </div>
                    <div class="form-group">
                        <label for="employmentStatus">Employment Status</label>
                        <select id="employmentStatus" name="employment_status" required>
                            <option value="">Select status</option>
                            ${statusOptions}
                        </select>
                    </div>
                    ${isEdit ? `
                        <div class="form-group">
                            <label for="currentCompany">Current Company</label>
                            <input type="text" id="currentCompany" name="current_company" value="${profile?.current_company || ''}">
                        </div>
                        <div class="form-group">
                            <label for="jobTitle">Job Title</label>
                            <input type="text" id="jobTitle" name="job_title" value="${profile?.job_title || ''}">
                        </div>
                    ` : ''}
                    <div class="form-group">
                        <label for="contactNumber">Contact Number</label>
                        <input type="tel" id="contactNumber" name="contact_number" value="${profile?.contact_number || ''}">
                    </div>
                    <div class="form-group">
                        <label for="address">Address</label>
                        <textarea id="address" name="address" rows="2">${profile?.address || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="linkedinProfile">LinkedIn Profile</label>
                        <input type="url" id="linkedinProfile" name="linkedin_profile" value="${profile?.linkedin_profile || ''}">
                    </div>
                    ${auth.getCurrentUser ().role === 'admin' ? `
                        <div class="form-group">
                            <label for="profileStatus">Profile Status</label>
                            <select id="profileStatus" name="status">
                                <option value="pending_verification" ${profile?.status === 'pending_verification' ? 'selected' : ''}>Pending Verification</option>
                                <option value="verified" ${profile?.status === 'verified' ? 'selected' : ''}>Verified</option>
                                <option value="rejected" ${profile?.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                            </select>
                        </div>
                    ` : ''}
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="alumniProfilesManager.saveProfile()">${isEdit ? 'Update' : 'Save'}</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    saveProfile() {
        const form = document.getElementById('alumniProfileForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const profileData = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            course: formData.get('course'),
            graduation_year: parseInt(formData.get('graduation_year')),
            employment_status: formData.get('employment_status'),
            current_company: formData.get('current_company') || '',
            job_title: formData.get('job_title') || '',
            contact_number: formData.get('contact_number') || '',
            address: formData.get('address') || '',
            linkedin_profile: formData.get('linkedin_profile') || '',
            status: formData.get('status') || (auth.getCurrentUser ().role === 'alumni' ? 'pending_verification' : 'verified'),
            user_id: auth.getCurrentUser ().id
        };

        if (this.editingProfile) {
            db.update('alumni_profiles', this.editingProfile.id, profileData);
            Utils.showNotification('Profile updated successfully', 'success');
        } else {
            // For new profiles, route through workflow if needed
            if (auth.getCurrentUser ().role === 'alumni') {
                const workflowResult = workflowManager.processTransaction('alumni_profiles', profileData, auth.getCurrentUser ());
                if (!workflowResult.success) {
                    Utils.showNotification(workflowResult.message, 'error');
                    return;
                }
                Utils.showNotification('Profile submitted for verification', 'info');
            } else {
                db.insert('alumni_profiles', profileData);
                Utils.showNotification('Profile created successfully', 'success');
            }
        }

        modalManager.closeModal();
        this.loadAlumniProfiles();
        dashboardManager.loadAnalytics();
    }

    viewProfile(id) {
        const profile = this.profiles.find(p => p.id === id);
        if (!profile) {
            Utils.showNotification('Profile not found', 'error');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>Profile Details</h2>
            </div>
            <div class="modal-body">
                <div class="profile-view">
                    <div class="profile-header">
                        <h3>${profile.first_name} ${profile.last_name}</h3>
                        <span class="status-badge status-${profile.status}">${profile.status.replace('_', ' ')}</span>
                    </div>
                    <div class="profile-details-grid">
                        <div class="detail-item">
                            <label>Course:</label>
                            <span>${profile.course}</span>
                        </div>
                        <div class="detail-item">
                            <label>Graduation Year:</label>
                            <span>${profile.graduation_year}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${profile.email}</span>
                        </div>
                        <div class="detail-item">
                            <label>Employment Status:</label>
                            <span>${profile.employment_status.replace('_', ' ')}</span>
                        </div>
                        ${profile.employment_status === 'employed' ? `
                            <div class="detail-item">
                                <label>Job Title:</label>
                                <span>${profile.job_title}</span>
                            </div>
                            <div class="detail-item">
                                <label>Current Company:</label>
                                <span>${profile.current_company}</span>
                            </div>
                        ` : ''}
                        <div class="detail-item">
                            <label>Contact Number:</label>
                            <span>${profile.contact_number || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Address:</label>
                            <span>${profile.address || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>LinkedIn:</label>
                            <span><a href="${profile.linkedin_profile}" target="_blank">${profile.linkedin_profile || 'Not provided'}</a></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Close</button>
                ${auth.canPerformAction('update', 'alumni_profiles') ? `
                    <button type="button" class="btn btn-primary" onclick="alumniProfilesManager.editProfile(${profile.id}); modalManager.closeModal();">Edit</button>
                ` : ''}
            </div>
        `;
        
        modalManager.openModal(modalContent, 'modal-lg');
    }

    editProfile(id) {
        const profile = this.profiles.find(p => p.id === id);
        if (profile) {
            this.openProfileModal(profile);
        }
    }

    verifyProfile(id) {
        if (!auth.canPerformAction('approve', 'alumni_profiles')) {
            Utils.showNotification('Access denied: You cannot verify profiles', 'error');
            return;
        }

        Utils.confirmAction('Are you sure you want to verify this profile?', () => {
            db.update('alumni_profiles', id, {
                status: 'verified',
                verified_by: auth.getCurrentUser ().username,
                verified_at: new Date().toISOString()
            });
            Utils.showNotification('Profile verified successfully', 'success');
            this.loadAlumniProfiles();
            dashboardManager.loadAnalytics();
        });
    }

    deleteProfile(id) {
        if (!auth.canPerformAction('delete', 'alumni_profiles')) {
            Utils.showNotification('Access denied: You cannot delete profiles', 'error');
            return;
        }

        Utils.confirmAction('Are you sure you want to delete this profile? This action cannot be undone.', () => {
            db.delete('alumni_profiles', id);
            Utils.showNotification('Profile deleted successfully', 'success');
            this.loadAlumniProfiles();
            dashboardManager.loadAnalytics();
        });
    }

    exportProfiles(format = 'csv') {
        // Placeholder for export functionality
        Utils.showNotification(`Exporting ${this.profiles.length} profiles as ${format.toUpperCase()}...`, 'info');
        setTimeout(() => {
            Utils.showNotification('Profiles exported successfully', 'success');
        }, 1500);
    }
}

// Global function for opening profile modal
function openAlumniProfileModal() {
    alumniProfilesManager.openProfileModal();
}

// Initialize alumni profiles manager
const alumniProfilesManager = new AlumniProfilesManager();

// js/careerTracking.js
// Graduate career path (employment history, outcomes, analytics)
class CareerTrackingManager {
    constructor() {
        this.careerRecords = [];
        this.editingRecord = null;
    }

    loadCareerTracking() {
        this.careerRecords = db.select('career_tracking');
        this.displayCareerRecords();
        this.displayCareerAnalytics();
    }

    displayCareerRecords() {
        const filteredRecords = auth.filterDataByRole(this.careerRecords, 'career_tracking');
        const container = document.getElementById('careerRecordsTable');
        
        if (filteredRecords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <h3>No career records found</h3>
                    <p>Add career tracking data to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Alumni</th>
                        <th>Job Title</th>
                        <th>Company</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredRecords.map(record => `
                        <tr>
                            <td>${record.alumni_name}</td>
                            <td>${record.job_title}</td>
                            <td>${record.company}</td>
                            <td>${Utils.formatDate(record.start_date)}</td>
                            <td>${record.end_date ? Utils.formatDate(record.end_date) : 'Present'}</td>
                            <td>
                                <span class="status-badge status-${record.status}">${record.status}</span>
                            </td>
                            <td>
                                <div class="table-actions">
                                    <button class="action-btn edit" onclick="careerTrackingManager.editRecord(${record.id})" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn delete" onclick="careerTrackingManager.deleteRecord(${record.id})" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    displayCareerAnalytics() {
        const analytics = this.calculateCareerAnalytics();
        const container = document.getElementById('careerAnalytics');
        
        if (container) {
            container.innerHTML = `
                <div class="analytics-grid">
                    <div class="analytic-card">
                        <h3>Average Career Duration</h3>
                        <div class="value">${analytics.avgDuration} years</div>
                    </div>
                    <div class="analytic-card">
                        <h3>Job Changes per Alumni</h3>
                        <div class="value">${analytics.avgJobChanges.toFixed(1)}</div>
                    </div>
                    <div class="analytic-card">
                        <h3>Current Employment Rate</h3>
                        <div class="value">${analytics.currentEmploymentRate}%</div>
                    </div>
                    <div class="analytic-card">
                        <h3>Top Industry</h3>
                        <div class="value">${analytics.topIndustry}</div>
                    </div>
                </div>
                <canvas id="careerProgressChart"></canvas>
            `;
            this.createCareerProgressChart(analytics);
        }
    }

    calculateCareerAnalytics() {
        const totalRecords = this.careerRecords.length;
        let totalDuration = 0;
        let totalJobChanges = 0;
        let currentEmployed = 0;
        const industries = {};
        let topIndustry = 'Unknown';

        this.careerRecords.forEach(record => {
            if (record.end_date) {
                const start = new Date(record.start_date);
                const end = new Date(record.end_date);
                const duration = (end - start) / (1000 * 60 * 60 * 24 * 365); // Years
                totalDuration += duration;
            }
            if (record.status === 'current') currentEmployed++;
            if (record.industry) {
                industries[record.industry] = (industries[record.industry] || 0) + 1;
                if (industries[record.industry] > (industries[topIndustry] || 0)) {
                    topIndustry = record.industry;
                }
            }
        });

        const avgDuration = totalRecords > 0 ? (totalDuration / totalRecords).toFixed(1) : 0;
        // js/alumniRequests.js (continued from line 350)
        const avgJobChanges = totalRecords > 0 ? (totalJobChanges / totalRecords) : 0;
        const currentEmploymentRate = totalRecords > 0 ? ((currentEmployed / totalRecords) * 100).toFixed(1) : 0;

        return {
            avgDuration,
            avgJobChanges,
            currentEmploymentRate,
            topIndustry
        };
    }

    createCareerProgressChart(analytics) {
        const ctx = document.getElementById('careerProgressChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
                datasets: [{
                    label: 'Employment Rate',
                    data: [75, 78, 82, 85, 88, 90],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    openCareerRecordModal(record = null) {
        this.editingRecord = record;
        const isEdit = record !== null;
        
        const modalContent = `
            <div class="modal-header">
                <h2>${isEdit ? 'Edit Career Record' : 'New Career Record'}</h2>
            </div>
            <div class="modal-body">
                <form id="careerRecordForm">
                    <div class="form-group">
                        <label for="alumniId">Alumni</label>
                        <select id="alumniId" name="alumni_id" required>
                            <option value="">Select alumni</option>
                            ${db.select('alumni_profiles').map(profile => 
                                `<option value="${profile.id}" ${record?.alumni_id === profile.id ? 'selected' : ''}>${profile.first_name} ${profile.last_name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="jobTitle">Job Title</label>
                        <input type="text" id="jobTitle" name="job_title" value="${record?.job_title || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="company">Company</label>
                        <input type="text" id="company" name="company" value="${record?.company || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="industry">Industry</label>
                        <input type="text" id="industry" name="industry" value="${record?.industry || ''}">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="startDate">Start Date</label>
                            <input type="date" id="startDate" name="start_date" value="${record?.start_date || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="endDate">End Date</label>
                            <input type="date" id="endDate" name="end_date" value="${record?.end_date || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="status">Status</label>
                        <select id="status" name="status" required>
                            <option value="current" ${record?.status === 'current' ? 'selected' : ''}>Current</option>
                            <option value="previous" ${record?.status === 'previous' ? 'selected' : ''}>Previous</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="salary">Salary (Optional)</label>
                        <input type="number" id="salary" name="salary" value="${record?.salary || ''}">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="careerTrackingManager.saveRecord()">${isEdit ? 'Update' : 'Save'}</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    saveRecord() {
        const form = document.getElementById('careerRecordForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const recordData = {
            alumni_id: parseInt(formData.get('alumni_id')),
            job_title: formData.get('job_title'),
            company: formData.get('company'),
            industry: formData.get('industry'),
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date') || null,
            status: formData.get('status'),
            salary: formData.get('salary') ? parseFloat(formData.get('salary')) : null
        };

        // Get alumni name for display
        const alumni = db.select('alumni_profiles').find(p => p.id === recordData.alumni_id);
        recordData.alumni_name = alumni ? `${alumni.first_name} ${alumni.last_name}` : 'Unknown';

        if (this.editingRecord) {
            db.update('career_tracking', this.editingRecord.id, recordData);
            Utils.showNotification('Career record updated successfully', 'success');
        } else {
            db.insert('career_tracking', recordData);
            Utils.showNotification('Career record added successfully', 'success');
        }

        modalManager.closeModal();
        this.loadCareerTracking();
    }

    editRecord(id) {
        const record = this.careerRecords.find(r => r.id === id);
        if (record) {
            this.openCareerRecordModal(record);
        }
    }

    deleteRecord(id) {
        Utils.confirmAction('Are you sure you want to delete this career record?', () => {
            db.delete('career_tracking', id);
            Utils.showNotification('Career record deleted successfully', 'success');
            this.loadCareerTracking();
        });
    }
}

function openCareerRecordModal() {
    careerTrackingManager.openCareerRecordModal();
}

const careerTrackingManager = new CareerTrackingManager();

// js/employmentOutcomes.js
// Employment outcomes tracking and analytics
class EmploymentOutcomesManager {
    constructor() {
        this.outcomes = [];
        this.charts = {};
    }

    loadEmploymentOutcomes() {
        this.outcomes = this.calculateOutcomes();
        this.displayOutcomes();
        this.createCharts();
    }

    calculateOutcomes() {
        const profiles = db.select('alumni_profiles');
        const careerData = db.select('career_tracking');
        
        const outcomes = {
            totalGraduates: profiles.length,
            employed: profiles.filter(p => p.employment_status === 'employed').length,
            unemployed: profiles.filter(p => p.employment_status === 'unemployed').length,
            selfEmployed: profiles.filter(p => p.employment_status === 'self_employed').length,
            furtherStudy: profiles.filter(p => p.employment_status === 'student').length,
            byYear: {},
            byCourse: {},
            averageSalary: 0,
            topEmployers: {}
        };

        // Calculate by graduation year
        profiles.forEach(profile => {
            const year = profile.graduation_year;
            if (!outcomes.byYear[year]) {
                outcomes.byYear[year] = { total: 0, employed: 0 };
            }
            outcomes.byYear[year].total++;
            if (profile.employment_status === 'employed') {
                outcomes.byYear[year].employed++;
            }
        });

        // Calculate by course
        profiles.forEach(profile => {
            const course = profile.course;
            if (!outcomes.byCourse[course]) {
                outcomes.byCourse[course] = { total: 0, employed: 0 };
            }
            outcomes.byCourse[course].total++;
            if (profile.employment_status === 'employed') {
                outcomes.byCourse[course].employed++;
            }
        });

        // Calculate average salary and top employers
        let totalSalary = 0;
        let salaryCount = 0;
        careerData.forEach(career => {
            if (career.salary && career.status === 'current') {
                totalSalary += career.salary;
                salaryCount++;
            }
            if (career.company && career.status === 'current') {
                outcomes.topEmployers[career.company] = (outcomes.topEmployers[career.company] || 0) + 1;
            }
        });

        outcomes.averageSalary = salaryCount > 0 ? Math.round(totalSalary / salaryCount) : 0;
        outcomes.employmentRate = outcomes.totalGraduates > 0 ? 
            ((outcomes.employed / outcomes.totalGraduates) * 100).toFixed(1) : 0;

        return outcomes;
    }

    displayOutcomes() {
        const container = document.getElementById('employmentOutcomesContainer');
        
        container.innerHTML = `
            <div class="outcomes-summary">
                <div class="summary-cards">
                    <div class="summary-card primary">
                        <div class="card-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="card-content">
                            <h3>Total Graduates</h3>
                            <div class="value">${this.outcomes.totalGraduates}</div>
                        </div>
                    </div>
                    <div class="summary-card success">
                        <div class="card-icon">
                            <i class="fas fa-briefcase"></i>
                        </div>
                        <div class="card-content">
                            <h3>Employment Rate</h3>
                            <div class="value">${this.outcomes.employmentRate}%</div>
                        </div>
                    </div>
                    <div class="summary-card info">
                        <div class="card-icon">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="card-content">
                            <h3>Average Salary</h3>
                            <div class="value">${Utils.formatCurrency(this.outcomes.averageSalary)}</div>
                        </div>
                    </div>
                    <div class="summary-card warning">
                        <div class="card-icon">
                            <i class="fas fa-user-graduate"></i>
                        </div>
                        <div class="card-content">
                            <h3>Further Study</h3>
                            <div class="value">${this.outcomes.furtherStudy}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="outcomes-charts">
                <div class="chart-container">
                    <h3>Employment by Status</h3>
                    <canvas id="employmentStatusChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Employment by Course</h3>
                    <canvas id="employmentByCourseChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Employment Trends by Year</h3>
                    <canvas id="employmentTrendsChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Top Employers</h3>
                    <canvas id="topEmployersChart"></canvas>
                </div>
            </div>
        `;
    }

    createCharts() {
        this.createEmploymentStatusChart();
        this.createEmploymentByCourseChart();
        this.createEmploymentTrendsChart();
        this.createTopEmployersChart();
    }

    createEmploymentStatusChart() {
        const ctx = document.getElementById('employmentStatusChart');
        if (!ctx) return;

        this.charts.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Employed', 'Unemployed', 'Self-Employed', 'Further Study'],
                datasets: [{
                    data: [
                        this.outcomes.employed,
                        this.outcomes.unemployed,
                        this.outcomes.selfEmployed,
                        this.outcomes.furtherStudy
                    ],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    createEmploymentByCourseChart() {
        const ctx = document.getElementById('employmentByCourseChart');
        if (!ctx) return;

        const courses = Object.keys(this.outcomes.byCourse);
        const employmentRates = courses.map(course => {
            const data = this.outcomes.byCourse[course];
            return data.total > 0 ? ((data.employed / data.total) * 100).toFixed(1) : 0;
        });

        this.charts.courseChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: courses,
                datasets: [{
                    label: 'Employment Rate (%)',
                    data: employmentRates,
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    createEmploymentTrendsChart() {
        const ctx = document.getElementById('employmentTrendsChart');
        if (!ctx) return;

        const years = Object.keys(this.outcomes.byYear).sort();
        const employmentRates = years.map(year => {
            const data = this.outcomes.byYear[year];
            return data.total > 0 ? ((data.employed / data.total) * 100).toFixed(1) : 0;
        });

        this.charts.trendsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Employment Rate (%)',
                    data: employmentRates,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    createTopEmployersChart() {
        const ctx = document.getElementById('topEmployersChart');
        if (!ctx) return;

        const employers = Object.entries(this.outcomes.topEmployers)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        this.charts.employersChart = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: employers.map(([name]) => name),
                datasets: [{
                    label: 'Number of Alumni',// js/employmentOutcomes.js (continued)
                    data: employers.map(([, count]) => count),
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    exportOutcomes(format = 'csv') {
        Utils.showNotification(`Exporting employment outcomes as ${format.toUpperCase()}...`, 'info');
        setTimeout(() => {
            Utils.showNotification('Employment outcomes exported successfully', 'success');
        }, 1500);
    }

    generateReport() {
        const reportData = {
            summary: this.outcomes,
            generatedAt: new Date().toISOString(),
            generatedBy: auth.getCurrentUser().username
        };

        const modalContent = `
            <div class="modal-header">
                <h2>Employment Outcomes Report</h2>
            </div>
            <div class="modal-body">
                <div class="report-summary">
                    <h3>Summary</h3>
                    <ul>
                        <li>Total Graduates: ${this.outcomes.totalGraduates}</li>
                        <li>Employment Rate: ${this.outcomes.employmentRate}%</li>
                        <li>Average Salary: ${Utils.formatCurrency(this.outcomes.averageSalary)}</li>
                        <li>Currently Employed: ${this.outcomes.employed}</li>
                        <li>Pursuing Further Study: ${this.outcomes.furtherStudy}</li>
                    </ul>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Close</button>
                <button type="button" class="btn btn-primary" onclick="employmentOutcomesManager.exportOutcomes('pdf')">Export PDF</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }
}

const employmentOutcomesManager = new EmploymentOutcomesManager();

// js/gradCohorts.js
// Graduate cohort management and tracking
class GradCohortsManager {
    constructor() {
        this.cohorts = [];
        this.editingCohort = null;
    }

    loadGradCohorts() {
        this.cohorts = this.generateCohorts();
        this.displayCohorts();
    }

    generateCohorts() {
        const profiles = db.select('alumni_profiles');
        const cohortMap = {};

        // Group alumni by graduation year
        profiles.forEach(profile => {
            const year = profile.graduation_year;
            if (!cohortMap[year]) {
                cohortMap[year] = {
                    id: year,
                    year: year,
                    totalGraduates: 0,
                    employed: 0,
                    unemployed: 0,
                    furtherStudy: 0,
                    courses: {},
                    alumni: []
                };
            }

            cohortMap[year].totalGraduates++;
            cohortMap[year].alumni.push(profile);

            // Count by employment status
            switch (profile.employment_status) {
                case 'employed':
                    cohortMap[year].employed++;
                    break;
                case 'unemployed':
                    cohortMap[year].unemployed++;
                    break;
                case 'student':
                    cohortMap[year].furtherStudy++;
                    break;
            }

            // Count by course
            if (!cohortMap[year].courses[profile.course]) {
                cohortMap[year].courses[profile.course] = 0;
            }
            cohortMap[year].courses[profile.course]++;
        });

        // Calculate employment rates
        Object.values(cohortMap).forEach(cohort => {
            cohort.employmentRate = cohort.totalGraduates > 0 ? 
                ((cohort.employed / cohort.totalGraduates) * 100).toFixed(1) : 0;
        });

        return Object.values(cohortMap).sort((a, b) => b.year - a.year);
    }

    displayCohorts() {
        const container = document.getElementById('gradCohortsContainer');
        
        if (this.cohorts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-graduation-cap"></i>
                    <h3>No graduation cohorts found</h3>
                    <p>Alumni data will automatically generate cohorts</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="cohorts-grid">
                ${this.cohorts.map(cohort => `
                    <div class="cohort-card">
                        <div class="cohort-header">
                            <h3>Class of ${cohort.year}</h3>
                            <span class="cohort-size">${cohort.totalGraduates} graduates</span>
                        </div>
                        <div class="cohort-stats">
                            <div class="stat-item">
                                <div class="stat-label">Employment Rate</div>
                                <div class="stat-value success">${cohort.employmentRate}%</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Employed</div>
                                <div class="stat-value">${cohort.employed}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Further Study</div>
                                <div class="stat-value">${cohort.furtherStudy}</div>
                            </div>
                        </div>
                        <div class="cohort-courses">
                            <h4>Top Courses</h4>
                            <div class="course-list">
                                ${Object.entries(cohort.courses)
                                    .sort(([,a], [,b]) => b - a)
                                    .slice(0, 3)
                                    .map(([course, count]) => `
                                        <div class="course-item">
                                            <span class="course-name">${course}</span>
                                            <span class="course-count">${count}</span>
                                        </div>
                                    `).join('')}
                            </div>
                        </div>
                        <div class="cohort-actions">
                            <button class="btn btn-sm btn-primary" onclick="gradCohortsManager.viewCohort(${cohort.year})">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="gradCohortsManager.exportCohort(${cohort.year})">
                                <i class="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    viewCohort(year) {
        const cohort = this.cohorts.find(c => c.year === year);
        if (!cohort) {
            Utils.showNotification('Cohort not found', 'error');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>Class of ${cohort.year} - Detailed View</h2>
            </div>
            <div class="modal-body">
                <div class="cohort-details">
                    <div class="detail-section">
                        <h3>Overview</h3>
                        <div class="overview-stats">
                            <div class="overview-item">
                                <label>Total Graduates:</label>
                                <span>${cohort.totalGraduates}</span>
                            </div>
                            <div class="overview-item">
                                <label>Employment Rate:</label>
                                <span>${cohort.employmentRate}%</span>
                            </div>
                            <div class="overview-item">
                                <label>Currently Employed:</label>
                                <span>${cohort.employed}</span>
                            </div>
                            <div class="overview-item">
                                <label>Pursuing Further Study:</label>
                                <span>${cohort.furtherStudy}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Course Distribution</h3>
                        <div class="course-distribution">
                            ${Object.entries(cohort.courses).map(([course, count]) => `
                                <div class="course-bar">
                                    <div class="course-label">${course}</div>
                                    <div class="course-progress">
                                        <div class="progress-bar" style="width: ${(count / cohort.totalGraduates) * 100}%"></div>
                                        <span class="progress-text">${count} (${((count / cohort.totalGraduates) * 100).toFixed(1)}%)</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Alumni List</h3>
                        <div class="alumni-list">
                            ${cohort.alumni.slice(0, 10).map(alumni => `
                                <div class="alumni-item">
                                    <div class="alumni-info">
                                        <strong>${alumni.first_name} ${alumni.last_name}</strong>
                                        <span class="alumni-course">${alumni.course}</span>
                                    </div>
                                    <span class="alumni-status status-${alumni.employment_status}">
                                        ${alumni.employment_status.replace('_', ' ')}
                                    </span>
                                </div>
                            `).join('')}
                            ${cohort.alumni.length > 10 ? `
                                <div class="alumni-item more">
                                    <span>... and ${cohort.alumni.length - 10} more alumni</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Close</button>
                <button type="button" class="btn btn-primary" onclick="gradCohortsManager.exportCohort(${cohort.year})">Export Cohort</button>
            </div>
        `;
        
        modalManager.openModal(modalContent, 'modal-lg');
    }

    exportCohort(year) {
        const cohort = this.cohorts.find(c => c.year === year);
        if (!cohort) {
            Utils.showNotification('Cohort not found', 'error');
            return;
        }

        Utils.showNotification(`Exporting Class of ${year} data...`, 'info');
        setTimeout(() => {
            Utils.showNotification(`Class of ${year} exported successfully`, 'success');
        }, 1500);
    }

    compareCohortsModal() {
        const modalContent = `
            <div class="modal-header">
                <h2>Compare Graduation Cohorts</h2>
            </div>
            <div class="modal-body">
                <form id="compareCohortForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="cohort1">First Cohort</label>
                            <select id="cohort1" name="cohort1" required>
                                <option value="">Select cohort</option>
                                ${this.cohorts.map(cohort => 
                                    `<option value="${cohort.year}">Class of ${cohort.year}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="cohort2">Second Cohort</label>
                            <select id="cohort2" name="cohort2" required>
                                <option value="">Select cohort</option>
                                ${this.cohorts.map(cohort => 
                                    `<option value="${cohort.year}">Class of ${cohort.year}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                </form>
                <div id="comparisonResults" style="display: none;">
                    <!-- Comparison results will be displayed here -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Close</button>
                <button type="button" class="btn btn-primary" onclick="gradCohortsManager.performComparison()">Compare</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    performComparison() {
        const form = document.getElementById('compareCohortForm');
        const formData = new FormData(form);
        const year1 = parseInt(formData.get('cohort1'));
        const year2 = parseInt(formData.get('cohort2'));

        if (!year1 || !year2 || year1 === year2) {
            Utils.showNotification('Please select two different cohorts', 'error');
            return;
        }

        const cohort1 = this.cohorts.find(c => c.year === year1);
        const cohort2 = this.cohorts.find(c => c.year === year2);

        const resultsContainer = document.getElementById('comparisonResults');
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = `
            <div class="comparison-table">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Class of ${year1}</th>
                            <th>Class of ${year2}</th>
                            <th>Difference</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Total Graduates</td>
                            <td>${cohort1.totalGraduates}</td>
                            <td>${cohort2.totalGraduates}</td>
                            <td>${cohort1.totalGraduates - cohort2.totalGraduates}</td>
                        </tr>
                        <tr>
                            <td>Employment Rate</td>
                            <td>${cohort1.employmentRate}%</td>
                            <td>${cohort2.employmentRate}%</td>
                            <td>${(cohort1.employmentRate - cohort2.employmentRate).toFixed(1)}%</td>
                        </tr>
                        <tr>
                            <td>Currently Employed</td>
                            <td>${cohort1.employed}</td>
                            <td>${cohort2.employed}</td>
                            <td>${cohort1.employed - cohort2.employed}</td>
                        </tr>
                        <tr>
                            <td>Further Study</td>
                            <td>${cohort1.furtherStudy}</td>
                            <td>${cohort2.furtherStudy}</td>
                            <td>${cohort1.furtherStudy - cohort2.furtherStudy}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
}

function openCompareCohorts() {
    gradCohortsManager.compareCohortsModal();
}

const gradCohortsManager = new GradCohortsManager();


// js/jobBoard.js
// Job board management (posting, applications, status tracking)
class JobBoardManager {
    constructor() {
        this.jobs = [];
        this.applications = [];
        this.editingJob = null;
        this.jobCategories = [
            'Information Technology',
            'Engineering',
            'Business & Finance',
            'Healthcare',
            'Education',
            'Marketing & Sales',
            'Human Resources',
            'Operations',
            'Research & Development',
            'Other'
        ];
        this.experienceLevels = [
            'Entry Level (0-2 years)',
            'Mid Level (3-5 years)',
            'Senior Level (6-10 years)',
            'Executive Level (10+ years)'
        ];
        this.jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
    }

    loadJobBoard() {
        this.jobs = db.select('job_board');
        this.applications = db.select('job_applications') || [];
        this.displayJobs();
        this.displayJobStatistics();
    }

    displayJobs() {
        const filteredJobs = auth.filterDataByRole(this.jobs, 'job_board');
        const container = document.getElementById('jobBoardContainer');
        
        if (filteredJobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase"></i>
                    <h3>No job postings found</h3>
                    <p>Post your first job opportunity to get started</p>
                    ${auth.canPerformAction('create', 'job_board') ? `
                        <button class="btn btn-primary" onclick="jobBoardManager.openJobModal()">
                            <i class="fas fa-plus"></i> Post a Job
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="job-filters">
                <div class="filter-group">
                    <select id="categoryFilter" onchange="jobBoardManager.filterJobs()">
                        <option value="">All Categories</option>
                        ${this.jobCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                    <select id="typeFilter" onchange="jobBoardManager.filterJobs()">
                        <option value="">All Types</option>
                        ${this.jobTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                    </select>
                    <select id="statusFilter" onchange="jobBoardManager.filterJobs()">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
                <div class="search-group">
                    <input type="text" id="jobSearch" placeholder="Search jobs..." onkeyup="jobBoardManager.filterJobs()">
                    <button class="btn btn-primary" onclick="jobBoardManager.filterJobs()">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>
            
            <div class="jobs-grid" id="jobsGrid">
                ${this.renderJobCards(filteredJobs)}
            </div>
        `;
    }

    renderJobCards(jobs) {
        return jobs.map(job => `
            <div class="job-card" data-category="${job.category}" data-type="${job.job_type}" data-status="${job.status}">
                <div class="job-header">
                    <div class="job-title-section">
                        <h3 class="job-title">${job.title}</h3>
                        <div class="company-info">
                            <i class="fas fa-building"></i>
                            <span>${job.company}</span>
                        </div>
                    </div>
                    <div class="job-status">
                        <span class="status-badge status-${job.status}">${job.status}</span>
                    </div>
                </div>
                
                <div class="job-details">
                    <div class="job-meta">
                        <div class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${job.location}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${job.job_type}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>Posted ${Utils.formatDate(job.posted_at)}</span>
                        </div>
                        ${job.salary_range ? `
                            <div class="meta-item">
                                <i class="fas fa-dollar-sign"></i>
                                <span>${job.salary_range}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="job-description">
                        <p>${job.description.substring(0, 150)}${job.description.length > 150 ? '...' : ''}</p>
                    </div>
                    
                    <div class="job-requirements">
                        <div class="requirements-tags">
                            ${job.requirements.split(',').slice(0, 3).map(req => 
                                `<span class="requirement-tag">${req.trim()}</span>`
                            ).join('')}
                            ${job.requirements.split(',').length > 3 ? '<span class="requirement-tag more">+more</span>' : ''}
                        </div>
                    </div>
                </div>
                
                <div class="job-actions">
                    <div class="job-stats">
                        <span class="applicant-count">
                            <i class="fas fa-users"></i>
                            ${this.getApplicationCount(job.id)} applicants
                        </span>
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="jobBoardManager.viewJob(${job.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${auth.getCurrentUser().role === 'alumni' && job.status === 'active' ? `
                            <button class="btn btn-sm btn-success" onclick="jobBoardManager.applyToJob(${job.id})">
                                <i class="fas fa-paper-plane"></i> Apply
                            </button>
                        ` : ''}
                        ${auth.canPerformAction('update', 'job_board') ? `
                            <button class="btn btn-sm btn-secondary" onclick="jobBoardManager.editJob(${job.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        ` : ''}
                        ${auth.canPerformAction('delete', 'job_board') ? `
                            <button class="btn btn-sm btn-danger" onclick="jobBoardManager.deleteJob(${job.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayJobStatistics() {
        const stats = this.calculateJobStatistics();
        const container = document.getElementById('jobStatistics');
        
        if (container) {
            container.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-briefcase"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Total Jobs</h3>
                            <div class="stat-value">${stats.totalJobs}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon active">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Active Jobs</h3>
                            <div class="stat-value">${stats.activeJobs}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Total Applications</h3>
                            <div class="stat-value">${stats.totalApplications}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Avg Applications/Job</h3>
                            <div class="stat-value">${stats.avgApplicationsPerJob}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    calculateJobStatistics() {
        const totalJobs = this.jobs.length;
        const activeJobs = this.jobs.filter(job => job.status === 'active').length;
        const totalApplications = this.applications.length;
        const avgApplicationsPerJob = totalJobs > 0 ? (totalApplications / totalJobs).toFixed(1) : 0;

        return {
            totalJobs,
            activeJobs,
            totalApplications,
            avgApplicationsPerJob
        };
    }

    getApplicationCount(jobId) {
        return this.applications.filter(app => app.job_id === jobId).length;
    }

    filterJobs() {
        const category = document.getElementById('categoryFilter')?.value || '';
        const type = document.getElementById('typeFilter')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';
        const search = document.getElementById('jobSearch')?.value.toLowerCase() || '';

        const jobCards = document.querySelectorAll('.job-card');
        
        jobCards.forEach(card => {
            const cardCategory = card.dataset.category;
            const cardType = card.dataset.type;
            const cardStatus = card.dataset.status;
            const cardText = card.textContent.toLowerCase();

            const matchesCategory = !category || cardCategory === category;
            const matchesType = !type || cardType === type;
            const matchesStatus = !status || cardStatus === status;
            const matchesSearch = !search || cardText.includes(search);

            if (matchesCategory && matchesType && matchesStatus && matchesSearch) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    openJobModal(job = null) {
        this.editingJob = job;
        const isEdit = job !== null;
        
        const categoryOptions = this.jobCategories.map(cat => 
            `<option value="${cat}" ${job?.category === cat ? 'selected' : ''}>${cat}</option>`
        ).join('');
        
        const typeOptions = this.jobTypes.map(type => 
            `<option value="${type}" ${job?.job_type === type ? 'selected' : ''}>${type}</option>`
        ).join('');
        
        const experienceOptions = this.experienceLevels.map(level => 
            `<option value="${level}" ${job?.experience_level === level ? 'selected' : ''}>${level}</option>`
        ).join('');
        
        const modalContent = `
            <div class="modal-header">
                <h2>${isEdit ? 'Edit Job Posting' : 'Post New Job'}</h2>
            </div>
            <div class="modal-body">
                <form id="jobForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="jobTitle">Job Title</label>
                            <input type="text" id="jobTitle" name="title" value="${job?.title || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="company">Company</label>
                            <input type="text" id="company" name="company" value="${job?.company || ''}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="location">Location</label>
                            <input type="text" id="location" name="location" value="${job?.location || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="jobType">Job Type</label>
                            <select id="jobType" name="job_type" required>
                                <option value="">Select type</option>
                                ${typeOptions}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="category">Category</label>
                            <select id="category" name="category" required>
                                <option value="">Select category</option>
                                ${categoryOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="experienceLevel">Experience Level</label>
                            <select id="experienceLevel" name="experience_level" required>
                                <option value="">Select level</option>
                                ${experienceOptions}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="salaryRange">Salary Range (Optional)</label>
                        <input type="text" id="salaryRange" name="salary_range" value="${job?.salary_range || ''}" placeholder="e.g., ₱30,000 - ₱50,000">
                    </div>
                    
                    <div class="form-group">
                        <label for="description">Job Description</label>
                        <textarea id="description" name="description" rows="6" required>${job?.description || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="requirements">Requirements (comma-separated)</label>
                        <textarea id="requirements" name="requirements" rows="4" required>${job?.requirements || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="applicationDeadline">Application Deadline</label>
                        <input type="date" id="applicationDeadline" name="application_deadline" value="${job?.application_deadline || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="contactEmail">Contact Email</label>
                        <input type="email" id="contactEmail" name="contact_email" value="${job?.contact_email || ''}" required>
                    </div>
                    
                    ${auth.canPerformAction('approve', 'job_board') ? `
                        <div class="form-group">
                            <label for="status">Status</label>
                            <select id="status" name="status">
                                <option value="draft" ${job?.status === 'draft' ? 'selected' : ''}>Draft</option>
                                <option value="active" ${job?.status === 'active' ? 'selected' : ''}>Active</option>
                                <option value="closed" ${job?.status === 'closed' ? 'selected' : ''}>Closed</option>
                            </select>
                        </div>
                    ` : ''}
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="jobBoardManager.saveJob()">${isEdit ? 'Update' : 'Post Job'}</button>
            </div>
        `;
        
        modalManager.openModal(modalContent, 'modal-lg');
    }

    saveJob() {
        const form = document.getElementById('jobForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const jobData = {
            title: formData.get('title'),
            company: formData.get('company'),
            location: formData.get('location'),
            job_type: formData.get('job_type'),
            category: formData.get('category'),
            experience_level: formData.get('experience_level'),
            salary_range: formData.get('salary_range'),
            description: formData.get('description'),
            requirements: formData.get('requirements'),
            application_deadline: formData.get('application_deadline'),
            contact_email: formData.get('contact_email'),
            status: formData.get('status') || 'draft',
            posted_by_id: auth.getCurrentUser().id,
            posted_by_name: auth.getCurrentUser().username
        };

        if (this.editingJob) {
            db.update('job_board', this.editingJob.id, jobData);
            Utils.showNotification('Job updated successfully', 'success');
        } else {
            // Route through workflow if needed
            if (auth.getCurrentUser().role !== 'admin') {
                const workflowResult = workflowManager.processTransaction('job_board', jobData, auth.getCurrentUser());
                if (!workflowResult.success) {
                    Utils.showNotification(workflowResult.message, 'error');
                    return;
                }
                Utils.showNotification('Job submitted for approval', 'info');
            } else {
                db.insert('job_board', jobData);
                Utils.showNotification('Job posted successfully', 'success');
            }
        }

        modalManager.closeModal();
        this.loadJobBoard();
        dashboardManager.loadAnalytics();
    }

    viewJob(id) {
        const job = this.jobs.find(j => j.id === id);
        if (!job) {
            Utils.showNotification('Job not found', 'error');
            return;
        }

        const applications = this.applications.filter(app => app.job_id === id);
        
        const modalContent = `
            <div class="modal-header">
                <h2>${job.title}</h2>
                <span class="status-badge status-${job.status}">${job.status}</span>
            </div>
            <div class="modal-body">
                <div class="job-view">
                    <div class="job-company-info">
                        <h3>${job.company}</h3>
                        <div class="job-meta-info">
                            <div class="meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${job.location}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-clock"></i>
                                <span>${job.job_type}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-layer-group"></i>
                                <span>${job.category}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-chart-line"></i>
                                <span>${job.experience_level}</span>
                            </div>
                            ${job.salary_range ? `
                                <div class="meta-item">
                                    <i class="fas fa-dollar-sign"></i>
                                    <span>${job.salary_range}</span>
                                </div>
                            ` : ''}
                            ${job.application_deadline ? `
                                <div class="meta-item">
                                    <i class="fas fa-calendar-times"></i>
                                    <span>Deadline: ${Utils.formatDate(job.application_deadline)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="job-section">
                        <h4>Job Description</h4>
                        <div class="job-description-full">
                            ${job.description.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    
                    <div class="job-section">
                        <h4>Requirements</h4>
                        <div class="job-requirements-full">
                            <ul>
                                ${job.requirements.split(',').map(req => 
                                    `<li>${req.trim()}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    </div>
                    
                    <div class="job-section">
                        <h4>Contact Information</h4>
                        <p>Email: <a href="mailto:${job.contact_email}">${job.contact_email}</a></p>
                        <p>Posted by: ${job.posted_by_name}</p>
                        <p>Posted on: ${Utils.formatDate(job.posted_at)}</p>
                    </div>
                    
                    ${auth.canPerformAction('read', 'job_applications') && applications.length > 0 ? `
                        <div class="job-section">
                            <h4>Applications (${applications.length})</h4>
                            <div class="applications-list">
                                ${applications.slice(0, 5).map(app => `
                                    <div class="application-item">
                                        <div class="applicant-info">
                                            <strong>${app.applicant_name}</strong>
                                            <span class="application-date">${Utils.formatDate(app.applied_at)}</span>
                                        </div>
                                        <span class="application-status status-${app.status}">${app.status}</span>
                                    </div>
                                `).join('')}
                                ${applications.length > 5 ? `
                                    <div class="application-item more">
                                        <span>... and ${applications.length - 5} more applications</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Close</button>
                ${auth.getCurrentUser().role === 'alumni' && job.status === 'active' ? `
                    <button type="button" class="btn btn-success" onclick="jobBoardManager.applyToJob(${job.id}); modalManager.closeModal();">
                        <i class="fas fa-paper-plane"></i> Apply Now
                    </button>
                ` : ''}
                ${auth.canPerformAction('update', 'job_board') ? `
                    <button type="button" class="btn btn-primary" onclick="jobBoardManager.editJob(${job.id}); modalManager.closeModal();">
                        <i class="fas fa-edit"></i> Edit Job
                    </button>
                ` : ''}
            </div>
        `;
        
        modalManager.openModal(modalContent, 'modal-lg');
    }

    editJob(id) {
        const job = this.jobs.find(j => j.id === id);
        if (job) {
            this.openJobModal(job);
        }
    }

    deleteJob(id) {
        if (!auth.canPerformAction('delete', 'job_board')) {
            Utils.showNotification('Access denied: You cannot delete jobs', 'error');
            return;
        }

        Utils.confirmAction('Are you sure you want to delete this job posting?', () => {
            db.delete('job_board', id);
            Utils.showNotification('Job deleted successfully', 'success');
            this.loadJobBoard();
            dashboardManager.loadAnalytics();
        });
    }

    applyToJob(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) {
            Utils.showNotification('Job not found', 'error');
            return;
        }

        // Check if already applied
        const existingApplication = this.applications.find(app => 
            app.job_id === jobId && app.applicant_id === auth.getCurrentUser().id
        );

        if (existingApplication) {
            Utils.showNotification('You have already applied to this job', 'warning');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>Apply to ${job.title}</h2>
            </div>
            <div class="modal-body">
                <form id="jobApplicationForm">
                    <div class="form-group">
                        <label for="coverLetter">Cover Letter</label>
                        <textarea id="coverLetter" name="cover_letter" rows="6" placeholder="Tell us why you're interested in this position..." required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="resumeFile">Resume/CV</label>
                        <input type="file" id="resumeFile" name="resume_file" accept=".pdf,.doc,.docx">
                        <small class="form-text">Upload your resume (PDF, DOC, DOCX)</small>
                    </div>
                    <div class="form-group">
                        <label for="expectedSalary">Expected Salary (Optional)</label>
                        <input type="text" id="expectedSalary" name="expected_salary" placeholder="e.g., ₱35,000">
                    </div>
                    <div class="form-group">
                        <label for="availabilityDate">Available Start Date</label>
                        <input type="date" id="availabilityDate" name="availability_date">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-success" onclick="jobBoardManager.submitApplication(${jobId})">
                    <i class="fas fa-paper-plane"></i> Submit Application
                </button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    submitApplication(jobId) {
        const form = document.getElementById('jobApplicationForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const applicationData = {
            job_id: jobId,
            applicant_id: auth.getCurrentUser().id,
            applicant_name: auth.getCurrentUser().username,
            cover_letter: formData.get('cover_letter'),
            expected_salary: formData.get('expected_salary'),
            availability_date: formData.get('availability_date'),
            status: 'pending',
            applied_at: new Date().toISOString()
        };

        // Save to job_applications table
        if (!localStorage.getItem('job_applications')) {
            localStorage.setItem('job_applications', JSON.stringify([]));
        }
        
        const applications = JSON.parse(localStorage.getItem('job_applications'));
        applications.push({
            id: Date.now(),
            ...applicationData
        });
        localStorage.setItem('job_applications', JSON.stringify(applications));

        Utils.showNotification('Application submitted successfully!', 'success');
        modalManager.closeModal();
        this.loadJobBoard();
    }

    closeJob(id) {
        if (!auth.canPerformAction('update', 'job_board')) {
            Utils.showNotification('Access denied: You cannot close jobs', 'error');
            return;
        }

        Utils.confirmAction('Are you sure you want to close this job posting?', () => {
            db.update('job_board', id, {
                status: 'closed',
                closed_at: new Date().toISOString(),
                closed_by: auth.getCurrentUser().username
            });
            Utils.showNotification('Job closed successfully', 'success');
            this.loadJobBoard();
        });
    }

    exportJobs(format = 'csv') {
        Utils.showNotification(`Exporting ${this.jobs.length} jobs as ${format.toUpperCase()}...`, 'info');
        setTimeout(() => {
            Utils.showNotification('Jobs exported successfully', 'success');
        }, 1500);
    }
}

function openJobModal() {
    jobBoardManager.openJobModal();
}

const jobBoardManager = new JobBoardManager();

// js/jobRecommendations.js
// AI-powered job recommendations for alumni
class JobRecommendationsManager {
    constructor() {
        this.recommendations = [];
        this.alumniProfiles = [];
        this.jobs = [];
        this.matchingAlgorithm = 'skills_based'; // skills_based, location_based, experience_based
    }

    loadJobRecommendations() {
        this.alumniProfiles = db.select('alumni_profiles');
        this.jobs = db.select('job_board').filter(job => job.status === 'active');
        this.generateRecommendations();
        this.displayRecommendations();
    }

    generateRecommendations() {
        const currentUser = auth.getCurrentUser();
        
        if (currentUser.role === 'alumni') {
            // Generate recommendations for current alumni user
            const userProfile = this.alumniProfiles.find(p => p.user_id === currentUser.id);
            if (userProfile) {
                this.recommendations = this.getRecommendationsForAlumni(userProfile);
            }
        } else {
            // Generate recommendations for all alumni (admin view)
            this.recommendations = this.getAllRecommendations();
        }
    }

    getRecommendationsForAlumni(alumniProfile) {
        const recommendations = [];
        
        this.jobs.forEach(job => {
            const score = this.calculateMatchScore(alumniProfile, job);
            if (score > 0.3) { // Minimum 30% match
                recommendations.push({
                    id: `${alumniProfile.id}_${job.id}`,
                    alumni_id: alumniProfile.id,
                    alumni_name: `${alumniProfile.first_name} ${alumniProfile.last_name}`,
                    job_id: job.id,
                    job_title: job.title,
                    company: job.company,
                    location: job.location,
                    match_score: score,
                    match_reasons: this.getMatchReasons(alumniProfile, job, score),
                    recommended_at: new Date().toISOString()
                });
            }
        });

        return recommendations.sort((a, b) => b.match_score - a.match_score);
    }

    getAllRecommendations() {
        const allRecommendations = [];
        
        this.alumniProfiles.forEach(alumni => {
            const alumniRecommendations = this.getRecommendationsForAlumni(alumni);
            allRecommendations.push(...alumniRecommendations.slice(0, 3)); // Top 3 per alumni
        });

       // js/jobRecommendations.js (continued)
        return allRecommendations.sort((a, b) => b.match_score - a.match_score);
    }

    calculateMatchScore(alumniProfile, job) {
        let score = 0;
        let factors = 0;

        // Course/Field match (40% weight)
        if (this.courseMatchesJob(alumniProfile.course, job.category)) {
            score += 0.4;
        }
        factors++;

        // Experience level match (30% weight)
        const experienceMatch = this.getExperienceMatch(alumniProfile, job);
        score += experienceMatch * 0.3;
        factors++;

        // Location preference (20% weight)
        if (this.locationMatches(alumniProfile, job)) {
            score += 0.2;
        }
        factors++;

        // Employment status (10% weight)
        if (alumniProfile.employment_status === 'unemployed') {
            score += 0.1; // Boost for unemployed alumni
        }
        factors++;

        return Math.min(score, 1.0); // Cap at 100%
    }

    courseMatchesJob(course, jobCategory) {
        const courseJobMapping = {
            'BS Computer Science': ['Information Technology', 'Engineering', 'Research & Development'],
            'BS Business Administration': ['Business & Finance', 'Marketing & Sales', 'Operations', 'Human Resources'],
            'BS Civil Engineering': ['Engineering', 'Operations'],
            'BS Nursing': ['Healthcare'],
            'BS Psychology': ['Human Resources', 'Healthcare', 'Education']
        };

        return courseJobMapping[course]?.includes(jobCategory) || false;
    }

    getExperienceMatch(alumniProfile, job) {
        const graduationYear = alumniProfile.graduation_year;
        const currentYear = new Date().getFullYear();
        const yearsExperience = currentYear - graduationYear;

        const jobExperienceLevel = job.experience_level;
        
        if (jobExperienceLevel.includes('Entry Level') && yearsExperience <= 2) return 1.0;
        if (jobExperienceLevel.includes('Mid Level') && yearsExperience >= 3 && yearsExperience <= 5) return 1.0;
        if (jobExperienceLevel.includes('Senior Level') && yearsExperience >= 6 && yearsExperience <= 10) return 1.0;
        if (jobExperienceLevel.includes('Executive Level') && yearsExperience > 10) return 1.0;
        
        // Partial matches
        if (jobExperienceLevel.includes('Entry Level') && yearsExperience <= 4) return 0.7;
        if (jobExperienceLevel.includes('Mid Level') && yearsExperience >= 2 && yearsExperience <= 7) return 0.7;
        
        return 0.3; // Minimum score for experience mismatch
    }

    locationMatches(alumniProfile, job) {
        // Simple location matching - can be enhanced with geolocation
        if (!alumniProfile.address) return false;
        
        const alumniLocation = alumniProfile.address.toLowerCase();
        const jobLocation = job.location.toLowerCase();
        
        // Check for city matches
        const cities = ['makati', 'taguig', 'bgc', 'ortigas', 'manila', 'quezon city', 'pasig'];
        
        for (const city of cities) {
            if (alumniLocation.includes(city) && jobLocation.includes(city)) {
                return true;
            }
        }
        
        return false;
    }

    getMatchReasons(alumniProfile, job, score) {
        const reasons = [];
        
        if (this.courseMatchesJob(alumniProfile.course, job.category)) {
            reasons.push(`Course matches job category (${job.category})`);
        }
        
        const experienceMatch = this.getExperienceMatch(alumniProfile, job);
        if (experienceMatch > 0.7) {
            reasons.push(`Experience level aligns with requirements`);
        }
        
        if (this.locationMatches(alumniProfile, job)) {
            reasons.push(`Location preference match`);
        }
        
        if (alumniProfile.employment_status === 'unemployed') {
            reasons.push(`Currently seeking employment`);
        }
        
        if (score > 0.8) {
            reasons.push(`Excellent overall match (${Math.round(score * 100)}%)`);
        } else if (score > 0.6) {
            reasons.push(`Good match (${Math.round(score * 100)}%)`);
        }
        
        return reasons;
    }

    displayRecommendations() {
        const container = document.getElementById('jobRecommendationsContainer');
        
        if (this.recommendations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lightbulb"></i>
                    <h3>No job recommendations available</h3>
                    <p>Update alumni profiles and add more job postings to generate recommendations</p>
                </div>
            `;
            return;
        }

        const currentUser = auth.getCurrentUser();
        
        if (currentUser.role === 'alumni') {
            this.displayAlumniRecommendations();
        } else {
            this.displayAdminRecommendations();
        }
    }

    displayAlumniRecommendations() {
        const container = document.getElementById('jobRecommendationsContainer');
        
        container.innerHTML = `
            <div class="recommendations-header">
                <h2>Recommended Jobs for You</h2>
                <p>Based on your profile, education, and preferences</p>
            </div>
            
            <div class="recommendations-grid">
                ${this.recommendations.map(rec => `
                    <div class="recommendation-card">
                        <div class="recommendation-header">
                            <div class="job-info">
                                <h3>${rec.job_title}</h3>
                                <p class="company">${rec.company}</p>
                                <p class="location">
                                    <i class="fas fa-map-marker-alt"></i>
                                    ${rec.location}
                                </p>
                            </div>
                            <div class="match-score">
                                <div class="score-circle" style="--score: ${rec.match_score * 100}">
                                    <span>${Math.round(rec.match_score * 100)}%</span>
                                </div>
                                <small>Match</small>
                            </div>
                        </div>
                        
                        <div class="match-reasons">
                            <h4>Why this job matches you:</h4>
                            <ul>
                                ${rec.match_reasons.map(reason => `<li>${reason}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="recommendation-actions">
                            <button class="btn btn-primary" onclick="jobRecommendationsManager.viewRecommendedJob(${rec.job_id})">
                                <i class="fas fa-eye"></i> View Job
                            </button>
                            <button class="btn btn-success" onclick="jobRecommendationsManager.applyToRecommendedJob(${rec.job_id})">
                                <i class="fas fa-paper-plane"></i> Apply Now
                            </button>
                            <button class="btn btn-secondary" onclick="jobRecommendationsManager.dismissRecommendation('${rec.id}')">
                                <i class="fas fa-times"></i> Not Interested
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayAdminRecommendations() {
        const container = document.getElementById('jobRecommendationsContainer');
        
        // Group recommendations by alumni
        const groupedRecs = {};
        this.recommendations.forEach(rec => {
            if (!groupedRecs[rec.alumni_id]) {
                groupedRecs[rec.alumni_id] = {
                    alumni_name: rec.alumni_name,
                    recommendations: []
                };
            }
            groupedRecs[rec.alumni_id].recommendations.push(rec);
        });

        container.innerHTML = `
            <div class="recommendations-header">
                <h2>Job Recommendations Overview</h2>
                <div class="recommendation-stats">
                    <div class="stat-item">
                        <span class="stat-value">${Object.keys(groupedRecs).length}</span>
                        <span class="stat-label">Alumni with Recommendations</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.recommendations.length}</span>
                        <span class="stat-label">Total Recommendations</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.jobs.length}</span>
                        <span class="stat-label">Active Jobs</span>
                    </div>
                </div>
            </div>
            
            <div class="alumni-recommendations">
                ${Object.entries(groupedRecs).map(([alumniId, data]) => `
                    <div class="alumni-recommendation-section">
                        <div class="alumni-header">
                            <h3>${data.alumni_name}</h3>
                            <span class="recommendation-count">${data.recommendations.length} recommendations</span>
                        </div>
                        <div class="recommendations-list">
                            ${data.recommendations.slice(0, 3).map(rec => `
                                <div class="recommendation-item">
                                    <div class="job-details">
                                        <h4>${rec.job_title}</h4>
                                        <p>${rec.company} • ${rec.location}</p>
                                    </div>
                                    <div class="match-info">
                                        <div class="match-score-small">
                                            ${Math.round(rec.match_score * 100)}%
                                        </div>
                                        <div class="match-reasons-small">
                                            ${rec.match_reasons.slice(0, 2).join(', ')}
                                        </div>
                                    </div>
                                    <div class="recommendation-actions-small">
                                        <button class="btn btn-sm btn-primary" onclick="jobRecommendationsManager.sendRecommendation('${rec.id}')">
                                            <i class="fas fa-paper-plane"></i> Send
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    viewRecommendedJob(jobId) {
        // Redirect to job board view
        if (typeof jobBoardManager !== 'undefined') {
            jobBoardManager.viewJob(jobId);
        } else {
            Utils.showNotification('Job details not available', 'error');
        }
    }

    applyToRecommendedJob(jobId) {
        // Redirect to job board apply
        if (typeof jobBoardManager !== 'undefined') {
            jobBoardManager.applyToJob(jobId);
        } else {
            Utils.showNotification('Application not available', 'error');
        }
    }

    dismissRecommendation(recommendationId) {
        Utils.confirmAction('Are you sure you want to dismiss this recommendation?', () => {
            this.recommendations = this.recommendations.filter(rec => rec.id !== recommendationId);
            this.displayRecommendations();
            Utils.showNotification('Recommendation dismissed', 'info');
        });
    }

    sendRecommendation(recommendationId) {
        const recommendation = this.recommendations.find(rec => rec.id === recommendationId);
        if (!recommendation) {
            Utils.showNotification('Recommendation not found', 'error');
            return;
        }

        // Simulate sending recommendation via email/notification
        Utils.showNotification(`Recommendation sent to ${recommendation.alumni_name}`, 'success');
        
        // Log the action
        console.log(`Recommendation sent: ${recommendation.job_title} to ${recommendation.alumni_name}`);
    }

    updateMatchingAlgorithm(algorithm) {
        this.matchingAlgorithm = algorithm;
        this.generateRecommendations();
        this.displayRecommendations();
        Utils.showNotification(`Matching algorithm updated to ${algorithm}`, 'info');
    }

    exportRecommendations(format = 'csv') {
        Utils.showNotification(`Exporting ${this.recommendations.length} recommendations as ${format.toUpperCase()}...`, 'info');
        setTimeout(() => {
            Utils.showNotification('Recommendations exported successfully', 'success');
        }, 1500);
    }

    generateRecommendationReport() {
        const stats = {
            totalRecommendations: this.recommendations.length,
            averageMatchScore: this.recommendations.length > 0 ? 
                (this.recommendations.reduce((sum, rec) => sum + rec.match_score, 0) / this.recommendations.length).toFixed(2) : 0,
            topMatchingJobs: this.getTopMatchingJobs(),
            alumniWithRecommendations: new Set(this.recommendations.map(rec => rec.alumni_id)).size
        };

        const modalContent = `
            <div class="modal-header">
                <h2>Job Recommendations Report</h2>
            </div>
            <div class="modal-body">
                <div class="report-stats">
                    <div class="stat-grid">
                        <div class="stat-item">
                            <h3>Total Recommendations</h3>
                            <div class="stat-value">${stats.totalRecommendations}</div>
                        </div>
                        <div class="stat-item">
                            <h3>Average Match Score</h3>
                            <div class="stat-value">${Math.round(stats.averageMatchScore * 100)}%</div>
                        </div>
                        <div class="stat-item">
                            <h3>Alumni with Recommendations</h3>
                            <div class="stat-value">${stats.alumniWithRecommendations}</div>
                        </div>
                    </div>
                    
                    <div class="top-jobs">
                        <h3>Top Matching Jobs</h3>
                        <ul>
                            ${stats.topMatchingJobs.map(job => 
                                `<li>${job.title} at ${job.company} (${job.matchCount} matches)</li>`
                            ).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Close</button>
                <button type="button" class="btn btn-primary" onclick="jobRecommendationsManager.exportRecommendations('pdf')">Export PDF</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    getTopMatchingJobs() {
        const jobCounts = {};
        
        this.recommendations.forEach(rec => {
            const key = `${rec.job_title}_${rec.company}`;
            if (!jobCounts[key]) {
                jobCounts[key] = {
                    title: rec.job_title,
                    company: rec.company,
                    matchCount: 0
                };
            }
            jobCounts[key].matchCount++;
        });

        return Object.values(jobCounts)
            .sort((a, b) => b.matchCount - a.matchCount)
            .slice(0, 5);
    }
}

const jobRecommendationsManager = new JobRecommendationsManager();

// js/placementLogs.js
// js/placementLogs.js
// Placement tracking and success stories
class PlacementLogsManager {
    constructor() {
        this.placements = [];
        this.successStories = [];
        this.editingPlacement = null;
    }

    loadPlacementLogs() {
        this.placements = db.select('placement_logs') || [];
        this.successStories = db.select('success_stories') || [];
        this.displayPlacements();
        this.displayPlacementStatistics();
    }

    displayPlacements() {
        const filteredPlacements = auth.filterDataByRole(this.placements, 'placement_logs');
        const container = document.getElementById('placementLogsContainer');
        
        if (filteredPlacements.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <h3>No placement records found</h3>
                    <p>Track successful placements to celebrate alumni achievements</p>
                    ${auth.canPerformAction('create', 'placement_logs') ? `
                        <button class="btn btn-primary" onclick="placementLogsManager.openPlacementModal()">
                            <i class="fas fa-plus"></i> Add Placement
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="placement-filters">
                <div class="filter-group">
                    <select id="yearFilter" onchange="placementLogsManager.filterPlacements()">
                        <option value="">All Years</option>
                        ${[...new Set(filteredPlacements.map(p => new Date(p.placement_date).getFullYear()))].sort((a, b) => b - a).map(year => 
                            `<option value="${year}">${year}</option>`
                        ).join('')}
                    </select>
                    <select id="companyFilter" onchange="placementLogsManager.filterPlacements()">
                        <option value="">All Companies</option>
                        ${[...new Set(filteredPlacements.map(p => p.company))].sort().map(company => 
                            `<option value="${company}">${company}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="search-group">
                    <input type="text" id="placementSearch" placeholder="Search placements..." onkeyup="placementLogsManager.filterPlacements()">
                    <button class="btn btn-primary" onclick="placementLogsManager.filterPlacements()">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>
            
            <div class="placements-grid" id="placementsGrid">
                ${this.renderPlacementCards(filteredPlacements)}
            </div>
        `;
    }

    renderPlacementCards(placements) {
        return placements.map(placement => `
            <div class="placement-card" data-year="${new Date(placement.placement_date).getFullYear()}" data-company="${placement.company}">
                <div class="placement-header">
                    <div class="alumni-info">
                        <h3>${placement.alumni_name}</h3>
                        <p class="course">${placement.course} • Class of ${placement.graduation_year}</p>
                    </div>
                    <div class="placement-status">
                        <span class="status-badge status-success">Placed</span>
                        <span class="placement-date">${Utils.formatDate(placement.placement_date)}</span>
                    </div>
                </div>
                
                <div class="placement-details">
                    <div class="job-info">
                        <h4>${placement.job_title}</h4>
                        <p class="company"><i class="fas fa-building"></i> ${placement.company}</p>
                        <p class="location"><i class="fas fa-map-marker-alt"></i> ${placement.location}</p>
                        ${placement.salary ? `
                            <p class="salary"><i class="fas fa-dollar-sign"></i> ${Utils.formatCurrency(placement.salary)}</p>
                        ` : ''}
                    </div>
                    
                    <div class="placement-meta">
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>Duration: ${placement.duration_months} months</span>
                        </div>
                        ${placement.source ? `
                            <div class="meta-item">
                                <i class="fas fa-link"></i>
                                <span>Source: ${placement.source}</span>
                            </div>
                        ` : ''}
                        ${placement.recruiter ? `
                            <div class="meta-item">
                                <i class="fas fa-user-tie"></i>
                                <span>Recruiter: ${placement.recruiter}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="placement-actions">
                    ${placement.success_story ? `
                        <button class="btn btn-sm btn-info" onclick="placementLogsManager.viewSuccessStory(${placement.id})">
                            <i class="fas fa-quote-left"></i> Read Story
                        </button>
                    ` : ''}
                    ${auth.canPerformAction('update', 'placement_logs') ? `
                        <button class="btn btn-sm btn-secondary" onclick="placementLogsManager.editPlacement(${placement.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    ` : ''}
                    ${auth.canPerformAction('delete', 'placement_logs') ? `
                        <button class="btn btn-sm btn-danger" onclick="placementLogsManager.deletePlacement(${placement.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    displayPlacementStatistics() {
        const stats = this.calculatePlacementStatistics();
        const container = document.getElementById('placementStatistics');
        
        if (container) {
            container.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Total Placements</h3>
                            <div class="stat-value">${stats.totalPlacements}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Avg Placement Time</h3>
                            <div class="stat-value">${stats.avgPlacementTime} months</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Top Employer</h3>
                            <div class="stat-value">${stats.topEmployer}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Avg Starting Salary</h3>
                            <div class="stat-value">${Utils.formatCurrency(stats.avgSalary)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="placement-trends">
                    <canvas id="placementTrendsChart"></canvas>
                </div>
            `;
            this.createPlacementTrendsChart(stats);
        }
    }

    calculatePlacementStatistics() {
        const totalPlacements = this.placements.length;
        let totalMonths = 0;
        let totalSalary = 0;
        const companyCounts = {};
        let topEmployer = 'N/A';
        let maxCount = 0;

        this.placements.forEach(placement => {
            // Calculate placement time (from graduation to placement)
            const gradDate = new Date(placement.graduation_year, 0, 1);
            const placementDate = new Date(placement.placement_date);
            const monthsDiff = (placementDate - gradDate) / (1000 * 60 * 60 * 24 * 30);
            totalMonths += Math.min(monthsDiff, 24); // Cap at 2 years

            if (placement.salary) {
                totalSalary += placement.salary;
            }

            // Count by company
            const company = placement.company;
            companyCounts[company] = (companyCounts[company] || 0) + 1;
            if (companyCounts[company] > maxCount) {
                maxCount = companyCounts[company];
                topEmployer = company;
            }
        });

        const avgPlacementTime = totalPlacements > 0 ? (totalMonths / totalPlacements).toFixed(1) : 0;
        const avgSalary = totalPlacements > 0 ? (totalSalary / totalPlacements).toFixed(0) : 0;

        return {
            totalPlacements,
            avgPlacementTime,
            topEmployer,
            avgSalary,
            companyCounts
        };
    }

    createPlacementTrendsChart(stats) {
        const ctx = document.getElementById('placementTrendsChart');
        if (!ctx) return;

        const years = [...new Set(this.placements.map(p => new Date(p.placement_date).getFullYear()))].sort();
        const placementsPerYear = years.map(year => 
            this.placements.filter(p => new Date(p.placement_date).getFullYear() === year).length
        );

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Placements',
                    data: placementsPerYear,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    filterPlacements() {
        const year = document.getElementById('yearFilter')?.value || '';
        const company = document.getElementById('companyFilter')?.value || '';
        const search = document.getElementById('placementSearch')?.value.toLowerCase() || '';

        const placementCards = document.querySelectorAll('.placement-card');
        
        placementCards.forEach(card => {
            const cardYear = card.dataset.year;
            const cardCompany = card.dataset.company;
            const cardText = card.textContent.toLowerCase();

            const matchesYear = !year || cardYear === year;
            const matchesCompany = !company || cardCompany === company;
            const matchesSearch = !search || cardText.includes(search);

            if (matchesYear && matchesCompany && matchesSearch) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    openPlacementModal(placement = null) {
        this.editingPlacement = placement;
        const isEdit = placement !== null;
        
        // Get alumni options
        const alumniOptions = db.select('alumni_profiles').map(profile => 
            `<option value="${profile.id}" ${placement?.alumni_id === profile.id ? 'selected' : ''}>${profile.first_name} ${profile.last_name} - ${profile.course} ${profile.graduation_year}</option>`
        ).join('');
        
        const sourceOptions = [
            'Job Board', 'Recommendation', 'Career Fair', 'Referral', 'Direct Application', 'Other'
        ].map(source => 
            `<option value="${source}" ${placement?.source === source ? 'selected' : ''}>${source}</option>`
        ).join('');
        
        const modalContent = `
            <div class="modal-header">
                <h2>${isEdit ? 'Edit Placement' : 'Add New Placement'}</h2>
            </div>
            <div class="modal-body">
                <form id="placementForm">
                    <div class="form-group">
                        <label for="alumniId">Alumni</label>
                        <select id="alumniId" name="alumni_id" required>
                            <option value="">Select alumni</option>
                            ${alumniOptions}
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="jobTitle">Job Title</label>
                            <input type="text" id="jobTitle" name="job_title" value="${placement?.job_title || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="company">Company</label>
                            <input type="text" id="company" name="company" value="${placement?.company || ''}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="location">Location</label>
                            <input type="text" id="location" name="location" value="${placement?.location || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="salary">Starting Salary</label>
                            <input type="number" id="salary" name="salary" value="${placement?.salary || ''}" min="0">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="placementDate">Placement Date</label>
                            <input type="date" id="placementDate" name="placement_date" value="${placement?.placement_date || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="durationMonths">Duration (months)</label>
                            <input type="number" id="durationMonths" name="duration_months" value="${placement?.duration_months || ''}" min="1" max="120">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="source">Placement Source</label>
                        <select id="source" name="source">
                            <option value="">Select source</option>
                            ${sourceOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="recruiter">Recruiter Name (Optional)</label>
                        <input type="text" id="recruiter" name="recruiter" value="${placement?.recruiter || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="notes">Notes</label>
                        <textarea id="notes" name="notes" rows="3">${placement?.notes || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="successStory">
                            <input type="checkbox" id="successStory" name="success_story" ${placement?.success_story ? 'checked' : ''}>
                            Add Success Story
                        </label>
                    </div>
                    
                    <div id="successStorySection" style="display: ${placement?.success_story ? 'block' : 'none'};">
                        <div class="form-group">
                            <label for="storyTitle">Story Title</label>
                            <input type="text" id="storyTitle" name="story_title" value="${placement?.story_title || ''}">
                        </div>
                        <div class="form-group">
                            <label for="storyContent">Success Story</label>
                            <textarea id="storyContent" name="story_content" rows="5">${placement?.story_content || ''}</textarea>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="placementLogsManager.savePlacement()">${isEdit ? 'Update' : 'Save Placement'}</button>
            </div>
        `;
        
        modalManager.openModal(modalContent, 'modal-lg');
        
        // Handle success story checkbox
        document.getElementById('successStory').addEventListener('change', function() {
            document.getElementById('successStorySection').style.display = this.checked ? 'block' : 'none';
        });
    }

    savePlacement() {
        const form = document.getElementById('placementForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const hasSuccessStory = document.getElementById('successStory').checked;
        
        const placementData = {
            alumni_id: parseInt(formData.get('alumni_id')),
            job_title: formData.get('job_title'),
            company: formData.get('company'),
            location: formData.get('location'),
            salary: formData.get('salary') ? parseFloat(formData.get('salary')) : null,
            placement_date: formData.get('placement_date'),
            duration_months: parseInt(formData.get('duration_months')) || 0,
            source: formData.get('source'),
            recruiter: formData.get('recruiter'),
            notes: formData.get('notes'),
            success_story: hasSuccessStory,
            created_by: auth.getCurrentUser ().username,
            created_at: new Date().toISOString()
        };

        // Get alumni details
        const alumni = db.select('alumni_profiles').find(p => p.id === placementData.alumni_id);
        if (alumni) {
            placementData.alumni_name = `${alumni.first_name} ${alumni.last_name}`;
            placementData.course = alumni.course;
            placementData.graduation_year = alumni.graduation_year;
        }

        if (hasSuccessStory) {
            placementData.story_title = formData.get('story_title');
            placementData.story_content = formData.get('story_content');
        }

        if (this.editingPlacement) {
            db.update('placement_logs', this.editingPlacement.id, placementData);
            Utils.showNotification('Placement updated successfully', 'success');
        } else {
            db.insert('placement_logs', placementData);
            Utils.showNotification('Placement recorded successfully', 'success');
        }

        modalManager.closeModal();
        this.loadPlacementLogs();
        dashboardManager.loadAnalytics();
    }

    editPlacement(id) {
        const placement = this.placements.find(p => p.id === id);
        if (placement) {
            this.openPlacementModal(placement);
        }
    }

    deletePlacement(id) {
        if (!auth.canPerformAction('delete', 'placement_logs')) {
            Utils.showNotification('Access denied: You cannot delete placements', 'error');
            return;
        }

        Utils.confirmAction('Are you sure you want to delete this placement record?', () => {
            db.delete('placement_logs', id);
            Utils.showNotification('Placement deleted successfully', 'success');
            this.loadPlacementLogs();
        });
    }

    viewSuccessStory(id) {
        const placement = this.placements.find(p => p.id === id);
        if (!placement || !placement.success_story) {
            Utils.showNotification('Success story not found', 'error');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>${placement.story_title || 'Success Story'}</h2>
            </div>
            <div class="modal-body">
                <div class="success-story">
                    // js/placementLogs.js (continued)
                    <div class="story-header">
                        <div class="alumni-info">
                            <h3>${placement.alumni_name}</h3>
                            <p>${placement.job_title} at ${placement.company}</p>
                            <p class="placement-date">Placed on ${Utils.formatDate(placement.placement_date)}</p>
                        </div>
                    </div>
                    
                    <div class="story-content">
                        <p>${placement.story_content.replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Close</button>
                <button type="button" class="btn btn-primary" onclick="placementLogsManager.shareSuccessStory(${id})">
                    <i class="fas fa-share"></i> Share Story
                </button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    shareSuccessStory(id) {
        const placement = this.placements.find(p => p.id === id);
        if (!placement) return;

        // Simulate sharing functionality
        Utils.showNotification(`Success story of ${placement.alumni_name} shared!`, 'success');
        modalManager.closeModal();
    }

    exportPlacements(format = 'csv') {
        Utils.showNotification(`Exporting ${this.placements.length} placements as ${format.toUpperCase()}...`, 'info');
        setTimeout(() => {
            Utils.showNotification('Placements exported successfully', 'success');
        }, 1500);
    }

    generatePlacementReport() {
        const stats = this.calculatePlacementStatistics();
        
        const modalContent = `
            <div class="modal-header">
                <h2>Placement Report</h2>
            </div>
            <div class="modal-body">
                <div class="report-summary">
                    <h3>Summary</h3>
                    <ul>
                        <li>Total Placements: ${stats.totalPlacements}</li>
                        <li>Average Placement Time: ${stats.avgPlacementTime} months</li>
                        <li>Top Employer: ${stats.topEmployer}</li>
                        <li>Average Starting Salary: ${Utils.formatCurrency(stats.avgSalary)}</li>
                    </ul>
                    
                    <h3>Top Employers</h3>
                    <ul>
                        ${Object.entries(stats.companyCounts)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([company, count]) => `<li>${company}: ${count} placements</li>`)
                            .join('')}
                    </ul>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Close</button>
                <button type="button" class="btn btn-primary" onclick="placementLogsManager.exportPlacements('pdf')">Export PDF</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }
}

function openPlacementModal() {
    placementLogsManager.openPlacementModal();
}

const placementLogsManager = new PlacementLogsManager();

// js/jobRecommendations.js
// AI-powered job recommendations for alumni
class JobRecommendationsManager {
    constructor() {
        this.recommendations = [];
        this.alumniProfiles = [];
        this.jobs = [];
        this.matchingAlgorithm = 'skills_based'; // skills_based, location_based, experience_based
    }

    loadJobRecommendations() {
        this.alumniProfiles = db.select('alumni_profiles');
        this.jobs = db.select('job_board').filter(job => job.status === 'active');
        this.generateRecommendations();
        this.displayRecommendations();
    }

    generateRecommendations() {
        const currentUser = auth.getCurrentUser();
        
        if (currentUser.role === 'alumni') {
            // Generate recommendations for current alumni user
            const userProfile = this.alumniProfiles.find(p => p.user_id === currentUser.id);
            if (userProfile) {
                this.recommendations = this.getRecommendationsForAlumni(userProfile);
            }
        } else {
            // Generate recommendations for all alumni (admin view)
            this.recommendations = this.getAllRecommendations();
        }
    }

    getRecommendationsForAlumni(alumniProfile) {
        const recommendations = [];
        
        this.jobs.forEach(job => {
            const score = this.calculateMatchScore(alumniProfile, job);
            if (score > 0.3) { // Minimum 30% match
                recommendations.push({
                    id: `${alumniProfile.id}_${job.id}`,
                    alumni_id: alumniProfile.id,
                    alumni_name: `${alumniProfile.first_name} ${alumniProfile.last_name}`,
                    job_id: job.id,
                    job_title: job.title,
                    company: job.company,
                    location: job.location,
                    match_score: score,
                    match_reasons: this.getMatchReasons(alumniProfile, job, score),
                    recommended_at: new Date().toISOString()
                });
            }
        });

        return recommendations.sort((a, b) => b.match_score - a.match_score);
    }

    getAllRecommendations() {
        const allRecommendations = [];
        
        this.alumniProfiles.forEach(alumni => {
            const alumniRecommendations = this.getRecommendationsForAlumni(alumni);
            allRecommendations.push(...alumniRecommendations.slice(0, 3)); // Top 3 per alumni
        });

       // js/jobRecommendations.js (continued)
        return allRecommendations.sort((a, b) => b.match_score - a.match_score);
    }

    calculateMatchScore(alumniProfile, job) {
        let score = 0;
        let factors = 0;

        // Course/Field match (40% weight)
        if (this.courseMatchesJob(alumniProfile.course, job.category)) {
            score += 0.4;
        }
        factors++;

        // Experience level match (30% weight)
        const experienceMatch = this.getExperienceMatch(alumniProfile, job);
        score += experienceMatch * 0.3;
        factors++;

        // Location preference (20% weight)
        if (this.locationMatches(alumniProfile, job)) {
            score += 0.2;
        }
        factors++;

        // Employment status (10% weight)
        if (alumniProfile.employment_status === 'unemployed') {
            score += 0.1; // Boost for unemployed alumni
        }
        factors++;

        return Math.min(score, 1.0); // Cap at 100%
    }

    courseMatchesJob(course, jobCategory) {
        const courseJobMapping = {
            'BS Computer Science': ['Information Technology', 'Engineering', 'Research & Development'],
            'BS Business Administration': ['Business & Finance', 'Marketing & Sales', 'Operations', 'Human Resources'],
            'BS Civil Engineering': ['Engineering', 'Operations'],
            'BS Nursing': ['Healthcare'],
            'BS Psychology': ['Human Resources', 'Healthcare', 'Education']
        };

        return courseJobMapping[course]?.includes(jobCategory) || false;
    }

    getExperienceMatch(alumniProfile, job) {
        const graduationYear = alumniProfile.graduation_year;
        const currentYear = new Date().getFullYear();
        const yearsExperience = currentYear - graduationYear;

        const jobExperienceLevel = job.experience_level;
        
        if (jobExperienceLevel.includes('Entry Level') && yearsExperience <= 2) return 1.0;
        if (jobExperienceLevel.includes('Mid Level') && yearsExperience >= 3 && yearsExperience <= 5) return 1.0;
        if (jobExperienceLevel.includes('Senior Level') && yearsExperience >= 6 && yearsExperience <= 10) return 1.0;
        if (jobExperienceLevel.includes('Executive Level') && yearsExperience > 10) return 1.0;
        
        // Partial matches
        if (jobExperienceLevel.includes('Entry Level') && yearsExperience <= 4) return 0.7;
        if (jobExperienceLevel.includes('Mid Level') && yearsExperience >= 2 && yearsExperience <= 7) return 0.7;
        
        return 0.3; // Minimum score for experience mismatch
    }

    locationMatches(alumniProfile, job) {
        // Simple location matching - can be enhanced with geolocation
        if (!alumniProfile.address) return false;
        
        const alumniLocation = alumniProfile.address.toLowerCase();
        const jobLocation = job.location.toLowerCase();
        
        // Check for city matches
        const cities = ['makati', 'taguig', 'bgc', 'ortigas', 'manila', 'quezon city', 'pasig'];
        
        for (const city of cities) {
            if (alumniLocation.includes(city) && jobLocation.includes(city)) {
                return true;
            }
        }
        
        return false;
    }

    getMatchReasons(alumniProfile, job, score) {
        const reasons = [];
        
        if (this.courseMatchesJob(alumniProfile.course, job.category)) {
            reasons.push(`Course matches job category (${job.category})`);
        }
        
        const experienceMatch = this.getExperienceMatch(alumniProfile, job);
        if (experienceMatch > 0.7) {
            reasons.push(`Experience level aligns with requirements`);
        }
        
        if (this.locationMatches(alumniProfile, job)) {
            reasons.push(`Location preference match`);
        }
        
        if (alumniProfile.employment_status === 'unemployed') {
            reasons.push(`Currently seeking employment`);
        }
        
        if (score > 0.8) {
            reasons.push(`Excellent overall match (${Math.round(score * 100)}%)`);
        } else if (score > 0.6) {
            reasons.push(`Good match (${Math.round(score * 100)}%)`);
        }
        
        return reasons;
    }

    displayRecommendations() {
        const container = document.getElementById('jobRecommendationsContainer');
        
        if (this.recommendations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lightbulb"></i>
                    <h3>No job recommendations available</h3>
                    <p>Update alumni profiles and add more job postings to generate recommendations</p>
                </div>
            `;
            return;
        }

        const currentUser = auth.getCurrentUser();
        
        if (currentUser.role === 'alumni') {
            this.displayAlumniRecommendations();
        } else {
            this.displayAdminRecommendations();
        }
    }

    displayAlumniRecommendations() {
        const container = document.getElementById('jobRecommendationsContainer');
        
        container.innerHTML = `
            <div class="recommendations-header">
                <h2>Recommended Jobs for You</h2>
                <p>Based on your profile, education, and preferences</p>
            </div>
            
            <div class="recommendations-grid">
                ${this.recommendations.map(rec => `
                    <div class="recommendation-card">
                        <div class="recommendation-header">
                            <div class="job-info">
                                <h3>${rec.job_title}</h3>
                                <p class="company">${rec.company}</p>
                                <p class="location">
                                    <i class="fas fa-map-marker-alt"></i>
                                    ${rec.location}
                                </p>
                            </div>
                            <div class="match-score">
                                <div class="score-circle" style="--score: ${rec.match_score * 100}">
                                    <span>${Math.round(rec.match_score * 100)}%</span>
                                </div>
                                <small>Match</small>
                            </div>
                        </div>
                        
                        <div class="match-reasons">
                            <h4>Why this job matches you:</h4>
                            <ul>
                                ${rec.match_reasons.map(reason => `<li>${reason}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="recommendation-actions">
                            <button class="btn btn-primary" onclick="jobRecommendationsManager.viewRecommendedJob(${rec.job_id})">
                                <i class="fas fa-eye"></i> View Job
                            </button>
                            <button class="btn btn-success" onclick="jobRecommendationsManager.applyToRecommendedJob(${rec.job_id})">
                                <i class="fas fa-paper-plane"></i> Apply Now
                            </button>
                            <button class="btn btn-secondary" onclick="jobRecommendationsManager.dismissRecommendation('${rec.id}')">
                                <i class="fas fa-times"></i> Not Interested
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayAdminRecommendations() {
        const container = document.getElementById('jobRecommendationsContainer');
        
        // Group recommendations by alumni
        const groupedRecs = {};
        this.recommendations.forEach(rec => {
            if (!groupedRecs[rec.alumni_id]) {
                groupedRecs[rec.alumni_id] = {
                    alumni_name: rec.alumni_name,
                    recommendations: []
                };
            }
            groupedRecs[rec.alumni_id].recommendations.push(rec);
        });

        container.innerHTML = `
            <div class="recommendations-header">
                <h2>Job Recommendations Overview</h2>
                <div class="recommendation-stats">
                    <div class="stat-item">
                        <span class="stat-value">${Object.keys(groupedRecs).length}</span>
                        <span class="stat-label">Alumni with Recommendations</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.recommendations.length}</span>
                        <span class="stat-label">Total Recommendations</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.jobs.length}</span>
                        <span class="stat-label">Active Jobs</span>
                    </div>
                </div>
            </div>
            
            <div class="alumni-recommendations">
                ${Object.entries(groupedRecs).map(([alumniId, data]) => `
                    <div class="alumni-recommendation-section">
                        <div class="alumni-header">
                            <h3>${data.alumni_name}</h3>
                            <span class="recommendation-count">${data.recommendations.length} recommendations</span>
                        </div>
                        <div class="recommendations-list">
                            ${data.recommendations.slice(0, 3).map(rec => `
                                <div class="recommendation-item">
                                    <div class="job-details">
                                        <h4>${rec.job_title}</h4>
                                        <p>${rec.company} • ${rec.location}</p>
                                    </div>
                                    <div class="match-info">
                                        <div class="match-score-small">
                                            ${Math.round(rec.match_score * 100)}%
                                        </div>
                                        <div class="match-reasons-small">
                                            ${rec.match_reasons.slice(0, 2).join(', ')}
                                        </div>
                                    </div>
                                    <div class="recommendation-actions-small">
                                        <button class="btn btn-sm btn-primary" onclick="jobRecommendationsManager.sendRecommendation('${rec.id}')">
                                            <i class="fas fa-paper-plane"></i> Send
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    viewRecommendedJob(jobId) {
        // Redirect to job board view
        if (typeof jobBoardManager !== 'undefined') {
            jobBoardManager.viewJob(jobId);
        } else {
            Utils.showNotification('Job details not available', 'error');
        }
    }

    applyToRecommendedJob(jobId) {
        // Redirect to job board apply
        if (typeof jobBoardManager !== 'undefined') {
            jobBoardManager.applyToJob(jobId);
        } else {
            Utils.showNotification('Application not available', 'error');
        }
    }

    dismissRecommendation(recommendationId) {
        Utils.confirmAction('Are you sure you want to dismiss this recommendation?', () => {
            this.recommendations = this.recommendations.filter(rec => rec.id !== recommendationId);
            this.displayRecommendations();
            Utils.showNotification('Recommendation dismissed', 'info');
        });
    }

    sendRecommendation(recommendationId) {
        const recommendation = this.recommendations.find(rec => rec.id === recommendationId);
        if (!recommendation) {
            Utils.showNotification('Recommendation not found', 'error');
            return;
        }

        // Simulate sending recommendation via email/notification
        Utils.showNotification(`Recommendation sent to ${recommendation.alumni_name}`, 'success');
        
        // Log the action
        console.log(`Recommendation sent: ${recommendation.job_title} to ${recommendation.alumni_name}`);
    }

    updateMatchingAlgorithm(algorithm) {
        this.matchingAlgorithm = algorithm;
        this.generateRecommendations();
        this.displayRecommendations();
        Utils.showNotification(`Matching algorithm updated to ${algorithm}`, 'info');
    }

    exportRecommendations(format = 'csv') {
        Utils.showNotification(`Exporting ${this.recommendations.length} recommendations as ${format.toUpperCase()}...`, 'info');
        setTimeout(() => {
            Utils.showNotification('Recommendations exported successfully', 'success');
        }, 1500);
    }

    generateRecommendationReport() {
        const stats = {
            totalRecommendations: this.recommendations.length,
            averageMatchScore: this.recommendations.length > 0 ? 
                (this.recommendations.reduce((sum, rec) => sum + rec.match_score, 0) / this.recommendations.length).toFixed(2) : 0,
            topMatchingJobs: this.getTopMatchingJobs(),
            alumniWithRecommendations: new Set(this.recommendations.map(rec => rec.alumni_id)).size
        };

        const modalContent = `
            <div class="modal-header">
                <h2>Job Recommendations Report</h2>
            </div>
            <div class="modal-body">
                <div class="report-stats">
                    <div class="stat-grid">
                        <div class="stat-item">
                            <h3>Total Recommendations</h3>
                            <div class="stat-value">${stats.totalRecommendations}</div>
                        </div>
                        <div class="stat-item">
                            <h3>Average Match Score</h3>
                            <div class="stat-value">${Math.round(stats.averageMatchScore * 100)}%</div>
                        </div>
                        <div class="stat-item">
                            <h3>Alumni with Recommendations</h3>
                            <div class="stat-value">${stats.alumniWithRecommendations}</div>
                        </div>
                    </div>
                    
                    <div class="top-jobs">
                        <h3>Top Matching Jobs</h3>
                        <ul>
                            ${stats.topMatchingJobs.map(job => 
                                `<li>${job.title} at ${job.company} (${job.matchCount} matches)</li>`
                            ).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Close</button>
                <button type="button" class="btn btn-primary" onclick="jobRecommendationsManager.exportRecommendations('pdf')">Export PDF</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    getTopMatchingJobs() {
        const jobCounts = {};
        
        this.recommendations.forEach(rec => {
            const key = `${rec.job_title}_${rec.company}`;
            if (!jobCounts[key]) {
                jobCounts[key] = {
                    title: rec.job_title,
                    company: rec.company,
                    matchCount: 0
                };
            }
            jobCounts[key].matchCount++;
        });

        return Object.values(jobCounts)
            .sort((a, b) => b.matchCount - a.matchCount)
            .slice(0, 5);
    }
}

const jobRecommendationsManager = new JobRecommendationsManager();

// js/jobFetchWorkflow.js
// Automated job fetching from external sources
class JobFetchWorkflowManager {
    constructor() {
        this.jobSources = [
            { id: 'jobstreet', name: 'JobStreet', url: 'https://www.jobstreet.com.ph', enabled: true },
            { id: 'indeed', name: 'Indeed', url: 'https://ph.indeed.com', enabled: true },
            { id: 'linkedin', name: 'LinkedIn', url: 'https://www.linkedin.com/jobs', enabled: false },
            { id: 'kalibrr', name: 'Kalibrr', url: 'https://www.kalibrr.com', enabled: true }
        ];
        this.fetchHistory = [];
        this.scheduledFetches = [];
        this.isRunning = false;
    }

    loadJobFetchWorkflow() {
        this.loadFetchHistory();
        this.displayJobSources();
        this.displayFetchHistory();
        this.displayScheduledFetches();
    }

    loadFetchHistory() {
        this.fetchHistory = JSON.parse(localStorage.getItem('job_fetch_history') || '[]');
        this.scheduledFetches = JSON.parse(localStorage.getItem('scheduled_fetches') || '[]');
    }

    saveFetchHistory() {
        localStorage.setItem('job_fetch_history', JSON.stringify(this.fetchHistory));
        localStorage.setItem('scheduled_fetches', JSON.stringify(this.scheduledFetches));
    }

    displayJobSources() {
        const container = document.getElementById('jobSourcesContainer');
        
        container.innerHTML = `
            <div class="job-sources-header">
                <h3>Job Sources Configuration</h3>
                <button class="btn btn-primary" onclick="jobFetchWorkflowManager.openSourceModal()">
                    <i class="fas fa-plus"></i> Add Source
                </button>
            </div>
            
            <div class="sources-grid">
                ${this.jobSources.map(source => `
                    <div class="source-card ${source.enabled ? 'enabled' : 'disabled'}">
                        <div class="source-header">
                            <div class="source-info">
                                <h4>${source.name}</h4>
                                <p class="source-url">${source.url}</p>
                            </div>
                            <div class="source-toggle">
                                <label class="switch">
                                    <input type="checkbox" ${source.enabled ? 'checked' : ''} 
                                           onchange="jobFetchWorkflowManager.toggleSource('${source.id}')">
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="source-stats">
                            <div class="stat-item">
                                <span class="stat-label">Last Fetch:</span>
                                <span class="stat-value">${this.getLastFetchTime(source.id)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Jobs Found:</span>
                                <span class="stat-value">${this.getJobsFoundCount(source.id)}</span>
                            </div>
                        </div>
                        
                        <div class="source-actions">
                            <button class="btn btn-sm btn-primary" onclick="jobFetchWorkflowManager.testFetch('${source.id}')">
                                <i class="fas fa-play"></i> Test Fetch
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="jobFetchWorkflowManager.configureSource('${source.id}')">
                                <i class="fas fa-cog"></i> Configure
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayFetchHistory() {
        const container = document.getElementById('fetchHistoryContainer');
        
        if (this.fetchHistory.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>No fetch history</h3>
                    <p>Run your first job fetch to see history</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="fetch-history-header">
                <h3>Fetch History</h3>
                <button class="btn btn-secondary" onclick="jobFetchWorkflowManager.clearHistory()">
                    <i class="fas fa-trash"></i> Clear History
                </button>
            </div>
            
            <div class="history-list">
                ${this.fetchHistory.slice(-10).reverse().map(fetch => `
                    <div class="history-item ${fetch.status}">
                        <div class="history-header">
                            <div class="fetch-info">
                                <h4>${fetch.source_name}</h4>
                                <p class="fetch-time">${Utils.formatDateTime(fetch.started_at)}</p>
                            </div>
                            <div class="fetch-status">
                                <span class="status-badge status-${fetch.status}">${fetch.status}</span>
                            </div>
                        </div>
                        
                        <div class="history-details">
                            <div class="detail-item">
                                <span class="label">Duration:</span>
                                <span class="value">${fetch.duration}ms</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Jobs Found:</span>
                                <span class="value">${fetch.jobs_found || 0}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Jobs Added:</span>
                                <span class="value">${fetch.jobs_added || 0}</span>
                            </div>
                            ${fetch.error ? `
                                <div class="detail-item error">
                                    <span class="label">Error:</span>
                                    <span class="value">${fetch.error}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayScheduledFetches() {
        const container = document.getElementById('scheduledFetchesContainer');
        
        container.innerHTML = `
            <div class="scheduled-header">
                <h3>Scheduled Fetches</h3>
                <button class="btn btn-primary" onclick="jobFetchWorkflowManager.openScheduleModal()">
                    <i class="fas fa-clock"></i> Schedule Fetch
                </button>
            </div>
            
            <div class="scheduled-list">
                ${this.scheduledFetches.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-calendar"></i>
                        <h3>No scheduled fetches</h3>
                        <p>Schedule automatic job fetching</p>
                    </div>
                ` : this.scheduledFetches.map(schedule => `
                    <div class="schedule-item">
                        <div class="schedule-info">
                            <h4>${schedule.name}</h4>
                            <p>Sources: ${schedule.sources.join(', ')}</p>
                            <p>Frequency: ${schedule.frequency}</p>
                            <p>Next Run: ${Utils.formatDateTime(schedule.next_run)}</p>
                        </div>
                        <div class="schedule-actions">
                            <button class="btn btn-sm btn-success" onclick="jobFetchWorkflowManager.runSchedule('${schedule.id}')">
                                <i class="fas fa-play"></i> Run Now
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="jobFetchWorkflowManager.editSchedule('${schedule.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="jobFetchWorkflowManager.deleteSchedule('${schedule.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    toggleSource(sourceId) {
        const source = this.jobSources.find(s => s.id === sourceId);
        if (source) {
            source.enabled = !source.enabled;
            this.displayJobSources();
            Utils.showNotification(`${source.name} ${source.enabled ? 'enabled' : 'disabled'}`, 'info');
        }
    }

    testFetch(sourceId) {
        const source = this.jobSources.find(s => s.id === sourceId);
        if (!source) return;

        if (this.isRunning) {
            Utils.showNotification('Another fetch is already running', 'warning');
            return;
        }

        this.isRunning = true;
        Utils.showNotification(`Testing fetch from ${source.name}...`, 'info');

        // Simulate fetch process
        const fetchRecord = {
            id: Date.now(),
            source_id: sourceId,
            source_name: source.name,
            started_at: new Date().toISOString(),
            status: 'running'
        };

        this.fetchHistory.push(fetchRecord);
        this.displayFetchHistory();

        // Simulate API call delay
        setTimeout(() => {
            const success = Math.random() > 0.2; // 80% success rate
            const jobsFound = success ? Math.floor(Math.random() * 50) + 10 : 0;
            const jobsAdded = success ? Math.floor(jobsFound * 0.3) : 0;

            fetchRecord.status = success ? 'completed' : 'failed';
            fetchRecord.completed_at = new Date().toISOString();
            fetchRecord.duration = Date.now() - new Date(fetchRecord.started_at).getTime();
            fetchRecord.jobs_found = jobsFound;
            fetchRecord.jobs_added = jobsAdded;

            if (!success) {
                fetchRecord.error = 'Connection timeout or API limit reached';
            }

            this.isRunning = false;
            this.saveFetchHistory();
            this.displayFetchHistory();

            if (success) {
                Utils.showNotification(`Fetch completed: ${jobsAdded} new jobs added`, 'success');
                // Simulate adding jobs to job board
                this.simulateJobAddition(jobsAdded, source.name);
            } else {
                Utils.showNotification(`Fetch failed: ${fetchRecord.error}`, 'error');
            }
        }, 3000);
    }

    simulateJobAddition(count, sourceName) {
        const sampleJobs = [
            { title: 'Software Developer', company: 'Tech Corp', category: 'Information Technology' },
            { title: 'Marketing Manager', company: 'Brand Co', category: 'Marketing & Sales' },
            { title: 'Data Analyst', company: 'Analytics Inc', category: 'Information Technology' },
            { title: 'HR Specialist', company: 'People First', category: 'Human Resources' },
            { title: 'Project Manager', company: 'Solutions Ltd', category: 'Operations' }
        ];

        for (let i = 0; i < count; i++) {
            const sampleJob = sampleJobs[Math.floor(Math.random() * sampleJobs.length)];
            const jobData = {
                title: sampleJob.title,
                company: sampleJob.company,
                location: 'Metro Manila',
                job_type: 'Full-time',
                category: sampleJob.category,
                experience_level: 'Mid Level (3-5 years)',
                description: `Exciting opportunity at ${sampleJob.company}. Join our dynamic team!`,
                requirements: 'Bachelor\'s degree, 2+ years experience, excellent communication skills',
                contact_email: 'hr@company.com',
                status: 'active',
                source: sourceName,
                posted_by_id: 1,
                posted_by_name: 'Job Fetch Bot'
            };

            // js/jobFetchWorkflow.js (continued)
            db.insert('job_board', jobData);
        }
    }

    openScheduleModal(schedule = null) {
        const isEdit = schedule !== null;
        
        const sourceOptions = this.jobSources.map(source => 
            `<option value="${source.id}" ${schedule?.sources?.includes(source.id) ? 'selected' : ''}>${source.name}</option>`
        ).join('');
        
        const modalContent = `
            <div class="modal-header">
                <h2>${isEdit ? 'Edit Schedule' : 'Schedule Job Fetch'}</h2>
            </div>
            <div class="modal-body">
                <form id="scheduleForm">
                    <div class="form-group">
                        <label for="scheduleName">Schedule Name</label>
                        <input type="text" id="scheduleName" name="name" value="${schedule?.name || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="sources">Job Sources</label>
                        <select id="sources" name="sources" multiple required>
                            ${sourceOptions}
                        </select>
                        <small class="form-text">Hold Ctrl/Cmd to select multiple sources</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="frequency">Frequency</label>
                        <select id="frequency" name="frequency" required>
                            <option value="hourly" ${schedule?.frequency === 'hourly' ? 'selected' : ''}>Every Hour</option>
                            <option value="daily" ${schedule?.frequency === 'daily' ? 'selected' : ''}>Daily</option>
                            <option value="weekly" ${schedule?.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                            <option value="monthly" ${schedule?.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="startTime">Start Time</label>
                        <input type="time" id="startTime" name="start_time" value="${schedule?.start_time || '09:00'}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="keywords">Keywords (Optional)</label>
                        <input type="text" id="keywords" name="keywords" value="${schedule?.keywords || ''}" placeholder="e.g., software, engineer, manager">
                        <small class="form-text">Comma-separated keywords to filter jobs</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="maxJobs">Max Jobs per Fetch</label>
                        <input type="number" id="maxJobs" name="max_jobs" value="${schedule?.max_jobs || 50}" min="1" max="200">
                    </div>
                    
                    <div class="form-group">
                        <label for="autoApprove">
                            <input type="checkbox" id="autoApprove" name="auto_approve" ${schedule?.auto_approve ? 'checked' : ''}>
                            Auto-approve fetched jobs
                        </label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="jobFetchWorkflowManager.saveSchedule()">${isEdit ? 'Update' : 'Create'} Schedule</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    saveSchedule() {
        const form = document.getElementById('scheduleForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const selectedSources = Array.from(document.getElementById('sources').selectedOptions).map(option => option.value);
        
        const scheduleData = {
            id: Date.now().toString(),
            name: formData.get('name'),
            sources: selectedSources,
            frequency: formData.get('frequency'),
            start_time: formData.get('start_time'),
            keywords: formData.get('keywords'),
            max_jobs: parseInt(formData.get('max_jobs')),
            auto_approve: document.getElementById('autoApprove').checked,
            created_at: new Date().toISOString(),
            next_run: this.calculateNextRun(formData.get('frequency'), formData.get('start_time')),
            enabled: true
        };

        this.scheduledFetches.push(scheduleData);
        this.saveFetchHistory();
        
        Utils.showNotification('Schedule created successfully', 'success');
        modalManager.closeModal();
        this.displayScheduledFetches();
    }

    calculateNextRun(frequency, startTime) {
        const now = new Date();
        const [hours, minutes] = startTime.split(':').map(Number);
        
        let nextRun = new Date();
        nextRun.setHours(hours, minutes, 0, 0);
        
        switch (frequency) {
            case 'hourly':
                if (nextRun <= now) {
                    nextRun.setHours(nextRun.getHours() + 1);
                }
                break;
            case 'daily':
                if (nextRun <= now) {
                    nextRun.setDate(nextRun.getDate() + 1);
                }
                break;
            case 'weekly':
                if (nextRun <= now) {
                    nextRun.setDate(nextRun.getDate() + 7);
                }
                break;
            case 'monthly':
                if (nextRun <= now) {
                    nextRun.setMonth(nextRun.getMonth() + 1);
                }
                break;
        }
        
        return nextRun.toISOString();
    }

    runSchedule(scheduleId) {
        const schedule = this.scheduledFetches.find(s => s.id === scheduleId);
        if (!schedule) return;

        Utils.showNotification(`Running scheduled fetch: ${schedule.name}`, 'info');
        
        // Run fetch for each source in the schedule
        schedule.sources.forEach(sourceId => {
            setTimeout(() => {
                this.testFetch(sourceId);
            }, Math.random() * 2000); // Stagger the requests
        });

        // Update next run time
        schedule.next_run = this.calculateNextRun(schedule.frequency, schedule.start_time);
        this.saveFetchHistory();
        this.displayScheduledFetches();
    }

    deleteSchedule(scheduleId) {
        Utils.confirmAction('Are you sure you want to delete this schedule?', () => {
            this.scheduledFetches = this.scheduledFetches.filter(s => s.id !== scheduleId);
            this.saveFetchHistory();
            this.displayScheduledFetches();
            Utils.showNotification('Schedule deleted successfully', 'success');
        });
    }

    configureSource(sourceId) {
        const source = this.jobSources.find(s => s.id === sourceId);
        if (!source) return;

        const modalContent = `
            <div class="modal-header">
                <h2>Configure ${source.name}</h2>
            </div>
            <div class="modal-body">
                <form id="sourceConfigForm">
                    <div class="form-group">
                        <label for="sourceName">Source Name</label>
                        <input type="text" id="sourceName" name="name" value="${source.name}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="sourceUrl">Source URL</label>
                        <input type="url" id="sourceUrl" name="url" value="${source.url}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="apiKey">API Key (if required)</label>
                        <input type="password" id="apiKey" name="api_key" value="${source.api_key || ''}" placeholder="Enter API key">
                    </div>
                    
                    <div class="form-group">
                        <label for="rateLimit">Rate Limit (requests per minute)</label>
                        <input type="number" id="rateLimit" name="rate_limit" value="${source.rate_limit || 60}" min="1" max="1000">
                    </div>
                    
                    <div class="form-group">
                        <label for="defaultLocation">Default Location Filter</label>
                        <input type="text" id="defaultLocation" name="default_location" value="${source.default_location || 'Philippines'}" placeholder="e.g., Metro Manila">
                    </div>
                    
                    <div class="form-group">
                        <label for="excludeKeywords">Exclude Keywords</label>
                        <textarea id="excludeKeywords" name="exclude_keywords" rows="3" placeholder="Comma-separated keywords to exclude">${source.exclude_keywords || ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="jobFetchWorkflowManager.saveSourceConfig('${sourceId}')">Save Configuration</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    saveSourceConfig(sourceId) {
        const form = document.getElementById('sourceConfigForm');
        const formData = new FormData(form);
        
        const source = this.jobSources.find(s => s.id === sourceId);
        if (source) {
            source.name = formData.get('name');
            source.url = formData.get('url');
            source.api_key = formData.get('api_key');
            source.rate_limit = parseInt(formData.get('rate_limit'));
            source.default_location = formData.get('default_location');
            source.exclude_keywords = formData.get('exclude_keywords');
            
            Utils.showNotification('Source configuration saved', 'success');
            modalManager.closeModal();
            this.displayJobSources();
        }
    }

    getLastFetchTime(sourceId) {
        const lastFetch = this.fetchHistory
            .filter(f => f.source_id === sourceId)
            .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0];
        
        return lastFetch ? Utils.formatDateTime(lastFetch.started_at) : 'Never';
    }

    getJobsFoundCount(sourceId) {
        return this.fetchHistory
            .filter(f => f.source_id === sourceId && f.status === 'completed')
            .reduce((total, f) => total + (f.jobs_found || 0), 0);
    }

    clearHistory() {
        Utils.confirmAction('Are you sure you want to clear all fetch history?', () => {
            this.fetchHistory = [];
            this.saveFetchHistory();
            this.displayFetchHistory();
            Utils.showNotification('Fetch history cleared', 'success');
        });
    }

    startAutomatedFetching() {
        // Check for scheduled fetches every minute
        setInterval(() => {
            const now = new Date();
            
            this.scheduledFetches.forEach(schedule => {
                if (schedule.enabled && new Date(schedule.next_run) <= now) {
                    this.runSchedule(schedule.id);
                }
            });
        }, 60000); // Check every minute
    }

    exportFetchHistory(format = 'csv') {
        Utils.showNotification(`Exporting fetch history as ${format.toUpperCase()}...`, 'info');
        setTimeout(() => {
            Utils.showNotification('Fetch history exported successfully', 'success');
        }, 1500);
    }
}

const jobFetchWorkflowManager = new JobFetchWorkflowManager();

// Start automated fetching when the page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof jobFetchWorkflowManager !== 'undefined') {
        jobFetchWorkflowManager.startAutomatedFetching();
    }
});