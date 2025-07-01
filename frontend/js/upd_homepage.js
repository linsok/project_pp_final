
document.addEventListener('DOMContentLoaded', function () {
    const roomTypeDropdown = document.getElementById('roomType');
    const roomImageDisplay = document.getElementById('roomImageDisplay');
    const selectedRoomImage = document.getElementById('selectedRoomImage');
    const selectedRoomName = document.getElementById('selectedRoomName');
    const quickSelectBtns = document.querySelectorAll('.quick-select-btn');

    // Define image paths
    const roomImages = {
        "Lecture Hall": "https://thumbs.dreamstime.com/b/empty-university-lecture-hall-spacious-lecture-hall-curved-tiered-wooden-seating-rows-face-large-green-chalkboard-featuring-383897937.jpg",
        "Conference Room": "https://techreadysolutions.ca/wp-content/uploads/2020/01/Boardroom-setup-825x510.jpg",
        "Meeting Room": "https://cdn-clppm.nitrocdn.com/jJRwhUySpmBiZVDZtJMwhTYymMvpDjuf/assets/images/optimized/rev-3010cec/www.avanta.co.in/wp-content/uploads/2020/12/Meeting-Rooms-in-Central-Delhi.webp",
        
        
    };

    function displayRoomImage(roomType) {
        const imagePath = roomImages[roomType];
        if (imagePath) {
            selectedRoomName.textContent = roomType;
            selectedRoomImage.src = imagePath;
            roomImageDisplay.style.display = 'block';
        } else {
            roomImageDisplay.style.display = 'none';
        }
    }

    // When selecting from dropdown
    roomTypeDropdown.addEventListener('change', function () {
        const selectedType = this.value;
        displayRoomImage(selectedType);
    });

    // When clicking quick-select buttons
    quickSelectBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const type = this.getAttribute('data-room-type');
            roomTypeDropdown.value = type; // Sync dropdown
            displayRoomImage(type);
        });
    });
});

