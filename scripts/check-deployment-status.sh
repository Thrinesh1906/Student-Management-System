#!/bin/bash

# Check deployment status across all platforms
# Usage: ./scripts/check-deployment-status.sh

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  Multi-Platform Deployment Status Check"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo "Checking requirements..."
    
    local missing=0
    
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}✗ curl not found${NC}"
        missing=1
    else
        echo -e "${GREEN}✓ curl found${NC}"
    fi
    
    if [ -n "$RENDER_API_TOKEN" ]; then
        echo -e "${GREEN}✓ RENDER_API_TOKEN set${NC}"
    else
        echo -e "${YELLOW}⚠ RENDER_API_TOKEN not set${NC}"
    fi
    
    if [ -n "$RAILWAY_TOKEN" ]; then
        echo -e "${GREEN}✓ RAILWAY_TOKEN set${NC}"
    else
        echo -e "${YELLOW}⚠ RAILWAY_TOKEN not set${NC}"
    fi
    
    if command -v kubectl &> /dev/null; then
        echo -e "${GREEN}✓ kubectl found${NC}"
    else
        echo -e "${YELLOW}⚠ kubectl not found (K8s checks skipped)${NC}"
    fi
    
    echo ""
    return $missing
}

# Check Render deployment status
check_render() {
    echo "Checking Render Deployment..."
    
    if [ -z "$RENDER_API_TOKEN" ] || [ -z "$RENDER_SERVICE_ID" ]; then
        echo -e "${YELLOW}⚠ Skipping Render check (credentials not set)${NC}"
        return
    fi
    
    # Check backend service
    RENDER_STATUS=$(curl -s -H "Authorization: Bearer $RENDER_API_TOKEN" \
        "https://api.render.com/v1/services/$RENDER_SERVICE_ID" | \
        grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    
    if [ "$RENDER_STATUS" = "available" ]; then
        echo -e "${GREEN}✓ Render Backend: $RENDER_STATUS${NC}"
    else
        echo -e "${RED}✗ Render Backend: $RENDER_STATUS${NC}"
    fi
    
    echo ""
}

# Check Railway deployment status
check_railway() {
    echo "Checking Railway Deployment..."
    
    if [ -z "$RAILWAY_TOKEN" ]; then
        echo -e "${YELLOW}⚠ Skipping Railway check (credentials not set)${NC}"
        return
    fi
    
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}⚠ Railway CLI not installed${NC}"
        return
    fi
    
    echo "Railway Status:"
    railway status --environment production 2>/dev/null || \
        echo -e "${YELLOW}⚠ Could not connect to Railway${NC}"
    
    echo ""
}

# Check Kubernetes deployment status
check_kubernetes() {
    echo "Checking Kubernetes Deployment..."
    
    if ! command -v kubectl &> /dev/null; then
        echo -e "${YELLOW}⚠ kubectl not found (K8s checks skipped)${NC}"
        return
    fi
    
    # Check if cluster is accessible
    if ! kubectl cluster-info &>/dev/null; then
        echo -e "${RED}✗ Cannot connect to Kubernetes cluster${NC}"
        return
    fi
    
    echo -e "${GREEN}✓ Kubernetes cluster accessible${NC}"
    
    # Check namespace exists
    if kubectl get namespace sms &>/dev/null; then
        echo -e "${GREEN}✓ Namespace 'sms' exists${NC}"
    else
        echo -e "${RED}✗ Namespace 'sms' not found${NC}"
        return
    fi
    
    # Check deployments
    echo ""
    echo "Deployment Status:"
    kubectl get deployments -n sms -o wide --no-headers 2>/dev/null | \
    while read -r line; do
        READY=$(echo "$line" | awk '{print $2}')
        AVAILABLE=$(echo "$line" | awk '{print $4}')
        if [ "$READY" = "$AVAILABLE" ]; then
            echo -e "${GREEN}✓ $line${NC}"
        else
            echo -e "${RED}✗ $line${NC}"
        fi
    done
    
    # Check pod status
    echo ""
    echo "Pod Status:"
    kubectl get pods -n sms -o wide --no-headers 2>/dev/null | \
    while read -r line; do
        STATUS=$(echo "$line" | awk '{print $3}')
        if [ "$STATUS" = "Running" ]; then
            echo -e "${GREEN}✓ $line${NC}"
        else
            echo -e "${RED}✗ $line${NC}"
        fi
    done
    
    echo ""
}

# Check application health endpoints
check_health() {
    echo "Checking Application Health Endpoints..."
    echo ""
    
    local endpoints=(
        "backend:https://sms-backend.onrender.com/health"
        "frontend:https://sms-frontend.onrender.com"
    )
    
    for endpoint in "${endpoints[@]}"; do
        IFS=':' read -r name url <<< "$endpoint"
        
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $name is healthy${NC}"
        else
            echo -e "${RED}✗ $name is not responding${NC}"
        fi
    done
    
    echo ""
}

# Generate summary report
generate_summary() {
    echo "═══════════════════════════════════════════════════════════════"
    echo "  Summary"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "Check timestamp: $(date)"
    echo ""
    echo "For detailed logs and information:"
    echo "  Render:  https://dashboard.render.com"
    echo "  Railway: https://railway.app/dashboard"
    echo "  K8s:     kubectl describe pods -n sms"
    echo ""
}

# Main execution
main() {
    check_requirements
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    
    check_render
    check_railway
    check_kubernetes
    check_health
    
    generate_summary
}

# Run main function
main
