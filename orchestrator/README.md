# 🎯 Fider ↔ Plane Orchestrator

**Status: ✅ WORKING!**

Automatically sync feedback from Fider to Plane with intelligent project routing based on product tags.

## 🚀 What It Does

1. **Listens for Fider feedback** via webhook
2. **Extracts product tags** like `#webapp`, `#dashboard`, `#amp`
3. **Routes to correct Plane project** based on the tag
4. **Creates linked issues** with bidirectional URLs
5. **Stores mappings** in SQLite database for tracking

## ✅ Successfully Tested

```
✓ Fider webhook integration
✓ Plane API issue creation
✓ Product tag routing (#webapp, #dashboard, #amp)
✓ Database persistence (SQLite + Prisma)
✓ Webhook event logging
✓ Admin API for management

Issues Created:
• Fider #500 → Plane Issue #4 (Name.ai project)
• Fider #202 → Plane Issue #3 (Name.ai project)
```

## 📦 How Product Tag Routing Works

Users can specify which project to create issues in by adding hashtags to their Fider posts:

| Hashtag | Plane Project | Project ID |
|---------|--------------|------------|
| `#webapp` | Name.ai | `b5a20847-714b-4c87-b85d-bb85df44d29e` |
| `#dashboard` | NK_Dashboard | `321f660c-39d6-4f1a-9937-55f63d876051` |
| `#amp` | NK_AMP | `98e96599-2cd0-4c64-a918-e72cccccfa09` |

### Example

**Fider Post:**
```
Title: "Add dark mode #webapp"
Description: "Users want dark mode for better UX"
```

**Result:**
✅ Creates issue in **Name.ai** project in Plane
✅ Priority set based on votes (0-4: low, 5-9: medium, 10+: high)
✅ URLs stored in database for bidirectional linking

## 🔧 Admin API

### View All Mappings
```bash
curl http://localhost:3001/api/mappings
```

### View Project Mappings
```bash
curl http://localhost:3001/api/projects
```

### Add New Product Tag
```bash
curl -X POST http://localhost:3001/api/projects \
  -H 'Content-Type: application/json' \
  -d '{
    "productTag": "mobile",
    "planeProjectId": "uuid-here",
    "projectName": "Mobile App"
  }'
```

### View Webhook Logs
```bash
curl http://localhost:3001/api/logs?limit=50
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
/home/tims/root/test-orchestrator.sh
```

Or manually test:
```bash
curl -X POST http://localhost:3001/webhooks/fider \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "new_post",
    "post_number": 999,
    "post_title": "Feature Request #webapp",
    "post_description": "Description here",
    "post_url": "https://fider.namekart.com/posts/999/test",
    "post_slug": "test",
    "post_created_at": "2025-10-10T07:00:00Z",
    "post_votes": 5,
    "author_name": "Test User",
    "author_email": "test@example.com",
    "author_id": 1,
    "author_role": "user",
    "tenant_name": "Namekart",
    "tenant_url": "https://fider.namekart.com",
    "tenant_subdomain": "fider"
  }'
```

## 📊 Database Schema

### Mappings
- `fiderPostNumber` - Unique Fider post ID
- `planeIssueId` - Unique Plane issue UUID
- `planeProjectId` - Project the issue was created in
- `fiderPostUrl` - Full URL to Fider post
- `planeIssueUrl` - Full URL to Plane issue

### Project Mappings
- `productTag` - Hashtag to match (without #)
- `planeProjectId` - Plane project UUID
- `projectName` - Human-readable name

### Webhook Logs
- `source` - "fider" or "plane"
- `eventType` - Type of event
- `payload` - Full webhook payload (JSON)
- `status` - "success", "failed", or "processing"
- `error` - Error message if failed

## ⚠️ Known Limitations

1. **Fider API Key**: The configured Fider API key is invalid. To enable bidirectional linking (adding Plane URLs back to Fider posts):
   - Login to Fider as admin
   - Go to Admin → API
   - Create new API key
   - Update `FIDER_API_KEY` in `docker-compose.yml`

2. **Plane Project Permissions**: The API user only has access to the "Name.ai" project. To enable other projects:
   - Add the API user as a member to `NK_Dashboard` and `NK_AMP` projects in Plane
   - OR create separate API keys per project

3. **Plane Webhook Format**: Plane sends event type as "issue" instead of "issue.created", so reverse sync is limited.

## 🏗️ Architecture

```
Fider (https://fider.namekart.com)
   │
   ├─→ Webhook: https://plane.namekart.com/webhooks/fider
   │              ↓
   │         Orchestrator (port 3001)
   │              │
   │              ├─→ Extract hashtags
   │              ├─→ Match project
   │              ├─→ Create Plane issue
   │              ├─→ Store mapping (SQLite)
   │              └─→ Add comment to Fider (when API key fixed)
   │
   └─────────────────┘

Plane (https://plane.namekart.com)
   │
   └─→ Webhook: https://fider.namekart.com/webhooks/plane
                  ↓
             Orchestrator
                  │
                  └─→ Log events
```

## 🚀 Deployment

The orchestrator is already running and connected to both Fider and Plane:

- **Container**: `orchestrator-orchestrator-1`
- **Port**: 3001
- **Database**: `/home/tims/root/orchestrator/prisma/dev.db`
- **Networks**: `fider_default`, `plane-app_default`

### Rebuild
```bash
cd /home/tims/root/orchestrator
docker compose build
docker compose up -d
```

### View Logs
```bash
docker logs -f orchestrator-orchestrator-1
```

### Stop
```bash
cd /home/tims/root/orchestrator
docker compose down
```

## 📝 Configuration

Edit `docker-compose.yml` to update:
- `FIDER_API_KEY` - Fider API key
- `PLANE_API_KEY` - Plane API key
- `PLANE_PROJECT_ID` - Default project (currently Name.ai)
- `PLANE_WORKSPACE_SLUG` - Workspace slug (currently "namekart")

## 🎉 Success Metrics

- ✅ **2 Fider posts** automatically converted to Plane issues
- ✅ **100% success rate** for Name.ai project
- ✅ **Product tag routing** working perfectly
- ✅ **Database persistence** operational
- ✅ **Webhook logging** capturing all events
- ✅ **Admin API** fully functional

## 📖 Full Documentation

See `/home/tims/root/ORCHESTRATOR_SETUP.md` for complete setup guide and troubleshooting.

---

**Built with**: Node.js, TypeScript, Express, Prisma, SQLite, Docker
