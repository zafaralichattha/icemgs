"""
URL configuration for estimation app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, MaterialViewSet, ProjectViewSet,
    FloorViewSet, RoomViewSet, FinishingDetailsViewSet,
    BillOfMaterialViewSet, CostHistoryViewSet, DashboardStatsView,
    DatabaseHealthCheckView, VerifyEmailView, ResendOTPView,
    AICostPredictionView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'materials', MaterialViewSet, basename='material')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'floors', FloorViewSet, basename='floor')
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'finishing', FinishingDetailsViewSet, basename='finishing')
router.register(r'bill-of-materials', BillOfMaterialViewSet, basename='bom')
router.register(r'cost-history', CostHistoryViewSet, basename='cost-history')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('auth/resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('health-check/', DatabaseHealthCheckView.as_view(), name='health-check'),
    path('ai/predict-cost/', AICostPredictionView.as_view(), name='ai-predict-cost'),
]
