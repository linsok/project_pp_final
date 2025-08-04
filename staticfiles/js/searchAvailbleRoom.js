document.addEventListener("DOMContentLoaded", function () {
    console.log('DOM Content Loaded - initializing search functionality');
    
    const searchBtn = document.querySelector(".search-btn-horizontal") || document.querySelector(".search-btn-main");
    const modal = document.getElementById("bookingModal");
    const bookingInfo = document.getElementById("bookingInfo");
    const closeBtn = document.querySelector(".close-btn");
    const bookNowBtn = document.getElementById("bookNowBtn");
    const modalTitle = document.getElementById("modalTitle");

    console.log('Elements found:');
    console.log('- searchBtn:', !!searchBtn, searchBtn);
    console.log('- modal:', !!modal, modal);
    console.log('- bookingInfo:', !!bookingInfo, bookingInfo);
    console.log('- closeBtn:', !!closeBtn, closeBtn);
    console.log('- bookNowBtn:', !!bookNowBtn, bookNowBtn);
    console.log('- modalTitle:', !!modalTitle, modalTitle);

    // If any critical element is missing, show an error
    if (!searchBtn || !modal || !bookingInfo || !modalTitle) {
        console.error('Critical elements missing for search functionality!');
        if (!searchBtn) console.error('Search button not found');
        if (!modal) console.error('Modal not found');
        if (!bookingInfo) console.error('Booking info container not found');
        if (!modalTitle) console.error('Modal title not found');
        return;
    }

    // Modal helper functions
    function showModal() {
        console.log('showModal called');
        if (modal) {
            modal.classList.add('show');
            document.body.classList.add('modal-open');
            console.log('Modal classes added, modal should be visible');
        } else {
            console.error('Modal element not found!');
        }
    }

    function hideModal() {
        console.log('hideModal called');
        if (modal) {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            console.log('Modal classes removed, modal should be hidden');
        }
    }

    if (searchBtn) {
        console.log('Search button found and event listener attached');
        searchBtn.addEventListener("click", function (event) {
            console.log('Search button clicked!');
            event.preventDefault();
            searchAvailableRooms();
        });
    } else {
        console.error('Search button not found! Looking for .search-btn-horizontal or .search-btn-main');
    }

    async function searchAvailableRooms() {
        console.log('searchAvailableRooms function called');
        try {
            // Get form values
            const roomType = document.getElementById("roomType").value;
            const roomNumber = document.getElementById("roomNumber").value;
            const capacity = document.getElementById("capacity").value;
            const date = document.getElementById("date").value;
            const fromTime = document.getElementById("from_time").value;
            const toTime = document.getElementById("to_time").value;

            console.log('Search parameters:', {
                roomType,
                roomNumber,
                capacity,
                date,
                fromTime,
                toTime
            });

            // Check if user wants availability checking
            const wantsAvailability = roomNumber || date || fromTime || toTime;
            const hasAllRequiredForAvailability = roomNumber && date && fromTime && toTime;

            if (wantsAvailability && !hasAllRequiredForAvailability) {
                // Show warning about required fields
                modalTitle.textContent = "Missing Required Information";
                bookingInfo.innerHTML = `
                    <div class="warning-message">
                        <h3><i class="fas fa-exclamation-triangle"></i> Missing Required Information</h3>
                        <p>To check room availability, you must provide:</p>
                        <ul>
                            <li><strong>Room Number:</strong> ${roomNumber ? '✓ Provided' : '✗ Missing'}</li>
                            <li><strong>Date:</strong> ${date ? '✓ Provided' : '✗ Missing'}</li>
                            <li><strong>Time From:</strong> ${fromTime ? '✓ Provided' : '✗ Missing'}</li>
                            <li><strong>Time To:</strong> ${toTime ? '✓ Provided' : '✗ Missing'}</li>
                        </ul>
                        <p>You can either:</p>
                        <ul>
                            <li>Fill in all required fields to check availability</li>
                            <li>Or clear all fields to browse all rooms without availability checking</li>
                        </ul>
                    </div>
                `;
                showModal();
                bookNowBtn.style.display = "none";
                return;
            }

            // Show loading state
            modalTitle.textContent = "Searching Rooms...";
            bookingInfo.innerHTML = '<div class="loading">Searching for available rooms...</div>';
            showModal();

            // Build search parameters (only include non-empty values)
            const searchParams = new URLSearchParams();
            
            if (roomType && roomType !== "" && !roomType.toLowerCase().includes("any")) {
                searchParams.append('room_type', roomType);
                console.log('Added room_type:', roomType);
            }
            if (roomNumber && roomNumber !== "" && !roomNumber.toLowerCase().includes("any")) {
                searchParams.append('room_number', roomNumber);
                console.log('Added room_number:', roomNumber);
            }
            if (capacity && capacity !== "" && !capacity.toLowerCase().includes("any")) {
                // Extract capacity range for API
                const capacityValue = parseCapacityRange(capacity);
                console.log('Parsed capacity:', capacityValue);
                if (capacityValue.min) searchParams.append('min_capacity', capacityValue.min);
                if (capacityValue.max) searchParams.append('max_capacity', capacityValue.max);
            }
            if (date) {
                searchParams.append('date', date);
                console.log('Added date:', date);
            }
            if (fromTime) {
                searchParams.append('start_time', fromTime);
                console.log('Added start_time:', fromTime);
            }
            if (toTime) {
                searchParams.append('end_time', toTime);
                console.log('Added end_time:', toTime);
            }

            const apiUrl = `http://localhost:8000/api/rooms/search/?${searchParams.toString()}`;
            console.log('API URL:', apiUrl);

            // Make API call with authentication headers
            console.log('Making fetch request to:', apiUrl);
            
            const headers = {
                'Content-Type': 'application/json',
            };
            
            // Add authentication token if available
            const token = localStorage.getItem('authToken');
            if (token) {
                headers['Authorization'] = `Token ${token}`;
                console.log('Added auth token to request');
            } else {
                console.log('No auth token found - making unauthenticated request');
            }
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: headers
            });
            console.log('API Response status:', response.status);
            console.log('API Response headers:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.log('Error response text:', errorText);
                throw new Error(`HTTP error! status: ${response.status}. Response: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('API Response data:', data);

            displaySearchResults(data, {
                roomType,
                roomNumber,
                capacity,
                date,
                fromTime,
                toTime
            });

        } catch (error) {
            console.error('Search error:', error);
            modalTitle.textContent = "Search Error";
            bookingInfo.innerHTML = `
                <div class="error">
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p>Please try again or contact support if the problem persists.</p>
                    <p><strong>Details:</strong> Check the browser console for more information.</p>
                </div>
            `;
        }
    }

    function parseCapacityRange(capacity) {
        const result = { min: null, max: null };
        
        if (capacity.includes('1-10')) {
            result.min = 1;
            result.max = 10;
        } else if (capacity.includes('11-25')) {
            result.min = 11;
            result.max = 25;
        } else if (capacity.includes('26-50')) {
            result.min = 26;
            result.max = 50;
        } else if (capacity.includes('51-100')) {
            result.min = 51;
            result.max = 100;
        } else if (capacity.includes('100+')) {
            result.min = 100;
        }
        
        return result;
    }

    function displaySearchResults(rooms, searchCriteria) {
        // Check if required fields for availability checking are provided
        const hasRequiredFields = searchCriteria.roomNumber && 
                                 searchCriteria.date && 
                                 searchCriteria.fromTime && 
                                 searchCriteria.toTime;
        
        // Check if this is a complete search (all fields filled)
        const isCompleteSearch = searchCriteria.roomType && 
                                searchCriteria.roomNumber && 
                                searchCriteria.capacity && 
                                searchCriteria.date && 
                                searchCriteria.fromTime && 
                                searchCriteria.toTime;

        if (rooms.length === 0) {
            if (!hasRequiredFields) {
                bookingInfo.innerHTML = `
                    <div class="no-results">
                        <h3>Incomplete Search</h3>
                        <p><strong>Required fields for availability checking:</strong></p>
                        <ul>
                            <li>Room Number (required)</li>
                            <li>Date (required)</li>
                            <li>Time From & To (required)</li>
                        </ul>
                        <p><strong>Optional fields:</strong></p>
                        <ul>
                            <li>Room Type (optional)</li>
                            <li>Number of people (optional)</li>
                        </ul>
                        <p>Please fill in the required fields to check room availability.</p>
                    </div>
                `;
            } else {
                modalTitle.textContent = "Room Not Available";
                bookingInfo.innerHTML = `
                    <div class="no-results">
                        <h3>Room Not Available</h3>
                        <p>The selected room is not available for the specified date and time.</p>
                        <p>This could be because:</p>
                        <ul>
                            <li>The room is already booked during this time</li>
                            <li>The room number doesn't exist</li>
                            <li>Try selecting a different time slot</li>
                        </ul>
                    </div>
                `;
            }
            bookNowBtn.style.display = "none";
            return;
        }

        // If it's a complete search, show simple format like the original
        if (isCompleteSearch) {
            const room = rooms[0]; // Take the first matching room
            const formattedDate = new Date(searchCriteria.date).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit', 
                year: 'numeric'
            });
            
            // Convert 24-hour time to 12-hour format
            const formatTime = (time24) => {
                const [hours, minutes] = time24.split(':');
                const hour12 = hours % 12 || 12;
                const ampm = hours >= 12 ? 'PM' : 'AM';
                return `${hour12}:${minutes} ${ampm}`;
            };

            const fromTime12 = formatTime(searchCriteria.fromTime);
            const toTime12 = formatTime(searchCriteria.toTime);

            modalTitle.textContent = "Room Available ✓";
            bookingInfo.innerHTML = `
                <div class="simple-search-result">
                    <h4>Your search:</h4>
                    <p>-Room Type: ${searchCriteria.roomType}</p>
                    <p>-Room: ${searchCriteria.roomNumber}</p>
                    <p>-Number of people: ${searchCriteria.capacity.replace(' people', '')}</p>
                    <p>Date: ${formattedDate}</p>
                    <p>Time: ${fromTime12}-${toTime12}</p>
                    <h3 style="color: #4CAF50; margin-top: 15px;">Available</h3>
                </div>
            `;

            // Show book now button
            bookNowBtn.style.display = "inline-block";
            bookNowBtn.onclick = function () {
                const query = new URLSearchParams({
                    roomId: room.id,
                    roomType: searchCriteria.roomType,
                    roomNumber: searchCriteria.roomNumber,
                    capacity: searchCriteria.capacity,
                    date: searchCriteria.date,
                    fromTime: searchCriteria.fromTime,
                    toTime: searchCriteria.toTime
                }).toString();
                window.location.href = `book_room.html?${query}`;
            };
        } else {
            // Show detailed card format for partial searches
            modalTitle.textContent = `Search Results (${rooms.length} found)`;
            let resultsHTML = `
                <div class="search-results">
                    <div class="room-list">
            `;

            rooms.forEach((room, index) => {
                resultsHTML += `
                    <div class="room-card ${index === 0 ? 'selected' : ''}" data-room-id="${room.id}">
                        <div class="room-header">
                            <h4>${room.roomType} - ${room.roomNumber}</h4>
                            <span class="capacity">${room.capacity} people</span>
                        </div>
                        <div class="room-details">
                            <p><strong>Building:</strong> ${room.buildingName}</p>
                            <p><strong>Location:</strong> ${room.floorName}</p>
                            ${room.amenities_list && room.amenities_list.length > 0 ? `<p><strong>Amenities:</strong> ${room.amenities_list.join(', ')}</p>` : ''}
                            ${room.availability_status ? `<p><strong>Status:</strong> ${room.availability_status}</p>` : ''}
                        </div>
                    </div>
                `;
            });

            resultsHTML += `
                    </div>
                    <div class="search-summary">
                        <h4>Search Criteria:</h4>
                        <p>Showing rooms matching your filters${searchCriteria.date ? ` for ${searchCriteria.date}` : ''}${searchCriteria.fromTime && searchCriteria.toTime ? ` from ${searchCriteria.fromTime} to ${searchCriteria.toTime}` : ''}</p>
                    </div>
                </div>
            `;

            bookingInfo.innerHTML = resultsHTML;

            // Add click handlers for room cards
            document.querySelectorAll('.room-card').forEach(card => {
                card.addEventListener('click', function() {
                    document.querySelectorAll('.room-card').forEach(c => c.classList.remove('selected'));
                    this.classList.add('selected');
                });
            });

            // Show book now button
            bookNowBtn.style.display = "inline-block";
            bookNowBtn.onclick = function () {
                const selectedRoom = document.querySelector('.room-card.selected');
                if (selectedRoom) {
                    const roomId = selectedRoom.dataset.roomId;
                    const query = new URLSearchParams({
                        roomId,
                        roomType: searchCriteria.roomType,
                        roomNumber: searchCriteria.roomNumber,
                        capacity: searchCriteria.capacity,
                        date: searchCriteria.date,
                        fromTime: searchCriteria.fromTime,
                        toTime: searchCriteria.toTime
                    }).toString();
                    window.location.href = `book_room.html?${query}`;
                }
            };
        }
    }

    // Close modal
    if (closeBtn) {
        console.log('Close button found and event listener attached');
        closeBtn.addEventListener("click", function () {
            console.log('Close button clicked');
            hideModal();
        });
    } else {
        console.error('Close button not found! Looking for .close-btn');
    }

    window.addEventListener("click", function (e) {
        if (e.target === modal) {
            hideModal();
        }
    });

    // Global test functions for debugging
    window.testModal = function() {
        console.log('Testing modal show/hide');
        showModal();
        if (modalTitle) modalTitle.textContent = "Test Modal";
        if (bookingInfo) bookingInfo.innerHTML = "This is a test modal";
    };

    window.testSearch = function() {
        console.log('Testing search function');
        searchAvailableRooms();
    };

    // SMART DROPDOWN LOGIC START
    const roomTypeSelect = document.getElementById("roomType");
    const roomNumberSelect = document.getElementById("roomNumber");
    const capacitySelect = document.getElementById("capacity");
    let allRooms = [];

    // Fetch all rooms on page load
    fetch("http://localhost:8000/api/rooms/search/")
      .then(res => res.json())
      .then(data => {
        allRooms = data;
        populateRoomTypeDropdown();
        populateRoomNumberDropdown();
      });

    function populateRoomTypeDropdown() {
      const types = [...new Set(allRooms.map(r => r.roomType))];
      roomTypeSelect.innerHTML = '<option value="">Select Room Type</option>' +
        types.map(type => `<option value="${type}">${type}</option>`).join("");
    }

    function populateRoomNumberDropdown(filteredType) {
      let filteredRooms = allRooms;
      if (filteredType) {
        filteredRooms = allRooms.filter(r => r.roomType === filteredType);
      }
      const numbers = [...new Set(filteredRooms.map(r => r.roomNumber))];
      roomNumberSelect.innerHTML = '<option value="">Select Room Number</option>' +
        numbers.map(num => `<option value="${num}">${num}</option>`).join("");
    }

    function populateCapacityDropdown(filteredType, filteredNumber) {
      let filteredRooms = allRooms;
      if (filteredNumber) {
        filteredRooms = allRooms.filter(r => r.roomNumber === filteredNumber);
      } else if (filteredType) {
        filteredRooms = allRooms.filter(r => r.roomType === filteredType);
      }
      const capacities = [...new Set(filteredRooms.map(r => r.capacity))].sort((a,b)=>a-b);
      capacitySelect.innerHTML = '<option value="">Select Capacity</option>' +
        capacities.map(cap => `<option value="${cap}">${cap} people</option>`).join("");
      // If only one capacity, auto-select it
      if (capacities.length === 1) {
        capacitySelect.value = capacities[0];
      }
    }

    // Event: Room Type changes -> filter room numbers
    roomTypeSelect.addEventListener('change', function() {
      populateRoomNumberDropdown(this.value);
      populateCapacityDropdown(this.value, null);
      roomNumberSelect.value = "";
      capacitySelect.value = "";
    });

    // Event: Room Number changes -> auto-select type/capacity
    roomNumberSelect.addEventListener('change', function() {
      const selectedRoom = allRooms.find(r => r.roomNumber === this.value);
      if (selectedRoom) {
        roomTypeSelect.value = selectedRoom.roomType;
        populateCapacityDropdown(selectedRoom.roomType, selectedRoom.roomNumber);
        capacitySelect.value = selectedRoom.capacity;
      }
    });

    // Event: Capacity changes (optional, for manual override)
    capacitySelect.addEventListener('change', function() {
      // No-op, but could be used for further logic
    });
    // SMART DROPDOWN LOGIC END
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
