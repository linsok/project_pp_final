// Notification Settings JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Notification settings page loaded');
    
    // Get DOM elements
    const notificationEmail = document.getElementById('notificationEmail');
    const emailNotifications = document.getElementById('emailNotifications');
    const bookingAlerts = document.getElementById('bookingAlerts');
    const systemAlerts = document.getElementById('systemAlerts');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const testEmailBtn = document.getElementById('testEmailBtn');
    const statusMessage = document.getElementById('statusMessage');

    console.log('DOM elements found:');
    console.log('- notificationEmail:', notificationEmail);
    console.log('- emailNotifications:', emailNotifications);
    console.log('- bookingAlerts:', bookingAlerts);
    console.log('- systemAlerts:', systemAlerts);
    console.log('- saveSettingsBtn:', saveSettingsBtn);
    console.log('- testEmailBtn:', testEmailBtn);
    console.log('- statusMessage:', statusMessage);

    // Check if all required elements are found
    if (!testEmailBtn) {
        console.error('Test email button not found!');
        alert('Test email button not found. Please check the page.');
        return;
    }

    if (!statusMessage) {
        console.error('Status message element not found!');
        alert('Status message element not found. Please check the page.');
        return;
    }

    // Load notification settings on page load
    loadNotificationSettings();

    // Event listeners
    saveSettingsBtn.addEventListener('click', saveNotificationSettings);
    testEmailBtn.addEventListener('click', sendTestEmail);
    
    console.log('Event listeners attached');

    // Load notification settings from API
    async function loadNotificationSettings() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                showStatus('Please log in to access notification settings', 'error');
                return;
            }

            const response = await fetch('http://localhost:8000/api/notifications/settings/', {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Populate form fields
                notificationEmail.value = data.notification_email || '';
                emailNotifications.checked = data.email_notifications || false;
                bookingAlerts.checked = data.booking_alerts || false;
                systemAlerts.checked = data.system_alerts || false;
                
                console.log('Notification settings loaded:', data);
            } else {
                console.error('Failed to load notification settings');
                showStatus('Failed to load notification settings', 'error');
            }
        } catch (error) {
            console.error('Error loading notification settings:', error);
            showStatus('Error loading notification settings', 'error');
        }
    }

    // Save notification settings
    async function saveNotificationSettings() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                showStatus('Please log in to save notification settings', 'error');
                return;
            }

            // Validate email if email notifications are enabled
            if (emailNotifications.checked && !notificationEmail.value) {
                showStatus('Please enter an email address for notifications', 'error');
                return;
            }

            const settingsData = {
                notification_email: notificationEmail.value,
                email_notifications: emailNotifications.checked,
                booking_alerts: bookingAlerts.checked,
                system_alerts: systemAlerts.checked
            };

            const response = await fetch('http://localhost:8000/api/notifications/settings/update/', {
                method: 'PUT',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settingsData)
            });

            if (response.ok) {
                const data = await response.json();
                showStatus('Notification settings saved successfully!', 'success');
                console.log('Settings saved:', data);
            } else {
                const errorData = await response.json();
                console.error('Failed to save settings:', errorData);
                showStatus('Failed to save notification settings', 'error');
            }
        } catch (error) {
            console.error('Error saving notification settings:', error);
            showStatus('Error saving notification settings', 'error');
        }
    }

    // Send test email
    async function sendTestEmail() {
        console.log('sendTestEmail function called');
        try {
            const token = localStorage.getItem('authToken');
            console.log('Auth token:', token ? token.substring(0, 20) + '...' : 'No token found');
            
            if (!token) {
                console.log('No auth token found');
                showStatus('Please log in to send test email', 'error');
                return;
            }

            // Check if email notifications are enabled
            console.log('Email notifications enabled:', emailNotifications.checked);
            if (!emailNotifications.checked) {
                console.log('Email notifications are disabled');
                showStatus('Please enable email notifications first', 'error');
                return;
            }

            // Check if email address is provided
            console.log('Notification email:', notificationEmail.value);
            if (!notificationEmail.value) {
                console.log('No email address provided');
                showStatus('Please enter an email address for notifications', 'error');
                return;
            }

            // Disable button and show loading
            console.log('Disabling button and showing loading state');
            testEmailBtn.disabled = true;
            testEmailBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            showStatus('Sending test email...', 'info');

            console.log('Making API request to send test email');
            const response = await fetch('http://localhost:8000/api/notifications/test-email/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('Test email sent successfully:', data);
                showStatus('Test email sent successfully! Check your inbox.', 'success');
            } else {
                const errorData = await response.json();
                console.error('Failed to send test email:', errorData);
                showStatus(errorData.error || 'Failed to send test email', 'error');
            }
        } catch (error) {
            console.error('Error sending test email:', error);
            showStatus('Error sending test email: ' + error.message, 'error');
        } finally {
            // Re-enable button
            console.log('Re-enabling button');
            testEmailBtn.disabled = false;
            testEmailBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Test Email';
        }
    }

    // Show status message
    function showStatus(message, type = 'info') {
        console.log('showStatus called:', message, type);
        console.log('statusMessage element:', statusMessage);
        
        if (!statusMessage) {
            console.error('statusMessage element not found!');
            alert(`Status: ${message}`); // Fallback to alert
            return;
        }
        
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.style.display = 'block';
        
        console.log('Status message set:', statusMessage.textContent);
        console.log('Status message display:', statusMessage.style.display);

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 5000);
        }

        // Auto-hide info messages after 3 seconds
        if (type === 'info') {
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 3000);
        }
    }

    // Toggle email input based on email notifications setting
    emailNotifications.addEventListener('change', function() {
        notificationEmail.disabled = !this.checked;
        if (!this.checked) {
            notificationEmail.value = '';
        }
    });

    // Initialize email input state
    notificationEmail.disabled = !emailNotifications.checked;
}); 