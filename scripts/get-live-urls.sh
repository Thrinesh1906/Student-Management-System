#!/bin/bash

# Get live URLs from deployed platforms
# Usage: ./scripts/get-live-urls.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Live URL Configuration Helper                                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get Render URLs
get_render_urls() {
    echo -e "${BLUE}Render URLs${NC}"
    echo "────────────────────────────────────────────────────────────────"
    
    if [ -z "$RENDER_API_TOKEN" ] || [ -z "$RENDER_SERVICE_ID" ]; then
        echo -e "${YELLOW}⚠ RENDER_API_TOKEN or RENDER_SERVICE_ID not set${NC}"
        echo "Set them and try again, or use dashboard: https://dashboard.render.com"
        return
    fi
    
    echo "Frontend:  https://sms-frontend.onrender.com"
    echo "Backend:   https://sms-backend.onrender.com"
    echo "API Docs:  https://sms-backend.onrender.com/api/docs"
    echo "Health:    https://sms-backend.onrender.com/health"
    echo ""
    echo -e "${GREEN}Copy these URLs and update your frontend config${NC}"
    echo ""
}

# Get Railway URLs
get_railway_urls() {
    echo -e "${BLUE}Railway URLs${NC}"
    echo "────────────────────────────────────────────────────────────────"
    
    if [ -z "$RAILWAY_TOKEN" ]; then
        echo -e "${YELLOW}⚠ RAILWAY_TOKEN not set${NC}"
        echo "Set it and try again, or use dashboard: https://railway.app/dashboard"
        return
    fi
    
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}⚠ Railway CLI not installed${NC}"
        echo "Install with: npm install -g @railway/cli"
        return
    fi
    
    echo "Getting Railway service URLs..."
    
    # Export token
    export RAILWAY_TOKEN="$RAILWAY_TOKEN"
    
    # Get backend URL
    BACKEND_URL=$(railway domain --service backend --environment production 2>/dev/null || echo "https://your-railway-backend.railway.app")
    FRONTEND_URL=$(railway domain --service frontend --environment production 2>/dev/null || echo "https://your-railway-frontend.railway.app")
    
    echo "Frontend:  $FRONTEND_URL"
    echo "Backend:   $BACKEND_URL"
    echo "API Docs:  $BACKEND_URL/api/docs"
    echo "Health:    $BACKEND_URL/health"
    echo ""
    echo -e "${GREEN}Copy these URLs and update your frontend config${NC}"
    echo ""
}

# Test URLs
test_urls() {
    echo -e "${BLUE}Testing URLs${NC}"
    echo "────────────────────────────────────────────────────────────────"
    
    local urls=(
        "https://sms-backend.onrender.com/health:Backend Health"
        "https://sms-frontend.onrender.com:Frontend"
    )
    
    for item in "${urls[@]}"; do
        IFS=':' read -r url name <<< "$item"
        echo -n "Testing $name ($url)... "
        
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ OK${NC}"
        else
            echo -e "${YELLOW}✗ Unreachable${NC}"
        fi
    done
    
    echo ""
}

# Update environment variables
update_env_vars() {
    echo -e "${BLUE}Manual Environment Configuration${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo ""
    echo "For Render deployments, update these in Service Settings → Environment:"
    echo ""
    echo "  CORS_ORIGIN=https://sms-frontend.onrender.com"
    echo "  API_BASE_URL=https://sms-backend.onrender.com/api/v1"
    echo ""
    echo "For Railway deployments, these are auto-configured:"
    echo ""
    echo "  CORS_ORIGIN=https://\${{ RAILWAY_PUBLIC_DOMAIN }}"
    echo "  API_BASE_URL=https://\${{ RAILWAY_PUBLIC_DOMAIN }}/api/v1"
    echo ""
    echo "For local development, use:"
    echo ""
    echo "  VITE_API_URL=http://localhost:5000/api/v1"
    echo ""
}

# Show frontend config example
show_frontend_config() {
    echo -e "${BLUE}Frontend API Configuration${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo ""
    echo "Update your API client (usually in src/api/client.ts or similar):"
    echo ""
    echo "  const API_BASE_URL = import.meta.env.VITE_API_URL;"
    echo "  const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000;"
    echo ""
    echo "Your .env files should contain:"
    echo ""
    echo "  # .env.production"
    echo "  VITE_API_URL=https://sms-backend.onrender.com/api/v1"
    echo "  VITE_API_TIMEOUT=30000"
    echo ""
    echo "  # .env.development"
    echo "  VITE_API_URL=http://localhost:5000/api/v1"
    echo "  VITE_API_TIMEOUT=30000"
    echo ""
}

# Main
main() {
    get_render_urls
    get_railway_urls
    update_env_vars
    show_frontend_config
    test_urls
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${GREEN}✓ Live URL guide complete${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Update your .env files with the URLs above"
    echo "  2. Redeploy to apply changes"
    echo "  3. Test the URLs in your browser"
    echo "  4. Update any hardcoded localhost references"
    echo ""
}

main
