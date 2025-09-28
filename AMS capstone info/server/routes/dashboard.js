const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get dashboard analytics
router.get('/analytics', authenticateToken, async (req, res) => {
    try {
        const analytics = await db.getDashboardAnalytics();
        res.json({ success: true, data: analytics });
    } catch (error) {
        console.error('Get dashboard analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get recent transactions
router.get('/recent-transactions', authenticateToken, async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        
        const sql = `
            (SELECT 'revenue' as type, id, amount, transaction_date as date, description, status, created_at
             FROM revenue_transactions 
             ORDER BY created_at DESC LIMIT ?)
            UNION ALL
            (SELECT 'expense' as type, id, amount, expense_date as date, description, approval_status as status, created_at
             FROM expenses 
             ORDER BY created_at DESC LIMIT ?)
            ORDER BY created_at DESC
            LIMIT ?
        `;
        
        const transactions = await db.query(sql, [limit, limit, limit]);
        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('Get recent transactions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get pending approvals for current user
router.get('/pending-approvals', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;
        
        let approvals = [];
        
        // Get pending budget requests
        if (role === 'admin' || role === 'finance_manager') {
            const budgetRequests = await db.query(`
                SELECT 'budget_request' as type, id, requested_amount as amount, justification as description, created_at
                FROM budget_requests 
                WHERE status = 'pending'
                ORDER BY created_at DESC
            `);
            approvals = approvals.concat(budgetRequests);
        }
        
        // Get pending expenses
        if (role === 'admin' || role === 'finance_manager') {
            const expenses = await db.query(`
                SELECT 'expense' as type, id, amount, description, created_at
                FROM expenses 
                WHERE approval_status = 'pending'
                ORDER BY created_at DESC
            `);
            approvals = approvals.concat(expenses);
        }
        
        // Get pending financial requests
        if (role === 'admin' || role === 'finance_manager') {
            const financialRequests = await db.query(`
                SELECT 'financial_request' as type, id, amount, description, created_at
                FROM financial_requests 
                WHERE status IN ('submitted', 'under_review')
                ORDER BY created_at DESC
            `);
            approvals = approvals.concat(financialRequests);
        }
        
        res.json({ success: true, data: approvals });
    } catch (error) {
        console.error('Get pending approvals error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get alerts and notifications
router.get('/alerts', authenticateToken, async (req, res) => {
    try {
        const alerts = [];
        
        // Check for overdue receivables
        const overdueReceivables = await db.query(`
            SELECT COUNT(*) as count 
            FROM accounts_receivable 
            WHERE status = 'overdue' OR (status != 'paid' AND due_date < CURRENT_DATE())
        `);
        
        if (overdueReceivables[0].count > 0) {
            alerts.push({
                type: 'error',
                title: 'Overdue Receivables',
                message: `${overdueReceivables[0].count} student accounts are overdue`,
                count: overdueReceivables[0].count
            });
        }
        
        // Check for pending payables
        const pendingPayables = await db.query(`
            SELECT COUNT(*) as count 
            FROM accounts_payable 
            WHERE status = 'pending' AND due_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
        `);
        
        if (pendingPayables[0].count > 0) {
            alerts.push({
                type: 'warning',
                title: 'Upcoming Payments',
                message: `${pendingPayables[0].count} payments due within 7 days`,
                count: pendingPayables[0].count
            });
        }
        
        // Check for low fund balances
        const lowFunds = await db.query(`
            SELECT COUNT(*) as count 
            FROM funds 
            WHERE balance <= minimum_balance AND is_active = TRUE
        `);
        
        if (lowFunds[0].count > 0) {
            alerts.push({
                type: 'warning',
                title: 'Low Fund Balances',
                message: `${lowFunds[0].count} funds below minimum balance`,
                count: lowFunds[0].count
            });
        }
        
        // Check for budget overruns
        const budgetOverruns = await db.query(`
            SELECT COUNT(*) as count 
            FROM budget_allocations 
            WHERE spent_amount > allocated_amount * 0.9
        `);
        
        if (budgetOverruns[0].count > 0) {
            alerts.push({
                type: 'warning',
                title: 'Budget Alerts',
                message: `${budgetOverruns[0].count} budget allocations over 90% utilized`,
                count: budgetOverruns[0].count
            });
        }
        
        res.json({ success: true, data: alerts });
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;