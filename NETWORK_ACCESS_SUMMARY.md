# Network Access Summary

## 🌐 Current Setup

### Services Running:
| Service | Internal Port | External Port | Status | Public Access |
|---------|--------------|---------------|--------|---------------|
| **Plane** | 80 | 80 | ✅ Running | ✅ http://40.86.188.12 |
| **Fider** | 3000 | 8081 | ✅ Running | ❌ **Blocked by Azure NSG** |
| **Orchestrator** | 3001 | 3001 | ✅ Running | ❌ Not exposed |

### Current Situation:
- ✅ Fider is running and accessible locally: `http://localhost:8081`
- ✅ Port 8081 is listening on all interfaces (0.0.0.0:8081)
- ❌ Azure Network Security Group (NSG) is blocking external access to port 8081
- ✅ Port 80 is already used by Plane

---

## ✅ Solution: Open Port 8081 in Azure NSG

You need to add an inbound security rule in Azure to allow traffic on port 8081.

### Quick Steps:

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate**: Virtual Machines → Your VM → Networking
3. **Add Rule**: Click "Add inbound port rule"
4. **Configure**:
   ```
   Source: Any
   Source port ranges: *
   Destination: Any
   Destination port ranges: 8081
   Protocol: TCP
   Action: Allow
   Priority: 1010
   Name: Allow-Fider-8081
   ```
5. **Save** and wait 1-2 minutes

### After Opening Port:

✅ Fider will be accessible at: **http://40.86.188.12:8081**

---

## 🔗 Webhook Configuration After Port Opens

Once port 8081 is accessible externally, you have two webhook options:

### Option 1: Internal Docker Network (Current - Recommended)
**Webhook URL**: `http://orchestrator-orchestrator-1:3001/webhooks/fider`
- ✅ Works without HTTPS
- ✅ Fast (internal network)
- ✅ Secure (doesn't leave Docker)
- ✅ No external dependencies

### Option 2: Public URL (After Port Opens)
**Webhook URL**: `http://40.86.188.12:3001/webhooks/fider`
- ❌ Requires port 3001 open in Azure NSG
- ❌ May require HTTPS (Fider blocks HTTP for external URLs)
- ⚠️ Not recommended unless you need external webhook access

**Recommendation**: Keep using internal Docker network URL for webhooks.

---

## 📊 Port Usage

| Port | Service | Accessible From | NSG Status |
|------|---------|----------------|------------|
| 22 | SSH | External | ✅ Open (default) |
| 80 | Plane | External | ✅ Open |
| 8081 | Fider | Local only | ❌ **Need to open** |
| 3001 | Orchestrator | Local only | ❌ Not needed externally |

---

## 🎯 What You Need To Do

### Immediate Action Required:
1. **Open Azure Portal**
2. **Add NSG rule for port 8081** (see steps above)
3. **Wait 1-2 minutes**
4. **Access Fider**: http://40.86.188.12:8081

### No Changes Needed For:
- ✅ Orchestrator (works via internal network)
- ✅ Webhooks (already configured correctly)
- ✅ Plane (already accessible)

---

## 🧪 Test Commands

### Before Opening Port (Current State):
```bash
# Works - Local access
curl http://localhost:8081

# Fails - External access
curl http://40.86.188.12:8081
# Error: Connection timeout
```

### After Opening Port 8081:
```bash
# Should work - External access
curl http://40.86.188.12:8081

# Or open in browser
http://40.86.188.12:8081
```

---

## 🔐 Security Recommendations

### For Fider (Port 8081):
- Consider restricting to specific IPs if you know your users' IPs
- Or set up HTTPS with a reverse proxy (nginx) for production

### Current Setup:
- ✅ Orchestrator not exposed externally (good for security)
- ✅ Internal webhooks don't require HTTPS (secure within Docker network)
- ✅ Only Fider and Plane exposed publicly

---

## 📝 Summary

**Problem**: Azure NSG blocking port 8081

**Solution**: Add inbound rule in Azure Portal → VM → Networking

**Impact**:
- Fider will be publicly accessible at http://40.86.188.12:8081
- Webhooks continue working via internal Docker network
- No changes needed to orchestrator configuration

**Time**: 5 minutes (2 min to add rule + 1-2 min for Azure to apply)

---

## 🆘 Need Help?

If you can't access Azure Portal or don't have permissions:
1. Contact your Azure administrator
2. Ask them to open port 8081 (TCP, Inbound)
3. Provide this document for reference

Or provide me with your Azure credentials (via secure method) and I can guide you through the Azure CLI commands.

