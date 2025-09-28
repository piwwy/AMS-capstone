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
            case 'budget':
                budgetManager.loadBudgets();
                break;
            case 'revenue':
                revenueManager.loadRevenue();
                break;
            case 'expenses':
                expenseManager.loadExpenses();
                break;
            case 'payables':
                payableManager.loadPayables();
                break;
            case 'receivables':
                receivableManager.loadReceivables();
                break;
            case 'funds':
                fundManager.loadFunds();
                break;
            case 'requests':
                requestManager.loadRequests();
                break;
            case 'reports':
                reportManager.loadReports();
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
        if (typeof reportManager !== 'undefined' && reportManager.generateReport) {
            reportManager.generateReport();
        } else {
            Utils.showNotification('Report generation is not available', 'error');
        }
    } else {
        Utils.showNotification('An unexpected error occurred. Please try again.', 'error');
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Financial Management System Initialized');
    moduleManager.showModule('dashboard');
});