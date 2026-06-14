"""
Models for ICEMGS - Intelligent Construction Estimation and Map Generator System
"""
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication"""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom User model with role-based access"""

    ROLE_CHOICES = [
        ('homeowner', 'Homeowner'),
        ('contractor', 'Contractor'),
        ('student', 'Architecture Student'),
        ('admin', 'Administrator'),
    ]

    username = None  # Remove username field
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='homeowner')
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    company_name = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def delete(self, *args, **kwargs):
        """Override delete to clean up ALL related records across all tables,
        including allauth EmailAddress and auth tokens that Django's CASCADE
        doesn't automatically handle."""
        # Clean up allauth email address records
        try:
            from allauth.account.models import EmailAddress
            EmailAddress.objects.filter(user=self).delete()
        except Exception:
            pass

        # Clean up auth tokens
        try:
            from rest_framework.authtoken.models import Token
            Token.objects.filter(user=self).delete()
        except Exception:
            pass

        # Clean up OTP verification records
        try:
            OTPVerification.objects.filter(user=self).delete()
        except Exception:
            pass

        # Now delete the user (CASCADE will handle projects, floors, rooms, etc.)
        return super().delete(*args, **kwargs)

    def __str__(self):
        return self.email


class OTPVerification(models.Model):
    """OTP Verification model for email confirmation"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='otp_verification')
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'otp_verifications'
        verbose_name = 'OTP Verification'
        verbose_name_plural = 'OTP Verifications'

    def is_expired(self):
        return timezone.now() > self.created_at + timezone.timedelta(minutes=10)

    def __str__(self):
        return f"OTP for {self.user.email}"


class Material(models.Model):
    """Material catalog with pricing"""

    CATEGORY_CHOICES = [
        ('floor_tiles', 'Floor Tiles'),
        ('wall_tiles', 'Wall Tiles'),
        ('paint', 'Paint'),
        ('doors', 'Doors'),
        ('windows', 'Windows'),
        ('electrical', 'Electrical'),
        ('plumbing', 'Plumbing'),
        ('sanitary', 'Sanitary'),
        ('cabinets', 'Cabinets'),
        ('cement', 'Cement'),
        ('steel', 'Steel'),
        ('bricks', 'Bricks'),
        ('sand', 'Sand'),
        ('gravel', 'Gravel'),
        ('other', 'Other'),
    ]

    QUALITY_CHOICES = [
        ('standard', 'Standard'),
        ('good', 'Good'),
        ('premium', 'Premium'),
    ]

    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    quality = models.CharField(max_length=20, choices=QUALITY_CHOICES, default='standard')
    unit = models.CharField(max_length=50, default='sqft')
    rate = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_price_locked = models.BooleanField(default=False, help_text='If True, price will not be overwritten by API/scraper sync')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'materials'
        ordering = ['category', 'quality', 'name']
        verbose_name = 'Material'
        verbose_name_plural = 'Materials'

    def __str__(self):
        return f"{self.name} ({self.quality}) - PKR {self.rate}/{self.unit}"


class Project(models.Model):
    """Construction project details"""

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    CONSTRUCTION_TYPE_CHOICES = [
        ('gray', 'Gray Structure Only'),
        ('full', 'Full Construction'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    construction_type = models.CharField(max_length=20, choices=CONSTRUCTION_TYPE_CHOICES)

    # Plot Details
    plot_area = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    plot_unit = models.CharField(max_length=20, default='marla')
    plot_length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    plot_width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    plot_marlas = models.CharField(max_length=50, blank=True, null=True)
    marla_size = models.CharField(max_length=50, blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)

    # Building Details
    num_floors = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    total_built_area = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Cost Summary
    gray_structure_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    finishing_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    labor_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Compliance
    lda_compliant = models.BooleanField(default=False)
    compliance_notes = models.TextField(blank=True, null=True)
    front_setback = models.CharField(max_length=50, blank=True, null=True)
    rear_setback = models.CharField(max_length=50, blank=True, null=True)
    side_setbacks = models.CharField(max_length=50, blank=True, null=True)
    max_height = models.CharField(max_length=50, blank=True, null=True)
    coverage_ratio = models.CharField(max_length=50, blank=True, null=True)

    # 2D Floor Plan
    floor_plan_data = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'

    def __str__(self):
        return f"{self.name} - {self.user.email}"


class Floor(models.Model):
    """Individual floor details within a project"""

    FLOOR_TYPE_CHOICES = [
        ('ground', 'Ground Floor'),
        ('first', 'First Floor'),
        ('second', 'Second Floor'),
        ('third', 'Third Floor'),
        ('basement', 'Basement'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='floors')
    floor_number = models.IntegerField(validators=[MinValueValidator(0)])
    floor_type = models.CharField(max_length=20, choices=FLOOR_TYPE_CHOICES)
    total_area = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        db_table = 'floors'
        ordering = ['floor_number']
        unique_together = ['project', 'floor_number']
        verbose_name = 'Floor'
        verbose_name_plural = 'Floors'

    def __str__(self):
        return f"{self.project.name} - Floor {self.floor_number}"


class Room(models.Model):
    """Room details for each floor"""

    ROOM_TYPE_CHOICES = [
        ('bedroom', 'Bedroom'),
        ('bathroom', 'Bathroom'),
        ('powder_room', 'Powder Room'),
        ('kitchen', 'Kitchen'),
        ('living_room', 'Living Room'),
        ('drawing_room', 'Drawing Room'),
        ('dining_room', 'Dining Room'),
        ('guest_room', 'Guest Room'),
        ('study_room', 'Study Room'),
        ('store_room', 'Store Room'),
        ('balcony', 'Balcony'),
        ('terrace', 'Terrace'),
        ('garage', 'Garage'),
        ('mumty', 'Mumty'),
        ('spiral_stairs', 'Spiral Stairs'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE, related_name='rooms')
    room_type = models.CharField(max_length=50, choices=ROOM_TYPE_CHOICES)
    custom_name = models.CharField(max_length=100, blank=True, null=True)
    size = models.CharField(max_length=20, default='none')
    length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    height = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=10, validators=[MinValueValidator(0)])
    area = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Additional features
    has_attached_bathroom = models.BooleanField(default=False)
    has_balcony = models.BooleanField(default=False)
    has_parapet_walls = models.BooleanField(default=False)

    class Meta:
        db_table = 'rooms'
        ordering = ['floor', 'room_type']
        verbose_name = 'Room'
        verbose_name_plural = 'Rooms'

    def save(self, *args, **kwargs):
        if self.length is not None and self.width is not None:
            self.area = self.length * self.width
        else:
            self.area = 0
        super().save(*args, **kwargs)

    def __str__(self):
        name = self.custom_name or self.get_room_type_display()
        return f"{self.floor} - {name}"


class GrayStructureDetails(models.Model):
    """Gray structure material selections for a project"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='gray_structure_details')

    foundation_type = models.CharField(max_length=50, blank=True, null=True)
    wall_material = models.CharField(max_length=50, blank=True, null=True)
    wall_thickness = models.CharField(max_length=50, blank=True, null=True)
    roof_type = models.CharField(max_length=50, blank=True, null=True)
    steel_grade = models.CharField(max_length=50, blank=True, null=True)
    cement_type = models.CharField(max_length=50, blank=True, null=True)
    brick_type = models.CharField(max_length=50, blank=True, null=True)
    plaster_type = models.CharField(max_length=50, blank=True, null=True)
    spiral_stairs = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gray_structure_details'
        verbose_name = 'Gray Structure Detail'
        verbose_name_plural = 'Gray Structure Details'

    def __str__(self):
        return f"Gray Structure for {self.project.name}"


class FinishingDetails(models.Model):
    """Finishing material selections for a project"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='finishing_details')

    # Material selections (Strings to match frontend UI)
    floor_tiles = models.CharField(max_length=100, blank=True, null=True)
    wall_tiles = models.CharField(max_length=100, blank=True, null=True)
    paint = models.CharField(max_length=100, blank=True, null=True)
    doors = models.CharField(max_length=100, blank=True, null=True)
    windows = models.CharField(max_length=100, blank=True, null=True)
    electrical = models.CharField(max_length=100, blank=True, null=True)
    plumbing = models.CharField(max_length=100, blank=True, null=True)
    sanitary = models.CharField(max_length=100, blank=True, null=True)
    cabinets = models.CharField(max_length=100, blank=True, null=True)

    # Quantities
    door_quantity = models.IntegerField(default=0)
    window_quantity = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'finishing_details'
        verbose_name = 'Finishing Detail'
        verbose_name_plural = 'Finishing Details'

    def __str__(self):
        return f"Finishing for {self.project.name}"


class BillOfMaterial(models.Model):
    """Bill of Materials for a project"""

    CATEGORY_CHOICES = [
        ('gray_structure', 'Gray Structure'),
        ('finishing', 'Finishing'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='bill_of_materials')
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'bill_of_materials'
        ordering = ['category', 'material']
        verbose_name = 'Bill of Material'
        verbose_name_plural = 'Bill of Materials'

    def save(self, *args, **kwargs):
        self.total_cost = self.quantity * self.rate
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.project.name} - {self.material.name}"


class CostHistory(models.Model):
    """Historical cost data for trend analysis"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='cost_history')
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    effective_date = models.DateField(default=timezone.now)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'cost_history'
        ordering = ['-effective_date']
        verbose_name = 'Cost History'
        verbose_name_plural = 'Cost Histories'

    def __str__(self):
        return f"{self.material.name} - PKR {self.rate} on {self.effective_date}"
