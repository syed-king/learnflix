"""
WSGI config for backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_wsgi_application()

# Auto-migrate and seed on startup if database tables are missing (e.g. fresh SQLite fallback on Render)
try:
    from django.contrib.auth.models import User
    from django.core.management import call_command
    if not User.objects.filter(username='admin').exists():
        call_command('migrate', interactive=False)
        import seed  # noqa: F401
except Exception:
    try:
        from django.core.management import call_command
        call_command('migrate', interactive=False)
        import seed  # noqa: F401
    except Exception as _err:
        import sys
        print(f"Startup auto-migrate warning: {_err}", file=sys.stderr)
