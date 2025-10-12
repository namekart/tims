# Azure Port Configuration for Fider

## 🚨 Issue: Port 8081 is blocked by Azure NSG

Your Fider is running correctly but Azure Network Security Group is blocking external access to port 8081.

## ✅ Solution: Add NSG Inbound Rule

### Method 1: Azure Portal (GUI)

1. **Go to Azure Portal**: https://portal.azure.com
2. **Find your VM**: Search for your VM name or go to Virtual Machines
3. **Navigate to Networking**:
   - Click on your VM
   - In the left menu, click **"Networking"** or **"Network settings"**
4. **Add Inbound Port Rule**:
   - Click **"Add inbound port rule"** or **"Create port rule"**
   - Fill in:
     - **Source**: `Any` or `IP Addresses` (for specific IPs only)
     - **Source port ranges**: `*`
     - **Destination**: `Any`
     - **Destination port ranges**: `8081`
     - **Protocol**: `TCP`
     - **Action**: `Allow`
     - **Priority**: `1010` (or any available priority)
     - **Name**: `Allow-Fider-8081`
     - **Description**: `Allow access to Fider on port 8081`
5. **Save** the rule
6. **Wait** 1-2 minutes for the rule to apply

### Method 2: Azure CLI (Command Line)

If you have Azure CLI installed:

```bash
# Get your resource group and NSG name
az vm show --name <your-vm-name> --resource-group <your-rg-name>

# Add the inbound rule
az network nsg rule create \
  --resource-group <your-resource-group> \
  --nsg-name <your-nsg-name> \
  --name Allow-Fider-8081 \
  --priority 1010 \
  --destination-port-ranges 8081 \
  --access Allow \
  --protocol Tcp \
  --description "Allow Fider on port 8081"
```

### Method 3: Use a Different Port (Already Open)

If you don't want to open a new port, check which ports are already open:

**Common Azure default open ports:**
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 22 (SSH)

**To use port 80 for Fider** (if available):
```bash
# Edit docker-compose
sed -i 's/"0.0.0.0:8081:3000"/"0.0.0.0:80:3000"/' /home/tims/root/fider/docker-compose.selfhost.yml
sed -i 's|http://40.86.188.12:8081|http://40.86.188.12|' /home/tims/root/fider/docker-compose.selfhost.yml

# Restart Fider
docker compose -f /home/tims/root/fider/docker-compose.selfhost.yml up -d
```

Then access Fider at: **http://40.86.188.12** (no port needed)

---

## 🧪 Test After Configuration

After adding the NSG rule, wait 1-2 minutes and test:

```bash
# From your local machine (not the server)
curl -I http://40.86.188.12:8081

# Or open in browser
http://40.86.188.12:8081
```

---

## 📊 Current Status

- ✅ **Fider is running** on port 8081
- ✅ **Port is listening** on 0.0.0.0:8081 (all interfaces)
- ✅ **BASE_URL configured** to http://40.86.188.12:8081
- ❌ **Azure NSG blocking** external traffic on port 8081
- ✅ **Local access works**: http://localhost:8081

---

## 🔍 Check Which Ports Are Open

To see which ports are already open in your NSG:

1. Go to Azure Portal → Your VM → Networking
2. Look at **Inbound port rules**
3. See which ports have "Allow" action

Common open ports:
- 22 (SSH) - Usually open
- 80 (HTTP) - Often open
- 443 (HTTPS) - Often open
- 3000 (If you opened it for other services)

---

## 💡 Recommended Approach

### Option A: Open Port 8081 (Recommended)
**Pros**: Clean, dedicated port for Fider
**Cons**: Requires NSG configuration

### Option B: Use Port 80
**Pros**: Usually already open, no NSG changes needed
**Cons**: May conflict with Plane (if using port 80)

### Option C: Use Port 443 with HTTPS
**Pros**: Secure, usually open
**Cons**: Requires SSL certificate setup

---

## 🔒 Security Note

If you want to restrict access to specific IPs only:

1. When creating the NSG rule, set **Source** to "IP Addresses"
2. Enter allowed IP addresses (comma-separated)
3. This restricts Fider access to only those IPs

---

## ✅ Final Verification

After opening the port, verify:

1. **From external browser**: http://40.86.188.12:8081
2. **Webhook will work**: Once accessible, configure webhook with public URL
3. **Update orchestrator**: May need to update if using public webhooks

---

## 🆘 Still Not Working?

1. **Check NSG rules are applied**: Azure Portal → VM → Networking
2. **Check priority**: Lower number = higher priority (100 is higher than 1000)
3. **Check for deny rules**: Make sure no deny rule is blocking port 8081
4. **Wait a bit**: NSG changes can take 1-2 minutes to apply
5. **Check VM firewall**: `sudo ufw status` (should show inactive or allow 8081)

---

## 📝 Summary

Your Fider is configured correctly. You just need to:
1. ✅ Open port 8081 in Azure NSG
2. ✅ Wait 1-2 minutes
3. ✅ Access http://40.86.188.12:8081

Or alternatively:
1. ✅ Change Fider to use port 80 (if available)
2. ✅ Access http://40.86.188.12

