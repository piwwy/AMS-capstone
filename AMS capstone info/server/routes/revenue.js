const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all revenue transactions
router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await db.getRevenueTransactions();
        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('Get revenue transactions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create revenue transaction
router.post('/transactions', authenticateToken, async (req, res) => {
    try {
        const transactionData = {
            ...req.body,
            created_by: req.user.userId
        };

        const result = await db.createRevenueTransaction(transactionData);

        // Log audit action
        await db.logAuditAction(
            req.user.userId,
            'CREATE',
            'revenue_transactions',
            result[0].insertId,
            null,
            transactionData,
            req.ip,
            req.get('User-Agent'),
            req.sessionID
        );

        res.json({
            success: true,
            message: 'Revenue transaction created successfully',
            transactionId: result[0].insertId
        });
    } catch (error) {
        console.error('Create revenue transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get revenue sources
router.get('/sources', authenticateToken, async (req, res) => {
    try {
        const sources = await db.getRevenueSources();
        res.json({ success: true, data: sources });
    } catch (error) {
        console.error('Get revenue sources error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create student bill
router.post('/bills', authenticateToken, async (req, res) => {
    try {
        const { student_id, student_name, bill_date, due_date, line_items } = req.body;

        // Generate bill number
        const billNumber = `BILL-${Date.now()}`;
        
        // Calculate total amount
        const totalAmount = line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        // Create bill
        const billSql = `
            INSERT INTO student_bills (student_id, student_name, bill_number, bill_date, due_date, total_amount, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const billResult = await db.query(billSql, [
            student_id, student_name, billNumber, bill_date, due_date, totalAmount, req.user.userId
        ]);

        const billId = billResult.insertId;

        // Create line items
        for (const item of line_items) {
            const itemSql = `
                INSERT INTO bill_line_items (bill_id, revenue_source_id, description, quantity, unit_price)
                VALUES (?, ?, ?, ?, ?)
            `;
            await db.query(itemSql, [
                billId, item.revenue_source_id, item.description, item.quantity, item.unit_price
            ]);
        }

        // Create corresponding accounts receivable
        const arSql = `
            INSERT INTO accounts_receivable (student_id, student_name, bill_id, invoice_number, invoice_date, due_date, amount, description, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(arSql, [
            student_id, student_name, billId, billNumber, bill_date, due_date, totalAmount, 'Student billing', req.user.userId
        ]);

        res.json({
            success: true,
            message: 'Student bill created successfully',
            billId: billId,
            billNumber: billNumber
        });
    } catch (error) {
        console.error('Create student bill error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;