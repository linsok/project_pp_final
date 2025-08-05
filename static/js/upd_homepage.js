
// Homepage JavaScript - Room type box functionality
document.addEventListener('DOMContentLoaded', function() {
    // Make room type boxes clickable
    const roomTypeBoxes = document.querySelectorAll('.room-type-box');
    const roomTypeSelect = document.getElementById('roomType');
    
    roomTypeBoxes.forEach(box => {
        box.addEventListener('click', function() {
            // Get the room type from the label
            const roomTypeLabel = this.querySelector('.room-type-label');
            const roomType = roomTypeLabel.textContent.trim();
            
            // Set the dropdown value
            if (roomTypeSelect) {
                roomTypeSelect.value = roomType;
                
                // Add visual feedback
                roomTypeBoxes.forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                
                // Optional: Scroll to the search form
                const searchForm = document.querySelector('.horizontal-search-form');
                if (searchForm) {
                    searchForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    });
    
    // Add selected state styling
    const style = document.createElement('style');
    style.textContent = `
        .room-type-box.selected {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(123, 220, 0, 0.3);
            border: 2px solid #7bdc00;
        }
        
        .room-type-box.selected .room-type-label {
            background: #7bdc00;
            color: white;
        }
        
        .room-type-box:hover .room-type-label {
            background: #07203f;
            opacity: 0.9;
        }
    `;
    document.head.appendChild(style);
});
