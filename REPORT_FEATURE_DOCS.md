# Report Problem Feature Documentation

## Overview
The Report Problem feature allows authenticated users to submit problem reports through a web form. Reports are stored in the database and can be viewed by administrators.

## Features

### Frontend Features
- **User-friendly form**: Clean, intuitive interface for problem reporting
- **Character counter**: Real-time character count with visual feedback
- **Validation**: Client-side validation for required fields and minimum character requirements
- **Status messages**: Clear feedback for success, error, and warning states
- **Authentication check**: Ensures user is logged in before allowing submission
- **Loading states**: Visual feedback during form submission

### Backend Features
- **RESTful API**: Clean API endpoints for creating and listing reports
- **Authentication**: Token-based authentication required for submissions
- **Data validation**: Server-side validation for report descriptions
- **Admin interface**: Django admin interface for viewing and managing reports
- **User tracking**: Reports are associated with the user who submitted them

## Technical Implementation

### Database Model
```python
class ReportProblem(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

### API Endpoints
- `POST /api/reports/` - Submit a new problem report
- `GET /api/reports/all/` - List all reports (admin only)

### Frontend Files
- `frontend/report.html` - Report submission form
- `frontend/js/report.js` - JavaScript functionality
- `frontend/css/style.css` - Styling (report-related styles)

### Backend Files
- `accounts/models.py` - ReportProblem model
- `accounts/views.py` - API views for report handling
- `accounts/serializers.py` - ReportProblemSerializer
- `accounts/urls.py` - URL configuration
- `accounts/admin.py` - Admin interface configuration

## How to Use

### For Users
1. Navigate to the report page (`/frontend/report.html`)
2. Ensure you are logged in (authentication required)
3. Fill out the problem description (minimum 10 characters)
4. Click "Submit Report"
5. Receive confirmation of successful submission

### For Administrators
1. Access the Django admin interface at `/admin/`
2. Navigate to "Report Problems" section
3. View all submitted reports with user information and timestamps
4. Search and filter reports as needed

## API Usage

### Submit a Report
```javascript
fetch('/api/reports/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token YOUR_AUTH_TOKEN'
    },
    body: JSON.stringify({
        description: 'Problem description here'
    })
})
```

### Response Format
```json
{
    "message": "Problem report submitted successfully",
    "data": {
        "id": 1,
        "description": "Problem description",
        "created_at": "2025-07-08T18:30:00Z",
        "username": "user123"
    }
}
```

## Security Features
- Authentication required for all submissions
- CSRF protection enabled
- Input validation and sanitization
- Rate limiting (can be added if needed)
- User association for accountability

## Error Handling
- Client-side validation for empty/short descriptions
- Server-side validation for malformed requests
- Graceful handling of network errors
- Clear error messages for users
- Automatic token refresh/re-authentication when needed

## Future Enhancements
- Email notifications for new reports
- Report status tracking (open/in-progress/resolved)
- File attachment support
- Report categories/tags
- User dashboard to view their submitted reports
- Priority levels for reports
- Auto-assignment to support team members
