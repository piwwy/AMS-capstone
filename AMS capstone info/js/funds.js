// Fund Management
class FundManager {
    constructor() {
        this.funds = [];
        this.transactions = [];
        this.modalType = 'deposit';
    }

    loadFunds() {
        this.funds = db.select('funds');
        this.transactions = db.select('fund_transactions');
        this.displayFunds();
        this.displayTransactions();
    }

    displayFunds() {
        const container = document.getElementById('fundsGrid');
        
        if (this.funds.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-piggy-bank"></i>
                    <h3>No funds found</h3>
                    <p>Initialize your fund accounts to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.funds.map(fund => `
            <div class="fund-card">
                <div class="fund-card-header">
                    <h3>${fund.fund_name}</h3>
                    <span class="fund-type-badge fund-type-${fund.fund_type}">${fund.fund_type}</span>
                </div>
                <div class="fund-balance">${Utils.formatCurrency(fund.balance)}</div>
                <div class="fund-description">${fund.description}</div>
            </div>
        `).join('');
    }

    displayTransactions() {
        const tbody = document.querySelector('#fundTransactionTable tbody');
        
        if (this.transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-exchange-alt"></i>
                            <h3>No transactions found</h3>
                            <p>Fund transactions will appear here</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.transactions.map(transaction => `
            <tr>
                <td>${transaction.reference_number}</td>
                <td>${transaction.fund_name}</td>
                <td>
                    <span class="status-badge status-${transaction.transaction_type}">
                        <i class="fas fa-${transaction.transaction_type === 'deposit' ? 'arrow-up' : 
                                         transaction.transaction_type === 'withdrawal' ? 'arrow-down' : 'exchange-alt'}"></i>
                        ${transaction.transaction_type}
                    </span>
                </td>
                <td class="text-${transaction.transaction_type === 'deposit' ? 'success' : 'danger'}">
                    ${transaction.transaction_type === 'deposit' ? '+' : '-'}${Utils.formatCurrency(transaction.amount)}
                </td>
                <td>${Utils.formatDate(transaction.transaction_date)}</td>
                <td>${transaction.created_by}</td>
            </tr>
        `).join('');
    }

    openFundModal(type) {
        this.modalType = type;
        
        const fundOptions = this.funds.map(fund => 
            `<option value="${fund.id}">${fund.fund_name} (${Utils.formatCurrency(fund.balance)})</option>`
        ).join('');
        
        let modalContent = `
            <div class="modal-header">
                <h2>${type === 'deposit' ? 'Deposit Funds' : 
                      type === 'withdrawal' ? 'Withdraw Funds' : 
                      'Transfer Funds'}</h2>
            </div>
            <div class="modal-body">
                <form id="fundForm">
        `;

        if (type === 'transfer') {
            modalContent += `
                <div class="form-group">
                    <label for="fromFund">From Fund</label>
                    <select id="fromFund" name="from_fund_id" required>
                        <option value="">Select source fund</option>
                        ${fundOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="toFund">To Fund</label>
                    <select id="toFund" name="to_fund_id" required>
                        <option value="">Select destination fund</option>
                        ${fundOptions}
                    </select>
                </div>
            `;
        } else {
            modalContent += `
                <div class="form-group">
                    <label for="fundSelect">Fund</label>
                    <select id="fundSelect" name="fund_id" required>
                        <option value="">Select fund</option>
                        ${fundOptions}
                    </select>
                </div>
            `;
        }

        modalContent += `
                    <div class="form-group">
                        <label for="fundAmount">Amount</label>
                        <input type="number" id="fundAmount" name="amount" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="fundReference">Reference Number</label>
                        <input type="text" id="fundReference" name="reference_number">
                    </div>
                    <div class="form-group">
                        <label for="fundTransactionDate">Transaction Date</label>
                        <input type="date" id="fundTransactionDate" name="transaction_date" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label for="fundDescription">Description</label>
                        <textarea id="fundDescription" name="description" rows="3" required></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                <button type="button" class="btn btn-${type === 'deposit' ? 'success' : type === 'withdrawal' ? 'danger' : 'primary'}" onclick="fundManager.saveFundTransaction()">
                    ${type === 'deposit' ? 'Deposit' : type === 'withdrawal' ? 'Withdraw' : 'Transfer'}
                </button>
            </div>
        `;
        
        modalManager.openModal(modalContent);
    }

    saveFundTransaction() {
        const form = document.getElementById('fundForm');
        if (!Utils.validateForm(form)) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData(form);
        const amount = parseFloat(formData.get('amount'));
        
        if (this.modalType === 'transfer') {
            const fromFundId = parseInt(formData.get('from_fund_id'));
            const toFundId = parseInt(formData.get('to_fund_id'));
            
            if (fromFundId === toFundId) {
                Utils.showNotification('Cannot transfer to the same fund', 'error');
                return;
            }
            
            const fromFund = this.funds.find(f => f.id === fromFundId);
            const toFund = this.funds.find(f => f.id === toFundId);
            
            if (fromFund.balance < amount) {
                Utils.showNotification('Insufficient balance in source fund', 'error');
                return;
            }
            
            // Update fund balances
            db.update('funds', fromFundId, { balance: fromFund.balance - amount });
            db.update('funds', toFundId, { balance: toFund.balance + amount });
            
            // Record transaction
            const transactionData = {
                fund_id: fromFundId,
                fund_name: fromFund.fund_name,
                transaction_type: 'transfer',
                amount: amount,
                from_fund_id: fromFundId,
                to_fund_id: toFundId,
                description: formData.get('description'),
                reference_number: formData.get('reference_number') || Utils.generateId(),
                transaction_date: formData.get('transaction_date'),
                created_by: auth.getCurrentUser().username
            };
            
            db.insert('fund_transactions', transactionData);
            
        } else {
            const fundId = parseInt(formData.get('fund_id'));
            const fund = this.funds.find(f => f.id === fundId);
            
            if (this.modalType === 'withdrawal' && fund.balance < amount) {
                Utils.showNotification('Insufficient fund balance', 'error');
                return;
            }
            
            // Update fund balance
            const newBalance = this.modalType === 'deposit' ? 
                fund.balance + amount : fund.balance - amount;
            db.update('funds', fundId, { balance: newBalance });
            
            // Record transaction
            const transactionData = {
                fund_id: fundId,
                fund_name: fund.fund_name,
                transaction_type: this.modalType,
                amount: amount,
                description: formData.get('description'),
                reference_number: formData.get('reference_number') || Utils.generateId(),
                transaction_date: formData.get('transaction_date'),
                created_by: auth.getCurrentUser().username
            };
            
            db.insert('fund_transactions', transactionData);
        }

        Utils.showNotification(`Fund ${this.modalType} completed successfully`, 'success');
        modalManager.closeModal();
        this.loadFunds();
        dashboardManager.loadAnalytics();
    }
}

// Global function for opening fund modal
function openFundModal(type) {
    fundManager.openFundModal(type);
}

// Initialize fund manager
const fundManager = new FundManager();