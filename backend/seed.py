import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Category, Content, SubscriptionPlan

# Admin user
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("Admin created: admin / admin123")

# Categories
cats = ['Programming', 'Design', 'Business', 'Data Science', 'Marketing']
cat_objs = {name: Category.objects.get_or_create(name=name)[0] for name in cats}

# Plans
plans = [
    ('Basic', 9.99, 30, 'Access to all standard content'),
    ('Pro', 19.99, 30, 'Access to all content + downloads'),
    ('Annual', 99.99, 365, 'Full access for a whole year'),
]
for name, price, days, desc in plans:
    SubscriptionPlan.objects.get_or_create(name=name, defaults={'price': price, 'duration_days': days, 'description': desc})

# Sample content
contents = [
    ('Python Masterclass', 'Complete Python from beginner to advanced', 'course', 'Programming', True),
    ('React & Next.js', 'Build modern web apps with React', 'course', 'Programming', True),
    ('UI/UX Design Fundamentals', 'Learn design principles and tools', 'course', 'Design', True),
    ('Machine Learning A-Z', 'Hands-on ML with Python & R', 'course', 'Data Science', True),
    ('Digital Marketing', 'Master SEO, social media & ads', 'course', 'Marketing', True),
    ('Django REST Framework', 'Build powerful APIs with Django', 'course', 'Programming', True),
    ('Figma for Beginners', 'Design beautiful UIs with Figma', 'course', 'Design', False),
    ('Excel for Business', 'Data analysis with Excel', 'course', 'Business', False),
    ('JavaScript ES6+', 'Modern JavaScript features', 'course', 'Programming', True),
    ('Data Visualization', 'Charts and graphs with Python', 'course', 'Data Science', True),
    ('Brand Strategy', 'Build a powerful brand identity', 'course', 'Business', True),
    ('CSS Animations', 'Create stunning web animations', 'course', 'Design', False),
]

for title, desc, ctype, cat_name, premium in contents:
    Content.objects.get_or_create(title=title, defaults={
        'description': desc, 'content_type': ctype,
        'category': cat_objs[cat_name], 'is_premium': premium,
        'video_url': 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    })

print("Seed data created successfully!")
