#!/bin/bash

echo "🔍 SSL Readiness Check"
echo "======================"
echo ""

# Check DNS
echo "📡 DNS Records:"
echo "  plane.namekart.com → $(dig +short plane.namekart.com | head -1)"
echo "  fider.namekart.com → $(dig +short fider.namekart.com | head -1)"
echo "  Expected: 40.86.188.12"
echo ""

# Check if DNS is correct
PLANE_IP=$(dig +short plane.namekart.com | head -1)
FIDER_IP=$(dig +short fider.namekart.com | head -1)

if [ "$PLANE_IP" = "40.86.188.12" ] && [ "$FIDER_IP" = "40.86.188.12" ]; then
    echo "  ✅ DNS is correct!"
    DNS_OK=true
else
    echo "  ❌ DNS not pointing to server yet"
    echo "  ⏳ Update DNS records and wait 5-10 minutes"
    DNS_OK=false
fi
echo ""

# Check ports
echo "🔌 Port Status:"
if ss -tlnp | grep -q ':80 '; then
    echo "  ✅ Port 80 (HTTP) is listening"
    PORT80_OK=true
else
    echo "  ❌ Port 80 (HTTP) not listening"
    PORT80_OK=false
fi

if ss -tlnp | grep -q ':443 '; then
    echo "  ✅ Port 443 (HTTPS) is listening"
    PORT443_OK=true
else
    echo "  ⚠️  Port 443 (HTTPS) not listening (will be used after SSL)"
    PORT443_OK=false
fi
echo ""

# Check nginx
echo "🌐 Nginx Status:"
if systemctl is-active --quiet nginx; then
    echo "  ✅ Nginx is running"
    NGINX_OK=true
else
    echo "  ❌ Nginx is not running"
    NGINX_OK=false
fi
echo ""

# Check services
echo "🐳 Service Status:"
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "  ✅ Plane is responding (localhost:8080)"
    PLANE_OK=true
else
    echo "  ❌ Plane is not responding"
    PLANE_OK=false
fi

if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo "  ✅ Fider is responding (localhost:8081)"
    FIDER_OK=true
else
    echo "  ❌ Fider is not responding"
    FIDER_OK=false
fi
echo ""

# Check external access (if DNS is correct)
if [ "$DNS_OK" = true ]; then
    echo "🌍 External Access Test:"

    if curl -s -I -m 5 http://plane.namekart.com 2>/dev/null | head -1 | grep -q "HTTP"; then
        echo "  ✅ plane.namekart.com is accessible via HTTP"
        PLANE_EXT_OK=true
    else
        echo "  ❌ plane.namekart.com not accessible (check Azure NSG)"
        PLANE_EXT_OK=false
    fi

    if curl -s -I -m 5 http://fider.namekart.com 2>/dev/null | head -1 | grep -q "HTTP"; then
        echo "  ✅ fider.namekart.com is accessible via HTTP"
        FIDER_EXT_OK=true
    else
        echo "  ❌ fider.namekart.com not accessible (check Azure NSG)"
        FIDER_EXT_OK=false
    fi
    echo ""
fi

# Final verdict
echo "📋 Summary:"
echo "=========="

if [ "$DNS_OK" = true ] && [ "$PORT80_OK" = true ] && [ "$NGINX_OK" = true ] && [ "$PLANE_OK" = true ] && [ "$FIDER_OK" = true ]; then
    if [ "${PLANE_EXT_OK:-false}" = true ] && [ "${FIDER_EXT_OK:-false}" = true ]; then
        echo "✅ ALL CHECKS PASSED! Ready to get SSL certificates."
        echo ""
        echo "Run this command to get SSL certificates:"
        echo "  sudo certbot --nginx -d plane.namekart.com -d fider.namekart.com --non-interactive --agree-tos --email admin@yoho.net"
    else
        echo "⚠️  Services OK but not externally accessible"
        echo "   → Open ports 80 and 443 in Azure NSG"
        echo "   → See: /home/tims/root/SSL_SETUP_GUIDE.md"
    fi
else
    echo "❌ Some checks failed. Please fix issues above."
    echo ""

    if [ "$DNS_OK" = false ]; then
        echo "→ Update DNS records to point to 40.86.188.12"
    fi

    if [ "$PORT80_OK" = false ] || [ "$NGINX_OK" = false ]; then
        echo "→ Start nginx: sudo systemctl start nginx"
    fi

    if [ "$PLANE_OK" = false ]; then
        echo "→ Start Plane: cd /home/tims/root/plane-selfhost/plane-app && docker compose up -d"
    fi

    if [ "$FIDER_OK" = false ]; then
        echo "→ Start Fider: cd /home/tims/root/fider && docker compose -f docker-compose.selfhost.yml up -d"
    fi
fi

echo ""
echo "📚 For detailed instructions, see: /home/tims/root/SSL_SETUP_GUIDE.md"

