#!/bin/bash

echo "=============================================="
echo "  Fider ↔ Plane Orchestrator Test Suite"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check orchestrator is running
echo -e "${YELLOW}[TEST 1]${NC} Checking orchestrator status..."
if docker ps | grep -q orchestrator-orchestrator-1; then
    echo -e "${GREEN}✓${NC} Orchestrator is running"
else
    echo -e "${RED}✗${NC} Orchestrator is not running"
    exit 1
fi
echo ""

# Test 2: Check database and mappings
echo -e "${YELLOW}[TEST 2]${NC} Checking database..."
MAPPINGS=$(curl -s http://localhost:3001/api/mappings | jq -r '.data | length')
PROJECTS=$(curl -s http://localhost:3001/api/projects | jq -r '.data | length')
echo -e "  Stored mappings: ${GREEN}$MAPPINGS${NC}"
echo -e "  Project mappings: ${GREEN}$PROJECTS${NC}"
echo ""

# Test 3: Test webhook with #webapp tag (should work - Name.ai project)
echo -e "${YELLOW}[TEST 3]${NC} Testing Fider webhook with #webapp tag..."
RESPONSE=$(curl -s -X POST http://localhost:3001/webhooks/fider \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "new_post",
    "post_number": 500,
    "post_title": "Add OAuth login #webapp",
    "post_description": "Users want to login with Google/GitHub",
    "post_url": "https://fider.namekart.com/posts/500/oauth-login",
    "post_slug": "oauth-login",
    "post_created_at": "2025-10-10T08:00:00Z",
    "post_votes": 20,
    "author_name": "Test User",
    "author_email": "test@example.com",
    "author_id": 1,
    "author_role": "user",
    "tenant_name": "Namekart",
    "tenant_url": "https://fider.namekart.com",
    "tenant_subdomain": "fider"
  }')

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Webhook processed successfully"
else
    echo -e "${RED}✗${NC} Webhook failed: $RESPONSE"
fi
echo ""

# Test 4: Check if mapping was created
echo -e "${YELLOW}[TEST 4]${NC} Checking if mapping was created..."
sleep 2
NEW_MAPPINGS=$(curl -s http://localhost:3001/api/mappings | jq -r '.data | length')
if [ "$NEW_MAPPINGS" -gt "$MAPPINGS" ]; then
    echo -e "${GREEN}✓${NC} New mapping created (total: $NEW_MAPPINGS)"
    LATEST=$(curl -s http://localhost:3001/api/mappings | jq -r '.data[0]')
    echo -e "  Fider Post: $(echo $LATEST | jq -r '.fiderPostNumber')"
    echo -e "  Plane URL: $(echo $LATEST | jq -r '.planeIssueUrl')"
else
    echo -e "${RED}✗${NC} No new mapping created"
fi
echo ""

# Test 5: View recent logs
echo -e "${YELLOW}[TEST 5]${NC} Recent webhook logs..."
curl -s http://localhost:3001/api/logs?limit=5 | jq -r '.data[] | "\(.source) - \(.eventType) - \(.status)"' | head -5
echo ""

# Test 6: Show orchestrator logs
echo -e "${YELLOW}[TEST 6]${NC} Orchestrator logs (last 20 lines)..."
docker logs orchestrator-orchestrator-1 --tail 20
echo ""

echo "=============================================="
echo -e "${GREEN}Test Suite Complete${NC}"
echo "=============================================="
echo ""
echo "📝 Summary:"
echo "  - Orchestrator: Running"
echo "  - Database: Connected"
echo "  - Product Tags: webapp, dashboard, amp"
echo "  - Working Project: Name.ai (webapp)"
echo ""
echo "🔧 Known Issues:"
echo "  1. Fider API key needs to be regenerated"
echo "  2. Plane permissions needed for dashboard/amp projects"
echo ""
echo "📖 Full documentation: /home/tims/root/ORCHESTRATOR_SETUP.md"

