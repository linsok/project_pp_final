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

        // Handle corrected room information from enhanced search
        if (params.has("roomId") && params.has("roomType")) {
            // This is from the enhanced search with corrected information
            const roomId = params.get("roomId");
            const roomNumber = params.get("roomNumber");
            const roomType = params.get("roomType");
            const capacity = params.get("capacity");
            const date = params.get("date");
            const startTime = params.get("startTime");
            const endTime = params.get("endTime");

            // Auto-fill room number
            if (roomNumber) {
                document.getElementById("roomNumber").value = roomNumber;
            }

            // Auto-select capacity based on actual room capacity
            if (capacity) {
                const capacitySelect = document.getElementById("capacity");
                let capacityRange = "";
                
                const cap = parseInt(capacity);
                if (cap <= 10) capacityRange = "1-10 people";
                else if (cap <= 25) capacityRange = "11-25 people";
                else if (cap <= 50) capacityRange = "26-50 people";
                else if (cap <= 100) capacityRange = "51-100 people";
                else capacityRange = "100+ people";
                
                for (let option of capacitySelect.options) {
                    if (option.text === capacityRange) {
                        option.selected = true;
                        break;
                    }
                }
            }

            // Auto-select building based on room type and number
            if (roomNumber) {
                const buildingSelect = document.getElementById("building");
                let buildingName = "";
                
                // Simple mapping - in a real app, this would come from the API
                if (roomNumber.startsWith("A")) buildingName = "Building A";
                else if (roomNumber.startsWith("B")) buildingName = "Building B";
                else if (roomNumber.startsWith("C")) buildingName = "Building C";
                else if (roomNumber.startsWith("T")) buildingName = "STEM";
                else if (roomNumber.startsWith("L")) buildingName = "Library";
                
                for (let option of buildingSelect.options) {
                    if (option.value === buildingName) {
                        option.selected = true;
                        break;
                    }
                }
            }

            // Auto-fill date
            if (date) {
                const [year, month, day] = date.split("-");
                document.getElementById("year").value = year;
                document.getElementById("month").value = String(parseInt(month) - 1); // Months are 0-indexed, ensure string
                document.getElementById("day").value = String(Number(day));
                // Auto-fill time if present
                if (startTime) {
                    document.getElementById("timeFrom").value = startTime;
                } else if (params.has("startTime")) {
                    document.getElementById("timeFrom").value = params.get("startTime");
                }
                if (endTime) {
                    document.getElementById("timeTo").value = endTime;
                } else if (params.has("endTime")) {
                    document.getElementById("timeTo").value = params.get("endTime");
                }
                // Extra debug: log what is set in the form
                console.log('[BOOK_ROOM DEBUG] Form values set:', {
                  year: document.getElementById("year").value,
                  month: document.getElementById("month").value,
                  day: document.getElementById("day").value,
                  timeFrom: document.getElementById("timeFrom").value,
                  timeTo: document.getElementById("timeTo").value
                });
            }
        }
        // Handle legacy parameters (for backward compatibility)
        else {
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

    // === Auto-fill room number ===
    if (roomNumber) {
        roomNumberInput.value = roomNumber;
        
        // Auto-select building will be handled by the main room-building mapping system
        // This ensures consistency with the API-driven approach
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

    // Remove auto-fill for timeFrom and timeTo input fields
});



document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    let roomBuildingMapping = {}; // Store room-to-building mapping from API

    // Fetch room-building mapping from API
    async function fetchRoomBuildingMapping() {
        try {
            const response = await fetch('http://localhost:8000/api/rooms/building-mapping/');
            if (response.ok) {
                const data = await response.json();
                roomBuildingMapping = data.room_building_mapping;
                console.log('Room-building mapping loaded:', roomBuildingMapping);
            } else {
                console.error('Failed to fetch room-building mapping');
                // Fallback to static mapping if API fails
                roomBuildingMapping = {
                    "A101": "Building A",
                    "A201": "Building A", 
                    "A301": "Building A",
                    "B101": "Building B",
                    "B201": "Building B",
                    "B301": "Building B",
                    "C101": "Building C",
                    "C201": "Building C"
                };
            }
        } catch (error) {
            console.error('Error fetching room-building mapping:', error);
            // Use fallback mapping
            roomBuildingMapping = {
                "A101": "Building A",
                "A201": "Building A", 
                "A301": "Building A",
                "B101": "Building B",
                "B201": "Building B",
                "B301": "Building B",
                "C101": "Building C",
                "C201": "Building C"
            };
        }
    }

    // Auto-select building based on room number
    function autoSelectBuilding(roomNumber) {
        const buildingSelect = document.getElementById("building");
        const building = roomBuildingMapping[roomNumber];
        
        if (building) {
            buildingSelect.value = building;
            buildingSelect.style.backgroundColor = "#e8f5e8"; // Light green to show auto-selection
            
            // Show feedback to user
            const hint = buildingSelect.parentElement.querySelector('.input-hint');
            if (date) {
                const [year, month, day] = date.split("-");
                // Always force the form to use the date from the URL
                setTimeout(() => {
                  document.getElementById("year").value = year;
                  document.getElementById("month").value = String(parseInt(month) - 1); // Months are 0-indexed, ensure string
                  document.getElementById("day").value = String(Number(day));
                  // Update summary if present
                  const summaryDate = document.getElementById("summaryDate");
                  if (summaryDate) {
                    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    summaryDate.textContent = `${monthNames[parseInt(month)-1]} ${Number(day)}, ${year}`;
                  }
                  // Extra debug: log what is set in the form
                  console.log('[BOOK_ROOM DEBUG] Forced form values set:', {
                    year: document.getElementById("year").value,
                    month: document.getElementById("month").value,
                    day: document.getElementById("day").value
                  });
                }, 100); // Delay to override any other autofill
            }
            buildingSelect.style.backgroundColor = "";
            
            // Show message if room number doesn't exist
            if (roomNumber.trim()) {
                const hint = buildingSelect.parentElement.querySelector('.input-hint');
                if (hint) {
                    hint.textContent = "Room not found - please select building manually";
                    hint.style.color = "#dc3545";
                    
                    setTimeout(() => {
                        hint.textContent = "Building";
                        hint.style.color = "";
                    }, 3000);
                }
            }
        }
    }

    // Set up room number input listener
    function setupRoomNumberAutoComplete() {
        const roomNumberInput = document.getElementById("roomNumber");
        if (roomNumberInput) {
            roomNumberInput.addEventListener('input', function(e) {
                const roomNumber = e.target.value.trim();
                autoSelectBuilding(roomNumber);
            });

            // Also trigger on blur (when user leaves the field)
            roomNumberInput.addEventListener('blur', function(e) {
                const roomNumber = e.target.value.trim();
                autoSelectBuilding(roomNumber);
            });
        }
    }

    // Initialize everything
    async function initializeBookingForm() {
        await fetchRoomBuildingMapping();
        setupRoomNumberAutoComplete();
        
        // If room number is already filled (from URL params), auto-select building
        const roomNumberInput = document.getElementById("roomNumber");
        if (roomNumberInput && roomNumberInput.value) {
            autoSelectBuilding(roomNumberInput.value);
        }
    }

    // Start initialization
    initializeBookingForm();

    form.addEventListener("submit", function (e) {
        e.preventDefault(); // Prevent default form submission

        // Check authentication
        const token = localStorage.getItem('authToken');
        if (!token) {
            showErrorModal("❌ Authentication Required", "Please log in to make a booking. You will be redirected to the login page.");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);
            return;
        }

        const requiredFields = [
            "firstName", "surname", "email", "month", "day", "year",
            "building", "roomNumber", "capacity", "timeFrom", "timeTo", "role"
        ];

        let allFilled = true;
        const missingFields = [];

        requiredFields.forEach(id => {
            const field = document.getElementById(id);
            if (!field || !field.value.trim()) {
                allFilled = false;
                missingFields.push(id);
            }
        });

        if (!allFilled) {
            showErrorModal("⚠️ Missing Information", `Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }

        // Collect form data
        const formData = {
            firstName: document.getElementById("firstName").value.trim(),
            surname: document.getElementById("surname").value.trim(),
            email: document.getElementById("email").value.trim(),
            phoneNumber: document.getElementById("phoneNumber").value.trim(),
            month: document.getElementById("month").value,
            day: document.getElementById("day").value,
            year: document.getElementById("year").value,
            building: document.getElementById("building").value,
            roomNumber: document.getElementById("roomNumber").value.trim(),
            capacity: document.getElementById("capacity").value,
            timeFrom: document.getElementById("timeFrom").value,
            timeTo: document.getElementById("timeTo").value,
            role: document.getElementById("role").value,
            meetingAgenda: document.getElementById("meetingAgenda").value.trim()
        };

        // Validate time
        if (formData.timeFrom >= formData.timeTo) {
            showWarning("End time must be after start time.");
            return;
        }

        // Format date
        const bookingDate = `${formData.year}-${String(parseInt(formData.month) + 1).padStart(2, '0')}-${String(Number(formData.day)).padStart(2, '0')}`;

        // Check if date is in the future
        const today = new Date();
        const selectedDate = new Date(bookingDate);
        if (selectedDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
            showErrorModal("⚠️ Invalid Date", "Cannot book rooms for past dates. Please select a future date.");
            return;
        }

        // Show custom confirmation modal
        showBookingConfirmationModal(formData, bookingDate, token);
    });

    // Function to show custom booking confirmation modal
    function showBookingConfirmationModal(formData, bookingDate, token) {
        const modal = document.getElementById('bookingConfirmationModal');
        const detailsGrid = document.getElementById('bookingDetailsGrid');
        
        // Populate booking details
        const details = [
            {
                icon: 'fas fa-user',
                label: 'Name',
                value: `${formData.firstName} ${formData.surname}`
            },
            {
                icon: 'fas fa-envelope',
                label: 'Email',
                value: formData.email
            },
            {
                icon: 'fas fa-calendar',
                label: 'Date',
                value: new Date(bookingDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            },
            {
                icon: 'fas fa-clock',
                label: 'Time',
                value: `${formData.timeFrom} - ${formData.timeTo}`
            },
            {
                icon: 'fas fa-building',
                label: 'Building',
                value: formData.building
            },
            {
                icon: 'fas fa-door-open',
                label: 'Room',
                value: formData.roomNumber
            },
            {
                icon: 'fas fa-user-tag',
                label: 'Role',
                value: formData.role.charAt(0).toUpperCase() + formData.role.slice(1)
            },
            {
                icon: 'fas fa-comment',
                label: 'Purpose',
                value: formData.meetingAgenda || 'Not specified'
            }
        ];

        // Create HTML for details
        detailsGrid.innerHTML = details.map(detail => `
            <div class="booking-detail-item">
                <div class="booking-detail-label">
                    <i class="${detail.icon}"></i>
                    ${detail.label}
                </div>
                <div class="booking-detail-value">${detail.value}</div>
            </div>
        `).join('');

        // Show modal
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent scrolling

        // Handle confirm button
        const confirmBtn = document.getElementById('confirmBookingBtn');
        const cancelBtn = document.getElementById('cancelBookingBtn');

        // Remove existing event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        // Add new event listeners
        newConfirmBtn.addEventListener('click', function() {
            hideBookingConfirmationModal();
            
            // Prepare booking data for API
            const bookingData = {
                room_number: formData.roomNumber,
                building_name: formData.building,
                booking_date: bookingDate,
                start_time: formData.timeFrom,
                end_time: formData.timeTo,
                purpose: formData.meetingAgenda || `${formData.role} meeting`
            };

            // Submit booking to API
            submitBooking(bookingData, token);
        });

        newCancelBtn.addEventListener('click', function() {
            hideBookingConfirmationModal();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideBookingConfirmationModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                hideBookingConfirmationModal();
            }
        });
    }

    // Function to hide booking confirmation modal
    function hideBookingConfirmationModal() {
        const modal = document.getElementById('bookingConfirmationModal');
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
    }

    async function submitBooking(bookingData, token) {
        try {
            // Show loading state
            const submitButton = document.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";

            console.log('Submitting booking:', bookingData);

            const response = await fetch('http://localhost:8000/api/bookings/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(bookingData)
            });

            const result = await response.json();
            console.log('Booking response:', result);

            if (response.ok) {
                showSuccessModal("✅ Room booked successfully!", "Your booking has been confirmed. You will receive a confirmation email shortly.");
                form.reset(); // Clear the form
            } else {
                // Handle API errors with detailed information
                console.error('Booking API Error:', result);
                let errorMessage = "Failed to book room.\n\n";
                
                if (result.non_field_errors) {
                    errorMessage += "Error: " + result.non_field_errors.join(', ');
                } else if (result.detail) {
                    errorMessage += "Error: " + result.detail;
                } else if (result.room_number) {
                    errorMessage += "Room Error: " + (Array.isArray(result.room_number) ? result.room_number.join(', ') : result.room_number);
                } else if (result.building_name) {
                    errorMessage += "Building Error: " + (Array.isArray(result.building_name) ? result.building_name.join(', ') : result.building_name);
                } else if (result.booking_date) {
                    errorMessage += "Date Error: " + (Array.isArray(result.booking_date) ? result.booking_date.join(', ') : result.booking_date);
                } else if (result.start_time || result.end_time) {
                    errorMessage += "Time Error: " + (result.start_time || result.end_time);
                } else {
                    // Show a user-friendly message instead of the full JSON
                    errorMessage += "Please check your information and try again.";
                }
                
                showErrorModal("❌ Booking Failed", errorMessage);
            }
        } catch (error) {
            console.error('Booking error:', error);
            showErrorModal("❌ Network Error", "Please check your internet connection and try again.");
        } finally {
            // Restore button state
            const submitButton = document.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }

    // Function to show success modal
    function showSuccessModal(title, message) {
        const modal = document.getElementById('successModal');
        const titleEl = document.getElementById('successTitle');
        const messageEl = document.getElementById('successMessage');
        const viewBookingsBtn = document.getElementById('viewBookingsBtn');
        const closeSuccessBtn = document.getElementById('closeSuccessBtn');

        titleEl.textContent = title;
        messageEl.textContent = message;

        // Show modal
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Remove existing event listeners
        const newViewBtn = viewBookingsBtn.cloneNode(true);
        const newCloseBtn = closeSuccessBtn.cloneNode(true);
        viewBookingsBtn.parentNode.replaceChild(newViewBtn, viewBookingsBtn);
        closeSuccessBtn.parentNode.replaceChild(newCloseBtn, closeSuccessBtn);

        // Add new event listeners
        newViewBtn.addEventListener('click', function() {
            window.location.href = "view_booking.html";
        });

        newCloseBtn.addEventListener('click', function() {
            hideSuccessModal();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideSuccessModal();
            }
        });
    }

    // Function to show error modal
    function showErrorModal(title, message) {
        const modal = document.getElementById('errorModal');
        const titleEl = document.getElementById('errorTitle');
        const messageEl = document.getElementById('errorMessage');
        const closeErrorBtn = document.getElementById('closeErrorBtn');

        titleEl.textContent = title;
        messageEl.textContent = message;

        // Show modal
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Remove existing event listeners
        const newCloseBtn = closeErrorBtn.cloneNode(true);
        closeErrorBtn.parentNode.replaceChild(newCloseBtn, closeErrorBtn);

        // Add new event listeners
        newCloseBtn.addEventListener('click', function() {
            hideErrorModal();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideErrorModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                hideErrorModal();
            }
        });
    }

    // Function to hide error modal
    function hideErrorModal() {
        const modal = document.getElementById('errorModal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // Function to hide success modal
    function hideSuccessModal() {
        const modal = document.getElementById('successModal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // --- Show booking summary if coming from available room ---
    const summaryBox = document.getElementById('bookingSummary');
    if (summaryBox) {
        let room = params.get('roomNumber');
        let building = params.get('building');
        let date = params.get('date');
        let timeFrom = params.get('timeFrom');
        let timeTo = params.get('timeTo');
        if (room && building && date && timeFrom && timeTo) {
            // Format date
            const [year, month, day] = date.split('-');
            const dateStr = `${year}-${month}-${day}`;
            // Format time for summary only (not for input fields)
            const formatTime = t => t.length === 5 ? t : t.slice(0,5);
            document.getElementById('summaryRoom').textContent = `${room} (${building})`;
            document.getElementById('summaryDate').textContent = dateStr;
            document.getElementById('summaryTime').textContent = `${formatTime(timeFrom)} - ${formatTime(timeTo)}`;
            summaryBox.style.display = '';
        }
    }
});
