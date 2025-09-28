// Expense Management
class ExpenseManager {
    constructor() {
        this.expenses = [];
        this.categories = [];
        this.editingExpense = null;
    }

    loadExpenses() {
        this.expenses = db.select('expenses');
        this.categories = db.select('expense_categories');
        this.displayExpenses();
    }

    displayExpenses() {
        // Filter expenses based on user role
        const filteredExpenses = auth.filterDataByRole(this.expenses, 'expenses');
        
        const tbody = document.querySelector('#expenseTable tbody');
        
        if (filteredExpenses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-credit-card"></i>
                            <h3>No expense records found</h3>
                            <p>Add your first expense to get started</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredExpenses.map(expense => `
            <tr>
                <td>
                    <div>
                        <strong>${expense.receipt_number}</strong>
                        <br><small class="text-muted">${expense.description}</small>
                    </div>
                </td>
                <td>${expense.category_name}</td>
                <td>${expense.vendor_name}</td>
                <td>${Utils.formatCurrency(expense.amount)}</td>
                <td>${Utils.formatDate(expense.expense_date)}</td>
                <td>
                    <span class="status-badge status-${expense.approval_status}">${expense.approval_status}</span>
                </td>
                <td>
                    <div class="table-actions">
                        ${expense.approval_status === 'pending' && auth.canPerformAction('approve', 'expenses') ? `
                            <button class="action-btn approve" onclick="expenseManager.approveExpense(${expense.id})" title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="action-btn reject" onclick="expenseManager.rejectExpense(${expense.id})" title="Reject">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        ${auth.canPerformAction('update', 'expenses') ? `
                            <button class="action-btn edit" onclick="expenseManager.editExpense(${expense.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                        ` : ''}
                        ${auth.canPerformAction('delete', 'expenses') ? `
                            <button class="action-btn delete" onclick="expenseManager.deleteExpense(${expense.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    openExpenseModal(expense = null) {
        this.editingExpense = expense;
        const isEdit = expense !== null;
        
        const categoryOptions = this.categories.map(category => 
            `<option value="${category.id}" ${expense?.expense_category_id === category.id ? 'selected' : ''}>${category.category_name}</option>`
        ).join('');
        
        const modalContent = `
            <div class="modal-header">
                <h2>${isEdit ? 'Edit Expense' : 'Add New Expense'}</h2>
            </div>
            <div class="modal-body">
                <form id="expenseForm">
                    <div class="form-group">
                        <label for="expenseCategory">Expense Category</label>
                        <select id="expenseCategory" name="expense_category_id" required>
                            <option value="">Select category</option>
                            ${categoryOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="vendorName">Vendor Name</label>
                        <input type="text" id="vendorName" name="vendor_name" value="${expense?.vendor_name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="expenseAmount">Amount</label>
                        <input type="number" id="expenseAmount" name="amount" step="0.01" value="${expense?.amount || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="expenseDate">Expense Date</label>
                        <input type="date" id="expenseDate" name="expense_date" value="${expense?.expense_date || new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label for="receiptNumber">Receipt Number</label>
                        <input type="text" id="receiptNumber" name="receipt_number" value="${expense?.receipt_number || ''}">
                    </div>
                    <div class="form-group">
                        <label for="expensePaymentMethod">Payment Method</label>
                        <select id="expensePaymentMethod" name="payment_method" required>
                            <option value="cash" ${expense?.payment_method === 'cash' ? 'selected' : ''}>Cash</option>
                            <option value="bank_transfer" ${expense?.payment_method === 'bank_transfer' ? 'selected' : ''}>Bank Transfer</option>
                            <option value="check" ${expense?.payment_method === 'check' ? 'selected' : ''}>Check</option>
                            <option value="credit_card" ${expense?.payment_method === 'credit_card' ? 'selected' : ''}>Credit Card</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="expenseDescription">Description</label>
                        <textarea id="expenseDescription" name="description" rows="3">${expense?.description || ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="expenseManager.saveExpense()">${isEdit ? 'Update' : 'Add'}</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    saveExpense() {
        const form = document.getElementById('expenseForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const selectedCategory = this.categories.find(c => c.id == formData.get('expense_category_id'));
        
        const expenseData = {
            expense_category_id: parseInt(formData.get('expense_category_id')),
            category_name: selectedCategory?.category_name || '',
            vendor_name: formData.get('vendor_name'),
            amount: parseFloat(formData.get('amount')),
            expense_date: formData.get('expense_date'),
            description: formData.get('description'),
            receipt_number: formData.get('receipt_number'),
            payment_method: formData.get('payment_method'),
            created_by: auth.getCurrentUser().username
        };

        // Process through workflow system
        const workflowResult = workflowManager.processTransaction('expenses', expenseData, auth.getCurrentUser());
        
        if (!workflowResult.success) {
            Utils.showNotification(workflowResult.message, 'error');
            return;
        }
        
        // Use workflow result data
        const finalExpenseData = workflowResult.data;

        if (this.editingExpense) {
            db.update('expenses', this.editingExpense.id, finalExpenseData);
            Utils.showNotification('Expense updated successfully', 'success');
        } else {
            db.insert('expenses', finalExpenseData);
            if (workflowResult.action === 'auto_approved') {
                Utils.showNotification('Expense automatically approved', 'success');
            } else {
                Utils.showNotification(`Expense submitted for approval to ${finalExpenseData.current_approver}`, 'info');
            }
        }

        modalManager.closeModal();
        this.loadExpenses();
        dashboardManager.loadAnalytics();
    }

    editExpense(id) {
        const expense = this.expenses.find(e => e.id === id);
        if (expense) {
            this.openExpenseModal(expense);
        }
    }

    deleteExpense(id) {
        Utils.confirmAction('Are you sure you want to delete this expense?', () => {
            db.delete('expenses', id);
            Utils.showNotification('Expense deleted successfully', 'success');
            this.loadExpenses();
            dashboardManager.loadAnalytics();
        });
    }

    approveExpense(id) {
        if (!auth.canPerformAction('approve', 'expenses')) {
            Utils.showNotification('Access denied: You cannot approve expenses', 'error');
            return;
        }

        Utils.confirmAction('Are you sure you want to approve this expense?', () => {
            db.update('expenses', id, {
                approval_status: 'approved',
                approved_by: auth.getCurrentUser().username,
                approved_at: new Date().toISOString()
            });
            Utils.showNotification('Expense approved successfully', 'success');
            this.loadExpenses();
            dashboardManager.loadAnalytics();
        });
    }

    rejectExpense(id) {
        if (!auth.canPerformAction('reject', 'expenses')) {
            Utils.showNotification('Access denied: You cannot reject expenses', 'error');
            return;
        }

        Utils.confirmAction('Are you sure you want to reject this expense?', () => {
            db.update('expenses', id, {
                approval_status: 'rejected',
                approved_by: auth.getCurrentUser().username,
                approved_at: new Date().toISOString()
            });
            Utils.showNotification('Expense rejected', 'success');
            this.loadExpenses();
            dashboardManager.loadAnalytics();
        });
    }
}

// Global function for opening expense modal
function openExpenseModal() {
    expenseManager.openExpenseModal();
}

// Initialize expense manager
const expenseManager = new ExpenseManager();