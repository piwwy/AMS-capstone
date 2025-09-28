const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Get all budgets
router.get('/', authenticateToken, async (req, res) => {
    try {
        const budgets = await db.getBudgets();
        res.json({ success: true, data: budgets });
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create budget
router.post('/', authenticateToken, requireRole(['admin', 'finance_manager']), async (req, res) => {
    try {
        const budgetData = {
            ...req.body,
            created_by: req.user.userId
        };

        const result = await db.createBudget(budgetData);

        // Log audit action
        await db.logAuditAction(
            req.user.userId,
            'CREATE',
            'budgets',
            result.insertId,
            null,
            budgetData,
            req.ip,
            req.get('User-Agent'),
            req.sessionID
        );

        res.json({
            success: true,
            message: 'Budget created successfully',
            budgetId: result.insertId
        });
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get budget requests
router.get('/requests', authenticateToken, async (req, res) => {
    try {
        const requests = await db.getBudgetRequests();
        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('Get budget requests error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create budget request
router.post('/requests', authenticateToken, async (req, res) => {
    try {
        const requestData = {
            ...req.body,
            requestor_id: req.user.userId,
            department: req.user.department
        };

        const result = await db.createBudgetRequest(requestData);

        // Log audit action
        await db.logAuditAction(
            req.user.userId,
            'CREATE',
            'budget_requests',
            result.insertId,
            null,
            requestData,
            req.ip,
            req.get('User-Agent'),
            req.sessionID
        );

        res.json({
            success: true,
            message: 'Budget request submitted successfully',
            requestId: result.insertId
        });
    } catch (error) {
        console.error('Create budget request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Approve/Reject budget request
router.patch('/requests/:id/approve', authenticateToken, requireRole(['admin', 'finance_manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approved_amount, comments } = req.body;

        const sql = `
            UPDATE budget_requests 
            SET status = ?, approved_amount = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        await db.query(sql, [status, approved_amount || 0, req.user.userId, id]);

        // If approved, create budget allocation
        if (status === 'approved' && approved_amount > 0) {
            const request = await db.query('SELECT * FROM budget_requests WHERE id = ?', [id]);
            if (request[0]) {
                const allocationSql = `
                    INSERT INTO budget_allocations (budget_id, department, category, allocated_amount)
                    VALUES (?, ?, ?, ?)
                `;
                await db.query(allocationSql, [
                    request[0].budget_id,
                    request[0].department,
                    request[0].category,
                    approved_amount
                ]);
            }
        }

        // Log audit action
        await db.logAuditAction(
            req.user.userId,
            'UPDATE',
            'budget_requests',
            id,
            null,
            { status, approved_amount, comments },
            req.ip,
            req.get('User-Agent'),
            req.sessionID
        );

        res.json({
            success: true,
            message: `Budget request ${status} successfully`
        });
    } catch (error) {
        console.error('Approve budget request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;