"""
API Views for ICEMGS
"""
import logging
import traceback

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Sum
from django.http import HttpResponse
from decimal import Decimal
from rest_framework.authtoken.models import Token
from .models import (
    User, Material, Project, Floor, Room,
    FinishingDetails, BillOfMaterial, CostHistory, OTPVerification
)
from .serializers import (
    UserSerializer, MaterialSerializer, ProjectListSerializer,
    ProjectDetailSerializer, ProjectCreateSerializer, FloorSerializer,
    RoomSerializer, FinishingDetailsSerializer, BillOfMaterialSerializer,
    CostHistorySerializer, CostEstimationSerializer
)
from .permissions import IsAdminUser, IsOwnerOrReadOnly
from .pdf_generator import ProjectPDFGenerator
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    logger.error('API Exception: %s\n%s', str(exc), traceback.format_exc())
    return response
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    # callback_url must match what Google sees during the OAuth flow.
    # For the implicit/access_token flow used by @react-oauth/google,
    # this URL just needs to be a registered origin — it isn't actually called.
    callback_url = 'https://icemgs-unified-latest.onrender.com'
    client_class = OAuth2Client

    def post(self, request, *args, **kwargs):
        """Override post to add error logging and ensure proper token return."""
        import logging
        google_logger = logging.getLogger(__name__)
        google_logger.info(f"Google login attempt with data keys: {list(request.data.keys())}")
        try:
            response = super().post(request, *args, **kwargs)
            google_logger.info(f"Google login successful, response keys: {list(response.data.keys()) if hasattr(response, 'data') else 'N/A'}")

            # Ensure the response contains user data alongside the token
            if hasattr(response, 'data') and 'key' in response.data and self.user:
                from .serializers import UserSerializer
                response.data['user'] = UserSerializer(self.user).data
            return response
        except Exception as e:
            google_logger.error(f"Google login FAILED: {type(e).__name__}: {e}")
            import traceback
            google_logger.error(traceback.format_exc())
            return Response(
                {'non_field_errors': [f'Google authentication failed: {str(e)}']},
                status=status.HTTP_400_BAD_REQUEST
            )


class VerifyEmailView(APIView):
    """Verify email with OTP and return token"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        if not email or not otp:
            return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
            otp_record = OTPVerification.objects.get(user=user, otp_code=otp)

            if otp_record.is_expired():
                otp_record.delete()
                return Response({'error': 'OTP has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

            # Activate user
            user.is_active = True
            user.save()
            otp_record.delete()

            # Generate or get token
            token, created = Token.objects.get_or_create(user=user)

            # Use UserSerializer from the file
            user_data = UserSerializer(user).data

            return Response({
                'key': token.key,
                'user': user_data,
                'message': 'Email verified successfully.'
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except OTPVerification.DoesNotExist:
            return Response({'error': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)


class ResendOTPView(APIView):
    """Resend OTP verification code"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        import random
        from django.core.mail import send_mail
        from django.conf import settings
        import logging
        logger = logging.getLogger(__name__)

        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_active:
            return Response({'error': 'This account is already verified.'}, status=status.HTTP_400_BAD_REQUEST)

        # Delete any existing OTP for this user
        OTPVerification.objects.filter(user=user).delete()

        # Generate new 6-digit OTP
        otp_code = str(random.randint(100000, 999999))
        OTPVerification.objects.create(user=user, otp_code=otp_code)

        # Send email asynchronously in a background thread to prevent request timeouts
        import threading
        def send_otp_email_async(email_addr, otp):
            try:
                logger.info(f"[Async Email] Resend OTP for {email_addr}: {otp}")
                
                html_message = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563EB;">ICEMGS - Email Verification</h2>
                    <p>Your new verification code is:</p>
                    <div style="background: #f0f4ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">{otp}</span>
                    </div>
                    <p>This code expires in 10 minutes.</p>
                    <p style="color: #6b7280; font-size: 12px;">If you did not request this code, please ignore this email.</p>
                </div>
                """
                
                result = send_mail(
                    subject='Verify your ICEMGS Account',
                    message=f'Your new verification code is: {otp}\n\nThis code expires in 10 minutes.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email_addr],
                    html_message=html_message,
                    fail_silently=False,
                )
                logger.info(f"[Async Email] Resend email result for {email_addr}: {result}")
            except Exception as ex:
                logger.error(f"[Async Email] EMAIL ERROR resending OTP to {email_addr}: {type(ex).__name__}: {ex}")
                import traceback
                logger.error(f"[Async Email] Full traceback: {traceback.format_exc()}")

        threading.Thread(target=send_otp_email_async, args=(user.email, otp_code), daemon=True).start()

        return Response({'message': 'A new verification code has been sent to your email.'}, status=status.HTTP_200_OK)



class DatabaseHealthCheckView(APIView):
    """Check database health and connectivity"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            # Query models to verify DB is functioning
            materials_count = Material.objects.count()
            projects_count = Project.objects.count()
            users_count = User.objects.count()
            
            return Response({
                'status': 'online', 
                'database': 'connected',
                'stats': {
                    'materials': materials_count,
                    'projects': projects_count,
                    'users': users_count
                }
            })
        except Exception as e:
            return Response(
                {'status': 'offline', 'database': 'disconnected', 'error': str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )


class UserViewSet(viewsets.ModelViewSet):
    """User management viewset"""

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return User.objects.all()
        return User.objects.filter(id=user.id)

    def get_serializer_class(self):
        if self.action == 'create' and self.request.user.role == 'admin':
            from .serializers import AdminUserCreateSerializer
            return AdminUserCreateSerializer
        return self.serializer_class

    def perform_create(self, serializer):
        """Auto-create allauth EmailAddress when admin creates a user via API."""
        user = serializer.save()
        try:
            from allauth.account.models import EmailAddress
            if not EmailAddress.objects.filter(user=user).exists():
                EmailAddress.objects.create(
                    user=user,
                    email=user.email,
                    verified=user.is_active,
                    primary=True
                )
        except Exception:
            pass

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """Update current user profile"""
        from .serializers import UserProfileUpdateSerializer
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Explicitly save role if provided (failsafe)
        if 'role' in request.data:
            request.user.role = request.data['role']
            request.user.save(update_fields=['role'])
            
        serializer.save()
        return Response(serializer.data)


class MaterialViewSet(viewsets.ModelViewSet):
    """Material catalog viewset"""

    queryset = Material.objects.filter(is_active=True)
    serializer_class = MaterialSerializer
    pagination_class = None
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['category', 'quality']
    search_fields = ['name', 'category']
    ordering_fields = ['category', 'rate', 'created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get materials grouped by category"""
        category = request.query_params.get('category')
        if category:
            materials = Material.objects.filter(category=category, is_active=True)
        else:
            materials = Material.objects.filter(is_active=True)

        serializer = self.get_serializer(materials, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_update_rates(self, request):
        """Bulk update material rates (admin only)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can update material rates'},
                status=status.HTTP_403_FORBIDDEN
            )

    @action(detail=False, methods=['post'])
    def sync_market_prices(self, request):
        """Trigger the live scraper to sync market prices (admin only)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can sync market prices'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        try:
            from estimation.services.scraper import perform_market_sync
            result = perform_market_sync()
            return Response(result)
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updates = request.data.get('updates', [])
        updated_count = 0

        for update in updates:
            material_id = update.get('id')
            new_rate = update.get('rate')

            if material_id and new_rate:
                try:
                    material = Material.objects.get(id=material_id)
                    old_rate = material.rate
                    material.rate = new_rate
                    material.save()

                    # Save to cost history
                    CostHistory.objects.create(
                        material=material,
                        rate=old_rate,
                        notes=f'Updated from {old_rate} to {new_rate}'
                    )
                    updated_count += 1
                except Material.DoesNotExist:
                    continue

        return Response({
            'message': f'{updated_count} materials updated successfully',
            'updated_count': updated_count
        })


class ProjectViewSet(viewsets.ModelViewSet):
    """Project management viewset"""

    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filterset_fields = ['status', 'construction_type']
    search_fields = ['name', 'location']
    ordering_fields = ['created_at', 'updated_at', 'total_cost']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Project.objects.all()
        return Project.objects.filter(user=user)

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action == 'create':
            return ProjectCreateSerializer
        return ProjectDetailSerializer

    def perform_create(self, serializer):
        project = serializer.save()
        self._perform_cost_calculation(project)

    def perform_update(self, serializer):
        project = serializer.save()
        self._perform_cost_calculation(project)

    def _perform_cost_calculation(self, project):
        """Helper to calculate project costs and generate Bill of Materials"""
        # Calculate total built area from plot data (convert marla to sqft)
        # Use Decimal everywhere to avoid floating-point drift
        marla_size = Decimal(str(project.marla_size)) if project.marla_size else Decimal('225')
        plot_marlas = Decimal(str(project.plot_marlas or project.plot_area or 0))
        plot_sqft = plot_marlas * marla_size
        num_floors = Decimal(str(project.num_floors or 1))
        
        # Count mumty rooms
        mumty_count = Decimal('0')
        try:
            for floor in project.floors.all():
                for room in floor.rooms.all():
                    if room.room_type == 'mumty' and room.size != 'none':
                        mumty_count += Decimal('1')
        except Exception:
            pass

        total_area = plot_sqft * num_floors + (mumty_count * Decimal('120'))

        # Persist the calculated built area
        project.total_built_area = total_area
        project.save()

        # Generate Bill of Materials first
        self._generate_bill_of_materials(project)

        # Sum costs from BillOfMaterial database table to ensure 100% consistency with details
        gray_structure_cost = BillOfMaterial.objects.filter(
            project=project, category='gray_structure'
        ).aggregate(total=Sum('total_cost'))['total'] or Decimal('0')

        finishing_cost = BillOfMaterial.objects.filter(
            project=project, category='finishing'
        ).aggregate(total=Sum('total_cost'))['total'] or Decimal('0')

        # Calculate labor cost (typically 25% of material cost)
        labor_cost = (gray_structure_cost + finishing_cost) * Decimal('0.25')

        # Update project costs
        project.gray_structure_cost = gray_structure_cost
        project.finishing_cost = finishing_cost
        project.labor_cost = labor_cost
        project.total_cost = gray_structure_cost + finishing_cost + labor_cost
        project.save()

    @action(detail=True, methods=['post'])
    def calculate_costs(self, request, pk=None):
        """Calculate project costs based on materials and quantities"""
        project = self.get_object()
        self._perform_cost_calculation(project)

        serializer = CostEstimationSerializer({
            'gray_structure_cost': project.gray_structure_cost,
            'finishing_cost': project.finishing_cost,
            'labor_cost': project.labor_cost,
            'total_cost': project.total_cost,
            'materials_breakdown': []
        })

        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def generate_floor_plan(self, request, pk=None):
        """Generate 2D floor plan based on LDA bylaws"""
        project = self.get_object()

        # Floor plan generation logic would go here
        # This is a placeholder for the actual implementation
        floor_plan_data = {
            'svg_data': '<svg>...</svg>',
            'rooms_layout': [],
            'lda_compliance_check': {
                'compliant': True,
                'issues': []
            }
        }

        project.floor_plan_data = floor_plan_data
        project.lda_compliant = floor_plan_data['lda_compliance_check']['compliant']
        project.save()

        return Response(floor_plan_data)

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Download project report as PDF"""
        project = self.get_object()
        
        # Calculate/refresh costs before generating PDF report
        self._perform_cost_calculation(project)

        # Generate PDF
        pdf_generator = ProjectPDFGenerator(project)
        pdf = pdf_generator.generate()

        # Create HTTP response with PDF
        response = HttpResponse(pdf, content_type='application/pdf')
        filename = f"ICEMGS_Report_{project.name.replace(' ', '_')}_{str(project.id)[:8]}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        return response

    def _calculate_gray_structure_cost(self, total_area, project=None):
        """Calculate gray structure cost based on itemized materials — matches frontend logic"""
        total_area = Decimal(str(total_area))

        # Determine plot area (single floor footprint sqft)
        num_floors = 1
        plot_sqft = total_area
        if project:
            num_floors = project.num_floors or 1
            marla_size = Decimal(str(project.marla_size)) if project.marla_size else Decimal('225')
            plot_marlas = Decimal(str(project.plot_marlas or project.plot_area or 0))
            plot_sqft = plot_marlas * marla_size

        # Wall thickness multiplier (default 9-inch standard)
        wall_multiplier = Decimal('1.0')
        brick_type = 'solid'
        cement_type = 'opc-43'
        plaster_type = 'cement'
        steel_grade = 'grade-60'
        spiral_stairs = False
        has_parapet = False

        if project and hasattr(project, 'gray_structure_details'):
            gray = project.gray_structure_details
            
            # Wall thickness multiplier
            thickness = gray.wall_thickness or ''
            if '13' in thickness:
                wall_multiplier = Decimal('1.4')
            elif '4.5' in thickness:
                wall_multiplier = Decimal('0.6')
                
            # Types/Grades
            brick_type = (gray.brick_type or 'solid').lower()
            cement_type = (gray.cement_type or 'opc-43').lower()
            plaster_type = (gray.plaster_type or 'cement').lower()
            steel_grade = (gray.steel_grade or 'grade-60').lower()
            spiral_stairs = gray.spiral_stairs

        # Check parapet walls from rooms
        if project:
            try:
                for floor in project.floors.all():
                    for room in floor.rooms.all():
                        if room.room_type == 'mumty' and room.has_parapet_walls:
                            has_parapet = True
            except Exception:
                pass

        # Get rates from DB, fallback to market defaults
        foundation_rate = self._get_material_rate('Foundation Concrete', 400)
        
        brick_name = 'Fly Ash' if 'fly' in brick_type else 'Awwal'
        brick_rate = self._get_material_rate(f'{brick_name} Bricks', 22 if 'fly' in brick_type else 17)
        
        # Cement OPC 43 or Cement OPC 53
        cement_name = 'OPC 53' if '53' in cement_type else 'OPC 43'
        cement_rate = self._get_material_rate(f'Cement {cement_name}', 1500 if '53' in cement_type else 1450)
        
        # Steel Grade 60 or Steel Grade 40
        steel_name = 'Grade 60' if '60' in steel_grade else 'Grade 40'
        steel_rate = self._get_material_rate(f'Steel {steel_name}', 260 if '60' in steel_grade else 250)
        
        sand_rate = self._get_material_rate('Sand (Bajri)', 90)
        crush_rate = self._get_material_rate('Crush (Stone Chips)', 130)
        
        plaster_name = 'Gypsum' if 'gypsum' in plaster_type else 'Cement'
        plaster_rate = self._get_material_rate(f'{plaster_name} Plaster', 85 if 'gypsum' in plaster_type else 65)
        
        roof_rate = self._get_material_rate('Roof Slab Pouring', 45)

        # Steel consumption: dynamic based on floors (kg/sqft)
        if num_floors <= 1:
            steel_kg_per_sqft = Decimal('3.5')
        elif num_floors <= 2:
            steel_kg_per_sqft = Decimal('4.5')
        else:
            steel_kg_per_sqft = Decimal('5.5')

        # Accumulate costs exactly like frontend
        total_cost = Decimal('0')
        
        # Foundation concrete: 0.15 cft per sqft
        total_cost += total_area * Decimal('0.15') * foundation_rate
        # Bricks: 55 pieces per sqft
        total_cost += total_area * Decimal('55') * wall_multiplier * brick_rate
        # Cement: 0.4 bags per sqft
        total_cost += total_area * Decimal('0.4') * wall_multiplier * cement_rate
        # Steel: dynamic kg/sqft
        total_cost += total_area * steel_kg_per_sqft * steel_rate
        # Sand: 0.25 cft per sqft
        total_cost += total_area * Decimal('0.25') * wall_multiplier * sand_rate
        # Crush: 0.45 cft per sqft
        total_cost += total_area * Decimal('0.45') * crush_rate
        # Plaster: 1.8 sqft per sqft
        total_cost += total_area * Decimal('1.8') * plaster_rate
        # Roof slab: plot footprint × roof rate × number of floors
        total_cost += plot_sqft * roof_rate * Decimal(str(num_floors))
        # Waterproofing: plot footprint × 45 rate
        total_cost += plot_sqft * Decimal('45')
        # Shuttering: total_area × 0.5 ratio × 25 rate
        total_cost += total_area * Decimal('0.5') * Decimal('25')

        # Parapet Walls if selected
        if has_parapet:
            import math
            perimeter = Decimal(str(round(4 * math.sqrt(float(plot_sqft)))))
            parapet_area = perimeter * Decimal('3.5')
            total_cost += parapet_area * Decimal('350')

        # Spiral stairs if selected
        if spiral_stairs:
            total_cost += Decimal('85000')

        return total_cost

    def _get_material_rate(self, name_query, default_rate):
        if not name_query:
            return Decimal('0')
        material = Material.objects.filter(name__icontains=name_query).first()
        return material.rate if material else Decimal(str(default_rate))

    def _calculate_finishing_cost(self, project, total_area=None):
        """Calculate finishing cost based on material selections"""
        try:
            finishing = project.finishing_details
            total_cost = Decimal('0')
            if total_area is None:
                total_area = Decimal(str(project.total_built_area or 0))
            else:
                total_area = Decimal(str(total_area))

            # Count rooms from project floors
            total_rooms = 0
            bathroom_count = 0
            kitchen_count = 0
            bedroom_count = 0
            try:
                for floor in project.floors.all():
                    for room in floor.rooms.all():
                        total_rooms += 1
                        if room.room_type == 'bathroom':
                            bathroom_count += 1
                        elif room.room_type == 'kitchen':
                            kitchen_count += 1
                        elif room.room_type == 'bedroom':
                            bedroom_count += 1
            except Exception:
                total_rooms = max(int(total_area / Decimal('200')), 5)
                bathroom_count = max(total_rooms // 3, 2)
                kitchen_count = 1
                bedroom_count = max(total_rooms // 3, 2)

            if total_rooms == 0:
                total_rooms = max(int(total_area / Decimal('200')), 5)
                bathroom_count = max(total_rooms // 3, 2)
                kitchen_count = 1
                bedroom_count = max(total_rooms // 3, 2)

            # Floor tiles (85% of total area)
            if finishing.floor_tiles:
                rate = self._get_material_rate('tiles', 300)
                total_cost += rate * total_area * Decimal('0.85')

            # Wall tiles (30% of total area — bathrooms & kitchen)
            if finishing.wall_tiles:
                wall_area = total_area * Decimal('0.3')
                rate = self._get_material_rate('tiles', 220)
                total_cost += rate * wall_area

            # Paint (wall area is roughly 2x floor area)
            if finishing.paint:
                wall_area = total_area * Decimal('2.0')
                rate = self._get_material_rate('paint', 55)
                total_cost += rate * wall_area

            # Doors (count based on rooms)
            door_count = total_rooms + 1  # each room + main entrance
            if finishing.doors:
                rate = self._get_material_rate('door', 25000)
                total_cost += rate * Decimal(str(door_count))

            # Windows (bedrooms get 2, others get 1, plus extras)
            window_count = bedroom_count * 2 + kitchen_count + bathroom_count + 3
            if finishing.windows:
                rate = self._get_material_rate('window', 1400)
                total_cost += rate * Decimal(str(window_count)) * Decimal('12')  # avg 12 sqft per window

            # Electrical (per room)
            if finishing.electrical:
                rate = self._get_material_rate('electrical', 25000)
                total_cost += rate * Decimal(str(total_rooms))
                total_cost += rate * Decimal('3')  # Distribution board

            # Plumbing (per wet point: bathrooms + kitchens)
            if finishing.plumbing:
                rate = self._get_material_rate('plumbing', 50000)
                total_cost += rate * Decimal(str(bathroom_count + kitchen_count))
                total_cost += Decimal('45000')  # Water tank

            # Sanitary (per bathroom)
            if finishing.sanitary:
                rate = self._get_material_rate('sanitary', 70000)
                total_cost += rate * Decimal(str(bathroom_count))

            # Cabinets (kitchen area based on count)
            if finishing.cabinets:
                cabinet_area = Decimal(str(kitchen_count * 100))  # ~100 sqft per kitchen
                rate = self._get_material_rate('cabinet', 2200)
                total_cost += rate * cabinet_area

            # False ceiling (30% of total area)
            total_cost += total_area * Decimal('0.3') * Decimal('180')

            return total_cost

        except FinishingDetails.DoesNotExist:
            return Decimal('0')

    def _generate_bill_of_materials(self, project):
        """Generate detailed Bill of Materials for the project"""
        # Clear existing BOM
        BillOfMaterial.objects.filter(project=project).delete()

        total_area = Decimal(str(project.total_built_area or 0))
        num_floors = project.num_floors or 1

        # Determine plot area (single floor footprint sqft)
        marla_size = Decimal(str(project.marla_size)) if project.marla_size else Decimal('225')
        plot_marlas = Decimal(str(project.plot_marlas or project.plot_area or 0))
        plot_sqft = plot_marlas * marla_size

        # Steel consumption based on floors
        if num_floors <= 1:
            steel_kg_per_sqft = Decimal('3.5')
        elif num_floors <= 2:
            steel_kg_per_sqft = Decimal('4.5')
        else:
            steel_kg_per_sqft = Decimal('5.5')

        # Wall thickness multiplier (default 9-inch standard)
        wall_multiplier = Decimal('1.0')
        brick_type = 'solid'
        cement_type = 'opc-43'
        plaster_type = 'cement'
        steel_grade = 'grade-60'
        spiral_stairs = False
        has_parapet = False

        if hasattr(project, 'gray_structure_details'):
            gray = project.gray_structure_details
            thickness = gray.wall_thickness or ''
            if '13' in thickness:
                wall_multiplier = Decimal('1.4')
            elif '4.5' in thickness:
                wall_multiplier = Decimal('0.6')
            brick_type = (gray.brick_type or 'solid').lower()
            cement_type = (gray.cement_type or 'opc-43').lower()
            plaster_type = (gray.plaster_type or 'cement').lower()
            steel_grade = (gray.steel_grade or 'grade-60').lower()
            spiral_stairs = gray.spiral_stairs

        # Check parapet walls from rooms
        try:
            for floor in project.floors.all():
                for room in floor.rooms.all():
                    if room.room_type == 'mumty' and room.size != 'none' and room.has_parapet_walls:
                        has_parapet = True
        except Exception:
            pass

        # Resolve gray structure materials with get_or_create to match frontend defaults exactly
        foundation_material, _ = Material.objects.get_or_create(
            id='foundation-concrete',
            defaults={'name': 'Foundation Concrete', 'category': 'other', 'rate': 400, 'unit': 'cft', 'quality': 'standard'}
        )
        
        brick_id = f"brick-{brick_type}"
        brick_material, _ = Material.objects.get_or_create(
            id=brick_id,
            defaults={'name': 'Fly Ash Bricks' if 'fly' in brick_type else 'Awwal Bricks', 'category': 'bricks', 'rate': 22 if 'fly' in brick_type else 17, 'unit': 'pieces', 'quality': 'standard'}
        )
        
        cement_id = f"cement-{cement_type}"
        cement_material, _ = Material.objects.get_or_create(
            id=cement_id,
            defaults={'name': f"Cement Bags ({cement_type.upper()})", 'category': 'cement', 'rate': 1500 if '53' in cement_type else 1450, 'unit': 'bags (50kg)', 'quality': 'standard'}
        )
        
        steel_id = f"steel-{steel_grade}"
        steel_material, _ = Material.objects.get_or_create(
            id=steel_id,
            defaults={'name': f"Steel Bars ({steel_grade.upper()})", 'category': 'steel', 'rate': 260 if '60' in steel_grade else 250, 'unit': 'kg', 'quality': 'standard'}
        )
        
        sand_material, _ = Material.objects.get_or_create(
            id='sand',
            defaults={'name': 'Sand (Bajri)', 'category': 'sand', 'rate': 90, 'unit': 'cft', 'quality': 'standard'}
        )
        
        crush_material, _ = Material.objects.get_or_create(
            id='crush',
            defaults={'name': 'Crush (Stone Chips)', 'category': 'gravel', 'rate': 130, 'unit': 'cft', 'quality': 'standard'}
        )
        
        plaster_id = f"plaster-{plaster_type}"
        plaster_material, _ = Material.objects.get_or_create(
            id=plaster_id,
            defaults={'name': f"{plaster_type.capitalize()} Plaster", 'category': 'other', 'rate': 85 if 'gypsum' in plaster_type else 65, 'unit': 'sq ft', 'quality': 'standard'}
        )
        
        roof_material, _ = Material.objects.get_or_create(
            id='roof-slab-pouring',
            defaults={'name': 'Roof Slab Pouring (Labor & Machinery)', 'category': 'other', 'rate': 45, 'unit': 'sq ft', 'quality': 'standard'}
        )
        
        waterproofing_material, _ = Material.objects.get_or_create(
            id='waterproofing',
            defaults={'name': 'Waterproofing Material', 'category': 'other', 'rate': 45, 'unit': 'sqft', 'quality': 'standard'}
        )
        
        shuttering_material, _ = Material.objects.get_or_create(
            id='shuttering',
            defaults={'name': 'Shuttering Material (Rental)', 'category': 'other', 'rate': 25, 'unit': 'sqft', 'quality': 'standard'}
        )

        gray_bom_items = []
        gray_bom_items.append((foundation_material, total_area * Decimal('0.15'), 'cft', foundation_material.rate))
        gray_bom_items.append((brick_material, total_area * Decimal('55') * wall_multiplier, 'pieces', brick_material.rate))
        gray_bom_items.append((cement_material, total_area * Decimal('0.4') * wall_multiplier, 'bags (50kg)', cement_material.rate))
        gray_bom_items.append((steel_material, total_area * steel_kg_per_sqft, 'kg', steel_material.rate))
        gray_bom_items.append((sand_material, total_area * Decimal('0.25') * wall_multiplier, 'cft', sand_material.rate))
        gray_bom_items.append((crush_material, total_area * Decimal('0.45'), 'cft', crush_material.rate))
        gray_bom_items.append((plaster_material, total_area * Decimal('1.8'), 'sq ft', plaster_material.rate))
        gray_bom_items.append((roof_material, plot_sqft * Decimal(str(num_floors)), 'sq ft', roof_material.rate))
        
        # Waterproofing
        gray_bom_items.append((waterproofing_material, plot_sqft, 'sq ft', waterproofing_material.rate))
        # Shuttering
        gray_bom_items.append((shuttering_material, total_area * Decimal('0.5'), 'sq ft', shuttering_material.rate))

        if has_parapet:
            import math
            perimeter = Decimal(str(round(4 * math.sqrt(float(plot_sqft)))))
            parapet_area = perimeter * Decimal('3.5')
            parapet_material, _ = Material.objects.get_or_create(
                id='parapet-walls',
                defaults={
                    'name': 'Parapet Walls (Standard 3.5 ft high roof boundary)',
                    'category': 'other',
                    'rate': 350,
                    'unit': 'sq ft',
                    'quality': 'standard'
                }
            )
            gray_bom_items.append((parapet_material, parapet_area, 'sq ft', parapet_material.rate))

        if spiral_stairs:
            spiral_material, _ = Material.objects.get_or_create(
                id='spiral-stairs',
                defaults={
                    'name': 'External Spiral Stairs (Iron/Steel Fabrication)',
                    'category': 'other',
                    'rate': 85000,
                    'unit': 'job',
                    'quality': 'standard'
                }
            )
            gray_bom_items.append((spiral_material, Decimal('1'), 'job', spiral_material.rate))

        for material, quantity, unit, rate in gray_bom_items:
            try:
                # Round quantity/rate to match frontend
                q = Decimal(str(round(quantity, 2))) if unit != 'pieces' else Decimal(str(round(quantity)))
                r = Decimal(str(round(rate, 2)))
                BillOfMaterial.objects.create(
                    project=project,
                    material=material,
                    category='gray_structure',
                    quantity=q,
                    unit=unit,
                    rate=r,
                    total_cost=Decimal(str(round(q * r)))
                )
            except Exception as e:
                pass

        # Finishing materials
        if project.construction_type == 'full':
            try:
                finishing = project.finishing_details

                # Count rooms from project floors
                total_rooms = 0
                bathroom_count = 0
                kitchen_count = 0
                bedroom_count = 0
                kitchen_area = Decimal('0')
                for floor in project.floors.all():
                    for room in floor.rooms.all():
                        if room.size == 'none':
                            continue
                        total_rooms += 1
                        if room.room_type == 'bathroom':
                            bathroom_count += 1
                        elif room.room_type == 'kitchen':
                            kitchen_count += 1
                            size = (room.size or 'medium').lower()
                            if size == 'small':
                                kitchen_area += Decimal('80')
                            elif size == 'large':
                                kitchen_area += Decimal('168')
                            else: # medium
                                kitchen_area += Decimal('120')
                        elif room.room_type == 'bedroom':
                            bedroom_count += 1

                if total_rooms == 0:
                    total_rooms = 5
                    bedroom_count = 2
                    bathroom_count = 2
                    kitchen_count = 1
                    kitchen_area = Decimal('120')

                door_count = total_rooms + 1
                window_count = bedroom_count * 2 + kitchen_count + bathroom_count + 3

                # Resolve flooring
                floor_tiles = (finishing.floor_tiles or 'ceramic').lower()
                if floor_tiles == 'porcelain':
                    flooring_quality = 'good'
                elif floor_tiles in ['marble', 'granite']:
                    flooring_quality = 'premium'
                else:
                    flooring_quality = 'standard'
                flooring_id = f'floor-tiles-{flooring_quality}'
                
                # Flooring rate mapping
                flooring_rate = 600 if flooring_quality == 'premium' else (350 if flooring_quality == 'good' else 280)
                
                flooring_material = Material.objects.filter(id=flooring_id).first()
                if not flooring_material:
                    flooring_material, _ = Material.objects.get_or_create(
                        id=flooring_id,
                        defaults={
                            'name': f"{floor_tiles.capitalize()} Flooring" if flooring_quality != 'premium' else "Marble/Granite Floor",
                            'category': 'floor_tiles',
                            'rate': flooring_rate,
                            'unit': 'sqft',
                            'quality': flooring_quality
                        }
                    )

                # Resolve wall tiles
                # frontend sends standard, premium, imported
                # standard -> standard, premium -> good, imported -> premium
                wall_tiles_raw = (finishing.wall_tiles or 'standard').lower()
                if wall_tiles_raw == 'imported':
                    wall_tiles = 'premium'
                elif wall_tiles_raw == 'premium':
                    wall_tiles = 'good'
                else:
                    wall_tiles = 'standard'
                tiles_id = f'wall-tiles-{wall_tiles}'
                
                # Wall tiles rate mapping
                tiles_rate = 500 if wall_tiles == 'premium' else (350 if wall_tiles == 'good' else 220)
                
                tiles_material = Material.objects.filter(id=tiles_id).first()
                if not tiles_material:
                    tiles_material, _ = Material.objects.get_or_create(
                        id=tiles_id,
                        defaults={
                            'name': "Luxury Wall Tiles" if wall_tiles == 'premium' else ("Premium Wall Tiles" if wall_tiles == 'good' else "Economy Wall Tiles"),
                            'category': 'wall_tiles',
                            'rate': tiles_rate,
                            'unit': 'sqft',
                            'quality': wall_tiles
                        }
                    )

                # Resolve paint
                # frontend sends emulsion, plastic, imported
                # emulsion -> standard, plastic -> good, imported -> premium
                paint_raw = (finishing.paint or 'standard').lower()
                if paint_raw == 'imported':
                    paint = 'premium'
                elif paint_raw == 'plastic':
                    paint = 'good'
                else:
                    paint = 'standard'
                paint_id = f'paint-{paint}'
                
                # Paint rate mapping
                paint_rate = 180 if paint == 'premium' else (100 if paint == 'good' else 50)
                
                paint_material = Material.objects.filter(id=paint_id).first()
                if not paint_material:
                    paint_material, _ = Material.objects.get_or_create(
                        id=paint_id,
                        defaults={
                            'name': "Luxury Paint" if paint == 'premium' else ("Premium Paint" if paint == 'good' else "Economy Paint"),
                            'category': 'paint',
                            'rate': paint_rate,
                            'unit': 'sqft',
                            'quality': paint
                        }
                    )

                # Resolve doors
                # frontend sends flush, wooden, fiber
                # flush -> standard, wooden -> premium, fiber -> premium
                doors_raw = (finishing.doors or 'simple').lower()
                if 'wood' in doors_raw or 'fiber' in doors_raw:
                    door_quality = 'premium'
                elif doors_raw in ['engineered', 'steel']:
                    door_quality = 'good'
                else:
                    door_quality = 'standard'
                door_id = f'doors-{door_quality}'
                
                # Door rate mapping
                door_rate = 45000 if door_quality == 'premium' else (28000 if door_quality == 'good' else 22000)
                
                door_material = Material.objects.filter(id=door_id).first()
                if not door_material:
                    door_material, _ = Material.objects.get_or_create(
                        id=door_id,
                        defaults={
                            'name': "Solid Wood Doors" if door_quality == 'premium' else ("Engineered Doors" if door_quality == 'good' else "Flush/Fiber Doors"),
                            'category': 'doors',
                            'rate': door_rate,
                            'unit': 'piece',
                            'quality': door_quality
                        }
                    )

                # Resolve windows
                # frontend sends aluminum, upvc, wooden
                # aluminum -> standard, upvc -> good, wooden -> premium
                windows_raw = (finishing.windows or 'aluminum').lower()
                if 'wood' in windows_raw:
                    window_quality = 'premium'
                elif windows_raw == 'upvc':
                    window_quality = 'good'
                else:
                    window_quality = 'standard'
                window_id = f'windows-{window_quality}'
                
                # Window rate mapping
                window_rate = 2500 if window_quality == 'premium' else (1800 if window_quality == 'good' else 1200)
                
                window_material = Material.objects.filter(id=window_id).first()
                if not window_material:
                    window_material, _ = Material.objects.get_or_create(
                        id=window_id,
                        defaults={
                            'name': "Wooden Windows" if window_quality == 'premium' else ("UPVC Windows" if window_quality == 'good' else "Aluminum Windows"),
                            'category': 'windows',
                            'rate': window_rate,
                            'unit': 'sqft',
                            'quality': window_quality
                        }
                    )

                # Resolve electrical
                # frontend sends standard, premium, luxury
                # standard -> standard, premium -> good, luxury -> premium
                electrical_raw = (finishing.electrical or 'standard').lower()
                if electrical_raw == 'luxury':
                    electrical = 'premium'
                elif electrical_raw == 'premium':
                    electrical = 'good'
                else:
                    electrical = 'standard'
                electrical_id = f'electrical-{electrical}'
                
                # Electrical rate mapping
                electrical_rate = 55000 if electrical == 'premium' else (35000 if electrical == 'good' else 22000)
                
                electrical_material = Material.objects.filter(id=electrical_id).first()
                if not electrical_material:
                    electrical_material, _ = Material.objects.get_or_create(
                        id=electrical_id,
                        defaults={
                            'name': "Premium Electrical" if electrical == 'premium' else ("Good Quality Electrical" if electrical == 'good' else "Standard Electrical"),
                            'category': 'electrical',
                            'rate': electrical_rate,
                            'unit': 'package',
                            'quality': electrical
                        }
                    )
                electrical_base_rate = electrical_material.rate

                # Resolve plumbing
                # frontend sends standard, premium
                # standard -> standard, premium -> good
                plumbing_raw = (finishing.plumbing or 'standard').lower()
                if plumbing_raw == 'premium':
                    plumbing = 'good'
                else:
                    plumbing = 'standard'
                plumbing_id = f'plumbing-{plumbing}'
                
                # Plumbing rate mapping
                plumbing_rate = 65000 if plumbing == 'good' else 45000
                
                plumbing_material = Material.objects.filter(id=plumbing_id).first()
                if not plumbing_material:
                    plumbing_material, _ = Material.objects.get_or_create(
                        id=plumbing_id,
                        defaults={
                            'name': "Premium Plumbing" if plumbing == 'good' else "Standard Plumbing",
                            'category': 'plumbing',
                            'rate': plumbing_rate,
                            'unit': 'package',
                            'quality': plumbing
                        }
                    )

                # Resolve sanitary
                # frontend sends standard, premium, luxury
                # standard -> standard, premium -> good, luxury -> premium
                sanitary_raw = (finishing.sanitary or 'standard').lower()
                if sanitary_raw == 'luxury':
                    sanitary = 'premium'
                elif sanitary_raw == 'premium':
                    sanitary = 'good'
                else:
                    sanitary = 'standard'
                sanitary_id = f'sanitary-{sanitary}'
                
                # Sanitary rate mapping
                sanitary_rate = 250000 if sanitary == 'premium' else (110000 if sanitary == 'good' else 65000)
                
                sanitary_material = Material.objects.filter(id=sanitary_id).first()
                if not sanitary_material:
                    sanitary_material, _ = Material.objects.get_or_create(
                        id=sanitary_id,
                        defaults={
                            'name': "Luxury Sanitary" if sanitary == 'premium' else ("Premium Sanitary" if sanitary == 'good' else "Standard Sanitary"),
                            'category': 'sanitary',
                            'rate': sanitary_rate,
                            'unit': 'package',
                            'quality': sanitary
                        }
                    )

                # Resolve cabinets
                # frontend sends basic, modular, premium
                # basic -> standard, modular -> good, premium -> premium
                cabinets_raw = (finishing.cabinets or 'standard').lower()
                if cabinets_raw == 'premium':
                    cabinets = 'premium'
                elif cabinets_raw == 'modular':
                    cabinets = 'good'
                else:
                    cabinets = 'standard'
                cabinets_id = f'cabinets-{cabinets}'
                
                # Cabinets rate mapping
                cabinets_rate = 4500 if cabinets == 'premium' else (2800 if cabinets == 'good' else 1800)
                
                cabinets_material = Material.objects.filter(id=cabinets_id).first()
                if not cabinets_material:
                    cabinets_material, _ = Material.objects.get_or_create(
                        id=cabinets_id,
                        defaults={
                            'name': "Premium Kitchen Cabinets" if cabinets == 'premium' else ("Modular Kitchen Cabinets" if cabinets == 'good' else "Basic Kitchen Cabinets"),
                            'category': 'cabinets',
                            'rate': cabinets_rate,
                            'unit': 'sqft',
                            'quality': cabinets
                        }
                    )

                # Resolve other finishing materials
                water_tank_material, _ = Material.objects.get_or_create(
                    id='water-tank',
                    defaults={
                        'name': 'Water Tank & Installation',
                        'category': 'other',
                        'rate': 45000,
                        'unit': 'set',
                        'quality': 'standard'
                    }
                )
                false_ceiling_material, _ = Material.objects.get_or_create(
                    id='false-ceiling',
                    defaults={
                        'name': 'False Ceiling (Selected Areas)',
                        'category': 'other',
                        'rate': 180,
                        'unit': 'sq ft',
                        'quality': 'standard'
                    }
                )

                finishing_bom_items = []
                finishing_bom_items.append((flooring_material, total_area * Decimal('0.85'), 'sq ft', flooring_material.rate))
                finishing_bom_items.append((tiles_material, total_area * Decimal('0.3'), 'sq ft', tiles_material.rate))
                finishing_bom_items.append((paint_material, total_area * Decimal('2.0'), 'sq ft', paint_material.rate))
                finishing_bom_items.append((door_material, Decimal(str(door_count)), 'pieces', door_material.rate))
                finishing_bom_items.append((window_material, Decimal(str(window_count)), 'pieces', window_material.rate * Decimal('12')))
                
                # Split electrical wiring and DB
                wiring_material, _ = Material.objects.get_or_create(
                    id=f'{electrical_id}-wiring',
                    defaults={
                        'name': f"{electrical.capitalize()} Electrical Points & Wiring",
                        'category': 'electrical',
                        'rate': electrical_base_rate / Decimal('2'),
                        'unit': 'rooms',
                        'quality': electrical
                    }
                )
                finishing_bom_items.append((wiring_material, Decimal(str(total_rooms)), 'rooms', wiring_material.rate))

                db_material, _ = Material.objects.get_or_create(
                    id=f'{electrical_id}-db',
                    defaults={
                        'name': 'Main Distribution Board & Breakers',
                        'category': 'electrical',
                        'rate': electrical_base_rate * Decimal('3'),
                        'unit': 'set',
                        'quality': electrical
                    }
                )
                finishing_bom_items.append((db_material, Decimal('1'), 'set', db_material.rate))

                finishing_bom_items.append((plumbing_material, Decimal(str(bathroom_count + kitchen_count)), 'points', plumbing_material.rate))
                finishing_bom_items.append((water_tank_material, Decimal('1'), 'set', water_tank_material.rate))

                if bathroom_count > 0:
                    finishing_bom_items.append((sanitary_material, Decimal(str(bathroom_count)), 'set', sanitary_material.rate))

                if kitchen_count > 0:
                    finishing_bom_items.append((cabinets_material, kitchen_area, 'sq ft', cabinets_material.rate))

                finishing_bom_items.append((false_ceiling_material, total_area * Decimal('0.3'), 'sq ft', false_ceiling_material.rate))

                for material, quantity, unit, rate in finishing_bom_items:
                    try:
                        q = Decimal(str(round(quantity, 2))) if unit != 'pieces' else Decimal(str(round(quantity)))
                        r = Decimal(str(round(rate, 2)))
                        BillOfMaterial.objects.create(
                            project=project,
                            material=material,
                            category='finishing',
                            quantity=q,
                            unit=unit,
                            rate=r,
                            total_cost=Decimal(str(round(q * r)))
                        )
                    except Exception as e:
                        pass

            except FinishingDetails.DoesNotExist:
                pass


class FloorViewSet(viewsets.ModelViewSet):
    """Floor management viewset"""

    queryset = Floor.objects.all()
    serializer_class = FloorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Floor.objects.all()
        return Floor.objects.filter(project__user=user)


class RoomViewSet(viewsets.ModelViewSet):
    """Room management viewset"""

    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Room.objects.all()
        return Room.objects.filter(floor__project__user=user)


class FinishingDetailsViewSet(viewsets.ModelViewSet):
    """Finishing details viewset"""

    queryset = FinishingDetails.objects.all()
    serializer_class = FinishingDetailsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return FinishingDetails.objects.all()
        return FinishingDetails.objects.filter(project__user=user)


class BillOfMaterialViewSet(viewsets.ReadOnlyModelViewSet):
    """Bill of Materials viewset (read-only)"""
    pagination_class = None

    queryset = BillOfMaterial.objects.all()
    serializer_class = BillOfMaterialSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['project']

    def get_queryset(self):
        user = self.request.user
        queryset = BillOfMaterial.objects.all() if user.role == 'admin' else BillOfMaterial.objects.filter(project__user=user)
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset


class CostHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Cost history viewset (read-only)"""

    queryset = CostHistory.objects.all()
    serializer_class = CostHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['material']
    ordering_fields = ['effective_date']


class DashboardStatsView(APIView):
    """Dashboard statistics for admin and users"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role == 'admin':
            stats = {
                'total_users': User.objects.count(),
                'total_projects': Project.objects.count(),
                'active_projects': Project.objects.filter(status='in_progress').count(),
                'total_materials': Material.objects.filter(is_active=True).count(),
                'recent_projects': ProjectListSerializer(
                    Project.objects.order_by('-created_at')[:5],
                    many=True
                ).data
            }
        else:
            user_projects = Project.objects.filter(user=user)
            stats = {
                'total_projects': user_projects.count(),
                'active_projects': user_projects.filter(status='in_progress').count(),
                'completed_projects': user_projects.filter(status='completed').count(),
                'total_investment': user_projects.aggregate(
                    total=Sum('total_cost')
                )['total'] or 0,
                'recent_projects': ProjectListSerializer(
                    user_projects.order_by('-created_at')[:5],
                    many=True
                ).data
            }

        return Response(stats)


class AICostPredictionView(APIView):
    """AI-powered construction cost prediction endpoint.
    
    Accepts project parameters and returns intelligent cost forecasts
    using Google Gemini AI with fallback to a rule-based engine.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        params = {
            'plot_area': request.data.get('plot_area', 5),
            'num_floors': request.data.get('num_floors', 1),
            'construction_type': request.data.get('construction_type', 'gray'),
            'quality': request.data.get('quality', 'standard'),
            'location': request.data.get('location', 'Lahore'),
            'marla_size': request.data.get('marla_size', 225),
            'prediction_months': request.data.get('prediction_months', 12),
        }

        try:
            from .ai_prediction import generate_ai_prediction
            prediction = generate_ai_prediction(params)
            return Response(prediction, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Prediction failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DiagnoseView(APIView):
    """Secure Diagnostic Endpoint for Checking Database and Auth State"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        email = request.query_params.get('email', 'zafarali.chatha22@gmail.com')
        try:
            from django.contrib.auth import get_user_model
            from allauth.account.models import EmailAddress
            from rest_framework.authtoken.models import Token
            User = get_user_model()
            
            user_exists = User.objects.filter(email__iexact=email).exists()
            res = {
                'user_exists': user_exists,
                'email_queried': email
            }
            
            # Test email sending if requested
            test_email = request.query_params.get('test_email')
            if test_email:
                try:
                    from django.core.mail import send_mail
                    from django.conf import settings
                    send_mail(
                        subject='ICEMGS Diagnosis Test Email',
                        message='This is a test email sent from the ICEMGS diagnostics endpoint.',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[test_email],
                        fail_silently=False,
                    )
                    res['email_test_status'] = 'success'
                except Exception as mail_ex:
                    import traceback
                    res['email_test_status'] = 'failed'
                    res['email_test_error'] = f"{type(mail_ex).__name__}: {str(mail_ex)}"
                    res['email_test_traceback'] = traceback.format_exc()

            if user_exists:
                user = User.objects.get(email__iexact=email)
                res.update({
                    'is_active': user.is_active,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'role': user.role,
                    'has_usable_password': user.has_usable_password(),
                })
                # Check password match if password param is provided
                test_pass = request.query_params.get('pass')
                if test_pass:
                    res['password_match'] = user.check_password(test_pass)
                
                # Check email address record
                email_records = EmailAddress.objects.filter(user=user)
                res['email_records'] = [
                    {'email': e.email, 'verified': e.verified, 'primary': e.primary}
                    for e in email_records
                ]
                
                # Check token
                token_exists = Token.objects.filter(user=user).exists()
                res['token_exists'] = token_exists
                
            return Response(res)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
