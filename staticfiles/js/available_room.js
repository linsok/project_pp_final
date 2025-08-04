// Toggle dropdown menu (Sidebar)
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

// Calendar and Room Availability Logic
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = new Date();

const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const monthYearSpan = document.getElementById('monthYear');
const calendarGrid = document.querySelector('.calendar-grid');
const roomAvailabilityBody = document.getElementById('roomAvailabilityBody');
const selectedDateText = document.getElementById('selectedDateText');

// Time slots from 7 AM to 6 PM
const timeSlots = [
    { start: '07:00', end: '08:00', display: '7:00 - 8:00' },
    { start: '08:00', end: '09:00', display: '8:00 - 9:00' },
    { start: '09:00', end: '10:00', display: '9:00 - 10:00' },
    { start: '10:00', end: '11:00', display: '10:00 - 11:00' },
    { start: '11:00', end: '12:00', display: '11:00 - 12:00' },
    { start: '12:00', end: '13:00', display: '12:00 - 13:00' },
    { start: '13:00', end: '14:00', display: '13:00 - 14:00' },
    { start: '14:00', end: '15:00', display: '14:00 - 15:00' },
    { start: '15:00', end: '16:00', display: '15:00 - 16:00' },
    { start: '16:00', end: '17:00', display: '16:00 - 17:00' },
    { start: '17:00', end: '18:00', display: '17:00 - 18:00' }
];

let allRooms = [];
let roomBookings = [];

// Helper: Get day of week as string (e.g., 'monday') from date string 'YYYY-MM-DD'
function getDayOfWeek(dateString) {
    // Parse 'YYYY-MM-DD' as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    // Map Monday as 0, Sunday as 6 for weekly schedule
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    // getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
    // We want: 0=Monday, ..., 5=Saturday, 6=Sunday
    let jsDay = date.getDay();
    let weekDayIndex = (jsDay === 0) ? 6 : jsDay - 1;
    return days[weekDayIndex];
}

// Weekly Schedule Variables
let weeklyBookings = [];
let currentWeekStart = new Date();

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadRoomsFromDatabase();
    renderCalendar();
    updateSelectedDateDisplay();
    initializeWeeklySchedule();
    
    // Set default view to room schedule
    showRoomSchedule();
});

// Schedule Toggle Functions
function showRoomSchedule() {
    // Update button states
    document.getElementById('roomScheduleBtn').classList.add('active');
    document.getElementById('weeklyScheduleBtn').classList.remove('active');
    
    // Show/hide sections
    document.getElementById('roomScheduleSection').classList.add('active');
    document.getElementById('weeklyScheduleSection').classList.remove('active');
}

function showWeeklySchedule() {
    // Update button states
    document.getElementById('weeklyScheduleBtn').classList.add('active');
    document.getElementById('roomScheduleBtn').classList.remove('active');
    
    // Show/hide sections
    document.getElementById('weeklyScheduleSection').classList.add('active');
    document.getElementById('roomScheduleSection').classList.remove('active');
}

// Load rooms from the database
async function loadRoomsFromDatabase() {
    try {
        const response = await fetch('http://localhost:8000/api/rooms/types/');
        if (response.ok) {
            const data = await response.json();
            allRooms = data.rooms || [];
            console.log('Loaded rooms:', allRooms);
            await loadBookingsForDate(selectedDate);
            renderRoomAvailabilityTable();
            populateWeeklyRoomSelector();
            loadWeeklyBookings();
        } else {
            console.error('Failed to load rooms');
            // Fallback to sample data
            useFallbackRoomData();
        }
    } catch (error) {
        console.error('Error loading rooms:', error);
        useFallbackRoomData();
    }
}

function useFallbackRoomData() {
    allRooms = [
        { id: 1, roomNumber: 'A101', buildingName: 'Building A', capacity: 30, roomType: 'Lecture Hall' },
        { id: 2, roomNumber: 'A201', buildingName: 'Building A', capacity: 25, roomType: 'Meeting Room' },
        { id: 3, roomNumber: 'A301', buildingName: 'Building A', capacity: 35, roomType: 'Lecture Hall' },
        { id: 4, roomNumber: 'B101', buildingName: 'Building B', capacity: 40, roomType: 'Lecture Hall' },
        { id: 5, roomNumber: 'B201', buildingName: 'Building B', capacity: 20, roomType: 'Meeting Room' },
        { id: 6, roomNumber: 'B301', buildingName: 'Building B', capacity: 30, roomType: 'Meeting Room' },
        { id: 7, roomNumber: 'C101', buildingName: 'Building C', capacity: 50, roomType: 'Conference Room' },
        { id: 8, roomNumber: 'C201', buildingName: 'Building C', capacity: 45, roomType: 'Conference Room' },
        { id: 9, roomNumber: 'T401', buildingName: 'STEM Building', capacity: 60, roomType: 'Lab' },
        { id: 10, roomNumber: 'T301', buildingName: 'STEM Building', capacity: 55, roomType: 'Lab' },
        { id: 11, roomNumber: 'L101', buildingName: 'Library', capacity: 15, roomType: 'Study Room' },
        { id: 12, roomNumber: 'L201', buildingName: 'Library', capacity: 20, roomType: 'Study Room' },
        { id: 13, roomNumber: '306', buildingName: 'Library', capacity: 12, roomType: 'Study Room' },
        { id: 14, roomNumber: '205', buildingName: 'Building A', capacity: 25, roomType: 'Meeting Room' },
        { id: 15, roomNumber: '107', buildingName: 'Building B', capacity: 18, roomType: 'Meeting Room' }
    ];
    renderRoomAvailabilityTable();
    populateWeeklyRoomSelector();
    loadWeeklyBookings();
}

// Load bookings for a specific date from the backend
async function loadBookingsForDate(date) {
    try {
        if (!date || !(date instanceof Date) || isNaN(date)) {
            console.error('Invalid date provided to loadBookingsForDate:', date);
            roomBookings = [];
            return;
        }

        // Use local date string to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        console.log(`Fetching bookings for date: ${dateStr}`);
        
        const response = await fetch(`http://localhost:8000/api/bookings/date/${dateStr}/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', response.status, errorText);
            throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Successfully loaded bookings:', data);
        
        // Transform the data to match the expected format
        roomBookings = Array.isArray(data) ? data.map(booking => ({
            id: booking.id,
            room_id: booking.room,
            start_time: booking.start_time,
            end_time: booking.end_time,
            status: booking.status || 'confirmed',
            purpose: booking.purpose || '',
            // Add any other fields your frontend expects
            ...booking
        })) : [];
        
    } catch (error) {
        console.error('Error in loadBookingsForDate:', error);
        roomBookings = [];
    }
}

// Generate sample bookings (replace with actual API call later)
function generateSampleBookings(date) {
    const bookings = [];
    const today = new Date();
    
    // Only add bookings for today and future dates
    if (date >= today.setHours(0, 0, 0, 0)) {
        // Add some random bookings
        const purposes = ['Team Meeting', 'Project Discussion', 'Interview', 'Workshop', 'Seminar', 'Training', 'Club Activity', 'Presentation', 'Research Group', 'Faculty Meeting'];
        if (Math.random() > 0.5) {
            bookings.push({
                room_id: allRooms[0]?.id,
                start_time: '09:00',
                end_time: '10:00',
                status: 'confirmed',
                purpose: purposes[Math.floor(Math.random() * purposes.length)]
            });
        }
        if (Math.random() > 0.7) {
            bookings.push({
                room_id: allRooms[1]?.id,
                start_time: '14:00',
                end_time: '15:00',
                status: 'confirmed',
                purpose: purposes[Math.floor(Math.random() * purposes.length)]
            });
        }
    }
    
    return bookings;
}

function renderCalendar() {
    calendarGrid.innerHTML = '';

    // Add day headers
    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    dayHeaders.forEach(day => {
        const headerDiv = document.createElement('div');
        headerDiv.classList.add('day-header');
        headerDiv.textContent = day;
        calendarGrid.appendChild(headerDiv);
    });

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    monthYearSpan.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Add empty cells for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day-cell', 'empty');
        calendarGrid.appendChild(emptyCell);
    }

    // Add day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell');
        dayCell.textContent = day;

        const today = new Date();
        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayCell.classList.add('today');
        }

        if (day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear()) {
            dayCell.classList.add('selected');
        }

        dayCell.addEventListener('click', async () => {
            // Remove previous selection
            const prevSelected = document.querySelector('.day-cell.selected');
            if (prevSelected) {
                prevSelected.classList.remove('selected');
            }
            
            // Add selection to clicked day
            dayCell.classList.add('selected');
            selectedDate = new Date(currentYear, currentMonth, day);
            
            updateSelectedDateDisplay();
            await loadBookingsForDate(selectedDate);
            renderRoomAvailabilityTable();
        });

        calendarGrid.appendChild(dayCell);
    }
}

function renderRoomAvailabilityTable() {
    if (allRooms.length === 0) {
        roomAvailabilityBody.innerHTML = `
            <tr>
                <td colspan="100%" class="room-availability-loading">
                    <i class="fas fa-spinner"></i>
                    <div>Loading room availability...</div>
                </td>
            </tr>
        `;
        return;
    }

    // Update table header with room columns
    const tableHeader = document.querySelector('.room-availability-table thead tr');
    tableHeader.innerHTML = '<th class="time-column">Time</th>';
    
    allRooms.forEach(room => {
        const roomHeader = document.createElement('th');
        roomHeader.className = 'room-header';
        roomHeader.innerHTML = `
            <span class="room-number">${room.roomNumber}</span>
        `;
        tableHeader.appendChild(roomHeader);
    });

    // Create time slot rows
    roomAvailabilityBody.innerHTML = '';
    
    timeSlots.forEach(timeSlot => {
        const row = document.createElement('tr');
        
        // Time column
        const timeCell = document.createElement('td');
        timeCell.className = 'time-slot';
        timeCell.textContent = timeSlot.display;
        row.appendChild(timeCell);
        
        // Room availability columns
        allRooms.forEach(room => {
            const roomCell = document.createElement('td');
            roomCell.className = 'room-cell';
            
            // Check if room is booked at this time (compare only HH:MM)
            const booking = roomBookings.find(booking => 
                booking.room_id === room.id && 
                booking.start_time && booking.start_time.slice(0,5) === timeSlot.start &&
                booking.status === "confirmed"
            );
            
            // Check if the time slot is in the past
            const now = new Date();
            const slotDateTime = new Date(selectedDate);
            const [hours, minutes] = timeSlot.start.split(':');
            slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const isPast = slotDateTime < now;
            
            if (isPast) {
                roomCell.className += ' unavailable';
                roomCell.innerHTML = '<small style="opacity: 0.6;">Past</small>';
            } else if (booking) {
                roomCell.className += ' booked';
                let agenda = booking.purpose || booking.meetingAgenda || booking.agenda || '';
                let agendaHtml = agenda ? `<div class='booking-purpose' style='font-size: 0.85em; color: #333; margin-top: 2px; word-break: break-word;'><i class="fas fa-info-circle" style="color:#007bff;"></i> ${agenda}</div>` : '';
                roomCell.innerHTML = `<small style='font-weight: 600;'>Booked</small>${agendaHtml}`;
            } else {
                roomCell.className += ' available';
                // Pass the selectedDate (the date used for fetching) to the booking form
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                roomCell.innerHTML = `
                    <button class="book-cell-btn" 
                            onclick="bookRoom('${room.id}', '${room.roomNumber}', '${room.buildingName}', '${timeSlot.start}', '${timeSlot.end}', '${dateStr}')">
                        Book Now
                    </button>
                `;
            }
            
            row.appendChild(roomCell);
        });
        
        roomAvailabilityBody.appendChild(row);
    });
}

function updateSelectedDateDisplay() {
    const formattedDate = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    selectedDateText.textContent = formattedDate;
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    // If selectedDate is not in the new month, select the 1st
    if (selectedDate.getMonth() !== currentMonth || selectedDate.getFullYear() !== currentYear) {
        selectedDate = new Date(currentYear, currentMonth, 1);
    }
    renderCalendar();
    updateSelectedDateDisplay();
    loadBookingsForDate(selectedDate).then(renderRoomAvailabilityTable);
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    // If selectedDate is not in the new month, select the 1st
    if (selectedDate.getMonth() !== currentMonth || selectedDate.getFullYear() !== currentYear) {
        selectedDate = new Date(currentYear, currentMonth, 1);
    }
    renderCalendar();
    updateSelectedDateDisplay();
    loadBookingsForDate(selectedDate).then(renderRoomAvailabilityTable);
}

// Book room function
// Accept dateStr as an optional argument for explicit date passing
function bookRoom(roomId, roomNumber, buildingName, startTime, endTime, dateStr) {
    let bookingDate = dateStr;
    if (!bookingDate) {
        // fallback to selectedDate if not provided
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        bookingDate = `${year}-${month}-${day}`;
    }
    // Convert 24-hour format to 12-hour for display
    const formatTime = (time24) => {
        const [hours, minutes] = time24.split(':');
        const hour12 = parseInt(hours) % 12 || 12;
        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
    };
    const queryParams = new URLSearchParams({
        roomNumber: roomNumber,
        building: buildingName,
        date: bookingDate,
        timeFrom: startTime,
        timeTo: endTime
    });
    window.location.href = `book_room.html?${queryParams.toString()}`;
}

// Book room function for weekly schedule
// Accept dateStr as an optional argument for explicit date passing
function bookRoomWeekly(roomId, roomNumber, buildingName, startTime, endTime, dayIndex, dateStr) {
    let selectedDateStr = dateStr;
    if (!selectedDateStr) {
        // fallback to old logic if not provided
        const bookingDate = new Date(currentWeekStart);
        bookingDate.setDate(currentWeekStart.getDate() + dayIndex);
        const year = bookingDate.getFullYear();
        const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
        const dayNum = String(bookingDate.getDate()).padStart(2, '0');
        selectedDateStr = `${year}-${month}-${dayNum}`;
    }
    // Convert 24-hour format to 12-hour for display
    const formatTime = (time24) => {
        const [hours, minutes] = time24.split(':');
        const hour12 = parseInt(hours) % 12 || 12;
        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
    };
    const queryParams = new URLSearchParams({
        roomNumber: roomNumber,
        building: buildingName,
        date: selectedDateStr,
        startTime: startTime,
        endTime: endTime,
        fromTime: formatTime(startTime),
        toTime: formatTime(endTime)
    });
    window.location.href = `book_room.html?${queryParams.toString()}`;
}

// Weekly Schedule Functions

// Add week navigation
function goToPreviousWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    updateWeeklyScheduleUI(true);
}

function goToNextWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    updateWeeklyScheduleUI(true);
}

function updateWeeklyScheduleUI(preserveRoomSelection = false) {
    const roomSelect = document.getElementById('weeklyRoomSelect');
    let selectedRoomId = roomSelect && roomSelect.value ? roomSelect.value : '';
    populateWeeklyRoomSelector(); // repopulate in case room list changes
    loadWeeklyBookings();
    // Restore previous selection if needed
    if (preserveRoomSelection && roomSelect && selectedRoomId) {
        roomSelect.value = selectedRoomId;
    }
    // If a room is selected, re-render the schedule
    if (roomSelect && roomSelect.value) {
        renderWeeklySchedule(parseInt(roomSelect.value));
    } else {
        document.getElementById('weeklyScheduleBody').innerHTML = '';
    }
    // Update week label
    updateWeekLabel();
}

function updateWeekLabel() {
    const weekLabel = document.getElementById('weekLabel');
    if (!weekLabel) return;
    const monday = new Date(currentWeekStart);
    const sunday = new Date(currentWeekStart);
    sunday.setDate(monday.getDate() + 5); // Saturday
    weekLabel.textContent = `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`;
}

// Initialize weekly schedule
function initializeWeeklySchedule() {
    // Set current week start to Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
    currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() + mondayOffset);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    // Add week navigation buttons if not already present
    const weekNavContainer = document.getElementById('weekNavContainer');
    if (weekNavContainer && weekNavContainer.children.length === 0) {
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
        prevBtn.onclick = goToPreviousWeek;
        weekNavContainer.appendChild(prevBtn);
        
        const weekLabel = document.createElement('span');
        weekLabel.id = 'weekLabel';
        weekLabel.style.margin = '0 10px';
        weekNavContainer.appendChild(weekLabel);
        
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fas fa-arrow-right"></i>';
        nextBtn.onclick = goToNextWeek;
        weekNavContainer.appendChild(nextBtn);
    }
    updateWeeklyScheduleUI();
}

// Populate room selector dropdown
function populateWeeklyRoomSelector() {
    const roomSelect = document.getElementById('weeklyRoomSelect');
    if (!roomSelect) return;
    
    // Clear existing options except the first one
    roomSelect.innerHTML = '<option value="">Choose a room</option>';
    
    // Add room options
    allRooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = `${room.roomNumber} - ${room.buildingName}`;
        roomSelect.appendChild(option);
    });
    
    // Add event listener for room selection
    roomSelect.addEventListener('change', function() {
        if (this.value) {
            renderWeeklySchedule(parseInt(this.value));
        } else {
            // Clear the table if no room selected
            document.getElementById('weeklyScheduleBody').innerHTML = '';
        }
    });
}

// Load weekly bookings from the database
async function loadWeeklyBookings() {
    try {
        if (!currentWeekStart) {
            currentWeekStart = getStartOfWeek(new Date());
        }
        
        const weekStart = currentWeekStart.toISOString().split('T')[0];
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        
        console.log(`Fetching weekly bookings from ${weekStart} to ${weekEndStr}`);
        
        const response = await fetch(`http://localhost:8000/api/bookings/week/${weekStart}/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', response.status, errorText);
            throw new Error(`Failed to fetch weekly bookings: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Successfully loaded weekly bookings:', data);
        
        // Transform the data to match the expected format
        weeklyBookings = Array.isArray(data) ? data.map(booking => ({
            id: booking.id,
            room_id: booking.room_id, // FIX: use room_id from backend
            day: getDayOfWeek(booking.booking_date), // Convert date to day name
            start_time: booking.start_time,
            end_time: booking.end_time,
            status: booking.status || 'confirmed',
            purpose: booking.purpose || '',
            meetingAgenda: booking.meeting_agenda || booking.purpose || '',
            // Add any other fields your frontend expects
            ...booking
        })) : [];
        
        // Update the UI if a room is already selected
        const roomSelect = document.getElementById('weeklyRoomSelect');
        if (roomSelect && roomSelect.value) {
            renderWeeklySchedule(parseInt(roomSelect.value));
        }
        
    } catch (error) {
        console.error('Error in loadWeeklyBookings:', error);
        weeklyBookings = [];
    }
}

// Generate sample weekly bookings
function generateSampleWeeklyBookings() {
    const bookings = [];
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    const purposes = ['Class Lecture', 'Group Study', 'Faculty Meeting', 'Club Event', 'Workshop', 'Seminar', 'Training', 'Presentation', 'Research Group', 'Interview'];
    allRooms.forEach(room => {
        daysOfWeek.forEach((day, dayIndex) => {
            // Add some random bookings for demonstration
            if (Math.random() > 0.7) {
                const randomTimeIndex = Math.floor(Math.random() * timeSlots.length);
                bookings.push({
                    room_id: room.id,
                    day: day,
                    dayIndex: dayIndex,
                    start_time: timeSlots[randomTimeIndex].start,
                    end_time: timeSlots[randomTimeIndex].end,
                    status: 'confirmed',
                    user: 'Sample User',
                    purpose: purposes[Math.floor(Math.random() * purposes.length)]
                });
            }
        });
    });
    
    return bookings;
}

// Render weekly schedule for selected room
function renderWeeklySchedule(roomId) {
    const weeklyBody = document.getElementById('weeklyScheduleBody');
    if (!weeklyBody) return;
    
    const selectedRoom = allRooms.find(room => room.id === roomId);
    if (!selectedRoom) return;
    
    weeklyBody.innerHTML = '';
    
    console.log('DEBUG: weeklyBookings', weeklyBookings);
    timeSlots.forEach(timeSlot => {
        const row = document.createElement('tr');
        // Time column
        const timeCell = document.createElement('td');
        timeCell.className = 'time-slot';
        timeCell.textContent = timeSlot.display;
        row.appendChild(timeCell);
        // Day columns (Monday to Saturday)
        const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        daysOfWeek.forEach((day, dayIndex) => {
            const dayCell = document.createElement('td');
            dayCell.className = 'day-cell';
            // Debug log for matching
            const matches = weeklyBookings.filter(booking =>
                booking.room_id === roomId &&
                booking.day === day &&
                booking.start_time && booking.start_time.slice(0,5) === timeSlot.start &&
                booking.status === "confirmed"
            );
            if (matches.length > 0) {
                console.log(`DEBUG: Found booking(s) for room ${roomId}, day ${day}, time ${timeSlot.start}:`, matches);
            }
            // Check if room is booked at this time on this day
            const booking = matches[0];
            // Get the date for this day
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + dayIndex);
            // Check if the time slot is in the past
            const now = new Date();
            const slotDateTime = new Date(date);
            const [hours, minutes] = timeSlot.start.split(':');
            slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            const isPast = slotDateTime < now;
            if (isPast) {
                dayCell.className += ' unavailable';
                dayCell.innerHTML = '<small style="opacity: 0.6;">Past</small>';
            } else if (booking) {
                dayCell.className += ' booked';
                // Show 'Booked' and the purpose/agenda if available
                let agenda = booking.meetingAgenda || booking.purpose || booking.agenda || '';
                let agendaHtml = agenda ? `<div class='booking-purpose' style='font-size: 0.85em; color: #333; margin-top: 2px; word-break: break-word;'><i class="fas fa-info-circle" style="color:#007bff;"></i> ${agenda}</div>` : '';
                dayCell.innerHTML = `<div style='font-weight:600;'>Booked</div>${agendaHtml}`;
            } else {
                dayCell.className += ' available';
                // Auto-fill like Room Booking Schedule
                dayCell.innerHTML = `
                    <button class="book-cell-btn" 
                            onclick="bookRoomWeekly('${selectedRoom.id}', '${selectedRoom.roomNumber}', '${selectedRoom.buildingName}', '${timeSlot.start}', '${timeSlot.end}', ${dayIndex})">
                        Book Now
                    </button>
                `;
            }
            row.appendChild(dayCell);
        });
        weeklyBody.appendChild(row);
    });
}
