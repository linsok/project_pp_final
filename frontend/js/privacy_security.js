// Global user data
let userData = {};
let profileData = {};

document.addEventListener('DOMContentLoaded', function() {
    // Check for authentication token
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    // Function to make fields editable
    function makeEditable(valueElement, inputElement, saveButton, fieldName) {
        valueElement.addEventListener('click', function() {
            // Hide the value and show the input field
            valueElement.style.display = 'none';
            inputElement.parentElement.style.display = 'flex';
            
            // Pre-fill with current value (except password)
            if (fieldName !== 'password') {
                inputElement.value = valueElement.textContent;
                
                // For email changes, show a password input field
                if (fieldName === 'email') {
                    showPasswordVerificationField(inputElement.parentElement);
                }
            } else {
                inputElement.value = '';  // Always clear password field
            }
            
            inputElement.focus();
        });

        saveButton.addEventListener('click', function() {
            if (inputElement.value.trim() === '' && fieldName !== 'password') {
                showStatus('error', 'Please enter a value');
                return;
            }
            
            // For password, validate minimum length
            if (fieldName === 'password' && inputElement.value.trim().length < 8) {
                showStatus('error', 'Password must be at least 8 characters long');
                return;
            }
            
            // Save changes to the server
            saveUserField(fieldName, inputElement.value.trim());
        });

        // Also save when pressing Enter
        inputElement.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveButton.click();
            }
        });
    }

    // Function to show password verification field for email changes
    function showPasswordVerificationField(parentElement) {
        // Check if verification field already exists
        if (parentElement.querySelector('.email-verification-password')) {
            return;
        }
        
        // Create password verification container
        const verificationDiv = document.createElement('div');
        verificationDiv.className = 'email-verification-container';
        verificationDiv.innerHTML = `
            <label for="emailVerificationPassword">Current Password (required to change email):</label>
            <input type="password" id="emailVerificationPassword" class="email-verification-password" placeholder="Enter your current password" required>
        `;
        
        // Insert before the save button
        const saveBtn = parentElement.querySelector('.save-btn');
        parentElement.insertBefore(verificationDiv, saveBtn);
    }
    
    // Enhanced function to save user field updates with password verification for email
    function saveUserField(fieldName, value) {
        const token = localStorage.getItem('authToken');
        let endpoint, data;
        
        if (fieldName === 'password') {
            // Password change endpoint
            endpoint = 'http://localhost:8000/auth/password/change/';
            data = { new_password1: value, new_password2: value };
        } else if (fieldName === 'email') {
            // Email requires password verification
            const verificationPassword = document.getElementById('emailVerificationPassword');
            if (!verificationPassword || !verificationPassword.value.trim()) {
                showStatus('error', 'Please enter your current password to change email');
                return;
            }
            
            // Email change endpoint
            endpoint = 'http://localhost:8000/auth/user/';
            data = {
                email: value,
                password: verificationPassword.value.trim()
            };
        } else if (fieldName === 'username') {
            // User info endpoint
            endpoint = 'http://localhost:8000/auth/user/';
            data = { username: value };
        } else if (fieldName === 'phone') {
            // This would require adding a phone field to the Profile model
            showStatus('error', 'Phone number updates are not implemented yet');
            hideEditField(document.getElementById('phoneValue'), document.getElementById('phoneInput'));
            return;
        }
        
        // Send update to server
        fetch(endpoint, {
            method: 'PUT', // or 'PATCH' depending on the API
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + token
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                // Handle specific error cases
                if (response.status === 400 && fieldName === 'email') {
                    return response.json().then(data => {
                        throw new Error(data.password ? 'Incorrect password' : 'Invalid email address');
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
                }
            }
            
            // Hide edit field
            const valueElement = document.getElementById(fieldName + 'Value');
            const inputElement = document.getElementById(fieldName + 'Input');
            hideEditField(valueElement, inputElement);
            
            // Update cached user data
            if (fieldName === 'email' || fieldName === 'username') {
                userData[fieldName] = value;
            }
        })
        .catch(error => {
            console.error('Error updating ' + fieldName + ':', error);
            showStatus('error', error.message || 'Failed to update ' + fieldName);
        });
    }
    
    // Function to hide edit field and show value
    function hideEditField(valueElement, inputElement) {
        valueElement.style.display = 'inline-block';
        inputElement.parentElement.style.display = 'none';
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
        document.getElementById('phoneValue').textContent = '+855123456789'; // Placeholder as phone is not in the model
        
        // Initialize editable fields
        makeEditable(
            document.getElementById('emailValue'),
            document.getElementById('emailInput'),
            document.getElementById('saveEmail'),
            'email'
        );

        makeEditable(
            document.getElementById('phoneValue'),
            document.getElementById('phoneInput'),
            document.getElementById('savePhone'),
            'phone'
        );

        makeEditable(
            document.getElementById('passwordValue'),
            document.getElementById('passwordInput'),
            document.getElementById('savePassword'),
            'password'
        );

        makeEditable(
            document.getElementById('nameValue'),
            document.getElementById('nameInput'),
            document.getElementById('saveName'),
            'username'
        );
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
        // Redirect to login on authentication failure
        localStorage.removeItem('authToken');
        window.location.href = "index.html";
    });
});

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