"""
Serializers for ICEMGS REST API
"""
from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import LoginSerializer
from django.contrib.auth import authenticate
from django.db import transaction
from .models import (
    User, Material, Project, Floor, Room,
    FinishingDetails, GrayStructureDetails, BillOfMaterial, CostHistory
)


class CustomLoginSerializer(LoginSerializer):
    """Custom login serializer for email-based authentication"""
    
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(style={'input_type': 'password'})
    
    def validate(self, attrs):
        """Authenticate user by email instead of username"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Get email or username (fallback for compatibility)
        email = attrs.get('email') or attrs.get('username')
        password = attrs.get('password')
        
        if not email or not password:
            msg = 'Must include "email" and "password".'
            raise serializers.ValidationError(msg, code='authorization')
        
        # Normalize email
        email = email.strip().lower() if email else ''
        
        logger.info(f"Login attempt with email: {email}")

        user = authenticate(request=self.context.get('request'), username=email, password=password)
        if user is None:
            logger.warning(f"Authentication failed for email: {email}")
            msg = 'Invalid email or password.'
            raise serializers.ValidationError(msg, code='authorization')

        if not user.is_active:
            logger.warning(f"Inactive user attempted login: {email}")
            msg = 'User account is disabled.'
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        logger.info(f"Login successful for user: {email}")
        return attrs


class CustomRegisterSerializer(RegisterSerializer):
    """Custom registration serializer with role field"""

    username = None  # remove username from parent serializer
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='homeowner')
    first_name = serializers.CharField(required=True, min_length=1, allow_blank=False)
    last_name = serializers.CharField(required=False, allow_blank=True, default='')
    phone_number = serializers.CharField(required=False, allow_blank=True)
    company_name = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, email):
        """Check if email already exists (case-insensitive).
        
        If the email belongs to an inactive (unverified) user, delete that
        stale record so the user can re-register with the same email.
        Only active (verified) users block re-registration.
        """
        if not email:
            raise serializers.ValidationError("Email is required.")
        
        # Normalize email
        email = email.strip().lower()
        
        # Check if email exists
        existing_user = User.objects.filter(email__iexact=email).first()
        if existing_user:
            if not existing_user.is_active:
                # User never verified — delete stale record so they can re-register
                from .models import OTPVerification
                OTPVerification.objects.filter(user=existing_user).delete()
                # Also clean up allauth EmailAddress records
                try:
                    from allauth.account.models import EmailAddress
                    EmailAddress.objects.filter(user=existing_user).delete()
                except Exception:
                    pass
                existing_user.delete()
            else:
                raise serializers.ValidationError(
                    "This email address is already registered. Please use a different email."
                )
        return email
    
    def validate_first_name(self, value):
        """Validate first name"""
        if not value or not value.strip():
            raise serializers.ValidationError("First name cannot be empty.")
        return value.strip()
    
    def validate_last_name(self, value):
        """Validate last name (optional)"""
        if value:
            return value.strip()
        return ''
    
    def validate(self, data):
        """Additional validation for the entire registration data"""
        try:
            data = super().validate(data)
        except serializers.ValidationError as e:
            # Log and re-raise
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Parent validation error: {e}")
            raise
        
        # Ensure passwords match
        password1 = data.get('password1')
        password2 = data.get('password2')
        
        if password1 and password2 and password1 != password2:
            raise serializers.ValidationError({
                'password2': 'Passwords do not match.'
            })
        
        if not password1:
            raise serializers.ValidationError({
                'password1': 'Password is required.'
            })
        
        return data

    def get_cleaned_data(self):
        """Get cleaned data including custom fields - build manually to avoid username reference"""
        return {
            'password1': self.validated_data.get('password1', ''),
            'password2': self.validated_data.get('password2', ''),
            'email': self.validated_data.get('email', ''),
            'role': self.validated_data.get('role', 'homeowner'),
            'first_name': self.validated_data.get('first_name', ''),
            'last_name': self.validated_data.get('last_name', ''),
            'phone_number': self.validated_data.get('phone_number', ''),
            'company_name': self.validated_data.get('company_name', ''),
        }

    def save(self, request):
        """Save user with custom fields and generate OTP"""
        import logging
        import random
        from django.core.mail import send_mail
        from django.conf import settings
        from .models import OTPVerification
        logger = logging.getLogger(__name__)
        
        try:
            user = super().save(request)
            user.role = self.validated_data.get('role', 'homeowner')
            user.first_name = self.validated_data.get('first_name', '')
            user.last_name = self.validated_data.get('last_name', '')
            user.phone_number = self.validated_data.get('phone_number', '') or None
            user.company_name = self.validated_data.get('company_name', '') or None
            
            # Deactivate user until email is verified
            user.is_active = False
            user.save()

            # Generate 6-digit OTP
            otp_code = str(random.randint(100000, 999999))
            OTPVerification.objects.create(user=user, otp_code=otp_code)

            # Send Email
            try:
                # We log it so it can be seen in the console during development
                logger.info(f"Generated OTP for {user.email}: {otp_code}")
                send_mail(
                    subject='Verify your ICEMGS Account',
                    message=f'Your verification code is: {otp_code}',
                    from_email=settings.EMAIL_HOST_USER or 'noreply@icemgs.com',
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error(f"Failed to send email to {user.email}: {e}")

            logger.info(f"User created successfully and OTP sent: {user.email}")
            return user
        except Exception as e:
            logger.error(f"Error saving user: {str(e)}")
            raise


class UserSerializer(serializers.ModelSerializer):
    """User serializer"""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'role', 'phone_number', 'company_name', 'profile_picture',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'email', 'role', 'is_active']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile data"""

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone_number', 'company_name', 'role', 'profile_picture']


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Serializer for admin-created users. Accepts email, password, role, and name fields."""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'role', 'phone_number', 'company_name']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.is_active = True
        user.save()
        return user


class MaterialSerializer(serializers.ModelSerializer):
    """Material serializer"""

    category_display = serializers.CharField(source='get_category_display', read_only=True)
    quality_display = serializers.CharField(source='get_quality_display', read_only=True)

    class Meta:
        model = Material
        fields = [
            'id', 'name', 'category', 'category_display',
            'quality', 'quality_display', 'unit', 'rate',
            'description', 'is_active', 'is_price_locked', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class RoomSerializer(serializers.ModelSerializer):
    """Room serializer"""

    room_type_display = serializers.CharField(source='get_room_type_display', read_only=True)

    class Meta:
        model = Room
        fields = [
            'id', 'floor', 'room_type', 'room_type_display',
            'custom_name', 'size', 'length', 'width', 'height', 'area',
            'has_attached_bathroom', 'has_balcony', 'has_parapet_walls'
        ]
        read_only_fields = ['id', 'area', 'floor']


class FloorSerializer(serializers.ModelSerializer):
    """Floor serializer with nested rooms"""

    rooms = RoomSerializer(many=True, required=False)
    floor_type_display = serializers.CharField(source='get_floor_type_display', read_only=True)

    class Meta:
        model = Floor
        fields = [
            'id', 'project', 'floor_number', 'floor_type',
            'floor_type_display', 'total_area', 'rooms'
        ]
        read_only_fields = ['id', 'project']


class GrayStructureDetailsSerializer(serializers.ModelSerializer):
    """Gray structure details serializer"""

    class Meta:
        model = GrayStructureDetails
        fields = [
            'id', 'project', 'foundation_type', 'wall_material',
            'wall_thickness', 'roof_type', 'steel_grade',
            'cement_type', 'brick_type', 'plaster_type', 'spiral_stairs',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'project', 'created_at', 'updated_at']


class FinishingDetailsSerializer(serializers.ModelSerializer):
    """Finishing details serializer"""

    class Meta:
        model = FinishingDetails
        fields = [
            'id', 'project',
            'floor_tiles',
            'wall_tiles',
            'paint',
            'doors', 'door_quantity',
            'windows', 'window_quantity',
            'electrical',
            'plumbing',
            'sanitary',
            'cabinets',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'project', 'created_at', 'updated_at']


class BillOfMaterialSerializer(serializers.ModelSerializer):
    """Bill of Material serializer"""

    material_detail = MaterialSerializer(source='material', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = BillOfMaterial
        fields = [
            'id', 'project', 'material', 'material_detail',
            'category', 'category_display', 'quantity', 'unit',
            'rate', 'total_cost'
        ]
        read_only_fields = ['id', 'total_cost']


class ProjectListSerializer(serializers.ModelSerializer):
    """Project list serializer (minimal fields for listing)"""

    status_display = serializers.CharField(source='get_status_display', read_only=True)
    construction_type_display = serializers.CharField(source='get_construction_type_display', read_only=True)
    owner_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'status', 'status_display',
            'construction_type', 'construction_type_display',
            'plot_area', 'plot_unit', 'plot_marlas', 'location', 'num_floors',
            'total_cost', 'lda_compliant', 'owner_email', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Project detail serializer (all fields with nested relationships)"""

    floors = FloorSerializer(many=True, required=False)
    finishing_details = FinishingDetailsSerializer(required=False)
    gray_structure_details = GrayStructureDetailsSerializer(required=False)
    bill_of_materials = BillOfMaterialSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    construction_type_display = serializers.CharField(source='get_construction_type_display', read_only=True)
    owner_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'user', 'owner_email', 'name', 'status', 'status_display',
            'construction_type', 'construction_type_display',
            'plot_area', 'plot_unit', 'plot_length', 'plot_width', 'location',
            'plot_marlas', 'marla_size',
            'num_floors', 'total_built_area',
            'gray_structure_cost', 'finishing_cost', 'labor_cost', 'total_cost',
            'lda_compliant', 'compliance_notes', 'front_setback', 'rear_setback',
            'side_setbacks', 'max_height', 'coverage_ratio', 'floor_plan_data',
            'floors', 'gray_structure_details', 'finishing_details', 'bill_of_materials',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    @transaction.atomic
    def update(self, instance, validated_data):
        floors_data = validated_data.pop('floors', None)
        gray_data = validated_data.pop('gray_structure_details', None)
        finishing_data = validated_data.pop('finishing_details', None)

        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update nested Gray Structure
        if gray_data is not None:
            GrayStructureDetails.objects.filter(project=instance).delete()
            GrayStructureDetails.objects.create(project=instance, **gray_data)

        # Update nested Finishing
        if finishing_data is not None:
            FinishingDetails.objects.filter(project=instance).delete()
            FinishingDetails.objects.create(project=instance, **finishing_data)

        # Update nested Floors and Rooms
        if floors_data is not None:
            Floor.objects.filter(project=instance).delete()
            for floor_data in floors_data:
                rooms_data = floor_data.pop('rooms', [])
                floor = Floor.objects.create(project=instance, **floor_data)
                for room_data in rooms_data:
                    Room.objects.create(floor=floor, **room_data)

        return instance


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Project creation serializer"""

    floors = FloorSerializer(many=True, required=False)
    gray_structure_details = GrayStructureDetailsSerializer(required=False)
    finishing_details = FinishingDetailsSerializer(required=False)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'construction_type', 'plot_area', 'plot_unit',
            'plot_length', 'plot_width', 'location', 'plot_marlas', 'marla_size', 
            'num_floors', 'lda_compliant', 'front_setback', 'rear_setback', 
            'side_setbacks', 'max_height', 'coverage_ratio',
            'floors', 'gray_structure_details', 'finishing_details'
        ]
        read_only_fields = ['id']

    @transaction.atomic
    def create(self, validated_data):
        floors_data = validated_data.pop('floors', [])
        gray_data = validated_data.pop('gray_structure_details', None)
        finishing_data = validated_data.pop('finishing_details', None)

        user = self.context['request'].user
        validated_data['user'] = user
        project = super().create(validated_data)

        # Create nested relations
        if gray_data:
            GrayStructureDetails.objects.create(project=project, **gray_data)
        
        if finishing_data:
            FinishingDetails.objects.create(project=project, **finishing_data)
            
        for floor_data in floors_data:
            rooms_data = floor_data.pop('rooms', [])
            floor = Floor.objects.create(project=project, **floor_data)
            for room_data in rooms_data:
                Room.objects.create(floor=floor, **room_data)

        return project


class CostHistorySerializer(serializers.ModelSerializer):
    """Cost history serializer"""

    material_name = serializers.CharField(source='material.name', read_only=True)

    class Meta:
        model = CostHistory
        fields = [
            'id', 'material', 'material_name', 'rate',
            'effective_date', 'notes'
        ]
        read_only_fields = ['id']


class CostEstimationSerializer(serializers.Serializer):
    """Serializer for cost estimation calculations"""

    gray_structure_cost = serializers.DecimalField(max_digits=12, decimal_places=2)
    finishing_cost = serializers.DecimalField(max_digits=12, decimal_places=2)
    labor_cost = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_cost = serializers.DecimalField(max_digits=12, decimal_places=2)
    materials_breakdown = serializers.ListField(child=serializers.DictField())


class FloorPlanGenerationSerializer(serializers.Serializer):
    """Serializer for 2D floor plan generation"""

    svg_data = serializers.CharField()
    rooms_layout = serializers.ListField(child=serializers.DictField())
    lda_compliance_check = serializers.DictField()
