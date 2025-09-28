// Financial Requests Management
class RequestManager {
    constructor() {
        this.requests = [];
        this.editingRequest = null;
    }

    loadRequests() {
        this.requests = db.select('financial_requests');
        this.displayRequests();
    }

    displayRequests() {
        // Filter requests based on user role
        let filteredRequests = this.requests;
        
        if (auth.getCurrentUser().role === 'accountant') {
            // Accountants only see their own requests
            filteredRequests = this.requests.filter(r => r.requestor_id === auth.getCurrentUser().id);
        }
        
        const tbody = document.querySelector('#requestTable tbody');
        
        if (filteredRequests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-paper-plane"></i>
                            <h3>No financial requests found</h3>
                            <p>Submit your first request to get started</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredRequests.map(request => `
            <tr>
                <td>
                    <div>
                        <strong class="text-capitalize">${request.request_type.replace('_', ' ')}</strong>
                        <br><small class="text-muted">${request.description}</small>
                    </div>
                </td>
                <td>
                    <div>
                        <span>${request.requestor_name}</span>
                        <br><small class="text-muted">${request.department}</small>
                    </div>
                </td>
                <td>${Utils.formatCurrency(request.amount)}</td>
                <td>
                    <span class="priority-${request.priority} status-badge">${request.priority}</span>
                </td>
                <td>
                    <span class="status-badge status-${request.status}">${request.status}</span>
                </td>
                <td>
                    <div class="table-actions">
                        ${request.status === 'pending' && auth.canPerformAction('approve', 'requests') ? `
                            <button class="action-btn approve" onclick="requestManager.approveRequest(${request.id})" title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="action-btn reject" onclick="requestManager.rejectRequest(${request.id})" title="Reject">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        ${(request.requestor_id === auth.getCurrentUser().id || auth.canPerformAction('update', 'requests')) ? `
                            <button class="action-btn edit" onclick="requestManager.editRequest(${request.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${auth.canPerformAction('delete', 'requests') ? `
                                <button class="action-btn delete" onclick="requestManager.deleteRequest(${request.id})" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    openRequestModal(request = null) {
        this.editingRequest = request;
        const isEdit = request !== null;
        
        const modalContent = `
            <div class="modal-header">
                <h2>${isEdit ? 'Edit Request' : 'New Financial Request'}</h2>
            </div>
            <div class="modal-body">
                <form id="requestForm">
                    <div class="form-group">
                        <label for="requestType">Request Type</label>
                        <select id="requestType" name="request_type" required>
                            <option value="purchase" ${request?.request_type === 'purchase' ? 'selected' : ''}>Purchase Request</option>
                            <option value="expense" ${request?.request_type === 'expense' ? 'selected' : ''}>Expense Authorization</option>
                            <option value="fund_transfer" ${request?.request_type === 'fund_transfer' ? 'selected' : ''}>Fund Transfer</option>
                            <option value="budget_adjustment" ${request?.request_type === 'budget_adjustment' ? 'selected' : ''}>Budget Adjustment</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="requestDepartment">Department</label>
                        <input type="text" id="requestDepartment" name="department" value="${request?.department || auth.getCurrentUser().department}" required>
                    </div>
                    <div class="form-group">
                        <label for="requestAmount">Amount</label>
                        <input type="number" id="requestAmount" name="amount" step="0.01" value="${request?.amount || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="requestPriority">Priority</label>
                        <select id="requestPriority" name="priority" required>
                            <option value="low" ${request?.priority === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${request?.priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${request?.priority === 'high' ? 'selected' : ''}>High</option>
                            <option value="urgent" ${request?.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="requestDescription">Description</label>
                        <textarea id="requestDescription" name="description" rows="3" required>${request?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="requestJustification">Justification</label>
                        <textarea id="requestJustification" name="justification" rows="3" placeholder="Explain why this request is necessary..." required>${request?.justification || ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="requestManager.saveRequest()">${isEdit ? 'Update' : 'Submit'}</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    saveRequest() {
        const form = document.getElementById('requestForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        
        const requestData = {
            request_type: formData.get('request_type'),
            department: formData.get('department'),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description'),
            justification: formData.get('justification'),
            priority: formData.get('priority'),
            requestor_id: auth.getCurrentUser().id,
            requestor_name: auth.getCurrentUser().username
        };

        // Process through workflow system
        const workflowResult = workflowManager.processTransaction('requests', requestData, auth.getCurrentUser());
        
        if (!workflowResult.success) {
            Utils.showNotification(workflowResult.message, 'error');
            return;
        }
        
        // Use workflow result data
        const finalRequestData = workflowResult.data;

        if (this.editingRequest) {
            db.update('financial_requests', this.editingRequest.id, finalRequestData);
            Utils.showNotification('Request updated successfully', 'success');
        } else {
            db.insert('financial_requests', finalRequestData);
            if (workflowResult.action === 'auto_approved') {
                Utils.showNotification('Request automatically approved', 'success');
            } else {
                Utils.showNotification(`Request submitted for approval to ${finalRequestData.current_approver}`, 'info');
            }
        }

        modalManager.closeModal();
        this.loadRequests();
        dashboardManager.loadAnalytics();
    }

    editRequest(id) {
        const request = this.requests.find(r => r.id === id);
        if (request && (request.requestor_id === auth.getCurrentUser().id || auth.hasPermission('all'))) {
            this.openRequestModal(request);
        }
    }

    deleteRequest(id) {
        const request = this.requests.find(r => r.id === id);
        if (request && (request.requestor_id === auth.getCurrentUser().id || auth.hasPermission('all'))) {
            Utils.confirmAction('Are you sure you want to delete this request?', () => {
                db.delete('financial_requests', id);
                Utils.showNotification('Request deleted successfully', 'success');
                this.loadRequests();
                dashboardManager.loadAnalytics();
            });
        }
    }

    approveRequest(id) {
        if (auth.canPerformAction('approve', 'requests')) {
            Utils.confirmAction('Are you sure you want to approve this request?', () => {
                db.update('financial_requests', id, {
                    status: 'approved',
                    approved_by: auth.getCurrentUser().username,
                    approved_at: new Date().toISOString()
                });
                Utils.showNotification('Request approved successfully', 'success');
                this.loadRequests();
                dashboardManager.loadAnalytics();
            });
        }
    }

    rejectRequest(id) {
        if (auth.canPerformAction('reject', 'requests')) {
            Utils.confirmAction('Are you sure you want to reject this request?', () => {
                db.update('financial_requests', id, {
                    status: 'rejected',
                    approved_by: auth.getCurrentUser().username,
                    approved_at: new Date().toISOString()
                });
                Utils.showNotification('Request rejected', 'success');
                this.loadRequests();
                dashboardManager.loadAnalytics();
            });
        }
    }
}

// Global function for opening request modal
function openRequestModal() {
    requestManager.openRequestModal();
}

// Initialize request manager
const requestManager = new RequestManager();