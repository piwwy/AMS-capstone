// Reports Management
class ReportManager {
    constructor() {
        this.currentReport = null;
    }

    loadReports() {
        // Initialize report interface
        this.generateReport();
    }

    generateReport() {
        const reportType = document.getElementById('reportType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        this.currentReport = {
            type: reportType,
            startDate,
            endDate,
            data: this.getReportData(reportType, startDate, endDate)
        };
        
        this.displayReport();
    }

    getReportData(type, startDate, endDate) {
        const revenue = db.select('revenue_transactions');
        const expenses = db.select('expenses');
        const funds = db.select('funds');
        const budgets = db.select('budgets');
        
        // Filter by date range
        const filteredRevenue = revenue.filter(r => 
            r.transaction_date >= startDate && r.transaction_date <= endDate && r.status === 'completed'
        );
        const filteredExpenses = expenses.filter(e => 
            e.expense_date >= startDate && e.expense_date <= endDate && e.approval_status === 'approved'
        );
        
        switch (type) {
            case 'income_statement':
                return this.generateIncomeStatement(filteredRevenue, filteredExpenses);
            case 'balance_sheet':
                return this.generateBalanceSheet(funds, filteredRevenue, filteredExpenses);
            case 'cash_flow':
                return this.generateCashFlow(filteredRevenue, filteredExpenses);
            case 'budget_variance':
                return this.generateBudgetVariance(budgets, filteredExpenses);
            default:
                return {};
        }
    }

    generateIncomeStatement(revenue, expenses) {
        const revenueBySource = {};
        const expensesByCategory = {};
        
        revenue.forEach(r => {
            revenueBySource[r.source_name] = (revenueBySource[r.source_name] || 0) + r.amount;
        });
        
        expenses.forEach(e => {
            expensesByCategory[e.category_name] = (expensesByCategory[e.category_name] || 0) + e.amount;
        });
        
        const totalRevenue = Object.values(revenueBySource).reduce((sum, val) => sum + val, 0);
        const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);
        
        return {
            revenue: revenueBySource,
            expenses: expensesByCategory,
            totalRevenue,
            totalExpenses,
            netIncome: totalRevenue - totalExpenses
        };
    }

    generateBalanceSheet(funds, revenue, expenses) {
        const totalCash = funds.reduce((sum, fund) => sum + fund.balance, 0);
        const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        
        return {
            assets: {
                'Cash and Cash Equivalents': totalCash,
                'Accounts Receivable': 25000, // Sample data
                'Equipment': 150000,
                'Buildings': 500000
            },
            liabilities: {
                'Accounts Payable': 15000,
                'Loans Payable': 75000
            },
            equity: {
                'Retained Earnings': totalCash + totalRevenue - totalExpenses - 90000
            }
        };
    }

    generateCashFlow(revenue, expenses) {
        const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        
        return {
            operating: {
                'Cash from Revenue': totalRevenue,
                'Cash for Expenses': -totalExpenses,
                'Net Operating Cash Flow': totalRevenue - totalExpenses
            },
            investing: {
                'Equipment Purchase': -25000,
                'Building Improvements': -50000,
                'Net Investing Cash Flow': -75000
            },
            financing: {
                'Loan Repayment': -10000,
                'Net Financing Cash Flow': -10000
            }
        };
    }

    generateBudgetVariance(budgets, expenses) {
        const variance = {};
        
        budgets.forEach(budget => {
            const budgetExpenses = expenses.filter(e => 
                e.expense_date >= budget.start_date && e.expense_date <= budget.end_date
            );
            const actualSpent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);
            
            variance[budget.name] = {
                budgeted: budget.total_amount,
                actual: actualSpent,
                variance: budget.total_amount - actualSpent,
                percentage: ((actualSpent / budget.total_amount) * 100).toFixed(1)
            };
        });
        
        return variance;
    }

    displayReport() {
        const container = document.getElementById('reportContent');
        
        if (!this.currentReport) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <h3>Generate Report</h3>
                    <p>Select report parameters and click "Generate Report" to view data</p>
                </div>
            `;
            return;
        }
        
        let content = '';
        
        switch (this.currentReport.type) {
            case 'income_statement':
                content = this.renderIncomeStatement(this.currentReport.data);
                break;
            case 'balance_sheet':
                content = this.renderBalanceSheet(this.currentReport.data);
                break;
            case 'cash_flow':
                content = this.renderCashFlow(this.currentReport.data);
                break;
            case 'budget_variance':
                content = this.renderBudgetVariance(this.currentReport.data);
                break;
        }
        
        container.innerHTML = content;
    }

    renderIncomeStatement(data) {
        return `
            <div class="report-section">
                <h3>Income Statement</h3>
                <p class="report-period">${this.currentReport.startDate} to ${this.currentReport.endDate}</p>
                
                <div class="report-table">
                    <h4>Revenue</h4>
                    <table class="data-table">
                        <tbody>
                            ${Object.entries(data.revenue).map(([source, amount]) => `
                                <tr>
                                    <td>${source}</td>
                                    <td class="text-right">${Utils.formatCurrency(amount)}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td><strong>Total Revenue</strong></td>
                                <td class="text-right"><strong>${Utils.formatCurrency(data.totalRevenue)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="report-table">
                    <h4>Expenses</h4>
                    <table class="data-table">
                        <tbody>
                            ${Object.entries(data.expenses).map(([category, amount]) => `
                                <tr>
                                    <td>${category}</td>
                                    <td class="text-right">${Utils.formatCurrency(amount)}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td><strong>Total Expenses</strong></td>
                                <td class="text-right"><strong>${Utils.formatCurrency(data.totalExpenses)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="report-summary">
                    <div class="summary-item ${data.netIncome >= 0 ? 'positive' : 'negative'}">
                        <span>Net Income</span>
                        <span>${Utils.formatCurrency(data.netIncome)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderBalanceSheet(data) {
        const totalAssets = Object.values(data.assets).reduce((sum, val) => sum + val, 0);
        const totalLiabilities = Object.values(data.liabilities).reduce((sum, val) => sum + val, 0);
        const totalEquity = Object.values(data.equity).reduce((sum, val) => sum + val, 0);
        
        return `
            <div class="report-section">
                <h3>Balance Sheet</h3>
                <p class="report-period">As of ${this.currentReport.endDate}</p>
                
                <div class="balance-sheet-grid">
                    <div class="report-table">
                        <h4>Assets</h4>
                        <table class="data-table">
                            <tbody>
                                ${Object.entries(data.assets).map(([asset, amount]) => `
                                    <tr>
                                        <td>${asset}</td>
                                        <td class="text-right">${Utils.formatCurrency(amount)}</td>
                                    </tr>
                                `).join('')}
                                <tr class="total-row">
                                    <td><strong>Total Assets</strong></td>
                                    <td class="text-right"><strong>${Utils.formatCurrency(totalAssets)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="report-table">
                        <h4>Liabilities</h4>
                        <table class="data-table">
                            <tbody>
                                ${Object.entries(data.liabilities).map(([liability, amount]) => `
                                    <tr>
                                        <td>${liability}</td>
                                        <td class="text-right">${Utils.formatCurrency(amount)}</td>
                                    </tr>
                                `).join('')}
                                <tr class="total-row">
                                    <td><strong>Total Liabilities</strong></td>
                                    <td class="text-right"><strong>${Utils.formatCurrency(totalLiabilities)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <h4>Equity</h4>
                        <table class="data-table">
                            <tbody>
                                ${Object.entries(data.equity).map(([equity, amount]) => `
                                    <tr>
                                        <td>${equity}</td>
                                        <td class="text-right">${Utils.formatCurrency(amount)}</td>
                                    </tr>
                                `).join('')}
                                <tr class="total-row">
                                    <td><strong>Total Equity</strong></td>
                                    <td class="text-right"><strong>${Utils.formatCurrency(totalEquity)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    renderCashFlow(data) {
        return `
            <div class="report-section">
                <h3>Cash Flow Statement</h3>
                <p class="report-period">${this.currentReport.startDate} to ${this.currentReport.endDate}</p>
                
                <div class="report-table">
                    <h4>Operating Activities</h4>
                    <table class="data-table">
                        <tbody>
                            ${Object.entries(data.operating).map(([item, amount]) => `
                                <tr>
                                    <td>${item}</td>
                                    <td class="text-right ${amount >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="report-table">
                    <h4>Investing Activities</h4>
                    <table class="data-table">
                        <tbody>
                            ${Object.entries(data.investing).map(([item, amount]) => `
                                <tr>
                                    <td>${item}</td>
                                    <td class="text-right ${amount >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="report-table">
                    <h4>Financing Activities</h4>
                    <table class="data-table">
                        <tbody>
                            ${Object.entries(data.financing).map(([item, amount]) => `
                                <tr>
                                    <td>${item}</td>
                                    <td class="text-right ${amount >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderBudgetVariance(data) {
        return `
            <div class="report-section">
                <h3>Budget Variance Report</h3>
                <p class="report-period">${this.currentReport.startDate} to ${this.currentReport.endDate}</p>
                
                <div class="report-table">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Budget</th>
                                <th>Budgeted Amount</th>
                                <th>Actual Amount</th>
                                <th>Variance</th>
                                <th>Utilization %</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(data).map(([budget, variance]) => `
                                <tr>
                                    <td>${budget}</td>
                                    <td class="text-right">${Utils.formatCurrency(variance.budgeted)}</td>
                                    <td class="text-right">${Utils.formatCurrency(variance.actual)}</td>
                                    <td class="text-right ${variance.variance >= 0 ? 'text-success' : 'text-danger'}">
                                        ${Utils.formatCurrency(variance.variance)}
                                    </td>
                                    <td class="text-right">
                                        <span class="status-badge ${variance.percentage > 90 ? 'status-rejected' : variance.percentage > 70 ? 'status-pending' : 'status-approved'}">
                                            ${variance.percentage}%
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    exportReport(format) {
        if (!this.currentReport) {
            Utils.showNotification('Please generate a report first', 'warning');
            return;
        }
        
        // Simulate export
        Utils.showNotification(`Exporting report as ${format.toUpperCase()}...`, 'info');
        
        setTimeout(() => {
            Utils.showNotification(`Report exported successfully as ${format.toUpperCase()}`, 'success');
        }, 2000);
    }
}

// Global functions
function generateReport() {
    reportManager.generateReport();
}

function exportReport(format) {
    reportManager.exportReport(format);
}

// Initialize report manager
const reportManager = new ReportManager();

// Add report styles
const reportStyles = `
<style>
.report-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.report-section {
    padding: 24px;
}

.report-section h3 {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 8px;
}

.report-period {
    color: #6b7280;
    margin-bottom: 24px;
    font-size: 14px;
}

.report-table {
    margin-bottom: 32px;
}

.report-table h4 {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e5e7eb;
}

.report-table .data-table {
    margin-bottom: 0;
}

.total-row {
    border-top: 2px solid #374151;
    background: #f9fafb;
}

.total-row td {
    padding-top: 12px;
    padding-bottom: 12px;
}

.report-summary {
    background: #f8fafc;
    border-radius: 8px;
    padding: 20px;
    margin-top: 24px;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 20px;
    font-weight: 700;
}

.summary-item.positive {
    color: #059669;
}

.summary-item.negative {
    color: #dc2626;
}

.balance-sheet-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
}

@media (max-width: 768px) {
    .balance-sheet-grid {
        grid-template-columns: 1fr;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', reportStyles);