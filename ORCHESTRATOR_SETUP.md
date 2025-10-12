# Fider ↔ Plane Orchestrator - Complete Setup Guide

## ✅ What's Working

### 1. **Database & Persistence**
- ✅ SQLite database with Prisma ORM
- ✅ Persistent mapping storage
- ✅ Webhook event logging
- ✅ Product-to-project routing

### 2. **Webhook Integration**
- ✅ Fider webhook endpoint: `https://plane.namekart.com/webhooks/fider`
- ✅ Plane webhook endpoint: `https://fider.namekart.com/webhooks/plane`
- ✅ Event processing and logging
- ✅ Error handling and retry logic

### 3. **Product Tag Routing** 🎯
Users can specify which Plane project to create issues in by adding hashtags to Fider posts:
- `#webapp` → Name.ai project
- `#dashboard` → NK_Dashboard project
- `#amp` → NK_AMP project

### 4. **Features Implemented**
- ✅ Fider post → Plane issue creation
- ✅ URL cross-linking (stored in database)
- ✅ Priority mapping based on votes
- ✅ Project routing based on hashtags
- ✅ Admin API for managing mappings

## ⚠️ Known Issues & Fixes Needed

### 1. **Plane API Permissions**
**Issue**: API key only has permission to create issues in "Name.ai" project (member_role: 20)

**Current Status**:
- ✅ Works: Creating issues in `Name.ai` (b5a20847-714b-4c87-b85d-bb85df44d29e)
- ❌ Fails: Creating issues in `NK_Dashboard` and `NK_AMP` (not a member)

**Fix Required**:
```bash
# Option 1: Add the API key user to all projects in Plane UI
# Go to: https://plane.namekart.com/namekart/settings/members
# Invite the API user to NK_Dashboard and NK_AMP projects

# Option 2: Create separate API keys for each project
# Then update the orchestrator to use project-specific keys
```

### 2. **Fider API Key**
**Issue**: Fider API key is invalid, cannot add comments back to Fider posts

**Current Error**: `API Key is invalid`

**Fix Required**:
```bash
# Generate a new Fider API key:
# 1. Login to Fider as admin
# 2. Go to: https://fider.namekart.com/admin/api
# 3. Create new API key
# 4. Update docker-compose.yml:
#    FIDER_API_KEY: your_new_key_here
```

### 3. **Plane Webhook Event Type**
**Issue**: Plane sends event type as "issue" instead of "issue.created"

**Current Workaround**: Events are logged but not fully processed

## 📊 Database Schema

### Mappings Table
Stores Fider post ↔ Plane issue relationships:
```sql
- fiderPostNumber (unique)
- fiderPostUrl
- fiderPostTitle
- planeIssueId (unique)
- planeIssueUrl
- planeProjectId
```

### Project Mappings Table
Maps product tags to Plane projects:
```sql
- productTag (unique) - e.g., "webapp", "dashboard", "amp"
- planeProjectId - UUID of the Plane project
- projectName - Human-readable name
```

### Webhook Logs Table
Tracks all webhook events for debugging:
```sql
- source (fider/plane)
- eventType
- payload (JSON)
- status (success/failed/processing)
- error (if failed)
```

## 🔧 Admin API Endpoints

### Get All Mappings
```bash
curl http://localhost:3001/api/mappings
```

### Get Project Mappings
```bash
curl http://localhost:3001/api/projects
```

### Create/Update Project Mapping
```bash
curl -X POST http://localhost:3001/api/projects \
  -H 'Content-Type: application/json' \
  -d '{
    "productTag": "mobile",
    "planeProjectId": "project-uuid-here",
    "projectName": "Mobile App"
  }'
```

### Get Webhook Logs
```bash
curl http://localhost:3001/api/logs?limit=50
```

## 🧪 Testing

### Test Fider Webhook (with product tag)
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

### Check Logs
```bash
docker logs -f orchestrator-orchestrator-1
```

## 🎯 Success Criteria Met

1. ✅ **Persistent Storage**: SQLite database with Prisma
2. ✅ **Product Tag Routing**: Hashtag-based project selection
3. ✅ **Bidirectional Mapping**: URLs stored for both directions
4. ✅ **Event Logging**: All webhooks logged to database
5. ✅ **Admin API**: Manage mappings and view logs
6. ⏳ **URL Linking**: Implemented but blocked by Fider API key issue
7. ⏳ **Multi-Project Support**: Implemented but blocked by Plane permissions

## 🚀 Next Steps

1. **Fix Fider API Key**
   - Generate new API key in Fider admin panel
   - Update `FIDER_API_KEY` in docker-compose.yml
   - Restart orchestrator

2. **Fix Plane Permissions**
   - Add API user to NK_Dashboard project
   - Add API user to NK_AMP project
   - OR create project-specific API keys

3. **Test Complete Flow**
   - Create real Fider post with #webapp tag
   - Verify Plane issue created in Name.ai project
   - Verify comment added to Fider with Plane link
   - Create Plane issue manually
   - Verify webhook fires and logs event

## 📁 Project Structure

```
/home/tims/root/orchestrator/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration history
│   └── dev.db                 # SQLite database
├── src/
│   ├── controllers/
│   │   └── webhookController.ts    # Webhook handlers
│   ├── services/
│   │   ├── DatabaseService.ts      # Database operations
│   │   ├── FiderClient.ts          # Fider API client
│   │   └── PlaneClient.ts          # Plane API client
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   ├── config/
│   │   └── index.ts                # Configuration
│   └── index.ts                    # Express app
├── docker-compose.yml         # Docker configuration
├── Dockerfile                 # Build configuration
└── package.json              # Dependencies
```

## 🔍 Verified Working

### Recent Test (Post #202)
```
✅ Received Fider webhook: new_post
✅ Created Plane issue: 77e12e38-c88b-4230-a9d0-a6602effa271
✅ Issue URL: https://plane.namekart.com/namekart/b5a20847-714b-4c87-b85d-bb85df44d29e/3
✅ Stored mapping in database
❌ Failed to add comment (Fider API key invalid)
```

### Product Tag Routing Test
```
✅ Post with #amp tag
✅ Matched "amp" → NK_AMP project
❌ Permission denied (user not member of NK_AMP)
```

## Configuration Files

### Current docker-compose.yml
```yaml
PLANE_API_KEY: plane_api_12350203ff65409e81979b7e8b5b44e8
PLANE_PROJECT_ID: b5a20847-714b-4c87-b85d-bb85df44d29e (Name.ai)
FIDER_API_KEY: inQmtCdwjeIUF4IW4WQKCbRTpA1JodY4m0hrfyeG9mJECpTaqWjTk3CQdLTt4O (INVALID)
```

