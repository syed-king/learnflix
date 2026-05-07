# Live Streaming Setup Guide

## Real-Time Camera/Mic Streaming with Agora

LearnFlix uses **Agora.io** for real-time video streaming where publishers can turn on their camera/mic and viewers watch instantly.

### Setup Steps:

#### 1. Sign Up for Agora (Free)
1. Go to: https://console.agora.io/
2. Sign up (free tier: 10,000 minutes/month)
3. Create a new project
4. Get your **App ID** from the project dashboard

#### 2. Add to Environment Variables

**Frontend (Vercel):**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add: `VITE_AGORA_APP_ID` = `your_agora_app_id`
- Redeploy

**Local Development:**
- Create `frontend/.env`
- Add: `VITE_AGORA_APP_ID=your_agora_app_id`

#### 3. How It Works

**For Publishers:**
1. Go to Publisher Dashboard → Live Streams
2. Create a new stream
3. Click "Go Live"
4. Allow camera/mic permissions
5. You're now broadcasting live!

**For Viewers:**
1. Go to Home → Live tab
2. Click any live stream
3. Watch the publisher's camera/mic in real-time

### Features:
- ✅ Real-time video & audio streaming
- ✅ No external software needed (OBS not required)
- ✅ Works directly in browser
- ✅ Low latency (~300ms)
- ✅ Free tier: 10,000 minutes/month
- ✅ Automatic quality adjustment

### Troubleshooting:
- **Camera not working?** Check browser permissions
- **No video showing?** Make sure Agora App ID is set correctly
- **Viewers can't see?** Ensure publisher clicked "Go Live"
