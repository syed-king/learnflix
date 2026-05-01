# Live Streaming Setup Guide

## Option 1: YouTube Live (Easiest - Free)

### For Publishers:
1. Go to [YouTube Studio](https://studio.youtube.com)
2. Click **Create** → **Go Live**
3. Choose **Stream** option
4. Copy the **Stream URL** (looks like: `https://www.youtube.com/embed/live_stream?channel=YOUR_CHANNEL_ID`)
5. In LearnFlix Publisher Dashboard:
   - Create a new stream
   - Paste the YouTube embed URL in the "Stream URL" field
   - Click "Go Live"

### For Viewers:
- They'll see your YouTube live stream embedded in LearnFlix

---

## Option 2: OBS Studio (Advanced)

### Setup:
1. Download [OBS Studio](https://obsproject.com/)
2. In LearnFlix, create a stream and copy your **Stream Key**
3. In OBS:
   - Settings → Stream
   - Service: Custom
   - Server: `rtmp://your-streaming-server.com/live`
   - Stream Key: Paste your LearnFlix stream key
4. Start streaming in OBS

**Note:** This requires a separate RTMP server (not included in free tier)

---

## Option 3: Twitch Integration

1. Go to [Twitch Dashboard](https://dashboard.twitch.tv)
2. Copy your Twitch embed URL
3. Paste in LearnFlix stream URL field
4. Go live on Twitch

---

## Recommended: YouTube Live
- ✅ Free
- ✅ No setup required
- ✅ Reliable streaming
- ✅ Works with LearnFlix embed
