// Enhanced Budget Planning and Allocation Management
class BudgetManager {
    constructor() {
        this.budgets = [];
        this.budgetRequests = [];
        this.allocations = [];
        this.forecasts = [];
        this.editingBudget = null;
        this.currentView = 'overview';
    }

    // Method for Adjust button functionality
    adjustAllocation(allocationId) {
        const allocation = this.allocations.find(a => a.id === allocationId);
        if (!allocation) {
            Utils.showNotification('Allocation not found', 'error');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>Adjust Allocation</h2>
            </div>
            <div class="modal-body">
                <div class="allocation-info mb-4">
                    <h4>${allocation.department} - ${allocation.category}</h4>
                    <p>Current Allocation: ${Utils.formatCurrency(allocation.allocated_amount)}</p>
                    <p>Spent: ${Utils.formatCurrency(allocation.spent_amount)}</p>
                    <p>Remaining: ${Utils.formatCurrency(allocation.allocated_amount - allocation.spent_amount)}</p>
                </div>
                <form id="adjustAllocationForm">
                    <div class="form-group">
                        <label for="adjustmentType">Adjustment Type</label>
                        <select id="adjustmentType" name="adjustment_type" required>
                            <option value="increase">Increase Allocation</option>
                            <option value="decrease">Decrease Allocation</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="adjustmentAmount">Adjustment Amount</label>
                        <input type="number" id="adjustmentAmount" name="adjustment_amount" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="adjustmentReason">Reason for Adjustment</label>
                        <textarea id="adjustmentReason" name="reason" rows="3" required placeholder="Explain why this adjustment is necessary..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="budgetManager.saveAdjustment(${allocationId})">Save Adjustment</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    // Save allocation adjustment
    saveAdjustment(allocationId) {
        const form = document.getElementById('adjustAllocationForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const adjustmentType = formData.get('adjustment_type');
        const adjustmentAmount = parseFloat(formData.get('adjustment_amount'));
        const reason = formData.get('reason');

        const allocation = this.allocations.find(a => a.id === allocationId);
        if (!allocation) {
            Utils.showNotification('Allocation not found', 'error');
            return;
        }

        // Validate adjustment amount
        if (adjustmentType === 'decrease' && adjustmentAmount > (allocation.allocated_amount - allocation.spent_amount)) {
            Utils.showNotification('Cannot decrease allocation below spent amount', 'error');
            return;
        }

        // Calculate new allocation amount
        const newAmount = adjustmentType === 'increase' ? 
            allocation.allocated_amount + adjustmentAmount : 
            allocation.allocated_amount - adjustmentAmount;

        // Update allocation
        const updatedAllocation = {
            ...allocation,
            allocated_amount: newAmount,
            last_adjusted: new Date().toISOString(),
            adjustment_reason: reason
        };

        // Update in allocations array
        const index = this.allocations.findIndex(a => a.id === allocationId);
        if (index !== -1) {
            this.allocations[index] = updatedAllocation;
            localStorage.setItem('budget_allocations', JSON.stringify(this.allocations));
        }

        // Log the adjustment
        const adjustmentLog = {
            id: Date.now(),
            allocation_id: allocationId,
            adjustment_type: adjustmentType,
            adjustment_amount: adjustmentAmount,
            old_amount: allocation.allocated_amount,
            new_amount: newAmount,
            reason: reason,
            adjusted_by: auth.getCurrentUser().username,
            adjusted_at: new Date().toISOString()
        };

        // Save adjustment history
        const adjustmentHistory = JSON.parse(localStorage.getItem('adjustment_history') || '[]');
        adjustmentHistory.push(adjustmentLog);
        localStorage.setItem('adjustment_history', JSON.stringify(adjustmentHistory));

        Utils.showNotification(`Allocation ${adjustmentType}d successfully`, 'success');
        modalManager.closeModal();
        this.loadAllocationsView();
    }

    // Method for History button functionality
    viewAllocationHistory(allocationId) {
        const allocation = this.allocations.find(a => a.id === allocationId);
        if (!allocation) {
            Utils.showNotification('Allocation not found', 'error');
            return;
        }

        // Get adjustment history for this allocation
        const adjustmentHistory = JSON.parse(localStorage.getItem('adjustment_history') || '[]');
        const allocationHistory = adjustmentHistory.filter(h => h.allocation_id === allocationId);

        const modalContent = `
            <div class="modal-header">
                <h2>Allocation History</h2>
            </div>
            <div class="modal-body">
                <div class="allocation-info mb-4">
                    <h4>${allocation.department} - ${allocation.category}</h4>
                    <p>Current Allocation: ${Utils.formatCurrency(allocation.allocated_amount)}</p>
                </div>
                <div class="history-list">
                    ${allocationHistory.length === 0 ? 
                        '<p class="text-center text-gray-500">No adjustment history found</p>' :
                        allocationHistory.map(history => `
                            <div class="history-item">
                                <div class="history-header">
                                    <span class="adjustment-type ${history.adjustment_type}">${history.adjustment_type.toUpperCase()}</span>
                                    <span class="adjustment-date">${Utils.formatDate(history.adjusted_at)}</span>
                                </div>
                                <div class="history-details">
                                    <p><strong>Amount:</strong> ${Utils.formatCurrency(history.adjustment_amount)}</p>
                                    <p><strong>From:</strong> ${Utils.formatCurrency(history.old_amount)} <strong>To:</strong> ${Utils.formatCurrency(history.new_amount)}</p>
                                    <p><strong>Adjusted by:</strong> ${history.adjusted_by}</p>
                                    <p><strong>Reason:</strong> ${history.reason}</p>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Close</button>
            </div>
        `;
        
        modalManager.openModal(modalContent, 'modal-lg');
    }

    loadBudgets() {
        this.budgets = db.select('budgets');
        this.budgetRequests = this.loadBudgetRequests();
        this.allocations = this.loadBudgetAllocations();
        this.forecasts = this.loadBudgetForecasts();
        this.displayCurrentView();
    }

    loadBudgetRequests() {
        // Simulate budget requests from different departments
        return [
            {
                id: 1,
                department: 'Academic Affairs',
                category: 'Educational Supplies',
                requested_amount: 150000,
                justification: 'Laboratory equipment and educational materials for new semester',
                priority: 'high',
                status: 'pending',
                submitted_by: 'Dr. Maria Santos',
                submitted_date: '2024-01-15',
                supporting_documents: ['equipment_quotes.pdf', 'curriculum_requirements.pdf']
            },
            {
                id: 2,
                department: 'IT Services',
                category: 'Technology Infrastructure',
                requested_amount: 200000,
                justification: 'Network upgrade and new computer lab setup',
                priority: 'urgent',
                status: 'approved',
                submitted_by: 'John Tech',
                submitted_date: '2024-01-10',
                approved_amount: 180000
            },
            {
                id: 3,
                department: 'Facilities',
                category: 'Maintenance & Repairs',
                requested_amount: 75000,
                justification: 'Building maintenance and safety improvements',
                priority: 'medium',
                status: 'under_review',
                submitted_by: 'Mike Johnson',
                submitted_date: '2024-01-20'
            }
        ];
    }

    loadBudgetAllocations() {
        return [
            {
                id: 1,
                budget_id: 1,
                department: 'Academic Affairs',
                category: 'Educational Supplies',
                allocated_amount: 120000,
                spent_amount: 45000,
                remaining_amount: 75000,
                utilization_rate: 37.5,
                last_updated: '2024-01-25'
            },
            {
                id: 2,
                budget_id: 1,
                department: 'IT Services',
                category: 'Technology',
                allocated_amount: 180000,
                spent_amount: 95000,
                remaining_amount: 85000,
                utilization_rate: 52.8,
                last_updated: '2024-01-24'
            },
            {
                id: 3,
                budget_id: 1,
                department: 'Facilities',
                category: 'Maintenance',
                allocated_amount: 75000,
                spent_amount: 25000,
                remaining_amount: 50000,
                utilization_rate: 33.3,
                last_updated: '2024-01-23'
            }
        ];
    }

    loadBudgetForecasts() {
        return {
            revenue_forecast: {
                tuition_fees: 2500000,
                government_grants: 500000,
                other_income: 200000,
                total_projected: 3200000,
                confidence_level: 85
            },
            expense_forecast: {
                salaries: 1800000,
                utilities: 300000,
                supplies: 400000,
                maintenance: 200000,
                other_expenses: 300000,
                total_projected: 3000000
            },
            variance_analysis: {
                projected_surplus: 200000,
                risk_factors: ['Enrollment fluctuation', 'Utility cost increases', 'Emergency repairs'],
                recommendations: ['Maintain 10% contingency fund', 'Monitor enrollment trends', 'Implement energy-saving measures']
            }
        };
    }

    displayCurrentView() {
        const container = document.getElementById('budgetContent');
        
        switch (this.currentView) {
            case 'overview':
                this.displayBudgetOverview(container);
                break;
            case 'requests':
                this.displayBudgetRequests(container);
                break;
            case 'allocations':
                this.displayBudgetAllocations(container);
                break;
            case 'forecasting':
                this.displayBudgetForecasting(container);
                break;
            case 'tracking':
                this.displayBudgetTracking(container);
                break;
            default:
                this.displayBudgetOverview(container);
        }
    }

    displayBudgetOverview(container) {
        const totalBudget = this.budgets.reduce((sum, b) => sum + b.total_amount, 0);
        const totalAllocated = this.allocations.reduce((sum, a) => sum + a.allocated_amount, 0);
        const totalSpent = this.allocations.reduce((sum, a) => sum + a.spent_amount, 0);
        const pendingRequests = this.budgetRequests.filter(r => r.status === 'pending').length;

        container.innerHTML = `
            <div class="budget-overview">
                <!-- Budget Summary Cards -->
                <div class="budget-summary-grid">
                    <div class="budget-card primary">
                        <div class="card-icon">
                            <i class="fas fa-calculator"></i>
                        </div>
                        <div class="card-content">
                            <h3>Total Budget</h3>
                            <div class="metric-value">${Utils.formatCurrency(totalBudget)}</div>
                            <div class="metric-change positive">+5.2% from last year</div>
                        </div>
                    </div>
                    
                    <div class="budget-card success">
                        <div class="card-icon">
                            <i class="fas fa-chart-pie"></i>
                        </div>
                        <div class="card-content">
                            <h3>Allocated Funds</h3>
                            <div class="metric-value">${Utils.formatCurrency(totalAllocated)}</div>
                            <div class="metric-change">${((totalAllocated/totalBudget)*100).toFixed(1)}% of total budget</div>
                        </div>
                    </div>
                    
                    <div class="budget-card warning">
                        <div class="card-icon">
                            <i class="fas fa-credit-card"></i>
                        </div>
                        <div class="card-content">
                            <h3>Spent Amount</h3>
                            <div class="metric-value">${Utils.formatCurrency(totalSpent)}</div>
                            <div class="metric-change">${((totalSpent/totalAllocated)*100).toFixed(1)}% of allocated</div>
                        </div>
                    </div>
                    
                    <div class="budget-card info">
                        <div class="card-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="card-content">
                            <h3>Pending Requests</h3>
                            <div class="metric-value">${pendingRequests}</div>
                            <div class="metric-change">Awaiting approval</div>
                        </div>
                    </div>
                </div>

                <!-- Budget Allocation Chart -->
                <div class="budget-chart-section">
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>Budget Allocation by Department</h3>
                            <div class="chart-controls">
                                <button class="chart-btn active">Current Year</button>
                                <button class="chart-btn">Previous Year</button>
                                <button class="chart-btn">Comparison</button>
                            </div>
                        </div>
                        <div class="chart-content">
                            <canvas id="budgetAllocationChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="budget-quick-actions">
                    <h3>Quick Actions</h3>
                    <div class="action-grid">
                        <div class="action-card" onclick="budgetManager.switchView('requests')">
                            <div class="action-icon blue">
                                <i class="fas fa-file-alt"></i>
                            </div>
                            <div class="action-content">
                                <h4>Review Requests</h4>
                                <p>${pendingRequests} pending approval</p>
                            </div>
                        </div>
                        
                        <div class="action-card" onclick="budgetManager.openBudgetModal()">
                            <div class="action-icon green">
                                <i class="fas fa-plus"></i>
                            </div>
                            <div class="action-content">
                                <h4>Create Budget</h4>
                                <p>New budget plan</p>
                            </div>
                        </div>
                        
                        <div class="action-card" onclick="budgetManager.switchView('allocations')">
                            <div class="action-icon purple">
                                <i class="fas fa-chart-bar"></i>
                            </div>
                            <div class="action-content">
                                <h4>Manage Allocations</h4>
                                <p>Track fund distribution</p>
                            </div>
                        </div>
                        
                        <div class="action-card" onclick="budgetManager.switchView('forecasting')">
                            <div class="action-icon orange">
                                <i class="fas fa-crystal-ball"></i>
                            </div>
                            <div class="action-content">
                                <h4>Budget Forecasting</h4>
                                <p>Plan future budgets</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize chart
        this.createBudgetAllocationChart();
    }

    displayBudgetRequests(container) {
        container.innerHTML = `
            <div class="budget-requests-section">
                <div class="section-header">
                    <h2>Budget Requests Management</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="budgetManager.openRequestModal()">
                            <i class="fas fa-plus"></i> New Request
                        </button>
                        <button class="btn btn-secondary" onclick="budgetManager.exportRequests()">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>

                <!-- Request Filters -->
                <div class="request-filters">
                    <div class="filter-group">
                        <label>Department:</label>
                        <select id="departmentFilter">
                            <option value="">All Departments</option>
                            <option value="Academic Affairs">Academic Affairs</option>
                            <option value="IT Services">IT Services</option>
                            <option value="Facilities">Facilities</option>
                            <option value="Administration">Administration</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Status:</label>
                        <select id="statusFilter">
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="under_review">Under Review</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Priority:</label>
                        <select id="priorityFilter">
                            <option value="">All Priorities</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>

                <!-- Requests Table -->
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Request Details</th>
                                <th>Department</th>
                                <th>Amount</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.budgetRequests.map(request => `
                                <tr>
                                    <td>
                                        <div class="request-details">
                                            <strong>${request.category}</strong>
                                            <p class="request-justification">${request.justification}</p>
                                            <small class="text-muted">Submitted: ${request.submitted_date}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <span class="department-name">${request.department}</span>
                                            <br><small class="text-muted">By: ${request.submitted_by}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="amount-info">
                                            <span class="requested-amount">${Utils.formatCurrency(request.requested_amount)}</span>
                                            ${request.approved_amount ? `
                                                <br><small class="approved-amount">Approved: ${Utils.formatCurrency(request.approved_amount)}</small>
                                            ` : ''}
                                        </div>
                                    </td>
                                    <td>
                                        <span class="priority-badge priority-${request.priority}">${request.priority}</span>
                                    </td>
                                    <td>
                                        <span class="status-badge status-${request.status}">${request.status.replace('_', ' ')}</span>
                                    </td>
                                    <td>
                                        <div class="table-actions">
                                            ${request.status === 'pending' && auth.canPerformAction('approve', 'budget') ? `
                                                <button class="action-btn approve" onclick="budgetManager.approveRequest(${request.id})" title="Approve">
                                                    <i class="fas fa-check"></i>
                                                </button>
                                                <button class="action-btn reject" onclick="budgetManager.rejectRequest(${request.id})" title="Reject">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            ` : ''}
                                            <button class="action-btn view" onclick="budgetManager.viewRequestDetails(${request.id})" title="View Details">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    displayBudgetAllocations(container) {
        container.innerHTML = `
            <div class="budget-allocations-section">
                <div class="section-header">
                    <h2>Budget Allocations & Tracking</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="budgetManager.openAllocationModal()">
                            <i class="fas fa-chart-pie"></i> New Allocation
                        </button>
                        <button class="btn btn-secondary" onclick="budgetManager.reallocateFunds()">
                            <i class="fas fa-exchange-alt"></i> Reallocate
                        </button>
                    </div>
                </div>

                <!-- Allocation Summary -->
                <div class="allocation-summary">
                    <div class="summary-cards">
                        ${this.allocations.map(allocation => `
                            <div class="allocation-card">
                                <div class="allocation-header">
                                    <h4>${allocation.department}</h4>
                                    <span class="category-tag">${allocation.category}</span>
                                </div>
                                <div class="allocation-metrics">
                                    <div class="metric">
                                        <label>Allocated</label>
                                        <span class="value">${Utils.formatCurrency(allocation.allocated_amount)}</span>
                                    </div>
                                    <div class="metric">
                                        <label>Spent</label>
                                        <span class="value spent">${Utils.formatCurrency(allocation.spent_amount)}</span>
                                    </div>
                                    <div class="metric">
                                        <label>Remaining</label>
                                        <span class="value remaining">${Utils.formatCurrency(allocation.remaining_amount)}</span>
                                    </div>
                                </div>
                                <div class="utilization-bar">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${allocation.utilization_rate}%"></div>
                                    </div>
                                    <span class="utilization-text">${allocation.utilization_rate}% utilized</span>
                                </div>
                                <div class="allocation-actions">
                                    <button class="btn btn-sm btn-primary" onclick="budgetManager.adjustAllocation(${allocation.id})">
                                        <i class="fas fa-edit"></i> Adjust
                                    </button>
                                    <button class="btn btn-sm btn-secondary" onclick="budgetManager.viewAllocationHistory(${allocation.id})">
                                        <i class="fas fa-history"></i> History
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Allocation Trends Chart -->
                <div class="allocation-trends">
                    <div class="chart-container">
                        <div class="chart-header">
                            <h3>Budget Utilization Trends</h3>
                            <div class="chart-controls">
                                <button class="chart-btn active">Monthly</button>
                                <button class="chart-btn">Quarterly</button>
                                <button class="chart-btn">Yearly</button>
                            </div>
                        </div>
                        <div class="chart-content">
                            <canvas id="utilizationTrendsChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.createUtilizationTrendsChart();
    }

    displayBudgetForecasting(container) {
        const forecast = this.forecasts;
        
        container.innerHTML = `
            <div class="budget-forecasting-section">
                <div class="section-header">
                    <h2>Budget Forecasting & Planning</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="budgetManager.generateForecast()">
                            <i class="fas fa-magic"></i> Generate Forecast
                        </button>
                        <button class="btn btn-secondary" onclick="budgetManager.exportForecast()">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>

                <!-- Forecast Overview -->
                <div class="forecast-overview">
                    <div class="forecast-cards">
                        <div class="forecast-card revenue">
                            <div class="card-header">
                                <h3>Revenue Forecast</h3>
                                <span class="confidence-badge">Confidence: ${forecast.revenue_forecast.confidence_level}%</span>
                            </div>
                            <div class="forecast-breakdown">
                                <div class="forecast-item">
                                    <span class="label">Tuition Fees</span>
                                    <span class="value">${Utils.formatCurrency(forecast.revenue_forecast.tuition_fees)}</span>
                                </div>
                                <div class="forecast-item">
                                    <span class="label">Government Grants</span>
                                    <span class="value">${Utils.formatCurrency(forecast.revenue_forecast.government_grants)}</span>
                                </div>
                                <div class="forecast-item">
                                    <span class="label">Other Income</span>
                                    <span class="value">${Utils.formatCurrency(forecast.revenue_forecast.other_income)}</span>
                                </div>
                                <div class="forecast-total">
                                    <span class="label">Total Projected</span>
                                    <span class="value">${Utils.formatCurrency(forecast.revenue_forecast.total_projected)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="forecast-card expense">
                            <div class="card-header">
                                <h3>Expense Forecast</h3>
                                <span class="variance-badge">Variance: ±5%</span>
                            </div>
                            <div class="forecast-breakdown">
                                <div class="forecast-item">
                                    <span class="label">Salaries</span>
                                    <span class="value">${Utils.formatCurrency(forecast.expense_forecast.salaries)}</span>
                                </div>
                                <div class="forecast-item">
                                    <span class="label">Utilities</span>
                                    <span class="value">${Utils.formatCurrency(forecast.expense_forecast.utilities)}</span>
                                </div>
                                <div class="forecast-item">
                                    <span class="label">Supplies</span>
                                    <span class="value">${Utils.formatCurrency(forecast.expense_forecast.supplies)}</span>
                                </div>
                                <div class="forecast-item">
                                    <span class="label">Maintenance</span>
                                    <span class="value">${Utils.formatCurrency(forecast.expense_forecast.maintenance)}</span>
                                </div>
                                <div class="forecast-total">
                                    <span class="label">Total Projected</span>
                                    <span class="value">${Utils.formatCurrency(forecast.expense_forecast.total_projected)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Variance Analysis -->
                    <div class="variance-analysis">
                        <div class="analysis-card">
                            <h3>Variance Analysis</h3>
                            <div class="surplus-indicator ${forecast.variance_analysis.projected_surplus >= 0 ? 'positive' : 'negative'}">
                                <span class="label">Projected ${forecast.variance_analysis.projected_surplus >= 0 ? 'Surplus' : 'Deficit'}</span>
                                <span class="value">${Utils.formatCurrency(Math.abs(forecast.variance_analysis.projected_surplus))}</span>
                            </div>
                            
                            <div class="risk-factors">
                                <h4>Risk Factors</h4>
                                <ul>
                                    ${forecast.variance_analysis.risk_factors.map(risk => `<li>${risk}</li>`).join('')}
                                </ul>
                            </div>
                            
                            <div class="recommendations">
                                <h4>Recommendations</h4>
                                <ul>
                                    ${forecast.variance_analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Scenario Planning -->
                <div class="scenario-planning">
                    <h3>Scenario Planning</h3>
                    <div class="scenario-tabs">
                        <button class="scenario-tab active" data-scenario="optimistic">Optimistic</button>
                        <button class="scenario-tab" data-scenario="realistic">Realistic</button>
                        <button class="scenario-tab" data-scenario="pessimistic">Pessimistic</button>
                    </div>
                    <div class="scenario-content">
                        <canvas id="scenarioChart"></canvas>
                    </div>
                </div>
            </div>
        `;

        this.createScenarioChart();
    }

    displayBudgetTracking(container) {
        container.innerHTML = `
            <div class="budget-tracking-section">
                <div class="section-header">
                    <h2>Budget Performance Tracking</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="budgetManager.generateReport()">
                            <i class="fas fa-chart-line"></i> Generate Report
                        </button>
                        <button class="btn btn-secondary" onclick="budgetManager.scheduleAlert()">
                            <i class="fas fa-bell"></i> Set Alerts
                        </button>
                    </div>
                </div>

                <!-- Performance Dashboard -->
                <div class="performance-dashboard">
                    <div class="kpi-grid">
                        <div class="kpi-card">
                            <div class="kpi-icon">
                                <i class="fas fa-target"></i>
                            </div>
                            <div class="kpi-content">
                                <h4>Budget Accuracy</h4>
                                <div class="kpi-value">92.5%</div>
                                <div class="kpi-trend positive">+2.1% vs last period</div>
                            </div>
                        </div>
                        
                        <div class="kpi-card">
                            <div class="kpi-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="kpi-content">
                                <h4>Approval Time</h4>
                                <div class="kpi-value">2.3 days</div>
                                <div class="kpi-trend positive">-0.5 days improvement</div>
                            </div>
                        </div>
                        
                        <div class="kpi-card">
                            <div class="kpi-icon">
                                <i class="fas fa-percentage"></i>
                            </div>
                            <div class="kpi-content">
                                <h4>Utilization Rate</h4>
                                <div class="kpi-value">87.2%</div>
                                <div class="kpi-trend neutral">Optimal range</div>
                            </div>
                        </div>
                        
                        <div class="kpi-card">
                            <div class="kpi-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="kpi-content">
                                <h4>Budget Variance</h4>
                                <div class="kpi-value">±3.2%</div>
                                <div class="kpi-trend positive">Within tolerance</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Real-time Alerts -->
                <div class="budget-alerts">
                    <h3>Budget Alerts & Notifications</h3>
                    <div class="alert-list">
                        <div class="alert-item warning">
                            <div class="alert-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="alert-content">
                                <h4>Budget Threshold Alert</h4>
                                <p>IT Services department has reached 85% of allocated budget</p>
                                <span class="alert-time">2 hours ago</span>
                            </div>
                            <div class="alert-actions">
                                <button class="btn btn-sm btn-primary">Review</button>
                                <button class="btn btn-sm btn-secondary">Dismiss</button>
                            </div>
                        </div>
                        
                        <div class="alert-item info">
                            <div class="alert-icon">
                                <i class="fas fa-info-circle"></i>
                            </div>
                            <div class="alert-content">
                                <h4>Budget Request Approved</h4>
                                <p>Academic Affairs equipment request has been approved for ₱120,000</p>
                                <span class="alert-time">1 day ago</span>
                            </div>
                            <div class="alert-actions">
                                <button class="btn btn-sm btn-primary">View</button>
                                <button class="btn btn-sm btn-secondary">Archive</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Navigation and View Management
    switchView(view) {
        this.currentView = view;
        this.updateNavigationTabs();
        this.displayCurrentView();
    }

    updateNavigationTabs() {
        const tabs = document.querySelectorAll('.budget-tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.view === this.currentView) {
                tab.classList.add('active');
            }
        });
    }

    // Chart Creation Methods
    createBudgetAllocationChart() {
        const ctx = document.getElementById('budgetAllocationChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.allocations.map(a => a.department),
                datasets: [{
                    data: this.allocations.map(a => a.allocated_amount),
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#f5576c',
                        '#4facfe',
                        '#00f2fe'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    createUtilizationTrendsChart() {
        const ctx = document.getElementById('utilizationTrendsChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: this.allocations.map((allocation, index) => ({
                    label: allocation.department,
                    data: [20, 35, 45, 60, 70, allocation.utilization_rate],
                    borderColor: ['#667eea', '#f5576c', '#4facfe'][index % 3],
                    backgroundColor: ['rgba(102, 126, 234, 0.1)', 'rgba(245, 87, 108, 0.1)', 'rgba(79, 172, 254, 0.1)'][index % 3],
                    fill: true,
                    tension: 0.4
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    createScenarioChart() {
        const ctx = document.getElementById('scenarioChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Revenue', 'Expenses', 'Net Result'],
                datasets: [
                    {
                        label: 'Optimistic',
                        data: [3500000, 2800000, 700000],
                        backgroundColor: '#10b981'
                    },
                    {
                        label: 'Realistic',
                        data: [3200000, 3000000, 200000],
                        backgroundColor: '#3b82f6'
                    },
                    {
                        label: 'Pessimistic',
                        data: [2900000, 3200000, -300000],
                        backgroundColor: '#ef4444'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '₱' + (value / 1000000).toFixed(1) + 'M';
                            }
                        }
                    }
                }
            }
        });
    }

    // Modal and Action Methods
    openBudgetModal(budget = null) {
        if (!auth.canPerformAction('create', 'budget') && !budget) {
            Utils.showNotification('Access denied: You cannot create budgets', 'error');
            return;
        }
        
        this.editingBudget = budget;
        const isEdit = budget !== null;
        
        const modalContent = `
            <div class="modal-header">
                <h2>${isEdit ? 'Edit Budget' : 'Create New Budget'}</h2>
            </div>
            <div class="modal-body">
                <form id="budgetForm">
                    <div class="form-group">
                        <label for="budgetName">Budget Name</label>
                        <input type="text" id="budgetName" name="name" value="${budget?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="budgetDescription">Description</label>
                        <textarea id="budgetDescription" name="description" rows="3">${budget?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="budgetAmount">Total Amount</label>
                        <input type="number" id="budgetAmount" name="total_amount" step="0.01" value="${budget?.total_amount || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="budgetPeriod">Budget Period</label>
                        <select id="budgetPeriod" name="budget_period" required>
                            <option value="monthly" ${budget?.budget_period === 'monthly' ? 'selected' : ''}>Monthly</option>
                            <option value="quarterly" ${budget?.budget_period === 'quarterly' ? 'selected' : ''}>Quarterly</option>
                            <option value="yearly" ${budget?.budget_period === 'yearly' ? 'selected' : ''}>Yearly</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="budgetStartDate">Start Date</label>
                            <input type="date" id="budgetStartDate" name="start_date" value="${budget?.start_date || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="budgetEndDate">End Date</label>
                            <input type="date" id="budgetEndDate" name="end_date" value="${budget?.end_date || ''}" required>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="budgetManager.saveBudget()">${isEdit ? 'Update' : 'Create'}</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    saveBudget() {
        const form = document.getElementById('budgetForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const budgetData = {
            name: formData.get('name'),
            description: formData.get('description'),
            total_amount: parseFloat(formData.get('total_amount')),
            budget_period: formData.get('budget_period'),
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
            status: 'active',
            created_by: auth.getCurrentUser().id
        };

        if (this.editingBudget) {
            db.update('budgets', this.editingBudget.id, budgetData);
            Utils.showNotification('Budget updated successfully', 'success');
        } else {
            budgetData.allocated_amount = 0;
            budgetData.spent_amount = 0;
            db.insert('budgets', budgetData);
            Utils.showNotification('Budget created successfully', 'success');
        }

        modalManager.closeModal();
        this.loadBudgets();
        dashboardManager.loadAnalytics();
    }

    // Request Management Methods
    approveRequest(id) {
        if (!auth.canPerformAction('approve', 'budget')) {
            Utils.showNotification('Access denied: You cannot approve budget requests', 'error');
            return;
        }

        Utils.confirmAction('Are you sure you want to approve this budget request?', () => {
            const request = this.budgetRequests.find(r => r.id === id);
            if (request) {
                request.status = 'approved';
                request.approved_by = auth.getCurrentUser().username;
                request.approved_date = new Date().toISOString();
                request.approved_amount = request.requested_amount;
                
                Utils.showNotification('Budget request approved successfully', 'success');
                this.displayCurrentView();
            }
        });
    }

    rejectRequest(id) {
        if (!auth.canPerformAction('reject', 'budget')) {
            Utils.showNotification('Access denied: You cannot reject budget requests', 'error');
            return;
        }

        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
            const request = this.budgetRequests.find(r => r.id === id);
            if (request) {
                request.status = 'rejected';
                request.rejected_by = auth.getCurrentUser().username;
                request.rejected_date = new Date().toISOString();
                request.rejection_reason = reason;
                
                Utils.showNotification('Budget request rejected', 'info');
                this.displayCurrentView();
            }
        }
    }

    // Utility Methods
    generateForecast() {
        Utils.showNotification('Generating budget forecast...', 'info');
        setTimeout(() => {
            Utils.showNotification('Budget forecast generated successfully', 'success');
        }, 2000);
    }

    exportRequests() {
        Utils.showNotification('Exporting budget requests...', 'info');
        setTimeout(() => {
            Utils.showNotification('Budget requests exported successfully', 'success');
        }, 1500);
    }

    exportForecast(format) {
        // Simulate forecast export
        Utils.showNotification(`Exporting budget forecast as ${format.toUpperCase()}...`, 'info');
        
        setTimeout(() => {
            Utils.showNotification(`Budget forecast exported successfully as ${format.toUpperCase()}`, 'success');
        }, 2000);
    }

    openRequestModal() {
        if (!auth.canPerformAction('create', 'budget')) {
            Utils.showNotification('Access denied: You cannot create budget requests', 'error');
            return;
        }
        
        const modalContent = `
            <div class="modal-header">
                <h2>New Budget Request</h2>
            </div>
            <div class="modal-body">
                <form id="budgetRequestForm">
                    <div class="form-group">
                        <label for="requestDepartment">Department</label>
                        <select id="requestDepartment" name="department" required>
                            <option value="">Select Department</option>
                            <option value="Academic Affairs">Academic Affairs</option>
                            <option value="IT Services">IT Services</option>
                            <option value="Facilities">Facilities</option>
                            <option value="Administration">Administration</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="requestCategory">Category</label>
                        <input type="text" id="requestCategory" name="category" required>
                    </div>
                    <div class="form-group">
                        <label for="requestAmount">Requested Amount</label>
                        <input type="number" id="requestAmount" name="requested_amount" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="requestJustification">Justification</label>
                        <textarea id="requestJustification" name="justification" rows="4" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="requestPriority">Priority</label>
                        <select id="requestPriority" name="priority" required>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="budgetManager.saveRequest()">Submit Request</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    saveRequest() {
        const form = document.getElementById('budgetRequestForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const requestData = {
            department: formData.get('department'),
            category: formData.get('category'),
            requested_amount: parseFloat(formData.get('requested_amount')),
            justification: formData.get('justification'),
            priority: formData.get('priority'),
            status: 'pending',
            submitted_by: auth.getCurrentUser().username,
            submitted_date: new Date().toISOString().split('T')[0]
        };

        // Add to budget requests array
        this.budgetRequests.push({
            id: this.budgetRequests.length + 1,
            ...requestData
        });

        Utils.showNotification('Budget request submitted successfully', 'success');
        modalManager.closeModal();
        this.displayCurrentView();
    }

    scheduleAlert() {
        const modalContent = `
            <div class="modal-header">
                <h2>Schedule Budget Alert</h2>
            </div>
            <div class="modal-body">
                <form id="alertForm">
                    <div class="form-group">
                        <label for="alertType">Alert Type</label>
                        <select id="alertType" name="alert_type" required>
                            <option value="threshold">Budget Threshold</option>
                            <option value="deadline">Budget Deadline</option>
                            <option value="variance">Budget Variance</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="alertThreshold">Threshold (%)</label>
                        <input type="number" id="alertThreshold" name="threshold" min="1" max="100" value="85" required>
                    </div>
                    <div class="form-group">
                        <label for="alertDepartment">Department</label>
                        <select id="alertDepartment" name="department">
                            <option value="">All Departments</option>
                            <option value="Academic Affairs">Academic Affairs</option>
                            <option value="IT Services">IT Services</option>
                            <option value="Facilities">Facilities</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="alertEmail">Email Notifications</label>
                        <input type="email" id="alertEmail" name="email" placeholder="Enter email address">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="budgetManager.saveAlert()">Schedule Alert</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    saveAlert() {
        const form = document.getElementById('alertForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        Utils.showNotification('Budget alert scheduled successfully', 'success');
        modalManager.closeModal();
    }

    viewRequestDetails(id) {
        const request = this.budgetRequests.find(r => r.id === id);
        if (!request) {
            Utils.showNotification('Request not found', 'error');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>Budget Request Details</h2>
            </div>
            <div class="modal-body">
                <div class="request-details-grid">
                    <div class="detail-item">
                        <label>Department:</label>
                        <span>${request.department}</span>
                    </div>
                    <div class="detail-item">
                        <label>Category:</label>
                        <span>${request.category}</span>
                    </div>
                    <div class="detail-item">
                        <label>Requested Amount:</label>
                        <span>${Utils.formatCurrency(request.requested_amount)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Priority:</label>
                        <span class="priority-badge priority-${request.priority}">${request.priority}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge status-${request.status}">${request.status.replace('_', ' ')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Submitted By:</label>
                        <span>${request.submitted_by}</span>
                    </div>
                    <div class="detail-item">
                        <label>Submitted Date:</label>
                        <span>${request.submitted_date}</span>
                    </div>
                    ${request.approved_amount ? `
                        <div class="detail-item">
                            <label>Approved Amount:</label>
                            <span>${Utils.formatCurrency(request.approved_amount)}</span>
                        </div>
                    ` : ''}
                    <div class="detail-item full-width">
                        <label>Justification:</label>
                        <p>${request.justification}</p>
                    </div>
                    ${request.supporting_documents ? `
                        <div class="detail-item full-width">
                            <label>Supporting Documents:</label>
                            <ul>
                                ${request.supporting_documents.map(doc => `<li>${doc}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Close</button>
                ${request.status === 'pending' && auth.canPerformAction('approve', 'budget') ? `
                    <button type="button" class="btn btn-success" onclick="budgetManager.approveRequest(${request.id}); modalManager.closeModal();">Approve</button>
                    <button type="button" class="btn btn-danger" onclick="budgetManager.rejectRequest(${request.id}); modalManager.closeModal();">Reject</button>
                ` : ''}
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    openAllocationModal() {
        const modalContent = `
            <div class="modal-header">
                <h2>New Budget Allocation</h2>
            </div>
            <div class="modal-body">
                <form id="allocationForm">
                    <div class="form-group">
                        <label for="allocationDepartment">Department</label>
                        <select id="allocationDepartment" name="department" required>
                            <option value="">Select department</option>
                            <option value="Academic Affairs">Academic Affairs</option>
                            <option value="Student Services">Student Services</option>
                            <option value="Administration">Administration</option>
                            <option value="Finance">Finance</option>
                            <option value="IT Services">IT Services</option>
                            <option value="Facilities">Facilities</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="allocationCategory">Category</label>
                        <select id="allocationCategory" name="category" required>
                            <option value="">Select category</option>
                            <option value="Personnel">Personnel</option>
                            <option value="Operations">Operations</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Supplies">Supplies</option>
                            <option value="Utilities">Utilities</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="allocationAmount">Allocated Amount</label>
                        <input type="number" id="allocationAmount" name="allocated_amount" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="allocationDescription">Description</label>
                        <textarea id="allocationDescription" name="description" rows="3" placeholder="Purpose and justification for this allocation..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="allocationPeriod">Budget Period</label>
                        <select id="allocationPeriod" name="period" required>
                            <option value="Q1 2024">Q1 2024</option>
                            <option value="Q2 2024">Q2 2024</option>
                            <option value="Q3 2024">Q3 2024</option>
                            <option value="Q4 2024">Q4 2024</option>
                            <option value="FY 2024">FY 2024</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="budgetManager.saveAllocation()">Allocate Funds</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    saveAllocation() {
        const form = document.getElementById('allocationForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        
        const allocationData = {
            id: Date.now(),
            department: formData.get('department'),
            category: formData.get('category'),
            allocated_amount: parseFloat(formData.get('allocated_amount')),
            spent_amount: 0,
            description: formData.get('description'),
            period: formData.get('period'),
            status: 'active',
            created_by: auth.getCurrentUser().username,
            created_at: new Date().toISOString()
        };

        // Add to allocations array
        if (!this.allocations) {
            this.allocations = [];
        }
        this.allocations.push(allocationData);
        
        // Store in localStorage for persistence
        localStorage.setItem('budget_allocations', JSON.stringify(this.allocations));

        Utils.showNotification('Budget allocation created successfully', 'success');
        modalManager.closeModal();
        
        // Refresh the allocations view if currently active
        if (this.currentView === 'allocations') {
            this.loadAllocationsView();
        }
    }

    openReallocationModal() {
        if (!auth.canPerformAction('update', 'budget')) {
            Utils.showNotification('Access denied: You cannot reallocate funds', 'error');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>Reallocate Funds</h2>
            </div>
            <div class="modal-body">
                <form id="reallocationForm">
                    <div class="form-group">
                        <label for="sourceAllocation">Source Allocation</label>
                        <select id="sourceAllocation" name="source_allocation" required>
                            <option value="">Select source allocation</option>
                            ${this.allocations.map(allocation => `
                                <option value="${allocation.id}">
                                    ${allocation.department} - ${allocation.category} (₱${allocation.remaining_amount.toLocaleString()} available)
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="targetDepartment">Target Department</label>
                        <select id="targetDepartment" name="target_department" required>
                            <option value="">Select target department</option>
                            <option value="Academic Affairs">Academic Affairs</option>
                            <option value="Student Services">Student Services</option>
                            <option value="Finance">Finance</option>
                            <option value="Human Resources">Human Resources</option>
                            <option value="IT Services">IT Services</option>
                            <option value="Facilities">Facilities</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="targetCategory">Target Category</label>
                        <select id="targetCategory" name="target_category" required>
                            <option value="">Select target category</option>
                            <option value="Personnel">Personnel</option>
                            <option value="Operations">Operations</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Supplies">Supplies</option>
                            <option value="Travel">Travel</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="reallocationAmount">Amount to Reallocate</label>
                        <input type="number" id="reallocationAmount" name="amount" step="0.01" required>
                        <small class="text-muted">Available amount will be shown when source is selected</small>
                    </div>
                    <div class="form-group">
                        <label for="reallocationReason">Reason for Reallocation</label>
                        <textarea id="reallocationReason" name="reason" rows="3" required placeholder="Explain why this reallocation is necessary..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="budgetManager.saveReallocation()">Reallocate Funds</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
        
        // Add event listener to update available amount when source changes
        setTimeout(() => {
            const sourceSelect = document.getElementById('sourceAllocation');
            const amountInput = document.getElementById('reallocationAmount');
            
            sourceSelect.addEventListener('change', function() {
                const selectedAllocation = budgetManager.allocations.find(a => a.id == this.value);
                if (selectedAllocation) {
                    amountInput.max = selectedAllocation.remaining_amount;
                    amountInput.placeholder = `Max: ₱${selectedAllocation.remaining_amount.toLocaleString()}`;
                }
            });
        }, 100);
    }

    saveReallocation() {
        const form = document.getElementById('reallocationForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const sourceAllocationId = parseInt(formData.get('source_allocation'));
        const amount = parseFloat(formData.get('amount'));
        
        const sourceAllocation = this.allocations.find(a => a.id === sourceAllocationId);
        if (!sourceAllocation) {
            Utils.showNotification('Invalid source allocation selected', 'error');
            return;
        }
        
        if (amount > sourceAllocation.remaining_amount) {
            Utils.showNotification('Amount exceeds available funds in source allocation', 'error');
            return;
        }
        
        // Create reallocation record
        const reallocationData = {
            source_allocation_id: sourceAllocationId,
            source_department: sourceAllocation.department,
            source_category: sourceAllocation.category,
            target_department: formData.get('target_department'),
            target_category: formData.get('target_category'),
            amount: amount,
            reason: formData.get('reason'),
            status: 'pending',
            requested_by: auth.getCurrentUser().username,
            requested_at: new Date().toISOString()
        };
        
        // Process through workflow if needed
        if (auth.getCurrentUser().role === 'admin' || amount <= 25000) {
            // Auto-approve for admin or small amounts
            reallocationData.status = 'approved';
            reallocationData.approved_by = auth.getCurrentUser().username;
            reallocationData.approved_at = new Date().toISOString();
            
            // Update allocations
            this.processReallocation(reallocationData);
            Utils.showNotification('Funds reallocated successfully', 'success');
        } else {
            // Route for approval
            Utils.showNotification('Reallocation request submitted for approval', 'info');
        }
        
        // Store reallocation record
        const reallocations = JSON.parse(localStorage.getItem('budget_reallocations') || '[]');
        reallocations.push({
            id: Date.now(),
            ...reallocationData
        });
        localStorage.setItem('budget_reallocations', JSON.stringify(reallocations));
        
        modalManager.closeModal();
        this.loadAllocations();
    }

    reallocateFunds() {
        this.openReallocationModal();
    }

    processReallocation(reallocationData) {
        // Update source allocation
        this.allocations = this.allocations.map(allocation => {
            if (allocation.id === reallocationData.source_allocation_id) {
                return {
                    ...allocation,
                    allocated_amount: allocation.allocated_amount - reallocationData.amount,
                    remaining_amount: allocation.remaining_amount - reallocationData.amount
                };
            }
            return allocation;
        });
        
        // Create or update target allocation
        const existingTarget = this.allocations.find(a => 
            a.department === reallocationData.target_department && 
            a.category === reallocationData.target_category
        );
        
        if (existingTarget) {
            // Update existing allocation
            this.allocations = this.allocations.map(allocation => {
                if (allocation.id === existingTarget.id) {
                    return {
                        ...allocation,
                        allocated_amount: allocation.allocated_amount + reallocationData.amount,
                        remaining_amount: allocation.remaining_amount + reallocationData.amount
                    };
                }
                return allocation;
            });
        } else {
            // Create new allocation
            const newAllocation = {
                id: Date.now(),
                department: reallocationData.target_department,
                category: reallocationData.target_category,
                allocated_amount: reallocationData.amount,
                spent_amount: 0,
                remaining_amount: reallocationData.amount,
                utilization_percentage: 0,
                created_by: auth.getCurrentUser().username,
                created_at: new Date().toISOString()
            };
            this.allocations.push(newAllocation);
        }
        
        // Update localStorage
        localStorage.setItem('budget_allocations', JSON.stringify(this.allocations));
    }

    openReallocationModal() {
        // Load current allocations
        const allocations = JSON.parse(localStorage.getItem('budget_allocations') || '[]');
        
        if (allocations.length === 0) {
            Utils.showNotification('No existing allocations found to reallocate', 'warning');
            return;
        }

        const allocationOptions = allocations.map(allocation => 
            `<option value="${allocation.id}">${allocation.department} - ${allocation.category} (₱${allocation.allocated_amount.toLocaleString()})</option>`
        ).join('');

        const modalContent = `
            <div class="modal-header">
                <h2>Reallocate Budget Funds</h2>
            </div>
            <div class="modal-body">
                <form id="reallocationForm">
                    <div class="form-group">
                        <label for="sourceAllocation">Source Allocation</label>
                        <select id="sourceAllocation" name="source_allocation_id" required>
                            <option value="">Select source allocation</option>
                            ${allocationOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="targetDepartment">Target Department</label>
                        <select id="targetDepartment" name="target_department" required>
                            <option value="">Select target department</option>
                            <option value="Academic Affairs">Academic Affairs</option>
                            <option value="Student Services">Student Services</option>
                            <option value="Administration">Administration</option>
                            <option value="Finance">Finance</option>
                            <option value="IT Services">IT Services</option>
                            <option value="Facilities">Facilities</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="targetCategory">Target Category</label>
                        <select id="targetCategory" name="target_category" required>
                            <option value="">Select target category</option>
                            <option value="Personnel">Personnel</option>
                            <option value="Operations">Operations</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Supplies">Supplies</option>
                            <option value="Utilities">Utilities</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="reallocationAmount">Amount to Reallocate</label>
                        <input type="number" id="reallocationAmount" name="amount" step="0.01" required>
                        <small class="text-muted">Available amount will be shown after selecting source allocation</small>
                    </div>
                    <div class="form-group">
                        <label for="reallocationReason">Reason for Reallocation</label>
                        <textarea id="reallocationReason" name="reason" rows="3" required placeholder="Explain why this reallocation is necessary..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="reallocationApprover">Requires Approval From</label>
                        <select id="reallocationApprover" name="approver" required>
                            <option value="finance_manager">Finance Manager</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-warning" onclick="budgetManager.saveReallocation()">Submit Reallocation</button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
        
        // Add event listener to update available amount
        document.getElementById('sourceAllocation').addEventListener('change', function() {
            const selectedId = this.value;
            const allocation = allocations.find(a => a.id == selectedId);
            if (allocation) {
                const available = allocation.allocated_amount - allocation.spent_amount;
                const amountInput = document.getElementById('reallocationAmount');
                amountInput.max = available;
                amountInput.placeholder = `Max available: ₱${available.toLocaleString()}`;
                
                const helpText = amountInput.nextElementSibling;
                helpText.textContent = `Available amount: ₱${available.toLocaleString()}`;
            }
        });
    }

    saveReallocation() {
        const form = document.getElementById('reallocationForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const allocations = JSON.parse(localStorage.getItem('budget_allocations') || '[]');
        const sourceAllocation = allocations.find(a => a.id == formData.get('source_allocation_id'));
        const reallocationAmount = parseFloat(formData.get('amount'));
        
        if (!sourceAllocation) {
            Utils.showNotification('Source allocation not found', 'error');
            return;
        }
        
        const availableAmount = sourceAllocation.allocated_amount - sourceAllocation.spent_amount;
        if (reallocationAmount > availableAmount) {
            Utils.showNotification('Reallocation amount exceeds available funds', 'error');
            return;
        }

        const reallocationData = {
            id: Date.now(),
            source_allocation_id: parseInt(formData.get('source_allocation_id')),
            source_department: sourceAllocation.department,
            source_category: sourceAllocation.category,
            target_department: formData.get('target_department'),
            target_category: formData.get('target_category'),
            amount: reallocationAmount,
            reason: formData.get('reason'),
            approver: formData.get('approver'),
            status: 'pending',
            requested_by: auth.getCurrentUser().username,
            requested_at: new Date().toISOString()
        };

        // Store reallocation request
        const reallocations = JSON.parse(localStorage.getItem('budget_reallocations') || '[]');
        reallocations.push(reallocationData);
        localStorage.setItem('budget_reallocations', JSON.stringify(reallocations));

        // Process through workflow if user has permission
        if (auth.canPerformAction('approve', 'budget')) {
            // Auto-approve if user has permission
            this.processReallocation(reallocationData.id, 'approved');
            Utils.showNotification('Reallocation approved and processed', 'success');
        } else {
            Utils.showNotification(`Reallocation request submitted for approval to ${reallocationData.approver}`, 'info');
        }

        modalManager.closeModal();
        
        // Refresh the allocations view if currently active
        if (this.currentView === 'allocations') {
            this.loadAllocationsView();
        }
    }

    processReallocation(reallocationId, action) {
        const reallocations = JSON.parse(localStorage.getItem('budget_reallocations') || '[]');
        const reallocation = reallocations.find(r => r.id === reallocationId);
        
        if (!reallocation) return;

        if (action === 'approved') {
            // Update source allocation
            const allocations = JSON.parse(localStorage.getItem('budget_allocations') || '[]');
            const sourceIndex = allocations.findIndex(a => a.id === reallocation.source_allocation_id);
            
            if (sourceIndex !== -1) {
                allocations[sourceIndex].allocated_amount -= reallocation.amount;
            }

            // Create new target allocation
            const newAllocation = {
                id: Date.now(),
                department: reallocation.target_department,
                category: reallocation.target_category,
                allocated_amount: reallocation.amount,
                spent_amount: 0,
                description: `Reallocated from ${reallocation.source_department} - ${reallocation.source_category}`,
                period: 'Current',
                status: 'active',
                created_by: auth.getCurrentUser().username,
                created_at: new Date().toISOString()
            };
            
            allocations.push(newAllocation);
            localStorage.setItem('budget_allocations', JSON.stringify(allocations));

            // Update reallocation status
            reallocation.status = 'approved';
            reallocation.approved_by = auth.getCurrentUser().username;
            reallocation.approved_at = new Date().toISOString();
        } else {
            reallocation.status = 'rejected';
            reallocation.rejected_by = auth.getCurrentUser().username;
            reallocation.rejected_at = new Date().toISOString();
        }

        localStorage.setItem('budget_reallocations', JSON.stringify(reallocations));
    }

    loadAllocationsView() {
        // Load and display allocations data
        const allocationsContainer = document.querySelector('#allocationsContent');
        if (!allocationsContainer) return;
        
        const allocations = this.getAllocations();
        
        allocationsContainer.innerHTML = `
            <div class="allocation-summary">
                <div class="summary-cards">
                    ${allocations.map(allocation => `
                        <div class="allocation-card">
                            <div class="allocation-header">
                                <h4>${allocation.department}</h4>
                                <span class="category-tag">${allocation.category}</span>
                            </div>
                            <div class="allocation-metrics">
                                <div class="metric">
                                    <label>Allocated</label>
                                    <div class="value">₱${allocation.allocated_amount.toLocaleString()}</div>
                                </div>
                                <div class="metric">
                                    <label>Spent</label>
                                    <div class="value spent">₱${allocation.spent_amount.toLocaleString()}</div>
                                </div>
                                <div class="metric">
                                    <label>Remaining</label>
                                    <div class="value remaining">₱${(allocation.allocated_amount - allocation.spent_amount).toLocaleString()}</div>
                                </div>
                            </div>
                            <div class="utilization-bar">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${((allocation.spent_amount / allocation.allocated_amount) * 100)}%"></div>
                                </div>
                                <div class="utilization-text">${((allocation.spent_amount / allocation.allocated_amount) * 100).toFixed(1)}% utilized</div>
                            </div>
                            <div class="allocation-actions">
                                <button class="btn btn-sm btn-primary" onclick="budgetManager.editAllocation(${allocation.id})">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="budgetManager.viewAllocationHistory(${allocation.id})">
                                    <i class="fas fa-history"></i> History
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Global function for opening budget modal
function openBudgetModal() {
    budgetManager.openBudgetModal();
}

// Initialize budget manager
const budgetManager = new BudgetManager();