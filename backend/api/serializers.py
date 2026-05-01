from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Content, Category, Subscription, SubscriptionPlan, Review, UserProfile, LiveStream, PublisherVideo


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['avatar', 'bio', 'phone', 'role', 'publisher_id', 'website', 'social_link']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    has_active_subscription = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff',
                  'date_joined', 'profile', 'has_active_subscription', 'role']

    def get_has_active_subscription(self, obj):
        return obj.subscriptions.filter(status='active').exists()

    def get_role(self, obj):
        try:
            return obj.profile.role
        except:
            return 'viewer'


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=['viewer', 'publisher'], default='viewer', write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role']

    def create(self, validated_data):
        role = validated_data.pop('role', 'viewer')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user, role=role)
        return user


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'username', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'username', 'created_at']


class ContentSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    avg_rating = serializers.FloatField(read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Content
        fields = ['id', 'title', 'description', 'thumbnail', 'video_url', 'content_type',
                  'category', 'category_name', 'is_premium', 'created_at', 'avg_rating', 'reviews', 'review_count']

    def get_review_count(self, obj):
        return obj.reviews.count()


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_price = serializers.DecimalField(source='plan.price', max_digits=8, decimal_places=2, read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Subscription
        fields = ['id', 'user', 'username', 'email', 'plan', 'plan_name', 'plan_price',
                  'status', 'start_date', 'end_date', 'created_at']
        read_only_fields = ['user']


class LiveStreamSerializer(serializers.ModelSerializer):
    publisher_name = serializers.CharField(source='publisher.username', read_only=True)
    publisher_id = serializers.SerializerMethodField()

    class Meta:
        model = LiveStream
        fields = ['id', 'publisher', 'publisher_name', 'publisher_id', 'title', 'description',
                  'stream_key', 'stream_url', 'status', 'viewer_count', 'started_at', 'ended_at', 'created_at']
        read_only_fields = ['publisher', 'stream_key']

    def get_publisher_id(self, obj):
        try:
            return obj.publisher.profile.publisher_id
        except:
            return None


class PublisherVideoSerializer(serializers.ModelSerializer):
    publisher_name = serializers.CharField(source='publisher.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = PublisherVideo
        fields = ['id', 'publisher', 'publisher_name', 'title', 'description', 'video_file',
                  'video_url', 'thumbnail', 'category', 'category_name', 'is_premium', 'views', 'created_at']
        read_only_fields = ['publisher', 'views']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.video_file:
            data['video_file'] = instance.video_file.url if hasattr(instance.video_file, 'url') else str(instance.video_file)
        return data
