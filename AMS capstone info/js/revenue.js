// Revenue Management
class RevenueManager {
    constructor() {
        this.revenues = [];
        this.revenueSources = [];
        this.editingRevenue = null;
    }

    loadRevenue() {
        this.revenues = db.select('revenue_transactions');
        this.revenueSources = db.select('revenue_sources');
        this.displayRevenue();
    }

    displayRevenue() {
        const tbody = document.querySelector('#revenueTable tbody');
        
        if (this.revenues.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-chart-bar"></i>
                            <h3>No revenue records found</h3>
                            <p>Add your first revenue transaction to get started</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.revenues.map(revenue => `
            <tr>
                <td>
                    <div>
                        <strong>${revenue.reference_number}</strong>
                        <br><small class="text-muted">${revenue.description}</small>
                    </div>
                </td>
                <td>
                    <div>
                        <span>${revenue.source_name}</span>
                        <br><small class="text-muted text-capitalize">${revenue.source_type}</small>
                    </div>
                </td>
                <td>${revenue.student_id}</td>
                <td>${Utils.formatCurrency(revenue.amount)}</td>
                <td>${Utils.formatDate(revenue.transaction_date)}</td>
                <td>
                    <span class="status-badge status-${revenue.status}">${revenue.status}</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="revenueManager.editRevenue(${revenue.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="revenueManager.deleteRevenue(${revenue.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    openRevenueModal(revenue = null) {
        this.editingRevenue = revenue;
        const isEdit = revenue !== null;
        
        const sourceOptions = this.revenueSources.map(source => 
            `<option value="${source.id}" ${revenue?.revenue_source_id === source.id ? 'selected' : ''}>${source.source_name}</option>`
        ).join('');
        
        const modalContent = `
            <div class="modal-header">
                <h2>${isEdit ? 'Edit Revenue Transaction' : 'Add New Revenue'}</h2>
            </div>
            <div class="modal-body">
                <form id="revenueForm">
                    <div class="form-group">
                        <label for="revenueSource">Revenue Source</label>
                        <select id="revenueSource" name="revenue_source_id" required>
                            <option value="">Select revenue source</option>
                            ${sourceOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="studentId">Student ID</label>
                        <input type="text" id="studentId" name="student_id" value="${revenue?.student_id || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="revenueAmount">Amount</label>
                        <input type="number" id="revenueAmount" name="amount" step="0.01" value="${revenue?.amount || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="transactionDate">Transaction Date</label>
                        <input type="date" id="transactionDate" name="transaction_date" value="${revenue?.transaction_date || new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label for="paymentMethod">Payment Method</label>
                        <select id="paymentMethod" name="payment_method" required>
                            <option value="cash" ${revenue?.payment_method === 'cash' ? 'selected' : ''}>Cash</option>
                            <option value="bank_transfer" ${revenue?.payment_method === 'bank_transfer' ? 'selected' : ''}>Bank Transfer</option>
                            <option value="check" ${revenue?.payment_method === 'check' ? 'selected' : ''}>Check</option>
                            <option value="credit_card" ${revenue?.payment_method === 'credit_card' ? 'selected' : ''}>Credit Card</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="referenceNumber">Reference Number</label>
                        <input type="text" id="referenceNumber" name="reference_number" value="${revenue?.reference_number || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="revenueDescription">Description</label>
                        <textarea id="revenueDescription" name="description" rows="3">${revenue?.description || ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="revenueManager.saveRevenue()">${isEdit ? 'Update' : 'Add'}</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    saveRevenue() {
        const form = document.getElementById('revenueForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const selectedSource = this.revenueSources.find(s => s.id == formData.get('revenue_source_id'));
        
        const revenueData = {
            revenue_source_id: parseInt(formData.get('revenue_source_id')),
            source_name: selectedSource?.source_name || '',
            source_type: selectedSource?.source_type || '',
            student_id: formData.get('student_id'),
            amount: parseFloat(formData.get('amount')),
            transaction_date: formData.get('transaction_date'),
            payment_method: formData.get('payment_method'),
            reference_number: formData.get('reference_number'),
            description: formData.get('description'),
            created_by: auth.getCurrentUser().username,
            status: 'completed'
        };

        if (this.editingRevenue) {
            db.update('revenue_transactions', this.editingRevenue.id, revenueData);
            Utils.showNotification('Revenue transaction updated successfully', 'success');
        } else {
            db.insert('revenue_transactions', revenueData);
            Utils.showNotification('Revenue transaction added successfully', 'success');
        }

        modalManager.closeModal();
        this.loadRevenue();
        dashboardManager.loadAnalytics();
    }

    editRevenue(id) {
        const revenue = this.revenues.find(r => r.id === id);
        if (revenue) {
            this.openRevenueModal(revenue);
        }
    }

    deleteRevenue(id) {
        Utils.confirmAction('Are you sure you want to delete this revenue transaction?', () => {
            db.delete('revenue_transactions', id);
            Utils.showNotification('Revenue transaction deleted successfully', 'success');
            this.loadRevenue();
            dashboardManager.loadAnalytics();
        });
    }
}

// Global function for opening revenue modal
function openRevenueModal() {
    revenueManager.openRevenueModal();
}

// Initialize revenue manager
const revenueManager = new RevenueManager();