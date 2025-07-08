from django.contrib import admin
from .models import Room, ReportProblem

admin.site.register(Room)

@admin.register(ReportProblem)
class ReportProblemAdmin(admin.ModelAdmin):
    list_display = ['user', 'description', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'user__email', 'description']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
