document.addEventListener('DOMContentLoaded', function() {
    // --- USER INFO FETCH ---
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = "login.html";
        return;
    }
    fetch("http://localhost:8000/auth/user/", {
        method: "GET",
        headers: {
            "Authorization": "Token " + token
        }
    })
    .then(response => {
        if (!response.ok) throw new Error("Not logged in");
        return response.json();
    })
    .then(user => {
        document.querySelectorAll(".user-name, .user-name-dropdown").forEach(el => {
            el.textContent = user.username || "User";
        });
        document.querySelectorAll(".user-email").forEach(el => {
            el.textContent = user.email || "";
        });
    })
    .catch(() => {
        window.location.href = "login.html";
    });

    // --- PROFILE IMAGE UPLOAD LOGIC (add this!) ---
    const profileImg = document.getElementById('profileImg');
    const editPhoto = document.getElementById('editPhoto');
    const profileImgInput = document.getElementById('profileImgInput');

    if (profileImg && editPhoto && profileImgInput) {
        profileImg.parentElement.addEventListener('mouseenter', () => { editPhoto.style.display = 'block'; });
        profileImg.parentElement.addEventListener('mouseleave', () => { editPhoto.style.display = 'none'; });

        editPhoto.addEventListener('click', () => { profileImgInput.click(); });

        profileImgInput.addEventListener('change', function() {
            if(this.files && this.files[0]) {
                // Preview
                const reader = new FileReader();
                reader.onload = e => { profileImg.src = e.target.result; };
                reader.readAsDataURL(this.files[0]);
                // Upload to backend
                const formData = new FormData();
                formData.append('image', this.files[0]);
                fetch('http://localhost:8000/accounts/profile/', {
                    method: 'PATCH',
                    headers: { 'Authorization': 'Token ' + token },
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.image) {
                        profileImg.src = data.image;
                        updateProfileIcon(data.image); // update top-right icon as well!
                    }
                });
            }
        });
    }

    // --- PROFILE ICON (TOP-RIGHT) LOGIC ---
    function updateProfileIcon(imageUrl) {
        const profileIconContainer = document.getElementById('profileIconContainer');
        if (!profileIconContainer) return;
        if (imageUrl && !imageUrl.endsWith('default.png')) {
            profileIconContainer.innerHTML = `<img src="${imageUrl}" class="user-avatar" alt="Profile Image">`;
        } else {
            profileIconContainer.innerHTML = `<i class="fas fa-user-circle profile-icon" id="profileIcon"></i>`;
        }
    }

    // Fetch profile image on load
    fetch('http://localhost:8000/accounts/profile/', {
        headers: { 'Authorization': 'Token ' + token }
    })
    .then(res => res.json())
    .then(data => {
        updateProfileIcon(data.image);
    });

    // --- SIDEBAR AND DROPDOWN LOGIC ---
    document.getElementById('sidebarToggle').addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('dropdownMenu').classList.toggle('active');
    });

    document.addEventListener('click', function() {
        document.getElementById('dropdownMenu').classList.remove('active');
    });

    document.getElementById('dropdownMenu').addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Profile dropdown logic
    const profileIcon = document.getElementById('profileIcon');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileIcon && profileDropdown) {
        profileIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', function(e) {
            if (!profileDropdown.contains(e.target) && !profileIcon.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });

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
        if (roomImages[roomType]) {
            selectedRoomImage.src = roomImages[roomType];
            selectedRoomImage.alt = roomType + " image";
            selectedRoomName.textContent = roomType;
            roomImageDisplay.style.display = 'block';
            roomImageDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            roomImageDisplay.style.display = 'none';
            selectedRoomImage.src = "";
            selectedRoomName.textContent = "";
        }
    }

    quickSelectBtns.forEach(button => {
        button.addEventListener('click', function() {
            const selectedType = this.getAttribute('data-room-type');
            roomTypeDropdown.value = selectedType;
            updateRoomImage(selectedType);
        });
    });

    roomTypeDropdown.addEventListener('change', function() {
        const selectedType = this.value;
        updateRoomImage(selectedType);
    });

    if (roomTypeDropdown.value === "Select Room Type" || roomTypeDropdown.value === "") {
        roomImageDisplay.style.display = 'none';
    }
});