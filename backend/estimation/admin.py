"""
Django Admin configuration for ICEMGS
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import (
    User, Material, Project, Floor, Room,
    FinishingDetails, BillOfMaterial, CostHistory
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin"""

    list_display = ['email', 'first_name', 'last_name', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'is_staff', 'created_at']
    search_fields = ['email', 'first_name', 'last_name', 'company_name']
    ordering = ['-created_at']
    readonly_fields = ['last_login', 'date_joined', 'created_at']
    filter_horizontal = ('groups', 'user_permissions',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone_number', 'company_name')}),
        ('Role & Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role', 'first_name', 'last_name'),
        }),
    )


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    """Material admin"""

    list_display = ['name', 'category', 'quality', 'rate', 'unit', 'is_active', 'updated_at']
    list_filter = ['category', 'quality', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    list_editable = ['rate', 'is_active']
    ordering = ['category', 'quality', 'name']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        (None, {'fields': ('name', 'category', 'quality')}),
        ('Pricing', {'fields': ('rate', 'unit')}),
        ('Details', {'fields': ('description', 'is_active')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )

    def save_model(self, request, obj, form, change):
        """Save material and create cost history entry"""
        if change:
            old_obj = Material.objects.get(pk=obj.pk)
            if old_obj.rate != obj.rate:
                CostHistory.objects.create(
                    material=obj,
                    rate=old_obj.rate,
                    notes=f'Updated by {request.user.email} from {old_obj.rate} to {obj.rate}'
                )
        super().save_model(request, obj, form, change)


class RoomInline(admin.TabularInline):
    """Inline admin for rooms"""
    model = Room
    extra = 0
    fields = ['room_type', 'custom_name', 'length', 'width', 'height', 'area']
    readonly_fields = ['area']


class FloorInline(admin.TabularInline):
    """Inline admin for floors"""
    model = Floor
    extra = 0
    fields = ['floor_number', 'floor_type', 'total_area']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Project admin"""

    list_display = ['name', 'user_email', 'status', 'construction_type', 'total_cost_display', 'created_at']
    list_filter = ['status', 'construction_type', 'lda_compliant', 'created_at']
    search_fields = ['name', 'user__email', 'location']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines = [FloorInline]
    ordering = ['-created_at']

    fieldsets = (
        ('Basic Info', {'fields': ('id', 'user', 'name', 'status')}),
        ('Construction Details', {'fields': ('construction_type', 'plot_area', 'plot_unit', 'plot_length', 'plot_width', 'location', 'num_floors', 'total_built_area')}),
        ('Costs', {'fields': ('gray_structure_cost', 'finishing_cost', 'labor_cost', 'total_cost')}),
        ('Compliance', {'fields': ('lda_compliant', 'compliance_notes')}),
        ('Floor Plan', {'fields': ('floor_plan_data',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Owner'

    def total_cost_display(self, obj):
        return format_html('<strong>PKR {:,.0f}</strong>', obj.total_cost)
    total_cost_display.short_description = 'Total Cost'


@admin.register(Floor)
class FloorAdmin(admin.ModelAdmin):
    """Floor admin"""

    list_display = ['project', 'floor_number', 'floor_type', 'total_area', 'room_count']
    list_filter = ['floor_type']
    search_fields = ['project__name']
    inlines = [RoomInline]
    ordering = ['project', 'floor_number']

    def room_count(self, obj):
        return obj.rooms.count()
    room_count.short_description = 'Rooms'


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    """Room admin"""

    list_display = ['floor', 'room_type', 'custom_name', 'area', 'has_attached_bathroom', 'has_balcony']
    list_filter = ['room_type', 'has_attached_bathroom', 'has_balcony']
    search_fields = ['floor__project__name', 'custom_name']
    readonly_fields = ['area']
    ordering = ['floor', 'room_type']


@admin.register(FinishingDetails)
class FinishingDetailsAdmin(admin.ModelAdmin):
    """Finishing details admin"""

    list_display = ['project', 'floor_tiles', 'paint', 'doors', 'windows']
    search_fields = ['project__name']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Project', {'fields': ('project',)}),
        ('Tiles & Paint', {'fields': ('floor_tiles', 'wall_tiles', 'paint')}),
        ('Doors & Windows', {'fields': ('doors', 'door_quantity', 'windows', 'window_quantity')}),
        ('Utilities', {'fields': ('electrical', 'plumbing', 'sanitary')}),
        ('Furniture', {'fields': ('cabinets',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(BillOfMaterial)
class BillOfMaterialAdmin(admin.ModelAdmin):
    """Bill of Material admin"""

    list_display = ['project', 'material', 'category', 'quantity', 'unit', 'rate', 'total_cost_display']
    list_filter = ['category']
    search_fields = ['project__name', 'material__name']
    readonly_fields = ['total_cost']
    ordering = ['project', 'category', 'material']

    def total_cost_display(self, obj):
        return format_html('<strong>PKR {:,.0f}</strong>', obj.total_cost)
    total_cost_display.short_description = 'Total Cost'


@admin.register(CostHistory)
class CostHistoryAdmin(admin.ModelAdmin):
    """Cost history admin"""

    list_display = ['material', 'rate', 'effective_date', 'notes']
    list_filter = ['effective_date', 'material__category']
    search_fields = ['material__name', 'notes']
    readonly_fields = ['id']
    ordering = ['-effective_date']
    date_hierarchy = 'effective_date'
