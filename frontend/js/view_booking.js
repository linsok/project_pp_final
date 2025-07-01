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



        //Delete function


        document.querySelectorAll('tbody tr').forEach(row => {
    const statusSpan = row.querySelector('td:nth-child(6) span'); // Status cell span
    const deleteBtn = row.querySelector('.delete-btn');
    if (deleteBtn && statusSpan.classList.contains('pending')) {
        // Disable the delete button for pending rows
        deleteBtn.disabled = true;
        deleteBtn.style.opacity = '0.5';
        deleteBtn.style.cursor = 'not-allowed';
        deleteBtn.title = "Cannot delete pending booking";
    }
});


/* Filter 
To implement a working filter that displays:

✅ All bookings

✅ Recent bookings (last 7 days)

✅ Canceled bookings

✅ Pending Confirmation

✅ Confirmed bookings
*/
document.addEventListener("DOMContentLoaded", function () {
    const filter = document.querySelector('.filter-dropdown');
    const rows = document.querySelectorAll('tbody tr');
    const noRecordMsg = document.getElementById('no-record-message');

    function filterRows() {
        const filterValue = filter.value.toLowerCase();
        let visibleCount = 0;

        rows.forEach(row => {
            const statusSpan = row.querySelector('td span.status');
            const statusClass = statusSpan ? statusSpan.classList[1] : '';
            let show = false;

            if (filterValue === "all") {
                show = true;
            } else if (filterValue === "recent") {
                const dateText = row.querySelector('.date-cell').innerText.trim();
                const parts = dateText.split(',')[1].trim().split(' ');
                const rowDate = new Date(`${parts[2]}-${getMonthNumber(parts[1])}-${parts[0]}`);
                const today = new Date();
                rowDate.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
                const diffDays = (today - rowDate) / (1000 * 60 * 60 * 24);
                show = diffDays >= 0 && diffDays <= 7;
            } else {
                show = statusClass.toLowerCase() === filterValue;
            }

            row.style.display = show ? '' : 'none';
            if (show) visibleCount++;
        });

        noRecordMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    function getMonthNumber(monthName) {
        const months = {
            January: '01', February: '02', March: '03', April: '04',
            May: '05', June: '06', July: '07', August: '08',
            September: '09', October: '10', November: '11', December: '12'
        };
        return months[monthName];
    }

    filter.addEventListener('change', filterRows);
    filterRows();
});
