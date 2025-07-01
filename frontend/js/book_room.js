
        // Toggle dropdown menu
        document.getElementById('sidebarToggle').addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent the click from bubbling up
            document.getElementById('dropdownMenu').classList.toggle('active');
        });

        // Close dropdown when clicking anywhere else
        document.addEventListener('click', function() {
            document.getElementById('dropdownMenu').classList.remove('active');
        });

        // Prevent dropdown from closing when clicking inside it
        document.getElementById('dropdownMenu').addEventListener('click', function(e) {
            e.stopPropagation();
        });
    

    
document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.includes("book_room.html")) {
        const params = new URLSearchParams(window.location.search);

        // Room Number
        if (params.has("roomNumber")) {
            document.getElementById("roomNumber").value = params.get("roomNumber");
        }

        // Capacity
        if (params.has("capacity")) {
            document.getElementById("capacity").value = params.get("capacity");
        }

        // Date (split into month/day/year)
        if (params.has("date")) {
            const dateStr = params.get("date"); // Format: YYYY-MM-DD
            const [year, month, day] = dateStr.split("-");

            document.getElementById("year").value = year;
            document.getElementById("month").value = parseInt(month) - 1; // Months are 0-indexed
            document.getElementById("day").value = parseInt(day);
        }

        // Time (split into from/to — same value for both by default)
        if (params.has("time")) {
            // Update these IDs if you rename inputs as I suggested earlier
            document.getElementById("timeFrom").value = params.get("time");
            document.getElementById("timeTo").value = params.get("time");
        }
    }
});


// AvailableRoom

document.addEventListener("DOMContentLoaded", function () {
    // Handle URL parameters for auto-filling
    const params = new URLSearchParams(window.location.search);

   // Building
if (params.has("building")) {
    const buildingValue = params.get("building");
    document.getElementById("building").value = buildingValue;
}

    // Room Number
    if (params.has("roomNumber")) {
        document.getElementById("roomNumber").value = params.get("roomNumber");
    }

    // Date (month/day/year)
    if (params.has("year") && params.has("month") && params.has("day")) {
        document.getElementById("year").value = params.get("year");
        document.getElementById("month").value = params.get("month");
        document.getElementById("day").value = params.get("day");
    }

    // Time
    if (params.has("timeFrom")) {
        document.getElementById("timeFrom").value = params.get("timeFrom");
    }
    if (params.has("timeTo")) {
        document.getElementById("timeTo").value = params.get("timeTo");
    }

    // Toggle dropdown menu
    document.getElementById('sidebarToggle').addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('dropdownMenu').classList.toggle('active');
    });

    // Close dropdown when clicking anywhere else
    document.addEventListener('click', function() {
        document.getElementById('dropdownMenu').classList.remove('active');
    });

    // Prevent dropdown from closing when clicking inside it
    document.getElementById('dropdownMenu').addEventListener('click', function(e) {
        e.stopPropagation();
    });
});
document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);

    const buildingSelect = document.getElementById("building");
    const roomNumberInput = document.getElementById("roomNumber");
    const capacitySelect = document.getElementById("capacity");
    const timeFromInput = document.getElementById("timeFrom");
    const timeToInput = document.getElementById("timeTo");

    const roomNumber = urlParams.get("roomNumber");
    const capacity = urlParams.get("capacity");
    const fromTime = urlParams.get("fromTime");
    const toTime = urlParams.get("toTime");

    // 🏢 Map room numbers to buildings
    const roomToBuildingMap = {
        "101": "Building A",
        "102": "Building A",
        "201": "Building A",
        "202": "Building A",
        "301": "Building B",
        "302": "Building B",
        // Add more if needed
    };

    // === Auto-fill room number ===
    if (roomNumber) {
        roomNumberInput.value = roomNumber;

        // Auto-select building based on room number
        const cleanRoom = roomNumber.replace(/[^0-9]/g, ''); // e.g., "Room 101" -> "101"
        const guessedBuilding = roomToBuildingMap[cleanRoom];

        if (guessedBuilding) {
            for (let option of buildingSelect.options) {
                if (option.value === guessedBuilding) {
                    option.selected = true;
                    break;
                }
            }
        }
    }

    // === Auto-fill capacity ===
    if (capacity) {
        for (let option of capacitySelect.options) {
            if (option.text === capacity) {
                option.selected = true;
                break;
            }
        }
    }

    // === Auto-fill time ===
    if (fromTime) timeFromInput.value = fromTime;
    if (toTime) timeToInput.value = toTime;

    if (!fromTime && !toTime) {
        const now = new Date();
        let minutes = now.getMinutes();
        let roundedMinutes = minutes <= 30 ? 30 : 0;
        if (roundedMinutes === 0) now.setHours(now.getHours() + 1);
        now.setMinutes(roundedMinutes, 0, 0);

        const pad = (n) => String(n).padStart(2, '0');
        const defaultFrom = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const to = new Date(now.getTime() + 60 * 60 * 1000);
        const defaultTo = `${pad(to.getHours())}:${pad(to.getMinutes())}`;

        timeFromInput.value = defaultFrom;
        timeToInput.value = defaultTo;
    }
});



document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");

    form.addEventListener("submit", function (e) {
        e.preventDefault(); // Prevent real submission

        const requiredFields = [
            "firstName", "surname", "email", "month", "day", "year",
            "building", "roomNumber", "capacity", "timeFrom", "timeTo", "role"
        ];

        let allFilled = true;

        requiredFields.forEach(id => {
            const field = document.getElementById(id);
            if (!field || !field.value.trim()) {
                allFilled = false;
            }
        });

        if (!allFilled) {
            alert("⚠️ Please fill in all required information.");
            return;
        }

        // Show confirmation dialog
        const confirmBooking = confirm("📝 Do you want to confirm your room booking?\nClick OK to confirm or Cancel to go back and edit.");
        
        if (confirmBooking) {
            alert("✅ Room booked successfully!");
            form.reset(); // Optional: clear the form
        } else {
            alert("❌ Booking cancelled. You can edit the form.");
        }
    });
});
