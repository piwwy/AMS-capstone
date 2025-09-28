// Authentication Management
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
            admin: {
                modules: ['dashboard', 'budget', 'revenue', 'expenses', 'payables', 'receivables', 'funds', 'requests', 'reports'],
                actions: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'export'],
                data: ['all']
            },
            finance_manager: {
                modules: ['dashboard', 'budget', 'revenue', 'expenses', 'payables', 'receivables', 'funds', 'requests', 'reports'],
                actions: ['create', 'read', 'update', 'approve', 'reject', 'export'],
                data: ['own_department', 'finance_data']
            },
            accountant: {
                modules: ['dashboard', 'revenue', 'expenses', 'payables', 'receivables', 'reports'],
                actions: ['create', 'read', 'update', 'export'],
                data: ['own_records', 'finance_data']
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
            admin: ['all'],
            finance_manager: ['own_department', 'finance_data', 'all_requests'],
            accountant: ['own_records', 'finance_data']
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
        
        // Admin sees everything
        if (this.currentUser.role === 'admin') return data;
        
        // Filter based on role and data type
        switch (this.currentUser.role) {
            case 'finance_manager':
                // Finance manager sees all finance-related data
                return data;
                
            case 'accountant':
                // Accountant sees only their own records and general finance data
                return data.filter(item => {
                    return item.created_by === this.currentUser.username || 
                           item.created_by_name === this.currentUser.username ||
                           !item.created_by; // Public data
                });
                
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