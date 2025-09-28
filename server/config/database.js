const mysql = require('mysql2/promise');
require('dotenv').config();

class DatabaseManager {
    constructor() {
        this.pool = null;
        this.initializePool();
    }

    initializePool() {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'financial_management_system',
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true
        });
    }

    async getConnection() {
        try {
            return await this.pool.getConnection();
        } catch (error) {
            console.error('Database connection error:', error);
            throw error;
        }
    }

    async query(sql, params = []) {
        const connection = await this.getConnection();
        try {
            const [results] = await connection.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    async transaction(queries) {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();
            
            const results = [];
            for (const { sql, params } of queries) {
                const [result] = await connection.execute(sql, params);
                results.push(result);
            }
            
            await connection.commit();
            return results;
        } catch (error) {
            await connection.rollback();
            console.error('Transaction error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // User Management
    async createUser(userData) {
        const sql = `
            INSERT INTO users (username, email, password_hash, role, department)
            VALUES (?, ?, ?, ?, ?)
        `;
        return await this.query(sql, [
            userData.username,
            userData.email,
            userData.password_hash,
            userData.role,
            userData.department
        ]);
    }

    async getUserByCredentials(username) {
        const sql = 'SELECT * FROM users WHERE username = ? AND is_active = TRUE';
        const results = await this.query(sql, [username]);
        return results[0];
    }

    async updateUserLastLogin(userId) {
        const sql = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
        return await this.query(sql, [userId]);
    }

    // Budget Management
    async createBudget(budgetData) {
        const sql = `
            INSERT INTO budgets (name, description, total_amount, budget_period, start_date, end_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        return await this.query(sql, [
            budgetData.name,
            budgetData.description,
            budgetData.total_amount,
            budgetData.budget_period,
            budgetData.start_date,
            budgetData.end_date,
            budgetData.created_by
        ]);
    }

    async getBudgets() {
        const sql = `
            SELECT b.*, u.username as created_by_name, a.username as approved_by_name
            FROM budgets b
            LEFT JOIN users u ON b.created_by = u.id
            LEFT JOIN users a ON b.approved_by = a.id
            ORDER BY b.created_at DESC
        `;
        return await this.query(sql);
    }

    async createBudgetRequest(requestData) {
        const sql = `
            INSERT INTO budget_requests (budget_id, requestor_id, department, category, requested_amount, justification, priority)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        return await this.query(sql, [
            requestData.budget_id,
            requestData.requestor_id,
            requestData.department,
            requestData.category,
            requestData.requested_amount,
            requestData.justification,
            requestData.priority
        ]);
    }

    async getBudgetRequests() {
        const sql = `
            SELECT br.*, b.name as budget_name, u.username as requestor_name, a.username as approved_by_name
            FROM budget_requests br
            JOIN budgets b ON br.budget_id = b.id
            JOIN users u ON br.requestor_id = u.id
            LEFT JOIN users a ON br.approved_by = a.id
            ORDER BY br.created_at DESC
        `;
        return await this.query(sql);
    }

    // Revenue Management
    async createRevenueTransaction(transactionData) {
        const queries = [
            {
                sql: `
                    INSERT INTO revenue_transactions (revenue_source_id, student_id, student_name, amount, transaction_date, payment_method, reference_number, description, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                params: [
                    transactionData.revenue_source_id,
                    transactionData.student_id,
                    transactionData.student_name,
                    transactionData.amount,
                    transactionData.transaction_date,
                    transactionData.payment_method,
                    transactionData.reference_number,
                    transactionData.description,
                    transactionData.created_by
                ]
            }
        ];

        // If this is a payment for an existing receivable, update it
        if (transactionData.receivable_id) {
            queries.push({
                sql: `
                    UPDATE accounts_receivable 
                    SET paid_amount = paid_amount + ?, 
                        status = CASE 
                            WHEN paid_amount + ? >= amount THEN 'paid'
                            WHEN paid_amount + ? > 0 THEN 'partial'
                            ELSE status
                        END,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `,
                params: [transactionData.amount, transactionData.amount, transactionData.amount, transactionData.receivable_id]
            });
        }

        return await this.transaction(queries);
    }

    async getRevenueTransactions() {
        const sql = `
            SELECT rt.*, rs.source_name, rs.source_type, u.username as created_by_name
            FROM revenue_transactions rt
            JOIN revenue_sources rs ON rt.revenue_source_id = rs.id
            LEFT JOIN users u ON rt.created_by = u.id
            ORDER BY rt.created_at DESC
        `;
        return await this.query(sql);
    }

    async getRevenueSources() {
        const sql = 'SELECT * FROM revenue_sources WHERE is_active = TRUE ORDER BY source_name';
        return await this.query(sql);
    }

    // Expense Management
    async createExpense(expenseData) {
        const sql = `
            INSERT INTO expenses (expense_category_id, budget_allocation_id, vendor_name, vendor_id, amount, expense_date, description, receipt_number, payment_method, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await this.query(sql, [
            expenseData.expense_category_id,
            expenseData.budget_allocation_id,
            expenseData.vendor_name,
            expenseData.vendor_id,
            expenseData.amount,
            expenseData.expense_date,
            expenseData.description,
            expenseData.receipt_number,
            expenseData.payment_method,
            expenseData.created_by
        ]);

        // Update budget allocation spent amount
        if (expenseData.budget_allocation_id) {
            await this.query(
                'UPDATE budget_allocations SET spent_amount = spent_amount + ? WHERE id = ?',
                [expenseData.amount, expenseData.budget_allocation_id]
            );
        }

        return result;
    }

    async getExpenses() {
        const sql = `
            SELECT e.*, ec.category_name, v.vendor_name as vendor_full_name, 
                   u.username as created_by_name, a.username as approved_by_name,
                   ba.department as budget_department, ba.category as budget_category
            FROM expenses e
            JOIN expense_categories ec ON e.expense_category_id = ec.id
            LEFT JOIN vendors v ON e.vendor_id = v.id
            LEFT JOIN users u ON e.created_by = u.id
            LEFT JOIN users a ON e.approved_by = a.id
            LEFT JOIN budget_allocations ba ON e.budget_allocation_id = ba.id
            ORDER BY e.created_at DESC
        `;
        return await this.query(sql);
    }

    async getExpenseCategories() {
        const sql = 'SELECT * FROM expense_categories WHERE is_active = TRUE ORDER BY category_name';
        return await this.query(sql);
    }

    // Dashboard Analytics
    async getDashboardAnalytics() {
        const queries = {
            totalRevenue: 'SELECT COALESCE(SUM(amount), 0) as total FROM revenue_transactions WHERE status = "completed"',
            totalExpenses: 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE approval_status = "approved"',
            pendingPayables: 'SELECT COUNT(*) as count FROM accounts_payable WHERE status = "pending"',
            overdueReceivables: 'SELECT COUNT(*) as count FROM accounts_receivable WHERE status = "overdue"',
            pendingRequests: 'SELECT COUNT(*) as count FROM financial_requests WHERE status IN ("submitted", "under_review")',
            monthlyRevenue: `
                SELECT COALESCE(SUM(amount), 0) as total 
                FROM revenue_transactions 
                WHERE status = "completed" 
                AND MONTH(transaction_date) = MONTH(CURRENT_DATE()) 
                AND YEAR(transaction_date) = YEAR(CURRENT_DATE())
            `,
            monthlyExpenses: `
                SELECT COALESCE(SUM(amount), 0) as total 
                FROM expenses 
                WHERE approval_status = "approved" 
                AND MONTH(expense_date) = MONTH(CURRENT_DATE()) 
                AND YEAR(expense_date) = YEAR(CURRENT_DATE())
            `
        };

        const results = {};
        for (const [key, sql] of Object.entries(queries)) {
            const result = await this.query(sql);
            results[key] = result[0]?.total || result[0]?.count || 0;
        }

        results.netIncome = results.totalRevenue - results.totalExpenses;
        results.monthlyNetIncome = results.monthlyRevenue - results.monthlyExpenses;

        return results;
    }

    // Audit Logging
    async logAuditAction(userId, action, tableName, recordId, oldValues, newValues, ipAddress, userAgent, sessionId) {
        const sql = `
            INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, session_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        return await this.query(sql, [
            userId,
            action,
            tableName,
            recordId,
            JSON.stringify(oldValues),
            JSON.stringify(newValues),
            ipAddress,
            userAgent,
            sessionId
        ]);
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

module.exports = new DatabaseManager();