from django.urls import path, include
from .views import (
    ProfileDetail, request_password_reset,
    verify_reset_code, reset_password_with_code, debug_profile,
    RoomSearchView, RoomDetailView, RoomListView, RoomCreateView, RoomUpdateView, RoomDeleteView, BookingCreateView, UserBookingsView, UserBookingHistoryView, AdminBookingsView, BookingDeleteView, RoomTypesView,
    ReportProblemCreateView, ReportProblemListView,
    get_room_building_mapping, test_api, change_email, change_phone, change_password, change_username,
    admin_dashboard_data, admin_stats, update_booking_status, toggle_room_status,
    admin_users_list, toggle_user_admin_status, delete_user, update_admin_account,
    create_backup, list_backups, restore_backup, delete_backup,
    get_notification_settings, update_notification_settings, test_notification_email,
    get_user_notification_settings, update_user_notification_settings, test_user_notification_email,
    admin_recent_bookings, admin_users_table, admin_rooms_table, bookings_by_date, bookings_by_week
)

urlpatterns = [
    path('auth/', include('dj_rest_auth.urls')),           # login/logout/password reset
    path('profile/', ProfileDetail.as_view(), name='profile-detail'),
    
    # Room and Booking endpoints
    path('rooms/', RoomListView.as_view(), name='room-list'),
    path('bookings/date/<str:date_str>/', bookings_by_date, name='bookings-by-date'),
    path('bookings/week/<str:week_start_str>/', bookings_by_week, name='bookings-by-week'),
    path('rooms/create/', RoomCreateView.as_view(), name='room-create'),
    path('rooms/<int:pk>/', RoomUpdateView.as_view(), name='room-update'),
    path('rooms/<int:pk>/delete/', RoomDeleteView.as_view(), name='room-delete'),
    path('rooms/<int:room_id>/toggle/', toggle_room_status, name='room-toggle'),
    path('rooms/search/', RoomSearchView.as_view(), name='room-search'),
    path('rooms/<int:pk>/detail/', RoomDetailView.as_view(), name='room-detail'),
    path('rooms/types/', RoomTypesView.as_view(), name='room-types'),
    path('rooms/building-mapping/', get_room_building_mapping, name='room-building-mapping'),
    path('bookings/', BookingCreateView.as_view(), name='booking-create'),
    path('bookings/my/', UserBookingsView.as_view(), name='user-bookings'),
    path('bookings/history/', UserBookingHistoryView.as_view(), name='user-booking-history'),
    path('bookings/all/', AdminBookingsView.as_view(), name='admin-bookings'),
    path('bookings/<int:pk>/', BookingDeleteView.as_view(), name='booking-delete'),
    path('bookings/<int:booking_id>/status/', update_booking_status, name='update-booking-status'),
    
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

    # Admin dashboard data endpoint
    path('admin/dashboard-data/', admin_dashboard_data, name='admin-dashboard-data'),
    
    # Admin stats endpoint
    path('admin/stats/', admin_stats, name='admin-stats'),
    
    # Admin settings endpoints
    path('admin/users/', admin_users_list, name='admin-users-list'),
    path('admin/users/<int:user_id>/toggle-admin/', toggle_user_admin_status, name='toggle-user-admin'),
    path('admin/users/<int:user_id>/', delete_user, name='delete-user'),
    path('admin/account/', update_admin_account, name='update-admin-account'),
    
    # Backup and restore endpoints
    path('admin/backup/create/', create_backup, name='create-backup'),
    path('admin/backup/list/', list_backups, name='list-backups'),
    path('admin/backup/restore/', restore_backup, name='restore-backup'),
    path('admin/backup/delete/<str:filename>/', delete_backup, name='delete-backup'),
    
    # Notification settings endpoints
    path('admin/notifications/settings/', get_notification_settings, name='get-notification-settings'),
    path('admin/notifications/settings/update/', update_notification_settings, name='update-notification-settings'),
    path('admin/notifications/test-email/', test_notification_email, name='test-notification-email'),
    
    # User notification settings endpoints
    path('notifications/settings/', get_user_notification_settings, name='get-user-notification-settings'),
    path('notifications/settings/update/', update_user_notification_settings, name='update-user-notification-settings'),
    path('notifications/test-email/', test_user_notification_email, name='test-user-notification-email'),
    
    # Admin dashboard table endpoints
    path('admin/recent-bookings/', admin_recent_bookings, name='admin-recent-bookings'),
    path('admin/users/', admin_users_table, name='admin-users-table'),
    path('admin/rooms/', admin_rooms_table, name='admin-rooms-table'),
]