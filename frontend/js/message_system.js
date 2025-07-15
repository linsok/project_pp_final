// Universal Message System
// This replaces all alert() calls with custom styled messages

window.MessageSystem = {
    messageCount: 0,
    
    // Show a simple message
    show: function(message, type = 'info', duration = 3000) {
        const messageEl = this.createMessage(message, type);
        document.body.appendChild(messageEl);
        
        // Position multiple messages
        const topOffset = 20 + (this.messageCount * 80);
        messageEl.style.top = topOffset + 'px';
        this.messageCount++;
        
        // Show with animation
        setTimeout(() => messageEl.classList.add('show'), 10);
        
        // Auto hide after duration
        setTimeout(() => {
            this.hide(messageEl);
        }, duration);
        
        return messageEl;
    },
    
    // Show success message
    success: function(message, duration = 3000) {
        return this.show(message, 'success', duration);
    },
    
    // Show error message
    error: function(message, duration = 4000) {
        return this.show(message, 'error', duration);
    },
    
    // Show warning message
    warning: function(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    },
    
    // Show info message
    info: function(message, duration = 3000) {
        return this.show(message, 'info', duration);
    },
    
    // Create message element
    createMessage: function(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `message-toast message-${type}`;
        
        const icon = this.getIcon(type);
        
        messageEl.innerHTML = `
            <div class="message-content">
                <i class="fas ${icon}"></i>
                <span class="message-text">${message}</span>
                <button class="message-close" onclick="MessageSystem.hide(this.parentElement.parentElement)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        return messageEl;
    },
    
    // Get icon for message type
    getIcon: function(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    },
    
    // Hide message
    hide: function(messageEl) {
        if (messageEl && messageEl.parentNode) {
            messageEl.classList.add('hiding');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                    this.messageCount = Math.max(0, this.messageCount - 1);
                    this.repositionMessages();
                }
            }, 300);
        }
    },
    
    // Reposition remaining messages
    repositionMessages: function() {
        const messages = document.querySelectorAll('.message-toast:not(.hiding)');
        messages.forEach((msg, index) => {
            msg.style.top = (20 + (index * 80)) + 'px';
        });
    },
    
    // Show confirmation dialog
    confirm: function(message, onConfirm, onCancel) {
        const modal = this.createConfirmModal(message, onConfirm, onCancel);
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        return modal;
    },
    
    // Create confirmation modal
    createConfirmModal: function(message, onConfirm, onCancel) {
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.innerHTML = `
            <div class="confirm-modal-content">
                <div class="confirm-modal-header">
                    <h3>Confirm Action</h3>
                </div>
                <div class="confirm-modal-body">
                    <p>${message}</p>
                </div>
                <div class="confirm-modal-actions">
                    <button class="confirm-modal-btn confirm-cancel-btn">Cancel</button>
                    <button class="confirm-modal-btn confirm-confirm-btn">Confirm</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const cancelBtn = modal.querySelector('.confirm-cancel-btn');
        const confirmBtn = modal.querySelector('.confirm-confirm-btn');
        
        cancelBtn.addEventListener('click', () => {
            this.hideConfirmModal(modal);
            if (onCancel) onCancel();
        });
        
        confirmBtn.addEventListener('click', () => {
            this.hideConfirmModal(modal);
            if (onConfirm) onConfirm();
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideConfirmModal(modal);
                if (onCancel) onCancel();
            }
        });
        
        return modal;
    },
    
    // Hide confirmation modal
    hideConfirmModal: function(modal) {
        if (modal && modal.parentNode) {
            modal.style.display = 'none';
            modal.parentNode.removeChild(modal);
        }
    }
};

// Shorthand functions for convenience
window.showMessage = (message, type, duration) => MessageSystem.show(message, type, duration);
window.showSuccess = (message, duration) => MessageSystem.success(message, duration);
window.showError = (message, duration) => MessageSystem.error(message, duration);
window.showWarning = (message, duration) => MessageSystem.warning(message, duration);
window.showInfo = (message, duration) => MessageSystem.info(message, duration);
window.showConfirm = (message, onConfirm, onCancel) => MessageSystem.confirm(message, onConfirm, onCancel);
