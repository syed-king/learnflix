from django.contrib import admin
from .models import Content, Category, Subscription, SubscriptionPlan, Review, UserProfile, PublisherVideo, LiveStream

admin.site.site_header = "Almiftah Administration"
admin.site.site_title = "Almiftah Admin"
admin.site.index_title = "Welcome to Almiftah Admin Portal"

admin.site.register(Content)
admin.site.register(Category)
admin.site.register(Subscription)
admin.site.register(SubscriptionPlan)
admin.site.register(Review)
admin.site.register(UserProfile)
admin.site.register(PublisherVideo)
admin.site.register(LiveStream)
