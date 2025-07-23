// Booking History functionality
document.addEventListener('DOMContentLoaded', function() {
    // Setup navigation menu functionality
    setupNavigationMenu();
    
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
        showMessage('Please log in to view your booking history.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    // Load booking history
    loadBookingHistory();

    async function loadBookingHistory() {
        try {
            console.log('Loading booking history (confirmed and cancelled only)...');
            
            const response = await fetch('http://localhost:8000/api/bookings/history/', {
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
                showMessage('Your session has expired. Please log in again.', 'error');
                localStorage.removeItem('authToken');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error loading booking history:', error);
            showError('Failed to load booking history: ' + error.message);
        }
    }

    function displayBookings(bookings) {
        const container = document.getElementById('bookingHistoryContainer');
        
        if (!container) {
            console.error('Booking history container not found');
            return;
        }
        
        if (bookings.length === 0) {
            container.innerHTML = `
                <div class="no-bookings" style="text-align: center; padding: 60px 20px; color: #64748b;">
                    <i class="fas fa-calendar-times" style="font-size: 4rem; margin-bottom: 20px; color: #cbd5e1;"></i>
                    <h3 style="font-size: 1.5rem; margin-bottom: 10px; color: #374151;">No Confirmed or Cancelled Bookings</h3>
                    <p style="margin-bottom: 20px; font-size: 1.1rem;">You don't have any confirmed or cancelled bookings yet.</p>
                    <p style="margin-bottom: 20px; font-size: 1rem; color: #94a3b8;">Check "View Bookings" to see all your bookings including pending ones.</p>
                    <a href="view_booking.html" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; background: #07203f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px;">
                        <i class="fas fa-eye"></i> View All Bookings
                    </a>
                    <a href="book_room.html" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; background: #7bdc00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        <i class="fas fa-plus"></i> Make New Booking
                    </a>
                </div>
            `;
            return;
        }

        // Create booking table layout
        let html = `
            <div class="booking-stats" style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #07203f, #2c5282); border-radius: 10px; color: white;">
                <h2 style="font-size: 2rem; margin-bottom: 10px; font-weight: 600;">Your Booking History</h2>
                <p style="font-size: 1.1rem; opacity: 0.9;">Showing confirmed and cancelled bookings: ${bookings.length}</p>
                <p style="font-size: 0.9rem; opacity: 0.8; margin-top: 5px;">Pending bookings are shown in "View Bookings"</p>
                <a href="view_booking.html" style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 10px; transition: background-color 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    <i class="fas fa-eye"></i> View All Bookings
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
                        <button onclick="deleteBooking(${booking.id})" style="padding: 6px 12px; font-size: 0.8rem; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: background-color 0.2s; font-weight: 500;" onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'" title="Delete Booking">
                            <i class="fas fa-trash" style="font-size: 0.7rem;"></i>
                            Delete
                        </button>
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

    function getStatusColor(status) {
        const statusColors = {
            'pending': '#fbbf24',
            'confirmed': '#10b981', 
            'cancelled': '#ef4444',
            'completed': '#3b82f6'
        };
        return statusColors[status] || '#6b7280';
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
        // Convert 24-hour format to 12-hour format
        const [hours, minutes] = timeString.split(':');
        const hour12 = parseInt(hours) % 12 || 12;
        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
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

    // Show toast notification messages
    function showMessage(message, type = 'info', duration = 4000) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.toast-message');
        existingMessages.forEach(msg => msg.remove());

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        
        // Set icon based on type
        let icon = 'fas fa-info-circle';
        let bgColor = '#3b82f6';
        
        switch(type) {
            case 'success':
                icon = 'fas fa-check-circle';
                bgColor = '#10b981';
                break;
            case 'error':
                icon = 'fas fa-exclamation-circle';
                bgColor = '#ef4444';
                break;
            case 'warning':
                icon = 'fas fa-exclamation-triangle';
                bgColor = '#f59e0b';
                break;
            default:
                icon = 'fas fa-info-circle';
                bgColor = '#3b82f6';
        }

        messageEl.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${bgColor};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
                font-weight: 500;
                z-index: 9999;
                max-width: 400px;
                animation: slideInRight 0.3s ease-out;
            ">
                <i class="${icon}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 10px;
                    opacity: 0.8;
                " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(messageEl);

        // Auto remove after duration
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => messageEl.remove(), 300);
            }
        }, duration);
    }

    // Show custom confirmation dialog
    function showConfirmDialog(title, message, confirmText = 'OK', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'confirm-modal-overlay';
            overlay.innerHTML = `
                <div class="confirm-modal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.2s ease-out;
                ">
                    <div class="confirm-modal-content" style="
                        background: white;
                        border-radius: 12px;
                        padding: 24px;
                        max-width: 400px;
                        width: 90%;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                        animation: scaleIn 0.2s ease-out;
                    ">
                        <div class="confirm-modal-header" style="
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            margin-bottom: 16px;
                            padding-bottom: 16px;
                            border-bottom: 2px solid #07203f;
                        ">
                            <i class="fas fa-exclamation-triangle" style="
                                color: #ef4444;
                                font-size: 24px;
                            "></i>
                            <h3 style="
                                margin: 0;
                                color: #07203f;
                                font-size: 18px;
                                font-weight: 600;
                            ">${title}</h3>
                        </div>
                        
                        <div class="confirm-modal-body" style="
                            margin-bottom: 24px;
                            color: #374151;
                            line-height: 1.5;
                            font-size: 14px;
                        ">
                            ${message}
                        </div>
                        
                        <div class="confirm-modal-footer" style="
                            display: flex;
                            gap: 12px;
                            justify-content: flex-end;
                        ">
                            <button class="confirm-cancel-btn" style="
                                padding: 10px 20px;
                                border: 2px solid #d1d5db;
                                background: white;
                                color: #374151;
                                border-radius: 6px;
                                cursor: pointer;
                                font-weight: 500;
                                font-size: 14px;
                                transition: all 0.2s;
                            " onmouseover="
                                this.style.background='#f3f4f6';
                                this.style.borderColor='#9ca3af';
                            " onmouseout="
                                this.style.background='white';
                                this.style.borderColor='#d1d5db';
                            ">${cancelText}</button>
                            
                            <button class="confirm-ok-btn" style="
                                padding: 10px 20px;
                                border: none;
                                background: #dc2626;
                                color: white;
                                border-radius: 6px;
                                cursor: pointer;
                                font-weight: 500;
                                font-size: 14px;
                                transition: background-color 0.2s;
                            " onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'">${confirmText}</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Add event listeners
            const cancelBtn = overlay.querySelector('.confirm-cancel-btn');
            const okBtn = overlay.querySelector('.confirm-ok-btn');

            const removeModal = () => {
                overlay.style.animation = 'fadeOut 0.2s ease-in';
                setTimeout(() => overlay.remove(), 200);
            };

            cancelBtn.onclick = () => {
                removeModal();
                resolve(false);
            };

            okBtn.onclick = () => {
                removeModal();
                resolve(true);
            };

            // Close on overlay click
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    removeModal();
                    resolve(false);
                }
            };
        });
    }

    // Global function for deleting bookings
    window.deleteBooking = async function(bookingId) {
        // Show custom confirmation dialog
        const confirmed = await showConfirmDialog(
            'Delete Booking',
            'Are you sure you want to delete this booking? This action cannot be undone.',
            'Delete',
            'Cancel'
        );
        
        if (!confirmed) {
            return;
        }

        try {
            console.log(`Deleting booking ${bookingId}...`);
            
            const response = await fetch(`http://localhost:8000/api/bookings/${bookingId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Show success message
                showMessage('Booking deleted successfully!', 'success');
                
                // Reload the booking history to reflect the changes
                loadBookingHistory();
            } else if (response.status === 404) {
                showMessage('Booking not found. It may have already been deleted.', 'warning');
                // Reload the list anyway to sync the display
                loadBookingHistory();
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
            showMessage('Failed to delete booking: ' + error.message, 'error');
        }
    };

    // Setup navigation menu functionality
    function setupNavigationMenu() {
        // Toggle dropdown menu
        const sidebarToggle = document.getElementById('sidebarToggle');
        const dropdownMenu = document.getElementById('dropdownMenu');
        
        if (sidebarToggle && dropdownMenu) {
            sidebarToggle.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent the click from bubbling up
                dropdownMenu.classList.toggle('active');
            });

            // Close dropdown when clicking anywhere else
            document.addEventListener('click', function() {
                dropdownMenu.classList.remove('active');
            });

            // Prevent dropdown from closing when clicking inside it
            dropdownMenu.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
});
