// Toggle dropdown menu
document.addEventListener("DOMContentLoaded", function() {
    // Back to settings page functionality
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', function() {
            // Navigate directly to setting.html regardless of history
            window.location.href = 'setting.html';
        });
    }

    // Form functionality
    const reportForm = document.getElementById("reportForm");
    const submitBtn = document.querySelector(".form-button");
    const reportTextarea = document.getElementById("reportDescription");
    const charCounter = document.getElementById("charCounter");
    const statusMessage = document.getElementById("statusMessage");
    const statusText = document.getElementById("statusText");

    // Character counter functionality
    reportTextarea.addEventListener('input', function() {
        const currentLength = reportTextarea.value.length;
        const maxLength = 1000;
        
        charCounter.textContent = currentLength;
        
        // Change color based on character count
        if (currentLength > maxLength * 0.9) {
            charCounter.style.color = '#dc3545'; // Red when near limit
        } else if (currentLength > maxLength * 0.7) {
            charCounter.style.color = '#ffc107'; // Yellow when getting close
        } else {
            charCounter.style.color = '#666'; // Default gray
        }
    });

    // Function to show status messages
    function showStatusMessage(message, type = 'info') {
        statusMessage.style.display = 'block';
        statusText.textContent = message;
        
        // Reset classes and content
        statusMessage.className = 'status-message';
        statusMessage.innerHTML = `<div id="statusText">${message}</div>`;
        
        // Add appropriate styling based on message type
        switch(type) {
            case 'success':
                statusMessage.classList.add('status-success');
                break;
            case 'error':
                statusMessage.classList.add('status-error');
                break;
            case 'warning':
                statusMessage.classList.add('status-warning');
                break;
            default:
                statusMessage.classList.add('status-info');
        }
        
        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 5000);
        }
    }

    // Handle form submission
    reportForm.addEventListener("submit", function (e) {
        e.preventDefault(); // Prevent default form submission
        
        const reportText = reportTextarea.value.trim();

        if (reportText === "") {
            showStatusMessage("Please describe the problem before submitting.", 'warning');
            reportTextarea.focus();
            return;
        }

        if (reportText.length < 10) {
            showStatusMessage("Please provide a more detailed description (at least 10 characters).", 'warning');
            reportTextarea.focus();
            return;
        }

        // Show professional confirmation message
        showConfirmationDialog(reportText);
    });

    function showConfirmationDialog(reportText) {
        // Create confirmation dialog
        const confirmationHtml = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <i class="fas fa-question-circle" style="font-size: 20px; margin-right: 8px;"></i>
                    <strong>Confirm Submission</strong>
                </div>
                <p style="margin: 0 0 16px 0;">Are you sure you want to submit this problem report?</p>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="cancelSubmit" class="confirmation-btn cancel-btn">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button id="confirmSubmit" class="confirmation-btn confirm-btn">
                        <i class="fas fa-check"></i> Submit Report
                    </button>
                </div>
            </div>
        `;
        
        statusMessage.innerHTML = confirmationHtml;
        statusMessage.style.display = 'block';
        
        // Add event listeners for confirmation buttons
        document.getElementById('cancelSubmit').addEventListener('click', function() {
            statusMessage.style.display = 'none';
            showStatusMessage("Submission cancelled. You can review or edit your report.", 'info');
        });
        
        document.getElementById('confirmSubmit').addEventListener('click', function() {
            statusMessage.style.display = 'none';
            submitProblemReport(reportText);
        });
    }

    async function submitProblemReport(description) {
        try {
            // Get the auth token from localStorage or sessionStorage
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            
            console.log('Token found:', !!token);
            console.log('Token value:', token ? token.substring(0, 10) + '...' : 'null');
            console.log('Submitting to URL:', 'http://localhost:8000/api/reports/');
            console.log('Description:', description);
            
            if (!token) {
                showStatusMessage("Please login first to submit a problem report. Redirecting to login page...", 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }

            // Test authentication first
            console.log('Testing authentication...');
            const authTest = await fetch('http://localhost:8000/auth/user/', {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });
            
            if (!authTest.ok) {
                console.log('Authentication test failed:', authTest.status);
                showStatusMessage("Authentication failed. Please login again. Redirecting to login page...", 'error');
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('authToken');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }
            
            const authData = await authTest.json();
            console.log('Authenticated user:', authData);

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>Submitting...';
            showStatusMessage("Submitting your report...", 'info');

            const requestData = {
                description: description
            };
            
            console.log('Request data:', requestData);

            const response = await fetch('http://localhost:8000/api/reports/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(requestData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                // Show professional success message
                const successHtml = `
                    <div style="background: #d1fae5; border: 1px solid #a7f3d0; color: #065f46; padding: 16px; border-radius: 8px;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <i class="fas fa-check-circle" style="font-size: 20px; margin-right: 8px; color: #10b981;"></i>
                            <strong>Report Submitted Successfully</strong>
                        </div>
                        <p style="margin: 0;">Thank you for your feedback! Your problem report has been received and will be reviewed by our support team.</p>
                    </div>
                `;
                statusMessage.innerHTML = successHtml;
                statusMessage.style.display = 'block';
                
                reportTextarea.value = ""; // Clear after successful submission
                charCounter.textContent = "0"; // Reset character counter
                
                // Auto-hide after 7 seconds
                setTimeout(() => {
                    statusMessage.style.display = 'none';
                }, 7000);
                
                console.log('Report submitted:', data);
            } else {
                console.error('Error response:', data);
                
                // Handle different error types
                if (response.status === 401) {
                    showStatusMessage("Authentication failed. Please login again.", 'error');
                    localStorage.removeItem('authToken');
                    sessionStorage.removeItem('authToken');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                } else if (response.status === 400) {
                    // Handle validation errors
                    let errorMessage = "Error submitting report:\n";
                    if (data.description) {
                        errorMessage += `Description: ${data.description.join(', ')}\n`;
                    }
                    if (data.non_field_errors) {
                        errorMessage += `${data.non_field_errors.join(', ')}\n`;
                    }
                    showStatusMessage(errorMessage, 'error');
                } else {
                    showStatusMessage(`Error submitting report: ${data.message || 'Unknown error'}`, 'error');
                }
            }
        } catch (error) {
            console.error('Detailed error:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                showStatusMessage("Unable to connect to server. Please check if the server is running and try again.", 'error');
            } else if (error.name === 'TypeError' && error.message.includes('JSON')) {
                showStatusMessage("Server response error. Please try again.", 'error');
            } else {
                showStatusMessage(`Network error: ${error.message}. Please check your connection and try again.`, 'error');
            }
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i>Submit Report';
        }
    }

    function getCsrfToken() {
        // Get CSRF token from cookie if available
        const csrfCookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        return csrfCookie ? csrfCookie.split('=')[1] : '';
    }
});
