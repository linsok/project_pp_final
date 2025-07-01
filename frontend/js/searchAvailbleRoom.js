document.addEventListener("DOMContentLoaded", function () {
    const searchBtn = document.querySelector(".search-btn-main");
    const modal = document.getElementById("bookingModal");
    const bookingInfo = document.getElementById("bookingInfo");
    const closeBtn = document.querySelector(".close-btn");
    const bookNowBtn = document.getElementById("bookNowBtn");

    if (searchBtn) {
        searchBtn.addEventListener("click", function (event) {
            event.preventDefault();

            const roomType = document.getElementById("roomType").value;
            const roomNumber = document.getElementById("roomNumber").value;
            const capacity = document.getElementById("capacity").value;
            const date = document.getElementById("date").value;
            const fromTime = document.getElementById("from_time").value;
            const toTime = document.getElementById("to_time").value;

            if (
                roomType.includes("Select") ||
                roomNumber.includes("Select") ||
                capacity.includes("Select") ||
                !date || !fromTime || !toTime
            ) {
                alert("Please fill out all fields.");
                return;
            }

            const isAvailable = Math.random() > 0.5;

            const messageHTML = `
                <p><strong>Room Type:</strong> ${roomType}</p>
                <p><strong>Room Number:</strong> ${roomNumber}</p>
                <p><strong>Number of People:</strong> ${capacity}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${fromTime} - ${toTime}</p>
                <p><strong>Status:</strong> ${isAvailable ? "Available" : "Unavailable"}</p>
            `;

            bookingInfo.innerHTML = messageHTML;

            if (isAvailable) {
                bookNowBtn.style.display = "inline-block";
                bookNowBtn.onclick = function () {
                    const query = new URLSearchParams({
                        roomType,
                        roomNumber,
                        capacity,
                        date,
                        fromTime,
                        toTime
                    }).toString();
                    window.location.href = `book_room.html?${query}`;
                };
            } else {
                bookNowBtn.style.display = "none";
            }

            modal.style.display = "flex";
        });
    }

    // Close modal
    closeBtn.addEventListener("click", function () {
        modal.style.display = "none";
    });

    window.addEventListener("click", function (e) {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
});

// Room Image Function (unchanged)
function updateRoomImage(roomType) {
    console.log("Selected room type:", roomType);
    console.log("Image path:", roomImages[roomType]);

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
