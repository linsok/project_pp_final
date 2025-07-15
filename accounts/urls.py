from django.urls import path, include
from .views import (
    ProfileDetail, request_password_reset,
    verify_reset_code, reset_password_with_code, debug_profile,
    RoomSearchView, RoomDetailView, BookingCreateView, UserBookingsView, BookingDeleteView, RoomTypesView,
    ReportProblemCreateView, ReportProblemListView,
    get_room_building_mapping, test_api, change_email, change_phone, change_password, change_username
)

urlpatterns = [
    path('auth/', include('dj_rest_auth.urls')),           # login/logout/password reset
    path('profile/', ProfileDetail.as_view(), name='profile-detail'),
    
    # Room and Booking endpoints
    path('rooms/search/', RoomSearchView.as_view(), name='room-search'),
    path('rooms/<int:pk>/', RoomDetailView.as_view(), name='room-detail'),
    path('rooms/types/', RoomTypesView.as_view(), name='room-types'),
    path('rooms/building-mapping/', get_room_building_mapping, name='room-building-mapping'),
    path('bookings/', BookingCreateView.as_view(), name='booking-create'),
    path('bookings/my/', UserBookingsView.as_view(), name='user-bookings'),
    path('bookings/<int:pk>/', BookingDeleteView.as_view(), name='booking-delete'),
    
    # Report Problem endpoints
    path('reports/', ReportProblemCreateView.as_view(), name='report-create'),
    path('reports/all/', ReportProblemListView.as_view(), name='reports-list'),
    
    # Custom 6-digit password reset endpoints
    path('password/reset/request/', request_password_reset, name='password_reset_request'),
    path('password/reset/verify/', verify_reset_code, name='password_reset_verify'),
    path('password/reset/confirm/', reset_password_with_code, name='password_reset_confirm'),
    
    # Email change endpoint
    path('change-email/', change_email, name='change_email'),
    
    # Phone change endpoint
    path('change-phone/', change_phone, name='change_phone'),
    
    # Password change endpoint
    path('change-password/', change_password, name='change_password'),
    
    # Username change endpoint
    path('change-username/', change_username, name='change_username'),
    
    # Debug endpoint
    path('debug/profile/', debug_profile, name='debug_profile'),

    # Test endpoint
    path('test/', test_api, name='test-api'),
]