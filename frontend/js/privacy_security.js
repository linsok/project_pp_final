 // Function to make fields editable
        function makeEditable(valueElement, inputElement, saveButton) {
            valueElement.addEventListener('click', function() {
                // Hide the value and show the input field
                valueElement.style.display = 'none';
                inputElement.style.display = 'inline-block';
                saveButton.style.display = 'inline-block';
                inputElement.focus();
            });

            saveButton.addEventListener('click', function() {
                // Update the value and hide the input field
                if (inputElement.value.trim() !== '') {
                    if (inputElement.type === 'password') {
                        valueElement.textContent = '••••••••';
                    } else {
                        valueElement.textContent = inputElement.value;
                    }
                }
                valueElement.style.display = 'inline-block';
                inputElement.style.display = 'none';
                saveButton.style.display = 'none';
            });

            // Also save when pressing Enter
            inputElement.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    saveButton.click();
                }
            });
        }

        // Initialize editable fields
        makeEditable(
            document.getElementById('emailValue'),
            document.getElementById('emailInput'),
            document.getElementById('saveEmail')
        );

        makeEditable(
            document.getElementById('phoneValue'),
            document.getElementById('phoneInput'),
            document.getElementById('savePhone')
        );

        makeEditable(
            document.getElementById('passwordValue'),
            document.getElementById('passwordInput'),
            document.getElementById('savePassword')
        );

        makeEditable(
            document.getElementById('nameValue'),
            document.getElementById('nameInput'),
            document.getElementById('saveName')
        );

        // Back to settings page functionality
        function goBackToSettings() {
            // Navigate directly to setting.html regardless of history
            window.location.href = 'setting.html';
        }

        // Make arrow clickable
        document.getElementById('backArrow').addEventListener('click', goBackToSettings);

        // Make header text clickable
        document.getElementById('backToSettingsFromPrivacy').addEventListener('click', function(e) {
            // Only trigger if clicking on the header text (not the arrow or other elements)
            if (e.target === this) {
                goBackToSettings();
            }
        });