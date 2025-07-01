    
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
    

    //Delete Function
   
    // Delete row functionality
    document.addEventListener('DOMContentLoaded', function () {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const row = this.closest('tr'); // Get the parent row
                row.remove(); // Remove the row from the table
            });
        });
    });



    // Option To make the dropdown filter (Today, This Week, This Month, All Time) work
    document.getElementById('filterDropdown').addEventListener('change', function () {
        const filterValue = this.value;
        const rows = document.querySelectorAll('tbody tr');
        const today = new Date();

        rows.forEach(row => {
            const dateText = row.querySelector('.date-cell').innerText.trim();
            const parts = dateText.split(',')[1].trim().split(' ');
            const rowDate = new Date(`${parts[2]}-${getMonthNumber(parts[1])}-${parts[0]}`);


            // Normalize rowDate (ensure no time)
            rowDate.setHours(0, 0, 0, 0);

            // Set default visible
            let show = false;

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
