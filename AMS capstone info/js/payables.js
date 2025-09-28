// Accounts Payable Management
class PayableManager {
    constructor() {
        this.payables = [];
        this.vendors = [];
        this.editingPayable = null;
    }

    loadPayables() {
        this.payables = db.select('accounts_payable');
        this.vendors = db.select('vendors');
        this.displayPayables();
    }

    displayPayables() {
        const tbody = document.querySelector('#payableTable tbody');
        
        if (this.payables.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-file-invoice"></i>
                            <h3>No payable records found</h3>
                            <p>Add your first invoice to get started</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.payables.map(payable => {
            const daysUntilDue = this.getDaysUntilDue(payable.due_date);
            const dueDateClass = payable.status !== 'paid' && daysUntilDue < 0 ? 'text-danger' : 
                                 daysUntilDue <= 7 ? 'text-warning' : '';
            
            return `
                <tr>
                    <td>
                        <div>
                            <strong>${payable.invoice_number}</strong>
                            <br><small class="text-muted">${payable.description}</small>
                        </div>
                    </td>
                    <td>${payable.vendor_name}</td>
                    <td>${Utils.formatCurrency(payable.amount)}</td>
                    <td>
                        <div>
                            <span>${Utils.formatDate(payable.due_date)}</span>
                            ${payable.status !== 'paid' ? `
                                <br><small class="${dueDateClass}">
                                    ${daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                                      daysUntilDue === 0 ? 'Due today' : 
                                      `${daysUntilDue} days remaining`}
                                </small>
                            ` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="status-badge status-${payable.status}">${payable.status}</span>
                    </td>
                    <td>
                        <div class="table-actions">
                            ${payable.status !== 'paid' ? `
                                <button class="action-btn pay" onclick="payableManager.markAsPaid(${payable.id})" title="Mark as Paid">
                                    <i class="fas fa-dollar-sign"></i>
                                </button>
                            ` : ''}
                            <button class="action-btn edit" onclick="payableManager.editPayable(${payable.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="payableManager.deletePayable(${payable.id})" title="Delete">
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

    openPayableModal(payable = null) {
        this.editingPayable = payable;
        const isEdit = payable !== null;
        
        const vendorOptions = this.vendors.map(vendor => 
            `<option value="${vendor.id}" ${payable?.vendor_id === vendor.id ? 'selected' : ''}>${vendor.vendor_name}</option>`
        ).join('');
        
        const modalContent = `
            <div class="modal-header">
                <h2>${isEdit ? 'Edit Payable' : 'Add New Invoice'}</h2>
            </div>
            <div class="modal-body">
                <form id="payableForm">
                    <div class="form-group">
                        <label for="payableVendor">Vendor</label>
                        <select id="payableVendor" name="vendor_id" required>
                            <option value="">Select vendor</option>
                            ${vendorOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="invoiceNumber">Invoice Number</label>
                        <input type="text" id="invoiceNumber" name="invoice_number" value="${payable?.invoice_number || ''}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="invoiceDate">Invoice Date</label>
                            <input type="date" id="invoiceDate" name="invoice_date" value="${payable?.invoice_date || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="dueDate">Due Date</label>
                            <input type="date" id="dueDate" name="due_date" value="${payable?.due_date || ''}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="payableAmount">Amount</label>
                        <input type="number" id="payableAmount" name="amount" step="0.01" value="${payable?.amount || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="payableDescription">Description</label>
                        <textarea id="payableDescription" name="description" rows="3">${payable?.description || ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="payableManager.savePayable()">${isEdit ? 'Update' : 'Add'}</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    savePayable() {
        const form = document.getElementById('payableForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const selectedVendor = this.vendors.find(v => v.id == formData.get('vendor_id'));
        
        const payableData = {
            vendor_id: parseInt(formData.get('vendor_id')),
            vendor_name: selectedVendor?.vendor_name || '',
            invoice_number: formData.get('invoice_number'),
            invoice_date: formData.get('invoice_date'),
            due_date: formData.get('due_date'),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description'),
            created_by: auth.getCurrentUser().username
        };

        if (this.editingPayable) {
            db.update('accounts_payable', this.editingPayable.id, payableData);
            Utils.showNotification('Payable updated successfully', 'success');
        } else {
            payableData.paid_amount = 0;
            payableData.status = 'pending';
            db.insert('accounts_payable', payableData);
            Utils.showNotification('Payable added successfully', 'success');
        }

        modalManager.closeModal();
        this.loadPayables();
        dashboardManager.loadAnalytics();
    }

    editPayable(id) {
        const payable = this.payables.find(p => p.id === id);
        if (payable) {
            this.openPayableModal(payable);
        }
    }

    deletePayable(id) {
        Utils.confirmAction('Are you sure you want to delete this payable record?', () => {
            db.delete('accounts_payable', id);
            Utils.showNotification('Payable deleted successfully', 'success');
            this.loadPayables();
            dashboardManager.loadAnalytics();
        });
    }

    markAsPaid(id) {
        Utils.confirmAction('Are you sure you want to mark this invoice as paid?', () => {
            const payable = this.payables.find(p => p.id === id);
            if (payable) {
                db.update('accounts_payable', id, {
                    status: 'paid',
                    paid_amount: payable.amount,
                    paid_at: new Date().toISOString()
                });
                Utils.showNotification('Invoice marked as paid', 'success');
                this.loadPayables();
                dashboardManager.loadAnalytics();
            }
        });
    }
}

// Global function for opening payable modal
function openPayableModal() {
    payableManager.openPayableModal();
}

// Initialize payable manager
const payableManager = new PayableManager();