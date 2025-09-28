// Database connection and initialization
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

class DatabaseManager {
    constructor() {
        this.db = new Database('financial_management.db');
        this.initializeDatabase();
    }

    initializeDatabase() {
        // Read and execute schema
        const schema = readFileSync(join(process.cwd(), 'src/database/schema.sql'), 'utf8');
        this.db.exec(schema);
        
        // Enable foreign keys
        this.db.exec('PRAGMA foreign_keys = ON');
    }

    // User Management
    createUser(userData) {
        const stmt = this.db.prepare(`
            INSERT INTO users (username, email, password_hash, role, department)
            VALUES (?, ?, ?, ?, ?)
        `);
        return stmt.run(userData.username, userData.email, userData.password_hash, userData.role, userData.department);
    }

    getUserByCredentials(username, password) {
        const stmt = this.db.prepare(`
            SELECT * FROM users WHERE username = ? AND password_hash = ?
        `);
        return stmt.get(username, password);
    }

    // Budget Management
    createBudget(budgetData) {
        const stmt = this.db.prepare(`
            INSERT INTO budgets (name, description, total_amount, budget_period, start_date, end_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            budgetData.name,
            budgetData.description,
            budgetData.total_amount,
            budgetData.budget_period,
            budgetData.start_date,
            budgetData.end_date,
            budgetData.created_by
        );
    }

    getBudgets() {
        const stmt = this.db.prepare(`
            SELECT b.*, u.username as created_by_name
            FROM budgets b
            LEFT JOIN users u ON b.created_by = u.id
            ORDER BY b.created_at DESC
        `);
        return stmt.all();
    }

    // Revenue Management
    createRevenue(revenueData) {
        const stmt = this.db.prepare(`
            INSERT INTO revenue_transactions (revenue_source_id, student_id, amount, transaction_date, payment_method, reference_number, description, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            revenueData.revenue_source_id,
            revenueData.student_id,
            revenueData.amount,
            revenueData.transaction_date,
            revenueData.payment_method,
            revenueData.reference_number,
            revenueData.description,
            revenueData.created_by
        );
    }

    getRevenueTransactions() {
        const stmt = this.db.prepare(`
            SELECT rt.*, rs.source_name, rs.source_type, u.username as created_by_name
            FROM revenue_transactions rt
            JOIN revenue_sources rs ON rt.revenue_source_id = rs.id
            LEFT JOIN users u ON rt.created_by = u.id
            ORDER BY rt.created_at DESC
        `);
        return stmt.all();
    }

    getRevenueSources() {
        const stmt = this.db.prepare('SELECT * FROM revenue_sources WHERE is_active = 1');
        return stmt.all();
    }

    // Expense Management
    createExpense(expenseData) {
        const stmt = this.db.prepare(`
            INSERT INTO expenses (expense_category_id, vendor_name, amount, expense_date, description, receipt_number, payment_method, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            expenseData.expense_category_id,
            expenseData.vendor_name,
            expenseData.amount,
            expenseData.expense_date,
            expenseData.description,
            expenseData.receipt_number,
            expenseData.payment_method,
            expenseData.created_by
        );
    }

    getExpenses() {
        const stmt = this.db.prepare(`
            SELECT e.*, ec.category_name, u.username as created_by_name, a.username as approved_by_name
            FROM expenses e
            JOIN expense_categories ec ON e.expense_category_id = ec.id
            LEFT JOIN users u ON e.created_by = u.id
            LEFT JOIN users a ON e.approved_by = a.id
            ORDER BY e.created_at DESC
        `);
        return stmt.all();
    }

    getExpenseCategories() {
        const stmt = this.db.prepare('SELECT * FROM expense_categories WHERE is_active = 1');
        return stmt.all();
    }

    // Accounts Payable
    createAccountsPayable(apData) {
        const stmt = this.db.prepare(`
            INSERT INTO accounts_payable (vendor_id, invoice_number, invoice_date, due_date, amount, description, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            apData.vendor_id,
            apData.invoice_number,
            apData.invoice_date,
            apData.due_date,
            apData.amount,
            apData.description,
            apData.created_by
        );
    }

    getAccountsPayable() {
        const stmt = this.db.prepare(`
            SELECT ap.*, v.vendor_name, u.username as created_by_name
            FROM accounts_payable ap
            JOIN vendors v ON ap.vendor_id = v.id
            LEFT JOIN users u ON ap.created_by = u.id
            ORDER BY ap.due_date ASC
        `);
        return stmt.all();
    }

    // Accounts Receivable
    createAccountsReceivable(arData) {
        const stmt = this.db.prepare(`
            INSERT INTO accounts_receivable (student_id, student_name, invoice_number, invoice_date, due_date, amount, description, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            arData.student_id,
            arData.student_name,
            arData.invoice_number,
            arData.invoice_date,
            arData.due_date,
            arData.amount,
            arData.description,
            arData.created_by
        );
    }

    getAccountsReceivable() {
        const stmt = this.db.prepare(`
            SELECT ar.*, u.username as created_by_name
            FROM accounts_receivable ar
            LEFT JOIN users u ON ar.created_by = u.id
            ORDER BY ar.due_date ASC
        `);
        return stmt.all();
    }

    // Fund Management
    getFunds() {
        const stmt = this.db.prepare('SELECT * FROM funds WHERE is_active = 1');
        return stmt.all();
    }

    createFundTransaction(transactionData) {
        const stmt = this.db.prepare(`
            INSERT INTO fund_transactions (fund_id, transaction_type, amount, from_fund_id, to_fund_id, description, reference_number, transaction_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            transactionData.fund_id,
            transactionData.transaction_type,
            transactionData.amount,
            transactionData.from_fund_id,
            transactionData.to_fund_id,
            transactionData.description,
            transactionData.reference_number,
            transactionData.transaction_date,
            transactionData.created_by
        );
    }

    // Financial Requests
    createFinancialRequest(requestData) {
        const stmt = this.db.prepare(`
            INSERT INTO financial_requests (request_type, requestor_id, department, amount, description, justification, priority)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            requestData.request_type,
            requestData.requestor_id,
            requestData.department,
            requestData.amount,
            requestData.description,
            requestData.justification,
            requestData.priority
        );
    }

    getFinancialRequests() {
        const stmt = this.db.prepare(`
            SELECT fr.*, u.username as requestor_name, a.username as approved_by_name
            FROM financial_requests fr
            JOIN users u ON fr.requestor_id = u.id
            LEFT JOIN users a ON fr.approved_by = a.id
            ORDER BY fr.created_at DESC
        `);
        return stmt.all();
    }

    // Dashboard Analytics
    getDashboardAnalytics() {
        const totalRevenue = this.db.prepare('SELECT SUM(amount) as total FROM revenue_transactions WHERE status = "completed"').get();
        const totalExpenses = this.db.prepare('SELECT SUM(amount) as total FROM expenses WHERE approval_status = "approved"').get();
        const pendingPayables = this.db.prepare('SELECT COUNT(*) as count FROM accounts_payable WHERE status = "pending"').get();
        const overdueReceivables = this.db.prepare('SELECT COUNT(*) as count FROM accounts_receivable WHERE status = "overdue"').get();
        const pendingRequests = this.db.prepare('SELECT COUNT(*) as count FROM financial_requests WHERE status = "pending"').get();

        return {
            totalRevenue: totalRevenue.total || 0,
            totalExpenses: totalExpenses.total || 0,
            netIncome: (totalRevenue.total || 0) - (totalExpenses.total || 0),
            pendingPayables: pendingPayables.count || 0,
            overdueReceivables: overdueReceivables.count || 0,
            pendingRequests: pendingRequests.count || 0
        };
    }

    // Audit Trail
    logAuditAction(userId, action, tableName, recordId, oldValues, newValues, ipAddress, userAgent) {
        const stmt = this.db.prepare(`
            INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            userId,
            action,
            tableName,
            recordId,
            JSON.stringify(oldValues),
            JSON.stringify(newValues),
            ipAddress,
            userAgent
        );
    }

    close() {
        this.db.close();
    }
}

export default DatabaseManager;