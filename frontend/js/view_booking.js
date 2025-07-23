// Sidebar menu toggle logic
if (document.getElementById('sidebarToggle') && document.getElementById('dropdownMenu')) {
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
}

// View Booking functionality - Shows all bookings regardless of status
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
        showMessage('Please log in to view your bookings.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    // Load all bookings
    loadAllBookings();

    async function loadAllBookings() {
        try {
            console.log('Loading all bookings...');
            
            const response = await fetch('http://localhost:8000/api/bookings/my/', {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const bookings = await response.json();
                console.log('All bookings loaded:', bookings);
                displayAllBookings(bookings);
            } else if (response.status === 401) {
                showMessage('Your session has expired. Please log in again.', 'error');
                localStorage.removeItem('authToken');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error loading all bookings:', error);
            showError('Failed to load bookings: ' + error.message);
        }
    }

    function displayAllBookings(bookings) {
        const container = document.getElementById('bookingHistoryContainer');
        
        if (!container) {
            console.error('Booking history container not found');
            return;
        }
        
        if (bookings.length === 0) {
            container.innerHTML = `
                <div class="no-bookings" style="text-align: center; padding: 60px 20px; color: #64748b;">
                    <i class="fas fa-calendar-times" style="font-size: 4rem; margin-bottom: 20px; color: #cbd5e1;"></i>
                    <h3 style="font-size: 1.5rem; margin-bottom: 10px; color: #374151;">No Bookings Found</h3>
                    <p style="margin-bottom: 20px; font-size: 1.1rem;">You haven't made any bookings yet.</p>
                    <a href="book_room.html" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; background: #07203f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        <i class="fas fa-plus"></i> Make Your First Booking
                    </a>
                </div>
            `;
            return;
        }

        // Count bookings by status
        const statusCounts = {
            pending: bookings.filter(b => b.status === 'pending').length,
            confirmed: bookings.filter(b => b.status === 'confirmed').length,
            cancelled: bookings.filter(b => b.status === 'cancelled').length,
            completed: bookings.filter(b => b.status === 'completed').length
        };

        // Create booking table layout
        let html = `
            <div class="booking-stats" style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #07203f, #2c5282); border-radius: 10px; color: white;">
                <h2 style="font-size: 2rem; margin-bottom: 10px; font-weight: 600;">View All Bookings</h2>
                <p style="font-size: 1.1rem; opacity: 0.9;">Total bookings: ${bookings.length}</p>
                <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px; flex-wrap: wrap;">
                    <div style="background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 6px;">
                        <span style="font-weight: 600;">Pending: ${statusCounts.pending}</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 6px;">
                        <span style="font-weight: 600;">Confirmed: ${statusCounts.confirmed}</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 6px;">
                        <span style="font-weight: 600;">Cancelled: ${statusCounts.cancelled}</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 6px;">
                        <span style="font-weight: 600;">Completed: ${statusCounts.completed}</span>
                    </div>
                </div>
                <a href="booking_history.html" style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 15px; transition: background-color 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    <i class="fas fa-history"></i> View Booking History
                </a>
            </div>
            
            <div class="table-container" style="background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); overflow: hidden; overflow-x: auto;">
                <table class="booking-table" style="width: 100%; border-collapse: collapse; min-width: 800px;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #07203f, #2c5282); color: white;">
                            <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 0.9rem; border-bottom: 2px solid #7bdc00;">Date</th>
                            <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 0.9rem; border-bottom: 2px solid #7bdc00;">Building</th>
                            <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 0.9rem; border-bottom: 2px solid #7bdc00;">Room</th>
                            <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 0.9rem; border-bottom: 2px solid #7bdc00;">Time</th>
                            <th style="padding: 15px 12px; text-align: left; font-weight: 600; font-size: 0.9rem; border-bottom: 2px solid #7bdc00;">Purpose</th>
                            <th style="padding: 15px 12px; text-align: center; font-weight: 600; font-size: 0.9rem; border-bottom: 2px solid #7bdc00;">Status</th>
                            <th style="padding: 15px 12px; text-align: center; font-weight: 600; font-size: 0.9rem; border-bottom: 2px solid #7bdc00;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        bookings.forEach((booking, index) => {
            const statusIcon = getStatusIcon(booking.status);
            const statusColor = getStatusColor(booking.status);
            const rowBg = index % 2 === 0 ? '#f8fafc' : 'white';
            
            html += `
                <tr style="background: ${rowBg}; transition: background-color 0.2s ease;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='${rowBg}'">
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; color: #374151;">
                        <div style="font-weight: 500;">${formatDateShort(booking.booking_date)}</div>
                        <div style="font-size: 0.8rem; color: #64748b;">${formatDateDay(booking.booking_date)}</div>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; color: #374151; font-weight: 500;">
                        ${booking.room_details ? booking.room_details.buildingName : 'N/A'}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; color: #1e293b; font-weight: 600;">
                        ${booking.room_details ? booking.room_details.roomNumber : 'N/A'}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; color: #374151;">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-clock" style="color: #64748b; font-size: 0.8rem;"></i>
                            <span style="font-weight: 500;">${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</span>
                        </div>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; color: #6b7280; max-width: 200px;">
                        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${booking.purpose || 'No purpose specified'}">
                            ${booking.purpose || 'No purpose specified'}
                        </div>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                        <span class="status-badge" style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 20px; font-size: 0.8rem; font-weight: 500; background: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40;">
                            <i class="${statusIcon}" style="font-size: 0.7rem;"></i>
                            ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                        ${booking.status === 'pending' ? 
                            `<button disabled style="padding: 6px 12px; font-size: 0.8rem; background: #9ca3af; color: white; border: none; border-radius: 4px; cursor: not-allowed; display: inline-flex; align-items: center; gap: 5px; font-weight: 500;" title="Cannot delete pending booking">
                                <i class="fas fa-clock" style="font-size: 0.7rem;"></i>
                                Pending
                            </button>` :
                            `<button onclick="deleteBooking(${booking.id})" style="padding: 6px 12px; font-size: 0.8rem; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: background-color 0.2s; font-weight: 500;" onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'" title="Delete Booking">
                                <i class="fas fa-trash" style="font-size: 0.7rem;"></i>
                                Delete
                            </button>`
                        }
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
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

    function getStatusColor(status) {
        const statusColors = {
            'pending': '#fbbf24',
            'confirmed': '#10b981', 
            'cancelled': '#ef4444',
            'completed': '#3b82f6'
        };
        return statusColors[status] || '#6b7280';
    }

    function formatDateShort(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function formatDateDay(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long'
        });
    }

    function formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    function showError(message) {
        const container = document.getElementById('bookingHistoryContainer');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc2626;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <h3 style="margin-bottom: 10px;">Error Loading Bookings</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    function showMessage(message, type = 'info', duration = 4000) {
        // Create toast message
        const messageEl = document.createElement('div');
        messageEl.className = `message-toast message-${type}`;
        messageEl.style.position = 'fixed';
        messageEl.style.top = '20px';
        messageEl.style.right = '20px';
        messageEl.style.zIndex = '10000';
        messageEl.style.background = 'white';
        messageEl.style.padding = '16px';
        messageEl.style.borderRadius = '8px';
        messageEl.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        messageEl.style.borderLeft = `4px solid ${type === 'error' ? '#dc2626' : type === 'success' ? '#10b981' : '#3b82f6'}`;
        messageEl.style.transform = 'translateX(100%)';
        messageEl.style.transition = 'transform 0.3s ease';
        
        const icon = type === 'error' ? 'fa-exclamation-circle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
        const color = type === 'error' ? '#dc2626' : type === 'success' ? '#10b981' : '#3b82f6';
        
        messageEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas ${icon}" style="color: ${color};"></i>
                <span style="color: #333;">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #999; cursor: pointer; padding: 4px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(messageEl);
        
        // Show with animation
        setTimeout(() => messageEl.style.transform = 'translateX(0)', 10);
        
        // Auto hide
        setTimeout(() => {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => messageEl.remove(), 300);
        }, duration);
    }
});

// Global function for deleting bookings
async function deleteBooking(bookingId) {
    if (!confirm('Are you sure you want to delete this booking?')) {
        return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Please log in to delete bookings.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:8000/api/bookings/${bookingId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Reload the page to show updated bookings
            window.location.reload();
        } else {
            const error = await response.json();
            alert(`Failed to delete booking: ${error.detail || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Failed to delete booking. Please try again.');
    }
}
