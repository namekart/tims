# ✅ Setup Complete - Ready for SSL

## 🎉 What's Been Configured

### ✅ Nginx Reverse Proxy
- **Installed**: nginx with certbot
- **Configured**: Reverse proxy for both domains
- **Status**: Running on port 80
- **Configs**:
  - `/etc/nginx/sites-available/plane.namekart.com`
  - `/etc/nginx/sites-available/fider.namekart.com`

### ✅ Plane (Project Management)
- **Port**: Internal 8080 → External via nginx
- **Domain**: plane.namekart.com (pending DNS)
- **Status**: Running and responding
- **Configuration**: Updated for HTTPS
- **Database**: PostgreSQL (persistent)
- **Storage**: MinIO (persistent)

### ✅ Fider (Fee∏∏dback Platform)
- **Port**: Internal 8081 → External via nginx
- **Domain**: fider.namekart.com (pending DNS)
- **Status**: Running and responding
- **Configuration**: Updated for HTTPS
- **Database**: PostgreSQL (persistent)
- **Email**: Configured with mail.yoho.net

### ✅ Orchestrator (Webhook Bridge)
- **Port**: Internal 3001 (not exposed externally)
- **Status**: Running
- **Function**: Bridges Fider ↔ Plane via webhooks
- **Networks**: Connected to both Fider and Plane

---

## 📋 What You Need to Do Now

### 1️⃣ Update DNS Records (REQUIRED)

Go to your DNS provider (where you registered namekart.com) and update:

**For Namecheap/GoDaddy/etc:**
```
Type: A
Host: plane
Value: 40.86.188.12
TTL: 300

Type: A
Host: fider
Value: 40.86.188.12
TTL: 300
```

**For Cloudflare:**
1. Go to Cloudflare Dashboard → namekart.com → DNS
2. Update/Create A records:
   ```
   Type: A
   Name: plane
   IPv4: 40.86.188.12
   Proxy: OFF (gray cloud) ← Important!
   ```
   ```
   Type: A
   Name: fider
   IPv4: 40.86.188.12
   Proxy: OFF (gray cloud) ← Important!
   ```

**Wait**: 5-10 minutes for DNS propagation

---

### 2️⃣ Open Ports in Azure (REQUIRED)

**Azure Portal Steps:**

1. Go to: https://portal.azure.com
2. Navigate to: Virtual Machines → Your VM → **Networking**
3. Click: **Add inbound port rule**
4. Add two rules:

**Rule 1: HTTP**
```
Destination port ranges: 80
Protocol: TCP
Action: Allow
Priority: 1000
Name: Allow-HTTP-80
```

**Rule 2: HTTPS**
```
Destination port ranges: 443
Protocol: TCP
Action: Allow
Priority: 1001
Name: Allow-HTTPS-443
```

5. **Save** and wait 1-2 minutes

---

### 3️⃣ Verify and Get SSL Certificates

After completing steps 1 and 2, run on your server:

```bash
# Check if everything is ready
/home/tims/root/check-ssl-readiness.sh

# If all checks pass, get SSL certificates
sudo certbot --nginx -d plane.namekart.com -d fider.namekart.com --non-interactive --agree-tos --email admin@yoho.net
```

**That's it!** Certbot will:
- Get SSL certificates from Let's Encrypt
- Configure nginx for HTTPS
- Set up auto-renewal (every 60 days)

---

## 🌐 Access Your Services

### After SSL Setup:

**Plane (Project Management):**
- URL: https://plane.namekart.com
- Use: Manage projects, issues, sprints

**Fider (Feedback Platform):**
- URL: https://fider.namekart.com
- Use: Collect user feedback, feature requests

**Orchestrator:**
- Internal only (no external access)
- Automatically syncs Fider posts → Plane issues

---

## 🔧 Service Management Commands

### Check Status:
```bash
# Check all services
/home/tims/root/check-ssl-readiness.sh

# Check nginx
sudo systemctl status nginx

# Check Docker services
docker ps
```

### Start/Stop Services:

**Nginx:**
```bash
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
```

**Plane:**
```bash
cd /home/tims/root/plane-selfhost/plane-app
docker compose up -d      # Start
docker compose down       # Stop
docker compose restart    # Restart
```

**Fider:**
```bash
cd /home/tims/root/fider
docker compose -f docker-compose.selfhost.yml up -d      # Start
docker compose -f docker-compose.selfhost.yml down       # Stop
docker compose -f docker-compose.selfhost.yml restart    # Restart
```

**Orchestrator:**
```bash
cd /home/tims/root/orchestrator
docker compose up -d      # Start
docker compose down       # Stop
docker compose restart    # Restart
```

### View Logs:

```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Plane logs
docker logs plane-app-proxy-1 -f

# Fider logs
docker logs fider-app-1 -f

# Orchestrator logs
docker logs orchestrator-orchestrator-1 -f
```

---

## 🔄 Webhook Configuration

### After SSL is working:

1. **Access Fider**: https://fider.namekart.com
2. **Go to**: Admin Settings → Webhooks
3. **Add webhook**:
   ```
   Name: Plane Integration
   URL: http://orchestrator-orchestrator-1:3001/webhooks/fider
   Events: All (or select specific ones)
   ```
   ⚠️ **Important**: Use the internal Docker URL (not https://), this bypasses HTTPS requirement

4. **Test**: Create a post in Fider, it should appear in Plane

---

## 📊 Architecture Overview

```
Internet
   ↓
Azure NSG (Firewall)
   ↓ (ports 80, 443)
Nginx (Reverse Proxy)
   ├─→ Plane (localhost:8080) → PostgreSQL + MinIO
   └─→ Fider (localhost:8081) → PostgreSQL
           ↓ (webhook)
       Orchestrator (localhost:3001)
           ↓ (API)
       Plane API
```

**Key Points:**
- Only nginx is exposed to internet (ports 80, 443)
- All services communicate internally via Docker networks
- Webhooks use internal Docker URLs (no HTTPS needed)
- SSL termination happens at nginx level

---

## 📚 Documentation Files

- **`/home/tims/root/SSL_SETUP_GUIDE.md`** - Detailed SSL setup instructions
- **`/home/tims/root/NETWORK_ACCESS_SUMMARY.md`** - Network configuration details
- **`/home/tims/root/check-ssl-readiness.sh`** - Status check script
- **`/home/tims/root/orchestrator/README.md`** - Orchestrator documentation
- **`/home/tims/root/orchestrator/QUICK_START.md`** - Quick start guide

---

## 🚨 Troubleshooting

### DNS Issues:
```bash
# Check DNS
dig +short plane.namekart.com
dig +short fider.namekart.com

# Should return: 40.86.188.12
```

### Can't Access Domains:
1. Check DNS is updated (see above)
2. Check Azure NSG has ports 80, 443 open
3. Check nginx is running: `sudo systemctl status nginx`
4. Check services are running: `docker ps`

### SSL Certificate Fails:
1. Ensure DNS points to your server
2. Ensure ports 80, 443 are open in Azure
3. Check nginx is accessible: `curl -I http://plane.namekart.com`
4. Check certbot logs: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`

### Webhooks Not Working:
1. Check orchestrator is running: `docker ps | grep orchestrator`
2. Check orchestrator logs: `docker logs orchestrator-orchestrator-1 -f`
3. Ensure using internal URL: `http://orchestrator-orchestrator-1:3001/webhooks/fider`
4. Test manually: `docker exec fider-app-1 curl http://orchestrator-orchestrator-1:3001/health`

---

## ✅ Checklist

Before getting SSL:
- [ ] DNS updated to 40.86.188.12
- [ ] Port 80 open in Azure NSG
- [ ] Port 443 open in Azure NSG
- [ ] Wait 5-10 minutes for DNS propagation
- [ ] Run `/home/tims/root/check-ssl-readiness.sh`
- [ ] All checks pass ✅

After SSL:
- [ ] Access https://plane.namekart.com ✅
- [ ] Access https://fider.namekart.com ✅
- [ ] Configure webhook in Fider
- [ ] Test: Create post in Fider → Check Plane for issue

---

## 🎯 Current Status

✅ **Configured:**
- Nginx reverse proxy
- Plane on localhost:8080
- Fider on localhost:8081
- Orchestrator on localhost:3001
- All services running

⏳ **Waiting for:**
- DNS update to 40.86.188.12
- Azure NSG ports 80, 443 open

🚀 **Next:**
- Get SSL certificates
- Access via HTTPS
- Configure webhooks

---

## 📞 Quick Commands Reference

```bash
# Check readiness
/home/tims/root/check-ssl-readiness.sh

# Get SSL (after DNS + ports are ready)
sudo certbot --nginx -d plane.namekart.com -d fider.namekart.com --non-interactive --agree-tos --email admin@yoho.net

# Check services
docker ps

# View all logs
docker compose -f /home/tims/root/plane-selfhost/plane-app/docker-compose.yaml logs -f &
docker compose -f /home/tims/root/fider/docker-compose.selfhost.yml logs -f &
docker compose -f /home/tims/root/orchestrator/docker-compose.yml logs -f

# Restart everything
sudo systemctl restart nginx
cd /home/tims/root/plane-selfhost/plane-app && docker compose restart
cd /home/tims/root/fider && docker compose -f docker-compose.selfhost.yml restart
cd /home/tims/root/orchestrator && docker compose restart
```

---

**🎉 You're all set! Just update DNS and open the ports, then run the SSL command.**

