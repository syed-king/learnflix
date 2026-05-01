from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import cloudinary.uploader
from django.conf import settings
from .models import Content, Category, Subscription, SubscriptionPlan, Review, UserProfile, LiveStream, PublisherVideo
from .serializers import (UserSerializer, RegisterSerializer, ContentSerializer,
                           CategorySerializer, SubscriptionSerializer, SubscriptionPlanSerializer,
                           ReviewSerializer, UserProfileSerializer, LiveStreamSerializer, PublisherVideoSerializer)


def is_publisher(user):
    try:
        return user.profile.role == 'publisher'
    except:
        return False


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({'access': str(refresh.access_token), 'refresh': str(refresh),
                         'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)
    user = request.user
    data = request.data
    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    user.email = data.get('email', user.email)
    user.save()
    profile_obj, _ = UserProfile.objects.get_or_create(user=user)
    profile_serializer = UserProfileSerializer(profile_obj, data=data, partial=True)
    if profile_serializer.is_valid():
        profile_serializer.save()
    return Response(UserSerializer(user).data)


class ContentListView(generics.ListAPIView):
    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Content.objects.all()
        category = self.request.query_params.get('category')
        content_type = self.request.query_params.get('type')
        search = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category__id=category)
        if content_type:
            qs = qs.filter(content_type=content_type)
        if search:
            qs = qs.filter(title__icontains=search)
        return qs.order_by('-created_at')


class ContentDetailView(generics.RetrieveAPIView):
    queryset = Content.objects.all()
    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticated]


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]


class SubscriptionPlanListView(generics.ListAPIView):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated]


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe(request):
    plan_id = request.data.get('plan_id')
    try:
        plan = SubscriptionPlan.objects.get(id=plan_id)
    except SubscriptionPlan.DoesNotExist:
        return Response({'error': 'Plan not found'}, status=404)
    existing = request.user.subscriptions.filter(status='active').first()
    if existing:
        return Response({'error': 'Already have an active subscription'}, status=400)
    sub = Subscription.objects.create(user=request.user, plan=plan, status='pending')
    return Response(SubscriptionSerializer(sub).data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_subscription(request):
    sub = request.user.subscriptions.filter(status='active').first()
    if sub:
        return Response(SubscriptionSerializer(sub).data)
    return Response({'status': 'none'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_review(request, content_id):
    try:
        content = Content.objects.get(pk=content_id)
    except Content.DoesNotExist:
        return Response({'error': 'Content not found'}, status=404)
    if not request.user.subscriptions.filter(status='active').exists():
        return Response({'error': 'Subscription required'}, status=403)
    review, created = Review.objects.update_or_create(
        user=request.user, content=content,
        defaults={'rating': request.data.get('rating'), 'comment': request.data.get('comment', '')}
    )
    return Response(ReviewSerializer(review).data, status=201 if created else 200)


# ===== PUBLISHER VIEWS =====

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cloudinary_signature(request):
    if not is_publisher(request.user):
        return Response({'error': 'Publisher access required'}, status=403)
    
    timestamp = int(timezone.now().timestamp())
    params_to_sign = {
        'timestamp': timestamp,
        'upload_preset': 'learnflix_videos',
        'folder': 'pub_videos'
    }
    
    signature = cloudinary.utils.api_sign_request(params_to_sign, settings.CLOUDINARY_API_SECRET)
    
    return Response({
        'signature': signature,
        'timestamp': timestamp,
        'cloud_name': settings.CLOUDINARY_CLOUD_NAME,
        'api_key': settings.CLOUDINARY_API_KEY,
        'upload_preset': 'learnflix_videos'
    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def publisher_videos(request):
    if not is_publisher(request.user):
        return Response({'error': 'Publisher access required'}, status=403)
    if request.method == 'GET':
        videos = PublisherVideo.objects.filter(publisher=request.user).order_by('-created_at')
        return Response(PublisherVideoSerializer(videos, many=True).data)
    serializer = PublisherVideoSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(publisher=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def publisher_video_detail(request, pk):
    try:
        video = PublisherVideo.objects.get(pk=pk, publisher=request.user)
    except PublisherVideo.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    if request.method == 'DELETE':
        video.delete()
        return Response(status=204)
    serializer = PublisherVideoSerializer(video, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def live_streams(request):
    if request.method == 'GET':
        streams = LiveStream.objects.filter(status='live').order_by('-started_at')
        return Response(LiveStreamSerializer(streams, many=True).data)
    if not is_publisher(request.user):
        return Response({'error': 'Publisher access required'}, status=403)
    serializer = LiveStreamSerializer(data=request.data)
    if serializer.is_valid():
        stream = serializer.save(publisher=request.user)
        return Response(LiveStreamSerializer(stream).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_streams(request):
    if not is_publisher(request.user):
        return Response({'error': 'Publisher access required'}, status=403)
    streams = LiveStream.objects.filter(publisher=request.user).order_by('-created_at')
    return Response(LiveStreamSerializer(streams, many=True).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def stream_control(request, pk):
    if not is_publisher(request.user):
        return Response({'error': 'Publisher access required'}, status=403)
    try:
        stream = LiveStream.objects.get(pk=pk, publisher=request.user)
    except LiveStream.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    action = request.data.get('action')
    if action == 'go_live':
        stream.status = 'live'
        stream.started_at = timezone.now()
    elif action == 'end':
        stream.status = 'ended'
        stream.ended_at = timezone.now()
    stream.save()
    return Response(LiveStreamSerializer(stream).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def stream_update(request, pk):
    if not is_publisher(request.user):
        return Response({'error': 'Publisher access required'}, status=403)
    try:
        stream = LiveStream.objects.get(pk=pk, publisher=request.user)
    except LiveStream.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    serializer = LiveStreamSerializer(stream, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_publisher_videos(request):
    publisher_id = request.query_params.get('publisher')
    if publisher_id:
        videos = PublisherVideo.objects.filter(publisher__id=publisher_id).order_by('-created_at')
    else:
        videos = PublisherVideo.objects.all().order_by('-created_at')
    return Response(PublisherVideoSerializer(videos, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def publisher_video_watch(request, pk):
    try:
        video = PublisherVideo.objects.get(pk=pk)
        video.views += 1
        video.save(update_fields=['views'])
        return Response(PublisherVideoSerializer(video).data)
    except PublisherVideo.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_publishers(request):
    publishers = User.objects.filter(profile__role='publisher').order_by('username')
    data = []
    for p in publishers:
        video_count = p.videos.count()
        data.append({
            'id': p.id,
            'username': p.username,
            'first_name': p.first_name,
            'last_name': p.last_name,
            'publisher_id': getattr(p.profile, 'publisher_id', None),
            'bio': getattr(p.profile, 'bio', ''),
            'website': getattr(p.profile, 'website', ''),
            'social_link': getattr(p.profile, 'social_link', ''),
            'video_count': video_count,
        })
    return Response(data)


# ===== ADMIN VIEWS =====

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_users(request):
    users = User.objects.all().order_by('-date_joined')
    return Response(UserSerializer(users, many=True).data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_subscriptions(request):
    status_filter = request.query_params.get('status')
    qs = Subscription.objects.all().order_by('-created_at')
    if status_filter:
        qs = qs.filter(status=status_filter)
    return Response(SubscriptionSerializer(qs, many=True).data)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_subscription_update(request, pk):
    try:
        sub = Subscription.objects.get(pk=pk)
    except Subscription.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    new_status = request.data.get('status')
    if new_status == 'active' and sub.status == 'pending':
        sub.start_date = timezone.now()
        sub.end_date = timezone.now() + timedelta(days=sub.plan.duration_days)
    sub.status = new_status
    sub.save()
    return Response(SubscriptionSerializer(sub).data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_reviews(request):
    reviews = Review.objects.all().order_by('-created_at')
    data = [{'id': r.id, 'user': r.user.username, 'content': r.content.title,
              'rating': r.rating, 'comment': r.comment, 'created_at': r.created_at} for r in reviews]
    return Response(data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_review_delete(request, pk):
    Review.objects.filter(pk=pk).delete()
    return Response(status=204)
