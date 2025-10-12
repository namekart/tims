# Webhook URL Configuration

## ❌ Problem: Fider Requires HTTPS

Fider blocks HTTP webhook URLs for security reasons.

## ✅ Solution: Use Internal Docker Network URLs

Since all services run in Docker, they can communicate via internal network names without HTTPS.

---

## 🔗 Correct Webhook URLs

### For Fider Admin Panel (http://localhost:8081/admin/webhooks)

When creating a webhook in Fider, use the **internal container name**:

```
http://orchestrator-orchestrator-1:3001/webhooks/fider
```

**NOT:**
```
http://localhost:3001/webhooks/fider  ❌ (Fider will reject this)
```

---

## 📝 Step-by-Step Configuration

### 1. Access Fider Admin
- URL: http://localhost:8081/admin/webhooks
- (You need to be logged in as admin)

### 2. Create New Webhook
Click "New webhook" button

### 3. Fill in Details
- **Name**: `Plane Integration`
- **Type**: ✅ `New Post`
- **Enabled**: ✅ Checked
- **URL**: `http://orchestrator-orchestrator-1:3001/webhooks/fider`
- **HTTP Method**: `POST`
- **Content**: (use the Fider template you want)

### 4. Add Headers
Click "Add" to add headers:
- **Header**: `Content-Type`
- **Value**: `application/json`

### 5. Request Body Template (Example)
```json
{
  "name": "[Fider #{{ .post_number }}] {{ escape .post_title }}",
  "description": "**Fider Post:** {{ .post_url }}\n\n**Author:** {{ .author_name }} ({{ .author_email }})\n\n**Votes:** {{ .post_votes }}\n\n{{ markdown .post_description }}",
  "priority": "{{ if ge .post_votes 10 }}high{{ else if ge .post_votes 5 }}medium{{ else }}low{{ end }}"
}
```

### 6. Save
Click "Save" button

---

## 🧪 Test the Webhook

### Method 1: Create a Post in Fider
1. Go to http://localhost:8081
2. Create a new post
3. Watch orchestrator logs:
   ```bash
   docker compose -f /home/tims/root/orchestrator/docker-compose.yml logs -f orchestrator
   ```
4. Check Plane for the new issue: http://localhost

### Method 2: Direct API Test
```bash
curl -X POST http://localhost:3001/test/create-issue \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Issue",
    "description": "Testing orchestrator",
    "priority": "medium"
  }'
```

---

## 🔍 Why This Works

- **Docker Networks**: Fider, Orchestrator, and Plane are on the same Docker network
- **Internal DNS**: Docker provides DNS resolution for container names
- **No HTTPS Required**: Internal container-to-container communication doesn't need HTTPS
- **Security**: Traffic never leaves the Docker network

---

## 🌐 Service Network Names

| Service | Container Name | Internal URL |
|---------|---------------|--------------|
| Orchestrator | `orchestrator-orchestrator-1` | `http://orchestrator-orchestrator-1:3001` |
| Fider | `fider-app-1` | `http://fider-app-1:3000` |
| Plane | `plane-app-proxy-1` | `http://plane-app-proxy-1` |

---

## 🐛 Troubleshooting

### Error: "Webhook URL must be HTTPS"
✅ Use internal container name: `http://orchestrator-orchestrator-1:3001/webhooks/fider`
❌ Don't use: `http://localhost:3001/webhooks/fider`

### Error: "Connection refused" or "Cannot reach webhook"
Check if orchestrator is running:
```bash
docker ps | grep orchestrator
```

Check if containers are on the same network:
```bash
docker network inspect fider_default
```

### Verify Container Names
```bash
docker ps --format "table {{.Names}}\t{{.Networks}}"
```

---

## 📊 Expected Flow

```
User creates post in Fider (http://localhost:8081)
           ↓
Fider sends webhook to orchestrator (internal network)
           ↓
http://orchestrator-orchestrator-1:3001/webhooks/fider
           ↓
Orchestrator processes webhook
           ↓
Orchestrator calls Plane API (internal network)
           ↓
http://plane-app-proxy-1/api/v1/workspaces/.../issues/
           ↓
Issue created in Plane ✅
```

---

## 💡 Alternative: Use Public HTTPS URL

If you need a public webhook URL (for testing or external access), you can use:

1. **ngrok** (free tunnel):
   ```bash
   ngrok http 3001
   ```
   Then use the HTTPS URL: `https://abc123.ngrok.io/webhooks/fider`

2. **Cloudflare Tunnel** (free):
   ```bash
   cloudflared tunnel --url http://localhost:3001
   ```

But for local Docker setup, **internal URLs are the best solution**!

