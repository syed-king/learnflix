# Quick Agora Setup (5 minutes)

## Step 1: Get Agora App ID
1. Go to https://console.agora.io/
2. Sign up (use any email)
3. Click "Create Project"
4. Project name: `LearnFlix`
5. Authentication: **Secured mode: APP ID**
6. Click "Submit"
7. Copy the **App ID** (looks like: `a1b2c3d4e5f6g7h8i9j0`)

## Step 2: Add to Vercel
1. Go to https://vercel.com/dashboard
2. Select your LearnFlix project
3. Settings → Environment Variables
4. Add new variable:
   - Name: `VITE_AGORA_APP_ID`
   - Value: `paste_your_app_id_here`
5. Click "Save"
6. Redeploy (Vercel will auto-redeploy)

## Step 3: Test
Wait 2-3 minutes for deployment, then:

**As Publisher:**
1. Login → Publisher Dashboard
2. Live Streams → New Stream
3. Enter title → Create Stream
4. Click "Go Live"
5. Allow camera/mic
6. You're live!

**As Viewer:**
1. Home → Live tab
2. Click the live stream
3. Watch in real-time!

## Done! 🎉
Publishers can now stream with camera/mic and viewers watch instantly.
