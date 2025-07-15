// Global functions for logout modal (needed for onclick handlers)
window.hideLogoutModal = function() {
    const logoutModal = document.getElementById('logoutModal');
    if (logoutModal) {
        logoutModal.style.display = 'none';
    }
};

window.confirmLogout = function() {
    hideLogoutModal();
    performLogout();
};

// Function to perform logout
function performLogout() {
    // Show logging out message
    showLogoutMessage();
    
    const token = localStorage.getItem('authToken');
    
    if (token) {
        // Call logout API
        fetch('http://localhost:8000/auth/logout/', {
            method: 'POST',
            headers: {
                'Authorization': 'Token ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            // Whether the API call succeeds or fails, we'll remove the token and redirect
            console.log('Logout API response:', response.status);
        })
        .catch(error => {
            console.log('Logout API error:', error);
        })
        .finally(() => {
            // Always clear local storage and redirect after a short delay
            setTimeout(() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                localStorage.removeItem('profileData');
                
                // Redirect to login page
                window.location.href = 'index.html';
            }, 800);
        });
    } else {
        // No token, just redirect after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 800);
    }
}

// Function to show logout message
function showLogoutMessage() {
    // Create message if it doesn't exist
    let logoutMessage = document.getElementById('logoutMessage');
    if (!logoutMessage) {
        logoutMessage = createLogoutMessage();
        document.body.appendChild(logoutMessage);
    }
    
    // Show the message
    logoutMessage.style.display = 'flex';
}

// Function to create logout message
function createLogoutMessage() {
    const message = document.createElement('div');
    message.id = 'logoutMessage';
    message.className = 'logout-message';
    message.innerHTML = `
        <div class="logout-message-content">
            <div class="logout-spinner"></div>
            <p>Logging out...</p>
        </div>
    `;
    return message;
}

document.addEventListener('DOMContentLoaded', function() {
    // --- USER INFO FETCH ---
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = "index.html";
        return;
    }
    
    // Fetch user info and profile
    Promise.all([
        fetch("http://localhost:8000/auth/user/", {
            method: "GET",
            headers: {
                "Authorization": "Token " + token
            }
        }),
        fetch('http://localhost:8000/api/profile/', {
            headers: { 'Authorization': 'Token ' + token }
        })
    ])
    .then(responses => {
        if (!responses[0].ok) throw new Error("Not logged in");
        return Promise.all([
            responses[0].json(), 
            responses[1].json()
        ]);
    })
    .then(([user, profile]) => {
        console.log('User data:', user);
        console.log('Profile data:', profile);
        
        // Update user info
        document.querySelectorAll(".user-name, .user-name-dropdown").forEach(el => {
            el.textContent = user.username || "User";
        });
        document.querySelectorAll(".user-email").forEach(el => {
            el.textContent = user.email || "";
        });
        
        // Update profile image
        console.log('Profile image_url:', profile.image_url);
        console.log('Profile image:', profile.image);
        updateProfileImage(profile.image_url);
        
        // Setup profile icon click handler after image is loaded
        setTimeout(setupProfileIconClickHandler, 100);
    })
    .catch(() => {
        localStorage.removeItem('authToken');
        window.location.href = "index.html";
    });

    // --- PROFILE IMAGE FUNCTIONS ---
    function updateProfileImage(imageUrl) {
        console.log('updateProfileImage called with:', imageUrl);
        const profileImg = document.getElementById('profileImg');
        const profileIconContainer = document.getElementById('profileIconContainer');
        
        if (imageUrl && imageUrl !== null) {
            console.log('Setting profile image to:', imageUrl);
            // Update dropdown image
            if (profileImg) {
                profileImg.src = imageUrl;
                profileImg.style.display = 'block';
                profileImg.onerror = function() {
                    console.error('Failed to load image:', imageUrl);
                    // Fallback to default if image fails to load
                    updateProfileImage(null);
                };
            }
            
            // Update top-right icon with click handler
            if (profileIconContainer) {
                profileIconContainer.innerHTML = `<img src="${imageUrl}" alt="Profile" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; cursor: pointer;" onerror="console.error('Icon image failed to load: ${imageUrl}')">`;
                // Re-add click handler after updating innerHTML
                setupProfileIconClickHandler();
            }
        } else {
            console.log('No image URL, using default avatar');
            // Show default icon
            if (profileImg) {
                profileImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDgiIGN5PSI0OCIgcj0iNDgiIGZpbGw9IiNlMGUwZTAiLz4KPGNpcmNsZSBjeD0iNDgiIGN5PSIzNiIgcj0iMTIiIGZpbGw9IiM5MDkwOTAiLz4KPHBhdGggZD0iTTI0IDcyYzAtMTMuMjU1IDEwLjc0NS0yNCAyNC0yNHMyNCAxMC43NDUgMjQgMjQiIGZpbGw9IiM5MDkwOTAiLz4KPC9zdmc+';
                profileImg.style.display = 'block';
            }
            
            // Update top-right icon with click handler
            if (profileIconContainer) {
                profileIconContainer.innerHTML = `<i class="fas fa-user-circle profile-icon" id="profileIcon" style="cursor: pointer;"></i>`;
                // Re-add click handler after updating innerHTML
                setupProfileIconClickHandler();
            }
        }
    }

    // Function to setup profile icon click handler
    function setupProfileIconClickHandler() {
        const profileIconContainer = document.getElementById('profileIconContainer');
        const profileDropdown = document.getElementById('profileDropdown');
        
        console.log('Setting up profile icon click handler...');
        console.log('profileIconContainer:', profileIconContainer);
        console.log('profileDropdown:', profileDropdown);
        
        if (profileIconContainer && profileDropdown) {
            // Remove existing event listeners to avoid duplicates
            profileIconContainer.onclick = null;
            
            // Add click handler
            profileIconContainer.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('Profile icon clicked!'); // Debug log
                console.log('Current dropdown classes:', profileDropdown.classList.toString());
                profileDropdown.classList.toggle('active'); // Changed from 'show' to 'active'
                console.log('New dropdown classes:', profileDropdown.classList.toString());
            });
            
            console.log('Profile icon click handler added successfully');
            
            // Setup logout button functionality
            setupLogoutHandler();
        } else {
            console.log('Could not find profile elements');
        }
    }

    // Function to setup logout button handler
    function setupLogoutHandler() {
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Show logout confirmation modal
                showLogoutModal();
            });
            console.log('Logout button handler added successfully');
        } else {
            console.log('Logout button not found');
        }
    }

    // Function to show logout confirmation modal
    function showLogoutModal() {
        // Create modal if it doesn't exist
        let logoutModal = document.getElementById('logoutModal');
        if (!logoutModal) {
            logoutModal = createLogoutModal();
            document.body.appendChild(logoutModal);
        }
        
        // Show the modal
        logoutModal.style.display = 'flex';
        
        // Close modal when clicking outside
        logoutModal.addEventListener('click', function(e) {
            if (e.target === logoutModal) {
                hideLogoutModal();
            }
        });
    }
    
    // Function to create logout modal
    function createLogoutModal() {
        const modal = document.createElement('div');
        modal.id = 'logoutModal';
        modal.className = 'logout-modal';
        modal.innerHTML = `
            <div class="logout-modal-content">
                <div class="logout-modal-header">
                    <h3>Confirm Logout</h3>
                </div>
                <div class="logout-modal-body">
                    <p>Are you sure you want to logout?</p>
                </div>
                <div class="logout-modal-actions">
                    <button class="logout-modal-btn logout-cancel-btn" onclick="hideLogoutModal()">
                        Cancel
                    </button>
                    <button class="logout-modal-btn logout-confirm-btn" onclick="confirmLogout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
        `;
        return modal;
    }
    
    // --- PROFILE IMAGE UPLOAD LOGIC ---
    const profileImg = document.getElementById('profileImg');
    const editPhoto = document.getElementById('editPhoto');
    const profileImgInput = document.getElementById('profileImgInput');

    if (profileImg && editPhoto && profileImgInput) {
        profileImg.parentElement.addEventListener('mouseenter', () => { 
            editPhoto.style.display = 'block'; 
        });
        profileImg.parentElement.addEventListener('mouseleave', () => { 
            editPhoto.style.display = 'none'; 
        });

        editPhoto.addEventListener('click', () => { 
            profileImgInput.click(); 
        });

        profileImgInput.addEventListener('change', function() {
            if(this.files && this.files[0]) {
                const file = this.files[0];
                
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showError('Please select an image file');
                    return;
                }
                
                // Validate file size (5MB limit)
                if (file.size > 5 * 1024 * 1024) {
                    showError('File size should be less than 5MB');
                    return;
                }
                
                // Show loading state
                editPhoto.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                
                // Upload to backend
                const formData = new FormData();
                formData.append('image', file);
                
                fetch('http://localhost:8000/api/profile/', {
                    method: 'PATCH',
                    headers: { 
                        'Authorization': 'Token ' + token 
                    },
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Upload failed');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Upload successful:', data);
                    console.log('New image URL:', data.image_url);
                    
                    // Update with the new image URL
                    if (data.image_url) {
                        updateProfileImage(data.image_url);
                    } else if (data.image) {
                        // Fallback to image field if image_url is not present
                        updateProfileImage(data.image);
                    } else {
                        console.warn('No image URL in response');
                    }
                    
                    editPhoto.innerHTML = '<i class="fas fa-camera"></i>';
                })
                .catch(error => {
                    console.error('Upload error:', error);
                    showError('Failed to upload image. Please try again.');
                    editPhoto.innerHTML = '<i class="fas fa-camera"></i>';
                });
            }
        });
    }

    // --- DROPDOWN LOGIC ---
    const sidebarToggle = document.getElementById('sidebarToggle');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const profileSection = document.getElementById('profileSection');
    const profileDropdown = document.getElementById('profileDropdown');

    // Sidebar toggle
    if (sidebarToggle && dropdownMenu) {
        sidebarToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('active');
        });
    }

    // Profile dropdown toggle (for profile section if it exists)
    if (profileSection && profileDropdown) {
        profileSection.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Profile section clicked!');
            profileDropdown.classList.toggle('active'); // Changed from 'show' to 'active'
        });
    }

    // Setup initial profile icon click handler
    setupProfileIconClickHandler();

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (dropdownMenu) dropdownMenu.classList.remove('active');
        if (profileDropdown) profileDropdown.classList.remove('active'); // Changed from 'show' to 'active'
    });

    // Prevent dropdown from closing when clicking inside
    if (dropdownMenu) {
        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    if (profileDropdown) {
        profileDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // --- ROOM QUICK SELECT LOGIC ---
    const quickSelectBtns = document.querySelectorAll('.quick-select-btn');
    const roomTypeDropdown = document.getElementById('roomType');
    const roomImageDisplay = document.getElementById('roomImageDisplay');
    const selectedRoomImage = document.getElementById('selectedRoomImage');
    const selectedRoomName = document.getElementById('selectedRoomName');

    const roomImages = {
        "Lecture Hall": "testing_img/room.PNG", 
        "Meeting Room": "testing_img/lake.PNG",
        "Conference Room": "testing_img/room.PNG", 
    };

    function updateRoomImage(roomType) {
        if (roomImages[roomType] && selectedRoomImage && selectedRoomName && roomImageDisplay) {
            selectedRoomImage.src = roomImages[roomType];
            selectedRoomImage.alt = roomType + " image";
            selectedRoomName.textContent = roomType;
            roomImageDisplay.style.display = 'block';
            roomImageDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (roomImageDisplay) {
            roomImageDisplay.style.display = 'none';
            if (selectedRoomImage) selectedRoomImage.src = "";
            if (selectedRoomName) selectedRoomName.textContent = "";
        }
    }

    if (quickSelectBtns && quickSelectBtns.length > 0) {
        quickSelectBtns.forEach(button => {
            button.addEventListener('click', function() {
                const selectedType = this.getAttribute('data-room-type');
                if (roomTypeDropdown) roomTypeDropdown.value = selectedType;
                updateRoomImage(selectedType);
            });
        });
    }

    if (roomTypeDropdown) {
        roomTypeDropdown.addEventListener('change', function() {
            const selectedType = this.value;
            updateRoomImage(selectedType);
        });

        if (roomTypeDropdown.value === "Select Room Type" || roomTypeDropdown.value === "") {
            if (roomImageDisplay) roomImageDisplay.style.display = 'none';
        }
    }
});