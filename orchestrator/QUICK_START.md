# 🚀 Quick Start Guide

## ✅ Orchestrator is Running!

**Status**: http://localhost:3001/health ✅

---

## 🔗 Configure Fider Webhook (IMPORTANT!)

### The Solution to HTTPS Problem

Fider requires HTTPS for webhooks, but we can bypass this using **internal Docker network URLs**.

### ✅ Use This URL:
```
http://orchestrator-orchestrator-1:3001/webhooks/fider
```

### ❌ NOT This:
```
http://localhost:3001/webhooks/fider  (Fider will reject HTTP localhost URLs)
```

---

## 📝 Step-by-Step Setup

### 1. Login to Fider as Admin
- Go to: http://localhost:8081
- Sign in with your admin account

### 2. Navigate to Webhooks
- Go to: http://localhost:8081/admin/webhooks
- Click **"New webhook"**

### 3. Configure Webhook

Fill in the form:

| Field | Value |
|-------|-------|
| **Name** | `Plane Integration` |
| **Type** | ✅ `New Post` |
| **Enabled** | ✅ Checked |
| **URL** | `http://orchestrator-orchestrator-1:3001/webhooks/fider` |
| **HTTP Method** | `POST` |

### 4. Add HTTP Header

Click **"Add"** button and add:
- **Header**: `Content-Type`
- **Value**: `application/json`

### 5. Request Body (Content)

Paste this template:

```json
{
  "name": "[Fider #{{ .post_number }}] {{ escape .post_title }}",
  "description": "**📊 Fider Feedback**\n\n**Author:** {{ .author_name }} ({{ .author_role }})\n**Email:** {{ .author_email }}\n**Votes:** {{ .post_votes }}\n**Created:** {{ format \"2006-01-02 15:04:05\" .post_created_at }}\n**Fider URL:** {{ .post_url }}\n\n---\n\n{{ markdown .post_description }}",
  "priority": "{{ if ge .post_votes 10 }}high{{ else if ge .post_votes 5 }}medium{{ else }}low{{ end }}"
}
```

### 6. Save

Click **"Save"** button

---

## 🧪 Test the Integration

### Option 1: Create a Test Post in Fider

1. Go to http://localhost:8081
2. Create a new post with:
   - Title: "Test Post from Fider"
   - Description: "Testing orchestrator integration"
3. Submit the post

### Option 2: Watch Logs

Open a terminal and watch orchestrator logs:
```bash
docker compose -f /home/tims/root/orchestrator/docker-compose.yml logs -f orchestrator
```

You should see:
```
📨 Received Fider webhook: new_post
   Post: #1 - Test Post from Fider
✨ Creating Plane issue from Fider post #1
📤 Creating Plane issue: [Fider #1] Test Post from Fider
✅ Plane issue created: <issue-id>
```

### Option 3: Check Plane

Go to http://localhost and look for the new issue:
- Title: `[Fider #1] Test Post from Fider`
- Label: `fider-feedback`

### Option 4: Direct API Test

Test orchestrator API directly:
```bash
curl -X POST http://localhost:3001/test/create-issue \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Direct API Test",
    "description": "Testing orchestrator directly",
    "priority": "medium"
  }'
```

---

## 🎯 What Happens

```
┌─────────────────────────────────────────────────────┐
│  User creates post in Fider                         │
│  http://localhost:8081                              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓ Webhook (internal network)
┌─────────────────────────────────────────────────────┐
│  Orchestrator receives webhook                      │
│  http://orchestrator-orchestrator-1:3001            │
│  - Parses Fider post data                           │
│  - Determines priority from votes                   │
│  - Builds Plane issue payload                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓ Plane API call (internal network)
┌─────────────────────────────────────────────────────┐
│  Plane creates issue                                │
│  http://plane-app-proxy-1/api/v1/...                │
│  - Title: [Fider #X] Post Title                     │
│  - Description: Author, votes, link, content        │
│  - Priority: Based on votes                         │
│  - Labels: fider-feedback                           │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Management

### View Logs
```bash
docker compose -f /home/tims/root/orchestrator/docker-compose.yml logs -f orchestrator
```

### Restart
```bash
docker compose -f /home/tims/root/orchestrator/docker-compose.yml restart
```

### Check Status
```bash
curl http://localhost:3001/health
```

---

## 🐛 Troubleshooting

### Webhook Error: "URL must be HTTPS"
✅ **Solution**: Use internal container name
```
http://orchestrator-orchestrator-1:3001/webhooks/fider
```

### No Issue Created in Plane
1. Check orchestrator logs for errors
2. Verify Plane API key is correct
3. Verify Plane project ID is correct
4. Test with direct API call

### Orchestrator Not Responding
```bash
# Check if running
docker ps | grep orchestrator

# Restart
docker compose -f /home/tims/root/orchestrator/docker-compose.yml restart
```

---

## 📚 More Info

- **Full Documentation**: `README.md`
- **Webhook URLs**: `WEBHOOK_URLS.md`
- **Setup Guide**: `SETUP_GUIDE.md`

---

## ✨ Summary

1. ✅ Orchestrator is running on port 3001
2. 🔗 Use internal Docker URL: `http://orchestrator-orchestrator-1:3001/webhooks/fider`
3. 📝 Configure webhook in Fider admin panel
4. 🧪 Test by creating a post in Fider
5. ✅ Check Plane for the new issue

**The key**: Use **container name** instead of **localhost** to bypass HTTPS requirement!

