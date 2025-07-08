from django.urls import path, include
from .views import (
    ProfileDetail, request_password_reset,
    verify_reset_code, reset_password_with_code, debug_profile,
    RoomSearchView, RoomDetailView, BookingCreateView, UserBookingsView, RoomTypesView,
    ReportProblemCreateView, ReportProblemListView,
    test_api
)

urlpatterns = [
    path('auth/', include('dj_rest_auth.urls')),           # login/logout/password reset
    path('profile/', ProfileDetail.as_view(), name='profile-detail'),
    
    # Room and Booking endpoints
    path('rooms/search/', RoomSearchView.as_view(), name='room-search'),
    path('rooms/<int:pk>/', RoomDetailView.as_view(), name='room-detail'),
    path('rooms/types/', RoomTypesView.as_view(), name='room-types'),
    path('bookings/', BookingCreateView.as_view(), name='booking-create'),
    path('bookings/my/', UserBookingsView.as_view(), name='user-bookings'),
    
    # Report Problem endpoints
    path('reports/', ReportProblemCreateView.as_view(), name='report-create'),
    path('reports/all/', ReportProblemListView.as_view(), name='reports-list'),
    
    # Custom 6-digit password reset endpoints
    path('password/reset/request/', request_password_reset, name='password_reset_request'),
    path('password/reset/verify/', verify_reset_code, name='password_reset_verify'),
    path('password/reset/confirm/', reset_password_with_code, name='password_reset_confirm'),
    
    # Debug endpoint
    path('debug/profile/', debug_profile, name='debug_profile'),

    # Test endpoint
    path('test/', test_api, name='test-api'),
]