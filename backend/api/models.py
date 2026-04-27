from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Content(models.Model):
    CONTENT_TYPES = [('movie', 'Movie'), ('series', 'Series'), ('course', 'Course')]
    title = models.CharField(max_length=200)
    description = models.TextField()
    thumbnail = models.ImageField(upload_to='thumbnails/', blank=True, null=True)
    video_url = models.URLField(blank=True)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES, default='course')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    is_premium = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    @property
    def avg_rating(self):
        reviews = self.reviews.all()
        return round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else 0


class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    duration_days = models.IntegerField(default=30)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Subscription(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('active', 'Active'), ('expired', 'Expired'), ('cancelled', 'Cancelled')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.plan.name} ({self.status})"


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.ForeignKey(Content, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'content')

    def __str__(self):
        return f"{self.user.username} - {self.content.title} ({self.rating}★)"


class UserProfile(models.Model):
    ROLE_CHOICES = [('viewer', 'Viewer'), ('publisher', 'Publisher')]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    publisher_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    website = models.URLField(blank=True)
    social_link = models.URLField(blank=True)

    def __str__(self):
        return self.user.username

    def save(self, *args, **kwargs):
        if self.role == 'publisher' and not self.publisher_id:
            import uuid
            self.publisher_id = 'PUB-' + str(uuid.uuid4())[:8].upper()
        super().save(*args, **kwargs)


class LiveStream(models.Model):
    STATUS_CHOICES = [('scheduled', 'Scheduled'), ('live', 'Live'), ('ended', 'Ended')]
    publisher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='streams')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    stream_key = models.CharField(max_length=100, unique=True, blank=True)
    stream_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    viewer_count = models.IntegerField(default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.publisher.username} - {self.title} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.stream_key:
            import uuid
            self.stream_key = str(uuid.uuid4()).replace('-', '')[:32]
        super().save(*args, **kwargs)


class PublisherVideo(models.Model):
    publisher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='videos')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    video_url = models.URLField()
    thumbnail = models.ImageField(upload_to='pub_thumbnails/', blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    is_premium = models.BooleanField(default=False)
    views = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
