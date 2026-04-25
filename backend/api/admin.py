from django.contrib import admin
from .models import Content, Category, Subscription, SubscriptionPlan, Review, UserProfile

admin.site.register(Content)
admin.site.register(Category)
admin.site.register(Subscription)
admin.site.register(SubscriptionPlan)
admin.site.register(Review)
admin.site.register(UserProfile)
