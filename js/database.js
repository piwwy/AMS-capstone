// Database Management - SQLite operations simulation
class DatabaseManager {
    constructor() {
        this.initializeDatabase();
    }

    initializeDatabase() {
        // Initialize localStorage if not exists
        if (!localStorage.getItem('financial_db_initialized')) {
            this.createTables();
            this.insertSampleData();
            localStorage.setItem('financial_db_initialized', 'true');
        }
    }

    createTables() {
        // Users table
        const users = [
            { id: 1, username: 'admin', password: 'admin123', email: 'admin@school.edu', role: 'admin', department: 'Administration' },
            { id: 2, username: 'finance_manager', password: 'finance123', email: 'finance@school.edu', role: 'finance_manager', department: 'Finance' },
            { id: 3, username: 'accountant', password: 'account123', email: 'accountant@school.edu', role: 'accountant', department: 'Finance' }
        ];
        localStorage.setItem('users', JSON.stringify(users));

        // Initialize other tables
        localStorage.setItem('budgets', JSON.stringify([]));
        localStorage.setItem('revenue_transactions', JSON.stringify([]));
        localStorage.setItem('expenses', JSON.stringify([]));
        localStorage.setItem('accounts_payable', JSON.stringify([]));
        localStorage.setItem('accounts_receivable', JSON.stringify([]));
        localStorage.setItem('funds', JSON.stringify([]));
        localStorage.setItem('fund_transactions', JSON.stringify([]));
        localStorage.setItem('financial_requests', JSON.stringify([]));
        localStorage.setItem('revenue_sources', JSON.stringify([]));
        localStorage.setItem('expense_categories', JSON.stringify([]));
        localStorage.setItem('vendors', JSON.stringify([]));
    }

    insertSampleData() {
        // Sample revenue sources
        const revenueSources = [
            { id: 1, source_name: 'Tuition Fees', source_type: 'tuition', description: 'Student tuition payments', is_active: true },
            { id: 2, source_name: 'Laboratory Fees', source_type: 'fees', description: 'Laboratory usage fees', is_active: true },
            { id: 3, source_name: 'Library Fines', source_type: 'fees', description: 'Late return fines', is_active: true },
            { id: 4, source_name: 'Government Grants', source_type: 'grants', description: 'Government funding', is_active: true }
        ];
        localStorage.setItem('revenue_sources', JSON.stringify(revenueSources));

        // Sample expense categories
        const expenseCategories = [
            { id: 1, category_name: 'Utilities', description: 'Electricity, water, internet', is_active: true },
            { id: 2, category_name: 'Supplies', description: 'Office and educational supplies', is_active: true },
            { id: 3, category_name: 'Maintenance', description: 'Building and equipment maintenance', is_active: true },
            { id: 4, category_name: 'Salaries', description: 'Employee salaries and benefits', is_active: true }
        ];
        localStorage.setItem('expense_categories', JSON.stringify(expenseCategories));

        // Sample funds
        const funds = [
            { id: 1, fund_name: 'Operating Fund', fund_type: 'operational', balance: 500000.00, description: 'Daily operational expenses', is_active: true },
            { id: 2, fund_name: 'Capital Fund', fund_type: 'capital', balance: 200000.00, description: 'Capital improvements and equipment', is_active: true },
            { id: 3, fund_name: 'Emergency Fund', fund_type: 'emergency', balance: 100000.00, description: 'Emergency reserves', is_active: true },
            { id: 4, fund_name: 'Scholarship Fund', fund_type: 'scholarship', balance: 75000.00, description: 'Student scholarships', is_active: true }
        ];
        localStorage.setItem('funds', JSON.stringify(funds));

        // Sample vendors
        const vendors = [
            { id: 1, vendor_name: 'Power Company', contact_person: 'John Smith', email: 'billing@powerco.com', phone: '555-0101', address: '123 Electric Ave', is_active: true },
            { id: 2, vendor_name: 'Office Supplies Co.', contact_person: 'Jane Doe', email: 'sales@officesupplies.com', phone: '555-0102', address: '456 Supply St', is_active: true },
            { id: 3, vendor_name: 'Maintenance Services', contact_person: 'Mike Johnson', email: 'service@maintenance.com', phone: '555-0103', address: '789 Repair Rd', is_active: true }
        ];
        localStorage.setItem('vendors', JSON.stringify(vendors));

        // Sample transactions for dashboard
        const sampleRevenue = [
            { id: 1, revenue_source_id: 1, source_name: 'Tuition Fees', student_id: 'STU001', amount: 25000.00, transaction_date: '2024-01-15', payment_method: 'bank_transfer', reference_number: 'TXN001', description: 'Spring semester tuition', status: 'completed', created_by: 'finance_manager', created_at: '2024-01-15' },
            { id: 2, revenue_source_id: 2, source_name: 'Laboratory Fees', student_id: 'STU002', amount: 1500.00, transaction_date: '2024-01-14', payment_method: 'cash', reference_number: 'TXN002', description: 'Chemistry lab fees', status: 'completed', created_by: 'accountant', created_at: '2024-01-14' }
        ];
        localStorage.setItem('revenue_transactions', JSON.stringify(sampleRevenue));

        const sampleExpenses = [
            { id: 1, expense_category_id: 1, category_name: 'Utilities', vendor_name: 'Power Company', amount: 12000.00, expense_date: '2024-01-15', description: 'Monthly electricity bill', receipt_number: 'PWR-001', payment_method: 'bank_transfer', approval_status: 'approved', created_by: 'accountant', created_at: '2024-01-15' },
            { id: 2, expense_category_id: 2, category_name: 'Supplies', vendor_name: 'Office Depot', amount: 3500.00, expense_date: '2024-01-14', description: 'Office supplies', receipt_number: 'SUP-002', payment_method: 'credit_card', approval_status: 'pending', created_by: 'accountant', created_at: '2024-01-14' }
        ];
        localStorage.setItem('expenses', JSON.stringify(sampleExpenses));
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
        const revenue = this.select('revenue_transactions');
        const expenses = this.select('expenses');
        const requests = this.select('financial_requests');
        const payables = this.select('accounts_payable');
        const receivables = this.select('accounts_receivable');

        const totalRevenue = revenue.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0);
        const totalExpenses = expenses.filter(e => e.approval_status === 'approved').reduce((sum, e) => sum + e.amount, 0);
        const pendingRequests = requests.filter(r => r.status === 'pending').length;
        const pendingPayables = payables.filter(p => p.status === 'pending').length;
        const overdueReceivables = receivables.filter(r => r.status === 'overdue').length;

        return {
            totalRevenue,
            totalExpenses,
            netIncome: totalRevenue - totalExpenses,
            pendingRequests,
            pendingPayables,
            overdueReceivables
        };
    }

    // Get recent transactions for dashboard
    getRecentTransactions(limit = 5) {
        const revenue = this.select('revenue_transactions').slice(-limit);
        const expenses = this.select('expenses').slice(-limit);
        
        const transactions = [
            ...revenue.map(r => ({ ...r, type: 'revenue' })),
            ...expenses.map(e => ({ ...e, type: 'expense' }))
        ];
        
        return transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
    }
}

// Initialize database
const db = new DatabaseManager();