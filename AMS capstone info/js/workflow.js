// Automated Workflow and Approval Rules Engine
class WorkflowManager {
    constructor() {
        this.approvalRules = this.initializeApprovalRules();
        this.workflowQueue = [];
        this.automatedChecks = this.initializeAutomatedChecks();
        this.notificationQueue = [];
    }

    initializeApprovalRules() {
        return {
            expenses: {
                // Amount-based approval rules
                amounts: [
                    { min: 0, max: 5000, approvers: ['accountant', 'finance_manager'] },
                    { min: 5001, max: 25000, approvers: ['finance_manager'] },
                    { min: 25001, max: 100000, approvers: ['finance_manager', 'admin'] },
                    { min: 100001, max: Infinity, approvers: ['admin'] }
                ],
                // Category-based rules
                categories: {
                    'Salaries': { requiresAdmin: true, dualApproval: true },
                    'Utilities': { maxAmount: 15000, autoApprove: true },
                    'Supplies': { maxAmount: 10000, autoApprove: false },
                    'Maintenance': { requiresQuotes: true, minQuotes: 2 }
                }
            },
            revenue: {
                // Revenue validation rules
                amounts: [
                    { min: 0, max: 10000, autoApprove: true },
                    { min: 10001, max: 50000, approvers: ['finance_manager'] },
                    { min: 50001, max: Infinity, approvers: ['finance_manager', 'admin'] }
                ],
                sources: {
                    'Tuition Fees': { autoApprove: true, requiresStudentVerification: true },
                    'Government Grants': { requiresAdmin: true, requiresDocumentation: true },
                    'Donations': { requiresVerification: true, taxDocumentation: true }
                }
            },
            budget: {
                creation: { approvers: ['admin'] },
                modification: { approvers: ['finance_manager', 'admin'] },
                allocation: { approvers: ['finance_manager'] }
            },
            funds: {
                transfer: {
                    amounts: [
                        { min: 0, max: 25000, approvers: ['finance_manager'] },
                        { min: 25001, max: Infinity, approvers: ['admin'] }
                    ]
                },
                withdrawal: {
                    emergency: { approvers: ['admin'], requiresJustification: true },
                    operational: { approvers: ['finance_manager'] }
                }
            },
            requests: {
                purchase: {
                    amounts: [
                        { min: 0, max: 10000, approvers: ['finance_manager'] },
                        { min: 10001, max: 50000, approvers: ['finance_manager', 'admin'] },
                        { min: 50001, max: Infinity, approvers: ['admin'] }
                    ]
                },
                budget_adjustment: { approvers: ['admin'], requiresJustification: true }
            }
        };
    }

    initializeAutomatedChecks() {
        return {
            fraudDetection: {
                duplicateTransactions: true,
                unusualAmounts: true,
                rapidTransactions: true,
                vendorValidation: true
            },
            budgetValidation: {
                exceedsAllocation: true,
                categoryLimits: true,
                periodValidation: true
            },
            complianceChecks: {
                documentationRequired: true,
                approvalChain: true,
                segregationOfDuties: true
            }
        };
    }

    // Main workflow processing function
    processTransaction(transactionType, transactionData, currentUser) {
        console.log(`Processing ${transactionType} transaction by ${currentUser.username}`);
        
        // Step 1: Automated validation checks
        const validationResult = this.runAutomatedChecks(transactionType, transactionData, currentUser);
        if (!validationResult.isValid) {
            return this.handleValidationFailure(validationResult, transactionData);
        }

        // Step 2: Determine approval requirements
        const approvalRequirements = this.determineApprovalRequirements(transactionType, transactionData);
        
        // Step 3: Check if auto-approval is possible
        if (this.canAutoApprove(transactionType, transactionData, currentUser, approvalRequirements)) {
            return this.autoApproveTransaction(transactionType, transactionData, currentUser);
        }

        // Step 4: Route to appropriate approvers
        return this.routeForApproval(transactionType, transactionData, currentUser, approvalRequirements);
    }

    runAutomatedChecks(transactionType, transactionData, currentUser) {
        const checks = [];
        
        // Fraud detection checks
        checks.push(this.checkForDuplicateTransactions(transactionData));
        checks.push(this.checkForUnusualAmounts(transactionType, transactionData));
        checks.push(this.checkForRapidTransactions(currentUser));
        
        // Compliance checks
        checks.push(this.checkSegregationOfDuties(transactionType, currentUser));
        checks.push(this.checkDocumentationRequirements(transactionType, transactionData));
        
        const failedChecks = checks.filter(check => !check.passed);
        
        return {
            isValid: failedChecks.length === 0,
            failedChecks: failedChecks,
            warnings: checks.filter(check => check.warning),
            score: this.calculateRiskScore(checks)
        };
    }

    checkForDuplicateTransactions(transactionData) {
        // Check for potential duplicate transactions
        const recentTransactions = this.getRecentTransactions(24); // Last 24 hours
        const duplicates = recentTransactions.filter(t => 
            Math.abs(t.amount - transactionData.amount) < 0.01 &&
            t.vendor_name === transactionData.vendor_name &&
            new Date(t.created_at) > new Date(Date.now() - 3600000) // Within 1 hour
        );
        
        return {
            passed: duplicates.length === 0,
            warning: duplicates.length > 0,
            message: duplicates.length > 0 ? 'Potential duplicate transaction detected' : 'No duplicates found',
            details: duplicates
        };
    }

    checkForUnusualAmounts(transactionType, transactionData) {
        const historicalData = this.getHistoricalData(transactionType);
        const averageAmount = historicalData.reduce((sum, t) => sum + t.amount, 0) / historicalData.length;
        const isUnusual = transactionData.amount > (averageAmount * 3); // 3x average
        
        return {
            passed: !isUnusual,
            warning: isUnusual,
            message: isUnusual ? 'Amount significantly higher than historical average' : 'Amount within normal range',
            details: { amount: transactionData.amount, average: averageAmount }
        };
    }

    checkForRapidTransactions(currentUser) {
        const recentTransactions = this.getUserRecentTransactions(currentUser.username, 1); // Last hour
        const isRapid = recentTransactions.length > 10; // More than 10 transactions in 1 hour
        
        return {
            passed: !isRapid,
            warning: isRapid,
            message: isRapid ? 'High frequency of transactions detected' : 'Normal transaction frequency',
            details: { count: recentTransactions.length, timeframe: '1 hour' }
        };
    }

    checkBudgetAllocation(transactionData) {
        const budgets = db.select('budgets');
        const currentBudget = budgets.find(b => b.status === 'active');
        
        if (!currentBudget) {
            return { passed: false, message: 'No active budget found' };
        }
        
        const remainingBudget = currentBudget.total_amount - currentBudget.spent_amount;
        const exceedsBudget = transactionData.amount > remainingBudget;
        
        return {
            passed: !exceedsBudget,
            warning: transactionData.amount > (remainingBudget * 0.8), // Warning at 80%
            message: exceedsBudget ? 'Transaction exceeds remaining budget' : 'Within budget allocation',
            details: { remaining: remainingBudget, requested: transactionData.amount }
        };
    }

    checkSegregationOfDuties(transactionType, currentUser) {
        // Ensure user isn't approving their own transactions
        const canSelfApprove = currentUser.role === 'admin';
        
        return {
            passed: true, // This will be enforced in approval routing
            warning: !canSelfApprove,
            message: canSelfApprove ? 'Admin can self-approve' : 'Requires separate approver',
            details: { role: currentUser.role }
        };
    }

    checkDocumentationRequirements(transactionType, transactionData) {
        const requiresDocumentation = transactionData.amount > 5000;
        const hasDocumentation = transactionData.receipt_number || transactionData.reference_number;
        
        return {
            passed: !requiresDocumentation || hasDocumentation,
            warning: requiresDocumentation && !hasDocumentation,
            message: requiresDocumentation ? 
                (hasDocumentation ? 'Documentation provided' : 'Documentation required for amounts > ₱5,000') :
                'No documentation required',
            details: { required: requiresDocumentation, provided: hasDocumentation }
        };
    }

    determineApprovalRequirements(transactionType, transactionData) {
        const rules = this.approvalRules[transactionType];
        if (!rules) return { approvers: ['admin'] };
        
        let requirements = {
            approvers: [],
            dualApproval: false,
            requiresDocumentation: false,
            autoApprove: false
        };
        
        // Amount-based rules
        if (rules.amounts) {
            const amountRule = rules.amounts.find(rule => 
                transactionData.amount >= rule.min && transactionData.amount <= rule.max
            );
            if (amountRule) {
                requirements.approvers = amountRule.approvers || [];
                requirements.autoApprove = amountRule.autoApprove || false;
            }
        }
        
        // Category/source specific rules
        if (rules.categories && transactionData.category_name) {
            const categoryRule = rules.categories[transactionData.category_name];
            if (categoryRule) {
                requirements.dualApproval = categoryRule.dualApproval || false;
                requirements.requiresDocumentation = categoryRule.requiresQuotes || false;
                if (categoryRule.requiresAdmin) {
                    requirements.approvers = ['admin'];
                }
            }
        }
        
        return requirements;
    }

    handleValidationFailure(validationResult, transactionData) {
        // Handle validation failure and return appropriate response
        const failedChecks = validationResult.failedChecks || [];
        const warnings = validationResult.warnings || [];
        
        let errorMessage = 'Transaction validation failed:';
        
        // Add failed check messages
        if (failedChecks.length > 0) {
            errorMessage += '\n• ' + failedChecks.map(check => check.message).join('\n• ');
        }
        
        // Add warning messages
        if (warnings.length > 0) {
            errorMessage += '\nWarnings:\n• ' + warnings.map(warning => warning.message).join('\n• ');
        }
        
        // Log the validation failure
        console.log('Validation failed for transaction:', transactionData, validationResult);
        
        return {
            success: false,
            action: 'validation_failed',
            message: errorMessage,
            validationResult: validationResult,
            riskScore: validationResult.score || 0
        };
    }

    canAutoApprove(transactionType, transactionData, currentUser, requirements) {
        // Check if transaction meets auto-approval criteria
        if (!requirements.autoApprove) return false;
        
        // Additional checks for auto-approval
        const isLowRisk = transactionData.amount <= 5000;
        const isRoutineCategory = ['Utilities', 'Supplies'].includes(transactionData.category_name);
        const hasProperDocumentation = transactionData.receipt_number;
        
        return isLowRisk && isRoutineCategory && hasProperDocumentation;
    }

    autoApproveTransaction(transactionType, transactionData, currentUser) {
        // Auto-approve the transaction
        const approvalData = {
            ...transactionData,
            approval_status: 'approved',
            approved_by: 'system_auto',
            approved_at: new Date().toISOString(),
            approval_method: 'automated',
            approval_reason: 'Met auto-approval criteria'
        };
        
        // Log the auto-approval
        this.logWorkflowAction('auto_approval', transactionType, approvalData, currentUser);
        
        // Send notification
        this.sendNotification(currentUser, 'success', 
            `${transactionType} auto-approved: ₱${transactionData.amount.toLocaleString()}`);
        
        return {
            success: true,
            action: 'auto_approved',
            data: approvalData,
            message: 'Transaction automatically approved'
        };
    }

    routeForApproval(transactionType, transactionData, currentUser, requirements) {
        // Determine the approval chain
        const approvalChain = this.buildApprovalChain(requirements.approvers, currentUser);
        
        if (approvalChain.length === 0) {
            return {
                success: false,
                message: 'No eligible approvers found',
                action: 'approval_failed'
            };
        }
        
        // Create pending approval record
        const pendingApproval = {
            ...transactionData,
            approval_status: 'pending',
            approval_chain: approvalChain,
            current_approver: approvalChain[0],
            requires_dual_approval: requirements.dualApproval,
            submitted_by: currentUser.username,
            submitted_at: new Date().toISOString()
        };
        
        // Add to workflow queue
        this.workflowQueue.push({
            id: Utils.generateId(),
            type: transactionType,
            data: pendingApproval,
            status: 'pending_approval',
            created_at: new Date().toISOString()
        });
        
        // Send notifications to approvers
        this.notifyApprovers(approvalChain[0], transactionType, transactionData);
        
        // Log the workflow action
        this.logWorkflowAction('routed_for_approval', transactionType, pendingApproval, currentUser);
        
        return {
            success: true,
            action: 'routed_for_approval',
            data: pendingApproval,
            message: `Routed to ${approvalChain[0]} for approval`
        };
    }

    buildApprovalChain(requiredApprovers, currentUser) {
        // Remove current user from approval chain (segregation of duties)
        const eligibleApprovers = requiredApprovers.filter(role => role !== currentUser.role);
        
        // Get actual users with required roles
        const users = db.select('users');
        const approvers = eligibleApprovers.map(role => 
            users.find(user => user.role === role)
        ).filter(user => user); // Remove null values
        
        return approvers.map(user => user.username);
    }

    notifyApprovers(approverUsername, transactionType, transactionData) {
        const notification = {
            recipient: approverUsername,
            type: 'approval_required',
            title: 'Approval Required',
            message: `${transactionType} approval needed: ₱${transactionData.amount.toLocaleString()}`,
            data: transactionData,
            created_at: new Date().toISOString()
        };
        
        this.notificationQueue.push(notification);
        
        // Show real-time notification if user is currently logged in
        if (auth.getCurrentUser() && auth.getCurrentUser().username === approverUsername) {
            Utils.showNotification(notification.message, 'info');
        }
    }

    processApproval(transactionId, action, approverUser, comments = '') {
        const workflowItem = this.workflowQueue.find(item => 
            item.data.id === transactionId || 
            (item.data.receipt_number && item.data.receipt_number === transactionId)
        );
        
        if (!workflowItem) {
            return { success: false, message: 'Transaction not found in workflow queue' };
        }
        
        // Verify approver is authorized
        if (!workflowItem.data.approval_chain.includes(approverUser.username)) {
            return { success: false, message: 'User not authorized to approve this transaction' };
        }
        
        // Process the approval/rejection
        if (action === 'approve') {
            return this.approveTransaction(workflowItem, approverUser, comments);
        } else if (action === 'reject') {
            return this.rejectTransaction(workflowItem, approverUser, comments);
        }
        
        return { success: false, message: 'Invalid action' };
    }

    approveTransaction(workflowItem, approverUser, comments) {
        const approvalData = {
            ...workflowItem.data,
            approval_status: 'approved',
            approved_by: approverUser.username,
            approved_at: new Date().toISOString(),
            approval_comments: comments,
            approval_method: 'manual'
        };
        
        // Remove from workflow queue
        this.workflowQueue = this.workflowQueue.filter(item => item.id !== workflowItem.id);
        
        // Log the approval
        this.logWorkflowAction('approved', workflowItem.type, approvalData, approverUser);
        
        // Notify submitter
        this.sendNotification(
            { username: workflowItem.data.submitted_by }, 
            'success', 
            `Your ${workflowItem.type} has been approved by ${approverUser.username}`
        );
        
        return {
            success: true,
            action: 'approved',
            data: approvalData,
            message: 'Transaction approved successfully'
        };
    }

    rejectTransaction(workflowItem, approverUser, comments) {
        const rejectionData = {
            ...workflowItem.data,
            approval_status: 'rejected',
            rejected_by: approverUser.username,
            rejected_at: new Date().toISOString(),
            rejection_reason: comments,
            rejection_method: 'manual'
        };
        
        // Remove from workflow queue
        this.workflowQueue = this.workflowQueue.filter(item => item.id !== workflowItem.id);
        
        // Log the rejection
        this.logWorkflowAction('rejected', workflowItem.type, rejectionData, approverUser);
        
        // Notify submitter
        this.sendNotification(
            { username: workflowItem.data.submitted_by }, 
            'error', 
            `Your ${workflowItem.type} has been rejected by ${approverUser.username}: ${comments}`
        );
        
        return {
            success: true,
            action: 'rejected',
            data: rejectionData,
            message: 'Transaction rejected'
        };
    }

    // Utility functions
    getRecentTransactions(hours) {
        const cutoff = new Date(Date.now() - (hours * 3600000));
        const allTransactions = [
            ...db.select('expenses'),
            ...db.select('revenue_transactions')
        ];
        return allTransactions.filter(t => new Date(t.created_at) > cutoff);
    }

    getUserRecentTransactions(username, hours) {
        const cutoff = new Date(Date.now() - (hours * 3600000));
        const allTransactions = [
            ...db.select('expenses'),
            ...db.select('revenue_transactions')
        ];
        return allTransactions.filter(t => 
            t.created_by === username && new Date(t.created_at) > cutoff
        );
    }

    getHistoricalData(transactionType) {
        const table = transactionType === 'expenses' ? 'expenses' : 'revenue_transactions';
        return db.select(table).slice(-50); // Last 50 transactions
    }

    calculateRiskScore(checks) {
        const failedChecks = checks.filter(check => !check.passed).length;
        const warnings = checks.filter(check => check.warning).length;
        return Math.min(100, (failedChecks * 30) + (warnings * 10));
    }

    logWorkflowAction(action, transactionType, data, user) {
        const logEntry = {
            action: action,
            transaction_type: transactionType,
            transaction_id: data.id,
            user_id: user.id,
            username: user.username,
            timestamp: new Date().toISOString(),
            details: JSON.stringify(data)
        };
        
        // Store in audit log (simplified for demo)
        console.log('Workflow Log:', logEntry);
    }

    sendNotification(user, type, message) {
        if (auth.getCurrentUser() && auth.getCurrentUser().username === user.username) {
            Utils.showNotification(message, type);
        }
    }

    // Get pending approvals for current user
    getPendingApprovals(username) {
        return this.workflowQueue.filter(item => 
            item.data.approval_chain.includes(username) && 
            item.status === 'pending_approval'
        );
    }

    // Get workflow statistics
    getWorkflowStats() {
        const total = this.workflowQueue.length;
        const pending = this.workflowQueue.filter(item => item.status === 'pending_approval').length;
        const autoApproved = this.getRecentTransactions(24).filter(t => t.approved_by === 'system_auto').length;
        
        return {
            totalInQueue: total,
            pendingApproval: pending,
            autoApprovedToday: autoApproved,
            averageProcessingTime: '2.3 hours' // Simulated
        };
    }
}

// Initialize workflow manager
const workflowManager = new WorkflowManager();