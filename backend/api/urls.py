from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('auth/register/', views.register, name='register'),
    path('profile/', views.profile, name='profile'),

    path('content/', views.ContentListView.as_view(), name='content-list'),
    path('content/<int:pk>/', views.ContentDetailView.as_view(), name='content-detail'),
    path('content/<int:content_id>/review/', views.add_review, name='add-review'),
    path('categories/', views.CategoryListView.as_view(), name='categories'),

    path('plans/', views.SubscriptionPlanListView.as_view(), name='plans'),
    path('subscribe/', views.subscribe, name='subscribe'),
    path('my-subscription/', views.my_subscription, name='my-subscription'),

    # Publisher
    path('publisher/videos/', views.publisher_videos, name='publisher-videos'),
    path('publisher/videos/<int:pk>/', views.publisher_video_detail, name='publisher-video-detail'),
    path('publisher/streams/', views.my_streams, name='my-streams'),
    path('publisher/streams/control/<int:pk>/', views.stream_control, name='stream-control'),

    # Viewer
    path('live/', views.live_streams, name='live-streams'),
    path('videos/', views.all_publisher_videos, name='all-videos'),
    path('videos/<int:pk>/', views.publisher_video_watch, name='video-watch'),
    path('publishers/', views.all_publishers, name='all-publishers'),

    # Admin
    path('admin/users/', views.admin_users, name='admin-users'),
    path('admin/subscriptions/', views.admin_subscriptions, name='admin-subscriptions'),
    path('admin/subscriptions/<int:pk>/', views.admin_subscription_update, name='admin-sub-update'),
    path('admin/reviews/', views.admin_reviews, name='admin-reviews'),
    path('admin/reviews/<int:pk>/', views.admin_review_delete, name='admin-review-delete'),
]
