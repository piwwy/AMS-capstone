// Modal Management
class ModalManager {
    constructor() {
        this.overlay = document.getElementById('modalOverlay');
        this.content = document.getElementById('modalContent');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close modal when clicking overlay
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.closeModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    openModal(content, size = '') {
        this.content.innerHTML = content;
        
        // Apply size class
        this.content.className = `modal-content ${size}`;
        
        // Show modal
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        setTimeout(() => {
            const firstInput = this.content.querySelector('input, select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }

    closeModal() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Clear content after animation
        setTimeout(() => {
            this.content.innerHTML = '';
        }, 300);
    }

    showConfirmation(title, message, onConfirm, type = 'warning') {
        const iconClass = type === 'danger' ? 'fa-exclamation-triangle' : 
                         type === 'success' ? 'fa-check-circle' : 'fa-question-circle';
        
        const content = `
            <div class="modal-body confirmation-modal">
                <div class="confirmation-icon ${type}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="btn-group">
                    <button type="button" class="btn btn-secondary" onclick="modalManager.closeModal()">Cancel</button>
                    <button type="button" class="btn btn-${type === 'danger' ? 'danger' : 'primary'}" onclick="modalManager.confirmAction()">${type === 'danger' ? 'Delete' : 'Confirm'}</button>
                </div>
            </div>
        `;
        
        this.pendingConfirmAction = onConfirm;
        this.openModal(content, 'modal-sm');
    }

    confirmAction() {
        if (this.pendingConfirmAction) {
            this.pendingConfirmAction();
            this.pendingConfirmAction = null;
        }
        this.closeModal();
    }

    showLoading(message = 'Loading...') {
        const content = `
            <div class="modal-loading">
                <div class="spinner"></div>
                <p style="margin-top: 16px; color: #6b7280;">${message}</p>
            </div>
        `;
        
        this.openModal(content, 'modal-sm');
    }

    showSuccess(title, message, callback = null) {
        const content = `
            <div class="modal-body confirmation-modal">
                <div class="confirmation-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <button type="button" class="btn btn-primary" onclick="modalManager.closeModal(); ${callback ? callback + '()' : ''}"">OK</button>
            </div>
        `;
        
        this.openModal(content, 'modal-sm');
    }

    showError(title, message) {
        const content = `
            <div class="modal-body confirmation-modal">
                <div class="confirmation-icon danger">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <button type="button" class="btn btn-danger" onclick="modalManager.closeModal()">OK</button>
            </div>
        `;
        
        this.openModal(content, 'modal-sm');
    }
}

// Initialize modal manager
const modalManager = new ModalManager();

// Global modal functions for backward compatibility
function openModal(content, size = '') {
    modalManager.openModal(content, size);
}

function closeModal() {
    modalManager.closeModal();
}