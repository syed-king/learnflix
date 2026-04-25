# LearnFlix 🎬

A Netflix-style learning platform built with Django + React.

## Requirements
- Python 3.10+
- Node.js 18+

## Setup

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd netflix-learning
```

### 2. Backend
```bash
cd backend
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers pillow
python manage.py migrate
python seed.py
python manage.py runserver
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## Default Admin
- Username: `admin`
- Password: `admin123`
