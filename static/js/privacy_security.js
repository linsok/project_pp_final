// Global user data
let userData = {};
let profileData = {};
let resetToken = null; // For password reset flow

document.addEventListener('DOMContentLoaded', function() {
    // Ensure message system is loaded
    if (window.MessageSystem) {
        console.log('MessageSystem is available');
    } else {
        console.warn('MessageSystem not detected - fallback will be used');
    }
    
    // Check for authentication token
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    // Function to make fields editable
    function makeEditable(valueElement, inputElement, saveButton, cancelButton, fieldName) {
        valueElement.parentElement.addEventListener('click', function(e) {
            // Close any other open edit forms first
            closeAllEditForms(fieldName);
            
            // Hide the value and show the input field with animation
            valueElement.style.display = 'none';
            inputElement.parentElement.style.display = 'flex';
            
            // Pre-fill with current value (except password)
            if (fieldName !== 'password') {
                inputElement.value = valueElement.textContent;
                
                // For email, phone, and username changes, show a password input field
                if (fieldName === 'email') {
                    showPasswordVerificationField(inputElement.parentElement, 'email');
                } else if (fieldName === 'phone') {
                    showPasswordVerificationField(inputElement.parentElement, 'phone');
                } else if (fieldName === 'username') {
                    showPasswordVerificationField(inputElement.parentElement, 'username');
                }
            } else {
                // Always clear password fields
                inputElement.value = '';  // New password field
                document.getElementById('currentPasswordInput').value = '';
                document.getElementById('confirmPasswordInput').value = '';
            }
            
            inputElement.focus();
        });

        saveButton.addEventListener('click', function() {
            if (fieldName === 'password') {
                // Special handling for password change
                const currentPassword = document.getElementById('currentPasswordInput').value.trim();
                const newPassword = inputElement.value.trim();
                const confirmPassword = document.getElementById('confirmPasswordInput').value.trim();
                
                if (!currentPassword || !newPassword || !confirmPassword) {
                    showStatus('error', 'Please fill in all password fields');
                    return;
                }
                
                if (newPassword.length < 8) {
                    showStatus('error', 'New password must be at least 8 characters long');
                    return;
                }
                
                if (newPassword !== confirmPassword) {
                    showStatus('error', 'New passwords do not match');
                    return;
                }
                
                // Save password change
                savePasswordChange(currentPassword, newPassword, confirmPassword);
            } else {
                // Regular field validation
                if (inputElement.value.trim() === '') {
                    showStatus('error', 'Please enter a value');
                    return;
                }
                
                // Save changes to the server
                saveUserField(fieldName, inputElement.value.trim());
            }
        });

        // Cancel button functionality
        cancelButton.addEventListener('click', function() {
            hideEditField(valueElement, inputElement);
        });

        // Also save when pressing Enter
        inputElement.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveButton.click();
            } else if (e.key === 'Escape') {
                cancelButton.click();
            }
        });
    }

    // Function to show password verification field for email, phone, and username changes
    function showPasswordVerificationField(parentElement, fieldType) {
        let verificationId, verificationClass;
        
        if (fieldType === 'email') {
            verificationId = 'emailVerificationPassword';
            verificationClass = 'email-verification-password';
        } else if (fieldType === 'phone') {
            verificationId = 'phoneVerificationPassword';
            verificationClass = 'phone-verification-password';
        } else if (fieldType === 'username') {
            verificationId = 'usernameVerificationPassword';
            verificationClass = 'username-verification-password';
        }
        
        // Check if verification field already exists
        if (parentElement.querySelector('.' + verificationClass)) {
            return;
        }
        
        // Create password verification container
        const verificationDiv = document.createElement('div');
        verificationDiv.className = fieldType + '-verification-container';
        verificationDiv.innerHTML = `
            <label for="${verificationId}">Current Password <span class="verification-note">(required to change ${fieldType})</span></label>
            <input type="password" id="${verificationId}" class="${verificationClass}" placeholder="Enter your current password" required>
            <small class="verification-tip">For security, we need to verify your identity</small>
        `;
        
        // Insert before the button group
        const buttonGroup = parentElement.querySelector('.button-group');
        parentElement.insertBefore(verificationDiv, buttonGroup);
    }
    
    // Enhanced function to save user field updates with password verification for email
    function saveUserField(fieldName, value) {
        const token = localStorage.getItem('authToken');
        let endpoint, data;
        
        if (fieldName === 'password') {
            // Password changes are handled by savePasswordChange function
            return;
        } else if (fieldName === 'email') {
            // Email requires password verification
            const verificationPassword = document.getElementById('emailVerificationPassword');
            if (!verificationPassword || !verificationPassword.value.trim()) {
                showStatus('error', 'Please enter your current password to change email');
                return;
            }
            
            // Email change endpoint
            endpoint = 'http://localhost:8000/api/change-email/';
            data = {
                email: value,
                password: verificationPassword.value.trim()
            };
        } else if (fieldName === 'username') {
            // Username requires password verification
            const verificationPassword = document.getElementById('usernameVerificationPassword');
            if (!verificationPassword || !verificationPassword.value.trim()) {
                showStatus('error', 'Please enter your current password to change username');
                return;
            }
            
            // Username change endpoint
            endpoint = 'http://localhost:8000/api/change-username/';
            data = {
                username: value,
                password: verificationPassword.value.trim()
            };
        } else if (fieldName === 'phone') {
            // Phone requires password verification
            const verificationPassword = document.getElementById('phoneVerificationPassword');
            if (!verificationPassword || !verificationPassword.value.trim()) {
                showStatus('error', 'Please enter your current password to change phone number');
                return;
            }
            
            // Phone change endpoint
            endpoint = 'http://localhost:8000/api/change-phone/';
            data = {
                phone: value,
                password: verificationPassword.value.trim()
            };
        }
        
        // Send update to server
        const requestMethod = (fieldName === 'email' || fieldName === 'phone' || fieldName === 'username') ? 'POST' : 'PUT';
        fetch(endpoint, {
            method: requestMethod,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + token
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                // Handle specific error cases
                if (response.status === 400) {
                    return response.json().then(data => {
                        throw new Error(data.error || 'Invalid request');
                    });
                }
                throw new Error('Server returned ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Update successful
            if (fieldName === 'password') {
                showStatus('success', 'Password updated successfully');
                document.getElementById('passwordValue').textContent = '•••••••';
            } else {
                showStatus('success', fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' updated successfully');
                // Update the displayed value
                if (fieldName === 'email') {
                    document.getElementById('emailValue').textContent = value;
                } else if (fieldName === 'username') {
                    document.getElementById('nameValue').textContent = value;
                } else if (fieldName === 'phone') {
                    document.getElementById('phoneValue').textContent = value;
                }
            }
            
            // Hide edit field
            let valueElement, inputElement;
            if (fieldName === 'username') {
                // Special case: username uses 'name' prefix in HTML
                valueElement = document.getElementById('nameValue');
                inputElement = document.getElementById('nameInput');
            } else {
                valueElement = document.getElementById(fieldName + 'Value');
                inputElement = document.getElementById(fieldName + 'Input');
            }
            
            // Check if elements exist before calling hideEditField
            if (valueElement && inputElement) {
                hideEditField(valueElement, inputElement);
            } else {
                console.error('Could not find elements for field:', fieldName);
            }
            
            // Remove password verification field for email, phone, and username changes
            if (fieldName === 'email' || fieldName === 'phone' || fieldName === 'username') {
                const verificationContainer = inputElement.parentElement.querySelector('.' + fieldName + '-verification-container');
                if (verificationContainer) {
                    verificationContainer.remove();
                }
            }
            
            // Update cached user data
            if (fieldName === 'email' || fieldName === 'username') {
                userData[fieldName] = value;
            }
            // Update cached profile data for phone
            if (fieldName === 'phone') {
                profileData[fieldName] = value;
            }
        })
        .catch(error => {
            console.error('Error updating ' + fieldName + ':', error);
            showStatus('error', error.message || 'Failed to update ' + fieldName);
        });
    }
    
    // Special function to handle password changes
    function savePasswordChange(currentPassword, newPassword, confirmPassword) {
        const token = localStorage.getItem('authToken');
        
        const data = {
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword
        };
        
        fetch('http://localhost:8000/api/change-password/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + token
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to change password');
                });
            }
            return response.json();
        })
        .then(data => {
            showStatus('success', 'Password updated successfully');
            
            // Hide edit fields and clear password inputs
            const valueElement = document.getElementById('passwordValue');
            const inputElement = document.getElementById('passwordInput');
            hideEditField(valueElement, inputElement);
            
            // Clear all password fields
            document.getElementById('currentPasswordInput').value = '';
            document.getElementById('passwordInput').value = '';
            document.getElementById('confirmPasswordInput').value = '';
        })
        .catch(error => {
            console.error('Error updating password:', error);
            showStatus('error', error.message || 'Failed to update password');
        });
    }
    
    // Function to hide edit field and show value
    function hideEditField(valueElement, inputElement) {
        // Check if elements exist
        if (!valueElement || !inputElement) {
            console.error('hideEditField: Missing elements', valueElement, inputElement);
            return;
        }
        
        // Add a transition effect
        inputElement.parentElement.style.opacity = '0';
        
        setTimeout(() => {
            valueElement.style.display = 'inline-block';
            inputElement.parentElement.style.display = 'none';
            inputElement.parentElement.style.opacity = '1';
            
            // Clean up verification fields if present
            const emailVerificationContainer = inputElement.parentElement.querySelector('.email-verification-container');
            const phoneVerificationContainer = inputElement.parentElement.querySelector('.phone-verification-container');
            const usernameVerificationContainer = inputElement.parentElement.querySelector('.username-verification-container');
            
            if (emailVerificationContainer) {
                emailVerificationContainer.remove();
            }
            if (phoneVerificationContainer) {
                phoneVerificationContainer.remove();
            }
            if (usernameVerificationContainer) {
                usernameVerificationContainer.remove();
            }
            
            // Clear password fields if this is password editing
            if (inputElement.id === 'passwordInput') {
                document.getElementById('currentPasswordInput').value = '';
                document.getElementById('passwordInput').value = '';
                document.getElementById('confirmPasswordInput').value = '';
            }
        }, 150); // Short delay for transition effect
    }
    
    // Function to show status messages
    function showStatus(type, message) {
        // Create status message if it doesn't exist
        let statusMessage = document.querySelector('.status-message');
        if (!statusMessage) {
            statusMessage = document.createElement('div');
            statusMessage.className = 'status-message';
            document.getElementById('privacySecuritySection').appendChild(statusMessage);
        }
        
        // Set message type and content
        statusMessage.className = 'status-message status-' + type;
        statusMessage.textContent = message;
        statusMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }

    // Fetch user data and populate fields
    Promise.all([
        fetch("http://localhost:8000/auth/user/", {
            method: "GET",
            headers: { "Authorization": "Token " + token }
        }),
        fetch('http://localhost:8000/api/profile/', {
            headers: { 'Authorization': 'Token ' + token }
        })
    ])
    .then(responses => {
        if (!responses[0].ok || !responses[1].ok) {
            throw new Error("Failed to fetch user data");
        }
        return Promise.all([responses[0].json(), responses[1].json()]);
    })
    .then(([user, profile]) => {
        console.log('User data:', user);
        console.log('Profile data:', profile);
        
        // Store data globally
        userData = user;
        profileData = profile;
        
        // Populate fields
        document.getElementById('emailValue').textContent = user.email || 'Not set';
        document.getElementById('nameValue').textContent = user.username || 'Not set';
        document.getElementById('phoneValue').textContent = profile.phone || 'Not set';
        
        // Initialize editable fields
        makeEditable(
            document.getElementById('emailValue'),
            document.getElementById('emailInput'),
            document.getElementById('saveEmail'),
            document.getElementById('cancelEmail'),
            'email'
        );

        makeEditable(
            document.getElementById('phoneValue'),
            document.getElementById('phoneInput'),
            document.getElementById('savePhone'),
            document.getElementById('cancelPhone'),
            'phone'
        );

        makeEditable(
            document.getElementById('passwordValue'),
            document.getElementById('passwordInput'),
            document.getElementById('savePassword'),
            document.getElementById('cancelPassword'),
            'password'
        );

        makeEditable(
            document.getElementById('nameValue'),
            document.getElementById('nameInput'),
            document.getElementById('saveName'),
            document.getElementById('cancelName'),
            'username'
        );
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
        // Redirect to login on authentication failure
        localStorage.removeItem('authToken');
        window.location.href = "index.html";
    });

    // Setup forgot password field (similar to other fields but different functionality)
    const forgotPasswordValue = document.getElementById('forgotPasswordValue');
    const forgotPasswordInput = document.getElementById('forgotPasswordInput');
    const saveForgotPassword = document.getElementById('saveForgotPassword');
    const cancelForgotPassword = document.getElementById('cancelForgotPassword');

    if (forgotPasswordValue && forgotPasswordInput && saveForgotPassword && cancelForgotPassword) {
        setupForgotPasswordFlow(forgotPasswordValue);
        
        // Add an ESC key handler for all form fields to cancel editing
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeAllEditForms();
            }
        });
    }
});

// Close all other edit forms except the current one
function closeAllEditForms(exceptFieldName) {
    // Fields to check
    const fields = ['email', 'phone', 'password', 'username', 'forgotPassword'];
    
    fields.forEach(field => {
        if (field !== exceptFieldName) {
            let valueElement, inputElement;
            
            // Handle the special case for username
            if (field === 'username') {
                valueElement = document.getElementById('nameValue');
                inputElement = document.getElementById('nameInput');
            } else {
                valueElement = document.getElementById(field + 'Value');
                inputElement = document.getElementById(field + 'Input');
            }
            
            // Check if elements exist before calling hideEditField
            if (valueElement && inputElement && 
                inputElement.parentElement.style.display === 'flex') {
                hideEditField(valueElement, inputElement);
            }
        }
    });
    
    // Also hide forgot password steps
    if (exceptFieldName !== 'forgotPassword') {
        resetPasswordFlow();
    }
}

// Setup the full forgot password flow with all three steps
function setupForgotPasswordFlow(valueElement) {
    // Get elements for all three steps
    const step1 = document.getElementById('forgotPasswordStep1');
    const step2 = document.getElementById('forgotPasswordStep2');
    const step3 = document.getElementById('forgotPasswordStep3');
    
    const emailInput = document.getElementById('forgotPasswordInput');
    const resetCodeInput = document.getElementById('resetCodeInput');
    const newPasswordInput = document.getElementById('newPasswordInput');
    const confirmNewPasswordInput = document.getElementById('confirmNewPasswordInput');
    
    // Step 1: Email input and send reset code
    valueElement.parentElement.addEventListener('click', function() {
        // Close any other open edit forms first
        closeAllEditForms('forgotPassword');
        
        // Hide the value and show the step 1 input with animation
        valueElement.style.display = 'none';
        step1.style.display = 'flex';
        
        // Pre-fill with user's current email if available
        if (userData.email) {
            emailInput.value = userData.email;
        }
        
        emailInput.focus();
    });

    // Handle "Send Reset Code" button click
    document.getElementById('saveForgotPassword').addEventListener('click', async function() {
        const email = emailInput.value.trim();
        
        if (!email) {
            showMessage('Please enter your email address', 'error');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }

        try {
            // Show loading state
            document.getElementById('saveForgotPassword').disabled = true;
            document.getElementById('saveForgotPassword').textContent = 'Sending...';

            const response = await fetch('http://localhost:8000/api/password_reset/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Reset code sent to your email', 'success');
                
                // Move to step 2: code verification
                step1.style.display = 'none';
                step2.style.display = 'flex';
                resetCodeInput.focus();
                
                // Store the email for resending the code
                resetCodeInput.dataset.email = email;
            } else {
                showMessage(data.detail || 'Failed to send reset code. Please try again.', 'error');
                document.getElementById('saveForgotPassword').disabled = false;
                document.getElementById('saveForgotPassword').textContent = 'Send Reset Code';
            }
        } catch (error) {
            console.error('Error sending password reset:', error);
            showMessage('Network error. Please try again.', 'error');
            document.getElementById('saveForgotPassword').disabled = false;
            document.getElementById('saveForgotPassword').textContent = 'Send Reset Code';
        }
    });

    // Handle "Cancel" for step 1
    document.getElementById('cancelForgotPassword').addEventListener('click', function() {
        resetPasswordFlow();
    });

    // Step 2: Verify reset code
    document.getElementById('verifyResetCode').addEventListener('click', async function() {
        const code = resetCodeInput.value.trim();
        const email = resetCodeInput.dataset.email;
        
        console.log('Verifying code. Email:', email, 'Code:', code);
        
        if (!code) {
            showMessage('Please enter the reset code', 'error');
            return;
        }

        // Accept any non-empty code (no length restriction)
        if (code.trim() === '') {
            showMessage('Please enter a valid reset code from your email', 'error');
            return;
        }

        try {
            // Show loading state
            document.getElementById('verifyResetCode').disabled = true;
            document.getElementById('verifyResetCode').textContent = 'Verifying...';
            
            // Show a message to indicate verification is in progress
            showMessage('Verifying your code...', 'info');

            console.log('Sending verification request to backend...');
            const requestBody = { email: email, token: code }; // Use 'token' instead of 'code'
            console.log('Request payload:', requestBody);
            
            const response = await fetch('http://localhost:8000/api/password_reset/validate_token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                showMessage('Code verified successfully', 'success');
                
                // Store the reset token (which is actually the code itself in this case)
                resetToken = code;
                console.log('Reset token stored:', resetToken);
                
                // Move to step 3: new password
                step2.style.display = 'none';
                step3.style.display = 'flex';
                newPasswordInput.focus();
            } else {
                const errorMsg = data.detail || (typeof data === 'object' ? JSON.stringify(data) : 'Invalid or expired code. Please try again.');
                console.error('Verification failed:', errorMsg);
                showMessage(errorMsg, 'error');
                document.getElementById('verifyResetCode').disabled = false;
                document.getElementById('verifyResetCode').textContent = 'Verify Code';
            }
        } catch (error) {
            console.error('Error verifying reset code:', error);
            showMessage('Network error. Please try again.', 'error');
            document.getElementById('verifyResetCode').disabled = false;
            document.getElementById('verifyResetCode').textContent = 'Verify Code';
        }
    });

    // Handle "Resend code" link
    document.getElementById('resendCodeLink').addEventListener('click', async function(e) {
        e.preventDefault();
        
        const email = resetCodeInput.dataset.email;
        if (!email) {
            showMessage('Email address not found. Please go back to the first step.', 'error');
            return;
        }

        try {
            // Show resending status
            const resendLink = document.getElementById('resendCodeLink');
            const originalText = resendLink.textContent;
            resendLink.textContent = 'Sending...';
            resendLink.style.pointerEvents = 'none';

            const response = await fetch('http://localhost:8000/api/password_reset/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('New reset code sent to your email', 'success');
                resetCodeInput.value = ''; // Clear the input for new code
                resetCodeInput.focus();
            } else {
                showMessage(data.detail || 'Failed to resend code. Please try again.', 'error');
            }

            // Reset the resend link
            setTimeout(() => {
                resendLink.textContent = originalText;
                resendLink.style.pointerEvents = 'auto';
            }, 3000);
        } catch (error) {
            console.error('Error resending reset code:', error);
            showMessage('Network error. Please try again.', 'error');
            document.getElementById('resendCodeLink').textContent = 'Resend code';
            document.getElementById('resendCodeLink').style.pointerEvents = 'auto';
        }
    });

    // Handle "Cancel" for step 2
    document.getElementById('cancelResetCode').addEventListener('click', function() {
        resetPasswordFlow();
    });

    // Step 3: Set new password
    document.getElementById('setNewPassword').addEventListener('click', async function() {
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmNewPasswordInput.value.trim();
        
        console.log('Setting new password...');
        
        if (!newPassword || !confirmPassword) {
            showMessage('Please fill in both password fields', 'error');
            return;
        }
        
        if (newPassword.length < 8) {
            showMessage('Password must be at least 8 characters long', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }

        if (!resetToken) {
            showMessage('Missing reset token. Please restart the process.', 'error');
            console.error('Reset token is missing!');
            resetPasswordFlow();
            return;
        }

        try {
            // Show loading state
            document.getElementById('setNewPassword').disabled = true;
            document.getElementById('setNewPassword').textContent = 'Setting Password...';
            
            // Show a message to indicate the process is running
            showMessage('Setting your new password...', 'info');

            const email = resetCodeInput.dataset.email;
            console.log('Sending password reset confirmation:');
            console.log('- Email:', email);
            console.log('- Token:', resetToken);
            console.log('- Password length:', newPassword.length);
            
            const payload = {
                email: email,
                token: resetToken,
                password: newPassword
            };
            console.log('Request payload:', payload);

            const response = await fetch('http://localhost:8000/api/password_reset/confirm/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log('Response status:', response.status);
            let data;
            try {
                data = await response.json();
                console.log('Response data:', data);
            } catch (e) {
                console.log('No JSON in response or empty response');
            }

            if (response.ok) {
                console.log('Password reset successful!');
                
                // Clear the form first to ensure UI feedback is visible
                resetPasswordFlow();
                
                // Show a prominent success message
                showMessage('Password has been reset successfully!', 'success');
                
                // If user was not logged in, ask them to login with new password
                if (!localStorage.getItem('authToken')) {
                    setTimeout(() => {
                        showMessage('Please log in with your new password', 'info');
                        window.location.href = 'index.html';
                    }, 2000);
                } else {
                    // Update password display
                    document.getElementById('passwordValue').textContent = '•••••••';
                }
            } else {
                const errorMsg = data ? (data.detail || JSON.stringify(data)) : 'Failed to reset password. Please try again.';
                console.error('Password reset failed:', errorMsg);
                showMessage(errorMsg, 'error');
                document.getElementById('setNewPassword').disabled = false;
                document.getElementById('setNewPassword').textContent = 'Set New Password';
            }
        } catch (error) {
            console.error('Error setting new password:', error);
            showMessage('Network error. Please try again.', 'error');
            document.getElementById('setNewPassword').disabled = false;
            document.getElementById('setNewPassword').textContent = 'Set New Password';
        }
    });

    // Handle "Cancel" for step 3
    document.getElementById('cancelSetPassword').addEventListener('click', function() {
        resetPasswordFlow();
    });

    // Add keyboard event listeners for better UX
    resetCodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('verifyResetCode').click();
        }
    });

    confirmNewPasswordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('setNewPassword').click();
        }
    });
}

// Reset the password flow, hiding all steps and showing the initial value
function resetPasswordFlow() {
    console.log('Resetting password flow');
    
    // Clear all inputs
    document.getElementById('forgotPasswordInput').value = '';
    document.getElementById('resetCodeInput').value = '';
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmNewPasswordInput').value = '';
    
    // Hide all steps and show the value
    document.getElementById('forgotPasswordStep1').style.display = 'none';
    document.getElementById('forgotPasswordStep2').style.display = 'none';
    document.getElementById('forgotPasswordStep3').style.display = 'none';
    document.getElementById('forgotPasswordValue').style.display = 'inline-block';
    
    // Reset buttons
    document.getElementById('saveForgotPassword').disabled = false;
    document.getElementById('saveForgotPassword').textContent = 'Send Reset Code';
    document.getElementById('verifyResetCode').disabled = false;
    document.getElementById('verifyResetCode').textContent = 'Verify Code';
    document.getElementById('setNewPassword').disabled = false;
    document.getElementById('setNewPassword').textContent = 'Set New Password';
    
    // Clear reset token and email
    resetToken = null;
    if (document.getElementById('resetCodeInput')) {
        document.getElementById('resetCodeInput').dataset.email = '';
    }
    
    // Force UI update with a slight delay
    setTimeout(() => {
        document.getElementById('forgotPasswordValue').style.display = 'inline-block';
    }, 100);
}

// Use MessageSystem for displaying messages
function showMessage(message, type) {
    console.log(`Showing message: ${message} (${type})`);
    
    if (window.MessageSystem) {
        console.log('Using MessageSystem');
        try {
            // For password reset success, use a longer duration to ensure visibility
            if (type === 'success' && message.includes('Password has been reset')) {
                window.MessageSystem[type](message, 6000); // Show for 6 seconds
            } else {
                window.MessageSystem[type](message);
            }
        } catch (e) {
            console.error('Error using MessageSystem:', e);
            // Use showStatus instead of alert as a fallback
            showStatus(type, message);
        }
    } else {
        console.log('MessageSystem not available, using fallback');
        // Fallback to old status messages if MessageSystem is not available
        showStatus(type, message);
    }
}

// Special function for forgot password field (no longer used - replaced by setupForgotPasswordFlow)
function makeEditableForgotPassword(valueElement, inputElement, saveButton, cancelButton) {
    // This function is kept for backward compatibility but no longer used
    // The flow is now handled by setupForgotPasswordFlow
}

// Back to settings page functionality
function goBackToSettings() {
    // Navigate directly to setting.html regardless of history
    window.location.href = 'setting.html';
}

// Make arrow clickable
document.getElementById('backArrow').addEventListener('click', goBackToSettings);

// Make header text clickable
document.getElementById('backToSettingsFromPrivacy').addEventListener('click', function(e) {
    // Only trigger if clicking on the header text (not the arrow or other elements)
    if (e.target === this) {
        goBackToSettings();
    }
});