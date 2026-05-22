#!/bin/bash

# Configure live URLs for your application
# This script helps you update API endpoints from localhost to live URLs

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Configure Live URLs                                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to update localhost references
update_localhost_refs() {
    local platform=$1
    local backend_url=$2
    
    echo "Updating localhost references for $platform..."
    
    # Files to check
    local files=(
        "frontend/src/api/client.ts"
        "frontend/src/config/api.ts"
        "frontend/src/config/index.ts"
        "frontend/src/constants/api.ts"
        "frontend/vite.config.ts"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo "  Checking $file..."
            
            # Look for localhost references
            if grep -q "localhost:5000" "$file" 2>/dev/null; then
                echo -e "    ${YELLOW}Found localhost references${NC}"
                echo "    Update: localhost:5000 → $backend_url"
            fi
        fi
    done
}

# Function to generate live URL config
generate_live_config() {
    local platform=$1
    
    echo ""
    echo -e "${BLUE}Generated Configuration for $platform${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo ""
    
    if [ "$platform" = "render" ]; then
        cat > /tmp/render-config.txt << 'EOF'
# Render Live URLs
FRONTEND_URL=https://sms-frontend.onrender.com
BACKEND_URL=https://sms-backend.onrender.com
API_BASE_URL=https://sms-backend.onrender.com/api/v1

# Update in Render Dashboard:
# Service Settings → Environment → Add these variables:
CORS_ORIGIN=https://sms-frontend.onrender.com
API_HOST=sms-backend.onrender.com
API_PROTOCOL=https
EOF
        cat /tmp/render-config.txt
        
    elif [ "$platform" = "railway" ]; then
        cat > /tmp/railway-config.txt << 'EOF'
# Railway Live URLs (Dynamic)
FRONTEND_URL=https://${RAILWAY_PUBLIC_DOMAIN}
BACKEND_URL=https://${RAILWAY_PUBLIC_DOMAIN}
API_BASE_URL=https://${RAILWAY_PUBLIC_DOMAIN}/api/v1

# These are auto-configured in Railway:
CORS_ORIGIN=https://${RAILWAY_PUBLIC_DOMAIN}
API_HOST=${RAILWAY_PUBLIC_DOMAIN}
API_PROTOCOL=https
EOF
        cat /tmp/railway-config.txt
    fi
    
    echo ""
}

# Show frontend code examples
show_code_examples() {
    echo -e "${BLUE}Frontend Code Examples${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo ""
    
    echo "1. Update your API client (src/api/client.ts):"
    echo ""
    cat << 'EOF'
// Define API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios/fetch client
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

// Example request
export const getUserProfile = async () => {
  const response = await client.get('/auth/profile');
  return response.data;
};
EOF
    
    echo ""
    echo "2. Update environment files:"
    echo ""
    cat << 'EOF'
# .env.development
VITE_API_URL=http://localhost:5000/api/v1

# .env.production (Render)
VITE_API_URL=https://sms-backend.onrender.com/api/v1

# .env.production (Railway)
VITE_API_URL=https://${RAILWAY_PUBLIC_DOMAIN}/api/v1
EOF
    
    echo ""
}

# Show deployment checklist
show_checklist() {
    echo -e "${BLUE}Live URL Deployment Checklist${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo ""
    echo "Before deploying with live URLs:"
    echo ""
    echo "  [ ] Remove all hardcoded localhost references"
    echo "  [ ] Update .env files with live URLs"
    echo "  [ ] Test API calls work with live URLs"
    echo "  [ ] Enable HTTPS in API calls"
    echo "  [ ] Configure CORS correctly"
    echo "  [ ] Update cookies/auth settings for production"
    echo "  [ ] Test in private/incognito mode"
    echo "  [ ] Monitor browser console for errors"
    echo "  [ ] Check network tab for failed requests"
    echo "  [ ] Verify authentication flows work"
    echo ""
}

# Verify files exist
verify_env_files() {
    echo -e "${BLUE}Verifying Environment Files${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo ""
    
    local env_files=(
        "backend/.env.render"
        "backend/.env.railway"
        "frontend/.env.render"
        "frontend/.env.railway"
    )
    
    for file in "${env_files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "${GREEN}✓ $file${NC}"
        else
            echo -e "${RED}✗ $file (not found)${NC}"
        fi
    done
    
    echo ""
}

# Main execution
main() {
    verify_env_files
    
    echo "Which platform are you deploying to?"
    echo "  1) Render"
    echo "  2) Railway"
    echo "  3) Both (view both configs)"
    echo ""
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            generate_live_config "render"
            update_localhost_refs "Render" "https://sms-backend.onrender.com/api/v1"
            ;;
        2)
            generate_live_config "railway"
            update_localhost_refs "Railway" "https://<your-railway-domain>/api/v1"
            ;;
        3)
            generate_live_config "render"
            generate_live_config "railway"
            ;;
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac
    
    show_code_examples
    show_checklist
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${GREEN}Configuration guide complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Update your API configuration files"
    echo "  2. Commit changes to git"
    echo "  3. Push to main branch"
    echo "  4. Verify deployment in GitHub Actions"
    echo "  5. Test live URLs in your browser"
    echo ""
    echo "Common issues & fixes:"
    echo "  • CORS errors: Check CORS_ORIGIN setting"
    echo "  • 404 errors: Verify API_BASE_URL is correct"
    echo "  • Connection refused: Service may still be deploying"
    echo "  • SSL errors: Use https:// not http://"
    echo ""
}

main
