#!/bin/bash

# Deploy to all platforms or specific platform
# Usage: ./scripts/deploy.sh [render|railway|kubernetes|all]

set -e

PLATFORM=${1:-all}
BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT=$(git rev-parse --short HEAD)

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Multi-Platform Deployment Script                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Branch: $BRANCH"
echo "Commit: $COMMIT"
echo "Platform: $PLATFORM"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check git status
check_git_status() {
    echo -e "${BLUE}Checking Git status...${NC}"
    
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${RED}⚠ Working directory has uncommitted changes${NC}"
        echo "Commit changes before deploying"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Working directory clean${NC}"
    echo ""
}

# Deploy to Render
deploy_render() {
    echo -e "${BLUE}Deploying to Render...${NC}"
    
    if [ -z "$RENDER_API_TOKEN" ] || [ -z "$RENDER_SERVICE_ID" ]; then
        echo -e "${RED}✗ RENDER_API_TOKEN or RENDER_SERVICE_ID not set${NC}"
        return 1
    fi
    
    # Trigger deployment via API
    DEPLOY_RESPONSE=$(curl -s -X POST \
        "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
        -H "Authorization: Bearer $RENDER_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{}")
    
    DEPLOY_ID=$(echo "$DEPLOY_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$DEPLOY_ID" ]; then
        echo -e "${GREEN}✓ Deployment initiated (ID: $DEPLOY_ID)${NC}"
        echo "   Monitor at: https://dashboard.render.com"
        echo ""
        return 0
    else
        echo -e "${RED}✗ Deployment failed${NC}"
        echo "   Response: $DEPLOY_RESPONSE"
        return 1
    fi
}

# Deploy to Railway
deploy_railway() {
    echo -e "${BLUE}Deploying to Railway...${NC}"
    
    if [ -z "$RAILWAY_TOKEN" ]; then
        echo -e "${RED}✗ RAILWAY_TOKEN not set${NC}"
        return 1
    fi
    
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}⚠ Railway CLI not found, installing...${NC}"
        npm install -g @railway/cli
    fi
    
    # Set Railway token
    export RAILWAY_TOKEN="$RAILWAY_TOKEN"
    
    # Deploy services
    echo "Deploying backend..."
    railway up --service backend --environment production
    
    echo "Deploying frontend..."
    railway up --service frontend --environment production
    
    echo -e "${GREEN}✓ Railway deployment completed${NC}"
    echo "   Monitor at: https://railway.app/dashboard"
    echo ""
    return 0
}

# Deploy to Kubernetes
deploy_kubernetes() {
    echo -e "${BLUE}Deploying to Kubernetes...${NC}"
    
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}✗ kubectl not found${NC}"
        return 1
    fi
    
    if [ -z "$KUBECONFIG" ]; then
        echo -e "${YELLOW}⚠ KUBECONFIG environment variable not set${NC}"
        echo "   Using default kubeconfig at ~/.kube/config"
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &>/dev/null; then
        echo -e "${RED}✗ Cannot connect to Kubernetes cluster${NC}"
        return 1
    fi
    
    echo "Checking namespace..."
    if ! kubectl get namespace sms &>/dev/null; then
        echo "Creating namespace 'sms'..."
        kubectl create namespace sms
    fi
    
    # Update image tags in manifests
    echo "Updating image tags to $COMMIT..."
    sed -i.bak "s|thrinesh1906/sms-backend:.*|thrinesh1906/sms-backend:$COMMIT|g" k8s/*.yaml helm/*/values.yaml
    sed -i.bak "s|thrinesh1906/sms-frontend:.*|thrinesh1906/sms-frontend:$COMMIT|g" k8s/*.yaml helm/*/values.yaml
    
    # Apply configurations
    echo "Applying Kubernetes manifests..."
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secrets.yaml
    kubectl apply -f k8s/
    
    # Wait for rollout
    echo "Waiting for deployments to be ready..."
    kubectl rollout status deployment/sms-backend -n sms --timeout=5m || true
    kubectl rollout status deployment/sms-frontend -n sms --timeout=5m || true
    
    echo -e "${GREEN}✓ Kubernetes deployment completed${NC}"
    echo "   Monitor with: kubectl get pods -n sms"
    echo ""
    return 0
}

# Deploy to all platforms
deploy_all() {
    echo -e "${BLUE}Deploying to all platforms...${NC}"
    echo ""
    
    local failed=0
    
    deploy_render || failed=$((failed + 1))
    deploy_railway || failed=$((failed + 1))
    deploy_kubernetes || failed=$((failed + 1))
    
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}✓ All deployments succeeded${NC}"
        return 0
    else
        echo -e "${RED}✗ Some deployments failed ($failed)${NC}"
        return 1
    fi
}

# Cleanup
cleanup() {
    # Remove temporary backup files
    find . -name "*.bak" -delete 2>/dev/null || true
}

trap cleanup EXIT

# Main execution
main() {
    check_git_status
    
    case "$PLATFORM" in
        render)
            deploy_render
            ;;
        railway)
            deploy_railway
            ;;
        kubernetes|k8s)
            deploy_kubernetes
            ;;
        all)
            deploy_all
            ;;
        *)
            echo -e "${RED}Unknown platform: $PLATFORM${NC}"
            echo "Valid options: render|railway|kubernetes|all"
            exit 1
            ;;
    esac
}

main
