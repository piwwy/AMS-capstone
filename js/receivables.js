// Accounts Receivable Management
class ReceivableManager {
    constructor() {
        this.receivables = [];
        this.editingReceivable = null;
    }

    loadReceivables() {
        this.receivables = db.select('accounts_receivable');
        this.displayReceivables();
    }

    displayReceivables() {
        const tbody = document.querySelector('#receivableTable tbody');
        
        if (this.receivables.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-receipt"></i>
                            <h3>No receivable records found</h3>
                            <p>Create your first student invoice to get started</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.receivables.map(receivable => {
            const daysUntilDue = this.getDaysUntilDue(receivable.due_date);
            const dueDateClass = receivable.status !== 'paid' && daysUntilDue < 0 ? 'text-danger' : 
                                 daysUntilDue <= 7 ? 'text-warning' : '';
            const outstanding = receivable.amount - receivable.paid_amount;
            
            return `
                <tr>
                    <td>
                        <div>
                            <strong>${receivable.student_name}</strong>
                            <br><small class="text-muted">${receivable.student_id}</small>
                        </div>
                    </td>
                    <td>
                        <div>
                            <strong>${receivable.invoice_number}</strong>
                            <br><small class="text-muted">${receivable.description}</small>
                        </div>
                    </td>
                    <td>
                        <div>
                            <span>${Utils.formatCurrency(receivable.amount)}</span>
                            ${receivable.paid_amount > 0 ? `
                                <br><small class="text-success">Paid: ${Utils.formatCurrency(receivable.paid_amount)}</small>
                            ` : ''}
                            ${outstanding > 0 ? `
                                <br><small class="text-danger">Outstanding: ${Utils.formatCurrency(outstanding)}</small>
                            ` : ''}
                        </div>
                    </td>
                    <td>
                        <div>
                            <span>${Utils.formatDate(receivable.due_date)}</span>
                            ${receivable.status !== 'paid' ? `
                                <br><small class="${dueDateClass}">
                                    ${daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                                      daysUntilDue === 0 ? 'Due today' : 
                                      `${daysUntilDue} days remaining`}
                                </small>
                            ` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="status-badge status-${receivable.status}">${receivable.status}</span>
                    </td>
                    <td>
                        <div class="table-actions">
                            ${receivable.status !== 'paid' ? `
                                <button class="action-btn pay" onclick="receivableManager.recordPayment(${receivable.id}, ${outstanding})" title="Record Payment">
                                    <i class="fas fa-dollar-sign"></i>
                                </button>
                            ` : ''}
                            <button class="action-btn edit" onclick="receivableManager.editReceivable(${receivable.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="receivableManager.deleteReceivable(${receivable.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getDaysUntilDue(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    openReceivableModal(receivable = null) {
        this.editingReceivable = receivable;
        const isEdit = receivable !== null;
        
        const modalContent = `
            <div class="modal-header">
                <h2>${isEdit ? 'Edit Receivable' : 'Create New Invoice'}</h2>
            </div>
            <div class="modal-body">
                <form id="receivableForm">
                    <div class="form-group">
                        <label for="studentId">Student ID</label>
                        <input type="text" id="studentId" name="student_id" value="${receivable?.student_id || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="studentName">Student Name</label>
                        <input type="text" id="studentName" name="student_name" value="${receivable?.student_name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="receivableInvoiceNumber">Invoice Number</label>
                        <input type="text" id="receivableInvoiceNumber" name="invoice_number" value="${receivable?.invoice_number || ''}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="receivableInvoiceDate">Invoice Date</label>
                            <input type="date" id="receivableInvoiceDate" name="invoice_date" value="${receivable?.invoice_date || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="receivableDueDate">Due Date</label>
                            <input type="date" id="receivableDueDate" name="due_date" value="${receivable?.due_date || ''}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="receivableAmount">Amount</label>
                        <input type="number" id="receivableAmount" name="amount" step="0.01" value="${receivable?.amount || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="receivableDescription">Description</label>
                        <textarea id="receivableDescription" name="description" rows="3">${receivable?.description || ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="receivableManager.saveReceivable()">${isEdit ? 'Update' : 'Create'}</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    saveReceivable() {
        const form = document.getElementById('receivableForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        
        const receivableData = {
            student_id: formData.get('student_id'),
            student_name: formData.get('student_name'),
            invoice_number: formData.get('invoice_number'),
            invoice_date: formData.get('invoice_date'),
            due_date: formData.get('due_date'),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description'),
            created_by: auth.getCurrentUser().username
        };

        if (this.editingReceivable) {
            db.update('accounts_receivable', this.editingReceivable.id, receivableData);
            Utils.showNotification('Receivable updated successfully', 'success');
        } else {
            receivableData.paid_amount = 0;
            receivableData.status = 'pending';
            db.insert('accounts_receivable', receivableData);
            Utils.showNotification('Invoice created successfully', 'success');
        }

        modalManager.closeModal();
        this.loadReceivables();
        dashboardManager.loadAnalytics();
    }

    editReceivable(id) {
        const receivable = this.receivables.find(r => r.id === id);
        if (receivable) {
            this.openReceivableModal(receivable);
        }
    }

    deleteReceivable(id) {
        Utils.confirmAction('Are you sure you want to delete this receivable record?', () => {
            db.delete('accounts_receivable', id);
            Utils.showNotification('Receivable deleted successfully', 'success');
            this.loadReceivables();
            dashboardManager.loadAnalytics();
        });
    }

    recordPayment(id, outstanding) {
        const payment = parseFloat(prompt(`Enter payment amount (Outstanding: ${Utils.formatCurrency(outstanding)})`) || '0');
        
        if (payment > 0 && payment <= outstanding) {
            const receivable = this.receivables.find(r => r.id === id);
            if (receivable) {
                const newPaidAmount = receivable.paid_amount + payment;
                const newStatus = newPaidAmount >= receivable.amount ? 'paid' : 'partial';
                
                db.update('accounts_receivable', id, {
                    paid_amount: newPaidAmount,
                    status: newStatus,
                    last_payment_date: new Date().toISOString()
                });
                
                Utils.showNotification('Payment recorded successfully', 'success');
                this.loadReceivables();
                dashboardManager.loadAnalytics();
            }
        } else if (payment > outstanding) {
            Utils.showNotification('Payment amount cannot exceed outstanding balance', 'error');
        }
    }
}

// Global function for opening receivable modal
function openReceivableModal() {
    receivableManager.openReceivableModal();
}

// Initialize receivable manager
const receivableManager = new ReceivableManager();