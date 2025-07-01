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

    // Back to settings page functionality
    function goBackToSettings() {
        // Navigate directly to setting.html regardless of history
        window.location.href = 'setting.html';
    }

    // Make arrow clickable - using the correct ID 'backButton'
    document.getElementById('backButton').addEventListener('click', goBackToSettings);





    document.addEventListener("DOMContentLoaded", function () {
    const submitBtn = document.querySelector(".form-button");
    const reportTextarea = document.querySelector(".report-form-control");

    submitBtn.addEventListener("click", function () {
        const reportText = reportTextarea.value.trim();

        if (reportText === "") {
            alert("⚠️ Please describe the problem before submitting.");
            return;
        }

        const confirmReport = confirm("📢 Do you want to submit this problem report?\nClick OK to confirm or Cancel to review.");
        
        if (confirmReport) {
            alert("✅ Your problem report has been submitted. Thank you!");
            reportTextarea.value = ""; // Clear after submission
        } else {
            alert("❌ Submission cancelled. You can review or edit your report.");
        }
    });
});
