// Dashboard Management
class DashboardManager {
    constructor() {
        this.analytics = {};
        this.recentTransactions = [];
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

        // Check for new transactions every 15 seconds
        setInterval(() => {
            this.checkForNewTransactions();
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
        if (this.revenueChart) {
            // Simulate new data points
            const currentData = this.revenueChart.data.datasets[0].data;
            const revenueData = this.revenueChart.data.datasets[0];
            const expenseData = this.revenueChart.data.datasets[1];
            
            // Add some realistic variation to the data
            const lastRevenue = currentData[currentData.length - 1];
            const newRevenue = lastRevenue + (Math.random() - 0.5) * 10000;
            
            const lastExpense = expenseData.data[expenseData.data.length - 1];
            const newExpense = lastExpense + (Math.random() - 0.5) * 8000;
            
            // Update chart data
            revenueData.data.push(Math.max(0, newRevenue));
            expenseData.data.push(Math.max(0, newExpense));
            
            // Keep only last 12 data points
            if (revenueData.data.length > 12) {
                revenueData.data.shift();
                expenseData.data.shift();
            }
            
            this.revenueChart.update('none');
        }
    }

    checkForNewTransactions() {
        // Simulate new transactions being added
        const random = Math.random();
        if (random < 0.3) { // 30% chance of new transaction
            const transactionTypes = ['revenue', 'expense'];
            const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
            
            const newTransaction = {
                id: Date.now(),
                type: type,
                description: type === 'revenue' ? 
                    `New tuition payment - Student ${Math.floor(Math.random() * 1000)}` :
                    `${['Office supplies', 'Utility payment', 'Equipment maintenance'][Math.floor(Math.random() * 3)]}`,
                amount: type === 'revenue' ? 
                    Math.floor(Math.random() * 5000) + 1000 :
                    -(Math.floor(Math.random() * 2000) + 200),
                date: new Date().toISOString().split('T')[0],
                isNew: true
            };
            
            // Add to recent transactions
            this.recentTransactions.unshift(newTransaction);
            if (this.recentTransactions.length > 5) {
                this.recentTransactions.pop();
            }
            
            // Update the display
            this.displayRecentTransactions();
            
            // Show notification
            this.showRealTimeNotification(
                `New ${type} recorded: ₱${Math.abs(newTransaction.amount).toLocaleString()}`,
                type === 'revenue' ? 'success' : 'info'
            );
            
            // Update analytics
            setTimeout(() => {
                this.updateAnalyticsRealTime();
            }, 1000);
        }
    }

    checkForSignificantChanges(previous, current) {
        const revenueChange = current.totalRevenue - previous.totalRevenue;
        const expenseChange = current.totalExpenses - previous.totalExpenses;
        
        if (Math.abs(revenueChange) > 1000) {
            this.showRealTimeNotification(
                `Revenue ${revenueChange > 0 ? 'increased' : 'decreased'} by ₱${Math.abs(revenueChange).toLocaleString()}`,
                revenueChange > 0 ? 'success' : 'warning'
            );
        }
        
        if (Math.abs(expenseChange) > 1000) {
            this.showRealTimeNotification(
                `Expenses ${expenseChange > 0 ? 'increased' : 'decreased'} by ₱${Math.abs(expenseChange).toLocaleString()}`,
                'info'
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

    displayRecentTransactions() {
        const container = document.querySelector('#recentTransactions .space-y-4');
        if (!container) return;
        
        container.innerHTML = this.recentTransactions.map(transaction => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg ${transaction.isNew ? 'new-transaction' : ''}">
                <div class="flex items-center">
                    <div class="p-2 rounded-full mr-3 ${
                        transaction.type === 'revenue' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }">
                        <i class="fas fa-${transaction.type === 'revenue' ? 'arrow-up' : 'arrow-down'} w-4 h-4"></i>
                    </div>
                    <div>
                        <p class="font-medium text-gray-900">${transaction.description}</p>
                        <p class="text-sm text-gray-500">${transaction.date}</p>
                    </div>
                </div>
                <span class="font-medium ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                }">
                    ₱${Math.abs(transaction.amount).toLocaleString()}
                </span>
            </div>
        `).join('');
        
        // Remove new transaction indicators after 3 seconds
        setTimeout(() => {
            this.recentTransactions.forEach(t => t.isNew = false);
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
        const pendingElement = document.getElementById('pendingRequests');
        if (pendingElement) {
            pendingElement.textContent = pendingApprovals.length;
        }
        
        // Show workflow notifications
        if (pendingApprovals.length > 0) {
            const approvalAlert = {
                type: 'warning',
                title: 'Pending Approvals',
                message: `You have ${pendingApprovals.length} transactions awaiting your approval`
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
                                <span class="amount">₱${item.data.amount.toLocaleString()}</span>
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
            Utils.showNotification('Transaction approved successfully', 'success');
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
            Utils.showNotification('Transaction rejected', 'info');
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
        this.animateNumberChange('totalRevenue', this.analytics.totalRevenue);
        this.animateNumberChange('totalExpenses', this.analytics.totalExpenses);
        this.animateNumberChange('netIncome', this.analytics.netIncome);
        this.animateNumberChange('netIncomeCard', this.analytics.netIncome);
        this.animateNumberChange('pendingRequests', this.analytics.pendingRequests, false);
        
        // Update budget utilization
        const budgetUtilization = this.analytics.totalExpenses > 0 ? 
            ((this.analytics.totalExpenses / (this.analytics.totalRevenue * 0.8)) * 100).toFixed(0) : 0;
        
        const budgetElement = document.getElementById('budgetUtilization');
        if (budgetElement) {
            budgetElement.textContent = budgetUtilization + '%';
        }
        
        // Update net income card styling based on value
        const netIncomeElement = document.getElementById('netIncomeCard');
        if (netIncomeElement && netIncomeElement.parentElement && netIncomeElement.parentElement.parentElement) {
            const card = netIncomeElement.parentElement.parentElement;
            if (this.analytics.netIncome >= 0) {
                card.className = card.className.replace(/net-income-card|expense-card/, 'net-income-card');
            } else {
                card.className = card.className.replace(/net-income-card/, 'expense-card');
            }
        }
    }

    animateNumberChange(elementId, newValue, isCurrency = true) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const currentText = element.textContent;
        const currentValue = isCurrency ? 
            parseFloat(currentText.replace(/[₱,]/g, '')) || 0 : 
            parseInt(currentText) || 0;
        
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
                Math.round(intermediateValue).toString();
            
            if (currentStep >= steps) {
                clearInterval(animation);
                element.textContent = isCurrency ? 
                    Utils.formatCurrency(newValue) : 
                    newValue.toString();
                element.classList.remove('value-changing');
            }
        }, duration / steps);
    }

    initializeCharts() {
        this.createRevenueChart();
    }
    
    createRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.revenueChart) {
            this.revenueChart.destroy();
        }
        
        this.revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [65000, 78000, 82000, 75000, 88000, 92000],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }, {
                    label: 'Expenses',
                    data: [45000, 52000, 48000, 61000, 55000, 67000],
                    borderColor: '#f5576c',
                    backgroundColor: 'rgba(245, 87, 108, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#f5576c',
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
                                return '₱' + (value / 1000) + 'K';
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
        
        // Check for overdue payables
        const overduePayables = db.getOverduePayables();
        if (overduePayables.length > 0) {
            alerts.push({
                type: 'error',
                title: 'Overdue Payables',
                message: `${overduePayables.length} payables are overdue`
            });
        }

        // Check for low fund balances
        const lowFunds = db.getLowFunds();
        
        if (lowFunds.length > 0) {
            alerts.push({
                type: 'warning',
                title: 'Low Fund Balance',
                message: `${lowFunds.length} funds have low balances`
            });
        }

        // Monthly report reminder
        alerts.push({
            type: 'info',
            title: 'Monthly Report',
            message: 'January financial report is ready for review'
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
        budget: 'Budget Management',
        revenue: 'Revenue Management',
        expenses: 'Expense Management',
        payables: 'Accounts Payable',
        receivables: 'Accounts Receivable',
        funds: 'Fund Management',
        requests: 'Financial Requests',
        reports: 'Reports & Analytics'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[moduleName] || 'Dashboard';
    }
};