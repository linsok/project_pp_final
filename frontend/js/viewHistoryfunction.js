// Booking History functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Please log in to view your booking history.');
        window.location.href = 'index.html';
        return;
    }

    // Load booking history
    loadBookingHistory();

    async function loadBookingHistory() {
        try {
            console.log('Loading booking history...');
            
            const response = await fetch('http://localhost:8000/api/bookings/my/', {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const bookings = await response.json();
                console.log('Bookings loaded:', bookings);
                displayBookings(bookings);
            } else if (response.status === 401) {
                alert('Your session has expired. Please log in again.');
                localStorage.removeItem('authToken');
                window.location.href = 'index.html';
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error loading booking history:', error);
            showError('Failed to load booking history: ' + error.message);
        }
    }

    function displayBookings(bookings) {
        const container = document.getElementById('bookingHistoryContainer') || createBookingContainer();
        
        if (bookings.length === 0) {
            container.innerHTML = `
                <div class="no-bookings">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Bookings Found</h3>
                    <p>You haven't made any bookings yet.</p>
                    <a href="book_room.html" class="btn btn-primary">Make Your First Booking</a>
                </div>
            `;
            return;
        }

        let html = `
            <div class="booking-stats">
                <h2>Your Booking History</h2>
                <p>Total bookings: ${bookings.length}</p>
            </div>
            <div class="bookings-grid">
        `;

        bookings.forEach(booking => {
            const statusClass = getStatusClass(booking.status);
            const statusIcon = getStatusIcon(booking.status);
            
            html += `
                <div class="booking-card ${statusClass}">
                    <div class="booking-header">
                        <div class="booking-status">
                            <i class="${statusIcon}"></i>
                            <span>${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                        </div>
                        <div class="booking-id">#${booking.id}</div>
                    </div>
                    
                    <div class="booking-details">
                        <div class="booking-room">
                            <i class="fas fa-door-open"></i>
                            <span>Room ${booking.room_details ? booking.room_details.roomNumber : 'N/A'}</span>
                            <small>${booking.room_details ? booking.room_details.buildingName : ''}</small>
                        </div>
                        
                        <div class="booking-date">
                            <i class="fas fa-calendar"></i>
                            <span>${formatDate(booking.booking_date)}</span>
                        </div>
                        
                        <div class="booking-time">
                            <i class="fas fa-clock"></i>
                            <span>${booking.start_time} - ${booking.end_time}</span>
                        </div>
                        
                        ${booking.purpose ? `
                            <div class="booking-purpose">
                                <i class="fas fa-comment"></i>
                                <span>${booking.purpose}</span>
                            </div>
                        ` : ''}
                        
                        <div class="booking-created">
                            <i class="fas fa-calendar-plus"></i>
                            <small>Created: ${formatDateTime(booking.created_at)}</small>
                        </div>
                    </div>
                    
                    <div class="booking-actions">
                        ${booking.status === 'pending' ? `
                            <button class="btn btn-sm btn-danger" onclick="cancelBooking(${booking.id})">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="viewBookingDetails(${booking.id})">
                            <i class="fas fa-eye"></i> Details
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    function createBookingContainer() {
        // Find main content area or create one
        let main = document.querySelector('main');
        if (!main) {
            main = document.createElement('main');
            document.body.appendChild(main);
        }

        const container = document.createElement('div');
        container.id = 'bookingHistoryContainer';
        container.className = 'booking-history-container';
        main.appendChild(container);
        
        return container;
    }

    function getStatusClass(status) {
        const statusClasses = {
            'pending': 'status-pending',
            'confirmed': 'status-confirmed',
            'cancelled': 'status-cancelled',
            'completed': 'status-completed'
        };
        return statusClasses[status] || 'status-default';
    }

    function getStatusIcon(status) {
        const statusIcons = {
            'pending': 'fas fa-clock',
            'confirmed': 'fas fa-check-circle',
            'cancelled': 'fas fa-times-circle',
            'completed': 'fas fa-check-double'
        };
        return statusIcons[status] || 'fas fa-question-circle';
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function showError(message) {
        const container = document.getElementById('bookingHistoryContainer') || createBookingContainer();
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }

    // Global functions for booking actions
    window.cancelBooking = async function(bookingId) {
        if (!confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            // For now, we'll update the status to cancelled
            // In a real app, you'd have a specific cancel endpoint
            const response = await fetch(`http://localhost:8000/api/bookings/${bookingId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'cancelled' })
            });

            if (response.ok) {
                alert('Booking cancelled successfully');
                loadBookingHistory(); // Reload the list
            } else {
                throw new Error('Failed to cancel booking');
            }
        } catch (error) {
            alert('Error cancelling booking: ' + error.message);
        }
    };

    window.viewBookingDetails = function(bookingId) {
        // For now, just show an alert. Could open a modal with more details
        alert(`Viewing details for booking #${bookingId}\n\nThis feature will show detailed booking information.`);
    };
});

            if (filterValue === "Today") {
                show = rowDate.getTime() === today.setHours(0, 0, 0, 0);
            } else if (filterValue === "This Week") {
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                startOfWeek.setHours(0, 0, 0, 0);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);

                show = rowDate >= startOfWeek && rowDate <= endOfWeek;
            } else if (filterValue === "This Month") {
                show = rowDate.getMonth() === today.getMonth() &&
                       rowDate.getFullYear() === today.getFullYear();
            } else {
                // "All Time"
                show = true;
            }

            row.style.display = show ? "" : "none";
        });
    });



/**
 * ================================================
 * Booking History Filter by Date
 * Filters table rows based on selected time range:
 * Today, This Week, This Month, or All Time
 * Shows a message if no bookings are found.
 * ================================================
 */

function getMonthNumber(monthName) {
    const months = {
        January: '01', February: '02', March: '03', April: '04',
        May: '05', June: '06', July: '07', August: '08',
        September: '09', October: '10', November: '11', December: '12'
    };
    return months[monthName];
}

document.addEventListener("DOMContentLoaded", function () {
    const filter = document.querySelector('.filter-dropdown');
    const noRecordMessage = document.getElementById('no-record-message');

    filter.addEventListener('change', function () {
        const filterValue = this.value;
        const rows = document.querySelectorAll('tbody tr');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let visibleCount = 0;

        rows.forEach(row => {
            const dateText = row.querySelector('.date-cell').innerText.trim();
            const parts = dateText.split(',')[1].trim().split(' ');
            const rowDate = new Date(`${parts[2]}-${getMonthNumber(parts[1])}-${parts[0]}`);
            rowDate.setHours(0, 0, 0, 0);

            let show = false;
            if (filterValue === "Today") {
                show = rowDate.getTime() === today.getTime();
            } else if (filterValue === "This Week") {
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                show = rowDate >= startOfWeek && rowDate <= endOfWeek;
            } else if (filterValue === "This Month") {
                show = rowDate.getMonth() === today.getMonth() && rowDate.getFullYear() === today.getFullYear();
            } else {
                show = true; // All Time
            }

            row.style.display = show ? '' : 'none';
            if (show) visibleCount++;
        });

        // Show or hide "no booking" message
        noRecordMessage.style.display = visibleCount === 0 ? 'block' : 'none';
    });
});
