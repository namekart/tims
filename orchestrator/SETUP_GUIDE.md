# Orchestrator Setup Guide

## ✅ Installation Complete!

Your Fider-Plane orchestrator is now running at **http://localhost:3001**

## 🔗 Configure Webhooks

### Step 1: Configure Fider Webhook

1. Access Fider admin panel (you need to be logged in as admin first)
2. Go to: **http://localhost:8081/admin/webhooks**
3. Click "New webhook"
4. Fill in:
   - **Name**: `Plane Integration`
   - **Type**: `New Post` ✅
   - **Enabled**: ✅
   - **URL**: `http://orchestrator-orchestrator-1:3001/webhooks/fider`
   - **HTTP Method**: `POST`
   - **HTTP Headers**:
     - Header: `Content-Type`, Value: `application/json`

### Step 2: Test the Integration

1. Create a new post in Fider: **http://localhost:8081**
2. Watch the orchestrator logs:
   ```bash
   docker compose -f /home/tims/root/orchestrator/docker-compose.yml logs -f orchestrator
   ```
3. Check Plane to see if the issue was created: **http://localhost**

### Step 3: Manual Test (Optional)

Test creating an issue directly:
```bash
curl -X POST http://localhost:3001/test/create-issue \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Issue from Orchestrator",
    "description": "This is a test issue",
    "priority": "medium"
  }'
```

## 📊 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Orchestrator | http://localhost:3001 | Webhook bridge |
| Fider | http://localhost:8081 | Feedback platform |
| Plane | http://localhost | Project management |

## 🔧 Webhook Endpoints

| Endpoint | Purpose |
|----------|---------|
| `http://localhost:3001/webhooks/fider` | Receives Fider webhooks |
| `http://localhost:3001/webhooks/plane` | Receives Plane webhooks |
| `http://localhost:3001/health` | Health check |

## 🎯 What Happens When You Create a Fider Post

1. User creates a post in Fider
2. Fider sends webhook to orchestrator
3. Orchestrator receives the webhook
4. Orchestrator creates a Plane issue with:
   - Title: `[Fider #123] Post Title`
   - Description: Author, votes, link, and full post content
   - Priority: Based on vote count (low/medium/high)
   - Labels: `fider-feedback`

## 📝 Priority Mapping

| Fider Votes | Plane Priority |
|-------------|----------------|
| 10+ votes | High |
| 5-9 votes | Medium |
| 0-4 votes | Low |

## 🛠️ Management Commands

### View logs
```bash
docker compose -f /home/tims/root/orchestrator/docker-compose.yml logs -f orchestrator
```

### Restart orchestrator
```bash
docker compose -f /home/tims/root/orchestrator/docker-compose.yml restart orchestrator
```

### Stop orchestrator
```bash
docker compose -f /home/tims/root/orchestrator/docker-compose.yml down
```

### Start orchestrator
```bash
docker compose -f /home/tims/root/orchestrator/docker-compose.yml up -d
```

## 🐛 Troubleshooting

### Check if orchestrator is running
```bash
curl http://localhost:3001/health
```

### Check Docker networks
The orchestrator needs to connect to both Fider and Plane networks:
```bash
docker network ls | grep -E 'fider|plane'
```

### Test Plane API connection
```bash
curl -X POST http://localhost:3001/test/create-issue \
  -H "Content-Type: application/json" \
  -d '{"name": "Connection Test"}'
```

## 📂 Project Structure

```
orchestrator/
├── src/
│   ├── config/              # Configuration
│   ├── controllers/         # Webhook handlers
│   │   └── webhookController.ts
│   ├── services/            # API clients
│   │   ├── PlaneClient.ts   # Plane API wrapper
│   │   └── FiderClient.ts   # Fider API wrapper
│   ├── types/               # TypeScript types
│   └── index.ts             # Main Express app
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔐 Security Notes

- The orchestrator runs in a Docker network with Fider and Plane
- Webhook endpoints are accessible from both services
- Consider adding webhook signature verification for production

## 📈 Next Steps

1. ✅ Orchestrator is running
2. 🔲 Configure Fider webhook
3. 🔲 Test by creating a Fider post
4. 🔲 Verify issue appears in Plane
5. 🔲 Customize event handlers in `src/controllers/webhookController.ts`

## 💡 Customization

To customize the integration behavior, edit:
- `src/controllers/webhookController.ts` - Webhook event handlers
- `src/services/PlaneClient.ts` - Plane API interactions
- `src/services/FiderClient.ts` - Fider API interactions

Then rebuild:
```bash
docker compose -f /home/tims/root/orchestrator/docker-compose.yml up -d --build
```

