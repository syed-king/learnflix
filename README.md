# LearnFlix 🎬

A Netflix-style learning platform built with Django + React.

## Features
- 🎥 Video Upload & Streaming (Cloudinary)
- 📡 Live Streaming (YouTube Live integration)
- 👤 Publisher & Viewer Roles
- 💳 Subscription System with Admin Approval
- 🔒 Premium Content Gating
- ⚡ Fast Direct-to-Cloud Uploads

## Requirements
- Python 3.10+
- Node.js 18+
- Cloudinary Account (free tier)

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/syed-king/learnflix.git
cd learnflix
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
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

### 4. Cloudinary Setup (Required for Videos)
1. Sign up at https://cloudinary.com/users/register_free
2. Get your credentials from Dashboard
3. Create upload preset named `learnflix_videos` (Signed mode)
4. Add to `.env`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 5. Live Streaming Setup
See [LIVE_STREAMING_GUIDE.md](LIVE_STREAMING_GUIDE.md) for YouTube Live integration

## Default Admin
- Username: `admin`
- Password: `admin123`

## Deployment
- **Backend**: Render.com (with PostgreSQL)
- **Frontend**: Vercel
- **Storage**: Cloudinary

## Live Demo
- Frontend: https://learnflix-frontend.vercel.app
- Backend: https://learnflix-backend.onrender.com
