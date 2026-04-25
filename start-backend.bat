@echo off
echo Starting LearnFlix Backend...
cd /d "%~dp0backend"
python manage.py runserver
