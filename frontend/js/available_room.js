// Toggle dropdown menu (Sidebar)
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

// Calendar Logic
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = new Date(); // Initially select today

const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const monthYearSpan = document.getElementById('monthYear');
const calendarGrid = document.querySelector('.calendar-grid');
const roomsTableBody = document.getElementById('roomsTableBody');

// Sample room data
const allRooms = [
    {
        date: new Date(2025, 5, 24), // June 24, 2025
        building: 'A',
        room: '101',
        time: '09:00 AM - 10:00 AM',
        status: 'Available'
    },
    {
        date: new Date(2025, 5, 24),
        building: 'B',
        room: '202',
        time: '01:00 PM - 02:00 PM',
        status: 'Available'
    },
    {
        date: new Date(2025, 5, 25),
        building: 'C',
        room: '303',
        time: '10:00 AM - 11:00 AM',
        status: 'Available'
    }
];

function renderCalendar() {
    calendarGrid.innerHTML = ''; // Clear previous days

    // Add day headers (S, M, T, W, T, F, S)
    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    dayHeaders.forEach(day => {
        const headerDiv = document.createElement('div');
        headerDiv.classList.add('day-header');
        headerDiv.textContent = day;
        calendarGrid.appendChild(headerDiv);
    });

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 for Sunday, 1 for Monday...
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Get last day of month

    monthYearSpan.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Add empty cells for days before the 1st of the month
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
        dayCell.dataset.day = day; // Store day in dataset

        const today = new Date();
        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayCell.classList.add('today');
        }

        if (day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear()) {
            dayCell.classList.add('selected');
        }

        dayCell.addEventListener('click', () => {
            // Remove 'selected' from previously selected day
            const prevSelected = document.querySelector('.day-cell.selected');
            if (prevSelected) {
                prevSelected.classList.remove('selected');
            }
            // Add 'selected' to the clicked day
            dayCell.classList.add('selected');
            selectedDate = new Date(currentYear, currentMonth, day);
            updateRoomsTable(selectedDate); // Update rooms based on selected date
        });

        calendarGrid.appendChild(dayCell);
    }
    updateRoomsTable(selectedDate); // Update rooms when calendar is rendered
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

function updateRoomsTable(date) {
    roomsTableBody.innerHTML = ''; // Clear existing rows
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Filter rooms for the selected date
    const roomsForSelectedDate = allRooms.filter(room => {
        return room.date.getDate() === date.getDate() &&
               room.date.getMonth() === date.getMonth() &&
               room.date.getFullYear() === date.getFullYear();
    });

    if (roomsForSelectedDate.length === 0) {
        const noRoomsRow = document.createElement('tr');
        noRoomsRow.innerHTML = `<td colspan="6" style="text-align: center; padding: 20px;">No rooms available for ${formattedDate}</td>`;
        roomsTableBody.appendChild(noRoomsRow);
    } else {
        roomsForSelectedDate.forEach(room => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${room.building}</td>
                <td>${room.room}</td>
                <td>${room.time}</td>
                <td><span class="status-available">${room.status}</span></td>
                <td>
                    <button 
                      class="book-btn" 
                      data-date="${room.date.toISOString()}"
                      data-building="${room.building}"
                      data-room="${room.room}"
                      data-time="${room.time}"
                    >Book Now</button>
                </td>
            `;
            roomsTableBody.appendChild(row);
        });
    }
}

// Event listener for Book Now buttons
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("book-btn")) {
        const btn = e.target;
        const date = new Date(btn.getAttribute("data-date"));
        const building = btn.getAttribute("data-building");
        const room = btn.getAttribute("data-room");
        const time = btn.getAttribute("data-time");

        const [fromTime, toTime] = time.split(" - ");

        const queryParams = new URLSearchParams({
            day: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear(),
            building,
            roomNumber: room,
            fromTime,
            toTime,
        });

        window.location.href = `book_room.html?${queryParams.toString()}`;
    }
});

// Initial render
renderCalendar();
updateRoomsTable(selectedDate);
