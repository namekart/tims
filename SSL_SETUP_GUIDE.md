# SSL Setup Guide for Plane and Fider

## 🎯 Current Status

✅ **Services Configured:**
- ✅ Nginx installed and running on port 80
- ✅ Plane running on localhost:8080
- ✅ Fider running on localhost:8081
- ✅ Nginx reverse proxy configured for both domains
- ✅ Certbot installed

❌ **DNS Not Configured:**
- ❌ `plane.namekart.com` → Currently points to Cloudflare (172.67.167.30, 104.21.42.221)
- ❌ `fider.namekart.com` → Currently points to Cloudflare (172.67.167.30, 104.21.42.221)
- ✅ Your server IP: `40.86.188.12`

---

## 📋 Step 1: Update DNS Records

You need to update your DNS records to point to your Azure server.

### Option A: Direct DNS (Recommended for Let's Encrypt)

**Go to your DNS provider (Namecheap/GoDaddy/etc.) and update:**

```
Type: A
Name: plane
Value: 40.86.188.12
TTL: 300 (5 minutes)

Type: A
Name: fider
Value: 40.86.188.12
TTL: 300 (5 minutes)
```

**Wait 5-10 minutes for DNS propagation**, then verify:

```bash
dig +short plane.namekart.com
dig +short fider.namekart.com
# Both should return: 40.86.188.12
```

### Option B: Using Cloudflare (If you want CDN/DDoS protection)

If you're using Cloudflare:

1. **Go to Cloudflare Dashboard** → Your domain → DNS
2. **Update A records:**
   ```
   Type: A
   Name: plane
   IPv4 address: 40.86.188.12
   Proxy status: OFF (gray cloud) ← IMPORTANT for Let's Encrypt
   ```
   ```
   Type: A
   Name: fider
   IPv4 address: 40.86.188.12
   Proxy status: OFF (gray cloud) ← IMPORTANT for Let's Encrypt
   ```

3. **After getting SSL certificates**, you can turn the proxy back ON (orange cloud)

---

## 📋 Step 2: Open Port 80 and 443 in Azure NSG

**Azure Portal Steps:**

1. Go to https://portal.azure.com
2. Navigate to your VM → **Networking**
3. **Add inbound rules:**

   **Rule 1: HTTP (Port 80)**
   ```
   Source: Any
   Source port ranges: *
   Destination: Any
   Destination port ranges: 80
   Protocol: TCP
   Action: Allow
   Priority: 1000
   Name: Allow-HTTP-80
   ```

   **Rule 2: HTTPS (Port 443)**
   ```
   Source: Any
   Source port ranges: *
   Destination: Any
   Destination port ranges: 443
   Protocol: TCP
   Action: Allow
   Priority: 1001
   Name: Allow-HTTPS-443
   ```

4. **Save** and wait 1-2 minutes

---

## 📋 Step 3: Verify HTTP Access

After DNS propagates and ports are open:

```bash
# Test from your local machine (not the server)
curl -I http://plane.namekart.com
curl -I http://fider.namekart.com

# Or open in browser:
http://plane.namekart.com
http://fider.namekart.com
```

Both should work over HTTP before proceeding to SSL.

---

## 📋 Step 4: Get SSL Certificates

Once HTTP access works, run this command on your server:

```bash
sudo certbot --nginx -d plane.namekart.com -d fider.namekart.com --non-interactive --agree-tos --email admin@yoho.net
```

**What this does:**
- Gets SSL certificates from Let's Encrypt
- Automatically configures nginx for HTTPS
- Sets up auto-renewal

**Expected output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/plane.namekart.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/plane.namekart.com/privkey.pem
```

---

## 📋 Step 5: Update Service BASE URLs

After SSL is configured, update your services to use HTTPS:

### Update Fider:

Already done! ✅
```yaml
BASE_URL: https://fider.namekart.com
```

### Update Plane:

Already done! ✅
```
WEB_URL=https://plane.namekart.com
CORS_ALLOWED_ORIGINS=https://plane.namekart.com
```

### Update Orchestrator:

Edit `/home/tims/root/orchestrator/docker-compose.yml`:

```yaml
environment:
  FIDER_BASE_URL: https://fider.namekart.com
  PLANE_BASE_URL: https://plane.namekart.com
```

Then restart:
```bash
cd /home/tims/root/orchestrator && docker compose restart
```

---

## 📋 Step 6: Update Plane API Key

Since Plane's domain changed, you may need to regenerate the API key:

1. Access Plane: https://plane.namekart.com
2. Go to Settings → API Tokens
3. Create new token
4. Update orchestrator with new token

---

## 📋 Step 7: Configure Webhooks in Fider

Once HTTPS is working:

1. Go to https://fider.namekart.com
2. Admin Settings → Webhooks
3. Add webhook:
   ```
   URL: http://orchestrator-orchestrator-1:3001/webhooks/fider
   ```
   (Use internal Docker URL to avoid HTTPS requirement)

---

## 🧪 Testing After SSL Setup

### Test HTTPS Access:
```bash
curl -I https://plane.namekart.com
curl -I https://fider.namekart.com
```

### Test HTTP → HTTPS Redirect:
```bash
curl -I http://plane.namekart.com
# Should return 301/302 redirect to https://
```

### Check Certificate:
```bash
openssl s_client -connect plane.namekart.com:443 -servername plane.namekart.com < /dev/null 2>/dev/null | grep "subject="
```

---

## 🔄 Auto-Renewal

Certbot automatically sets up renewal. Check status:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

Certificates auto-renew every 60 days.

---

## 🚨 Troubleshooting

### DNS Not Propagating?
```bash
# Check current DNS
dig +short plane.namekart.com

# Force flush local DNS cache
sudo systemd-resolve --flush-caches

# Check from different DNS server
dig @8.8.8.8 plane.namekart.com
```

### Let's Encrypt Fails?
```bash
# Check nginx is accessible
curl -I http://plane.namekart.com

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Port 80 Not Accessible?
```bash
# Check nginx is listening
sudo ss -tlnp | grep :80

# Check Azure NSG rules
# Go to Azure Portal → VM → Networking → Inbound rules

# Test locally
curl -I http://localhost
```

---

## 📊 Current Configuration Summary

### Nginx Configs:
- `/etc/nginx/sites-available/plane.namekart.com` ✅
- `/etc/nginx/sites-available/fider.namekart.com` ✅
- Both symlinked to `sites-enabled/` ✅

### Service Ports:
- Nginx: 0.0.0.0:80 (external)
- Plane: 127.0.0.1:8080 (internal only)
- Fider: 127.0.0.1:8081 (internal only)
- Orchestrator: 127.0.0.1:3001 (internal only)

### Docker Networks:
- Plane: `plane-app_default`
- Fider: `fider_default`
- Orchestrator: Connected to both

---

## ✅ Quick Start Commands

Once DNS is updated and pointing to 40.86.188.12:

```bash
# 1. Verify DNS
dig +short plane.namekart.com fider.namekart.com

# 2. Test HTTP access
curl -I http://plane.namekart.com
curl -I http://fider.namekart.com

# 3. Get SSL certificates
sudo certbot --nginx -d plane.namekart.com -d fider.namekart.com --non-interactive --agree-tos --email admin@yoho.net

# 4. Verify HTTPS
curl -I https://plane.namekart.com
curl -I https://fider.namekart.com

# 5. Update orchestrator (if needed)
cd /home/tims/root/orchestrator
# Edit docker-compose.yml to use https:// URLs
docker compose restart
```

---

## 🎯 Next Steps

1. ✅ **Update DNS records** → Point to 40.86.188.12
2. ✅ **Open ports 80 & 443** in Azure NSG
3. ⏳ **Wait for DNS propagation** (5-10 minutes)
4. ✅ **Test HTTP access** → Should work
5. ✅ **Run certbot** → Get SSL certificates
6. ✅ **Test HTTPS access** → Should work with valid SSL
7. ✅ **Update orchestrator** → Use HTTPS URLs
8. ✅ **Configure webhooks** → Use internal Docker URLs

---

## 📝 Important Notes

- **DNS must point to your server** before running certbot
- **Ports 80 and 443 must be open** in Azure NSG
- **Cloudflare proxy must be OFF** (gray cloud) during certificate issuance
- **Internal webhooks** use HTTP (orchestrator-orchestrator-1:3001)
- **External access** uses HTTPS (plane.namekart.com, fider.namekart.com)
- **Certificates auto-renew** every 60 days via certbot timer

---

## 🆘 Need Help?

If you encounter issues:

1. Check DNS: `dig +short plane.namekart.com`
2. Check ports: `sudo ss -tlnp | grep -E ':(80|443) '`
3. Check nginx: `sudo nginx -t && sudo systemctl status nginx`
4. Check services: `curl http://localhost:8080 && curl http://localhost:8081`
5. Check Azure NSG: Portal → VM → Networking → Inbound rules
6. Check logs: `sudo tail -f /var/log/nginx/error.log`

---

**Current Status**: Waiting for DNS update to 40.86.188.12

