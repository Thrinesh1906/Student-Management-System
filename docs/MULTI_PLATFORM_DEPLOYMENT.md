# Multi-Platform Deployment Guide

This guide covers deploying the Student Management System to **Render**, **Railway**, and **Kubernetes** with automated CI/CD pipelines.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Render Deployment](#render-deployment)
4. [Railway Deployment](#railway-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [CI/CD Pipelines](#cicd-pipelines)
7. [Environment Configuration](#environment-configuration)
8. [Monitoring & Observability](#monitoring--observability)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│                   (Multi-platform config)                    │
└────┬────────────────────┬──────────────────────────┬────────┘
     │                    │                          │
     ▼                    ▼                          ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
│    Render    │  │   Railway    │  │   Kubernetes Cluster │
│  (PaaS)      │  │   (PaaS)     │  │   (Self-hosted/EKS)  │
│              │  │              │  │                      │
│ • Backend    │  │ • Backend    │  │ • Backend Deploy     │
│ • Frontend   │  │ • Frontend   │  │ • Frontend Deploy    │
│ • MongoDB    │  │ • MongoDB    │  │ • Ingress            │
│ • Redis      │  │ • Redis      │  │ • Monitoring (Prom)  │
│ • Nginx      │  │              │  │ • Logging (Loki)     │
└──────────────┘  └──────────────┘  └──────────────────────┘
     │                    │                          │
     └────────────────────┴──────────────────────────┘
              ▼
        Health Monitoring
       & Log Aggregation
```

---

## Prerequisites

### Required Accounts & Tokens

1. **Render Account**
   - Create account at https://render.com
   - Generate API token: https://dashboard.render.com/account/api-tokens
   - Set `RENDER_API_TOKEN` in GitHub Secrets

2. **Railway Account**
   - Create account at https://railway.app
   - Generate API token: https://railway.app/account/tokens
   - Set `RAILWAY_TOKEN` in GitHub Secrets

3. **Kubernetes Cluster** (for K8s deployment)
   - AWS EKS, DigitalOcean, or self-managed cluster
   - kubeconfig file (base64 encoded as `KUBECONFIG` secret)

4. **Docker Hub**
   - Registry for pushing Docker images
   - Set `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` in GitHub Secrets

### GitHub Secrets Configuration

```
DOCKERHUB_USERNAME=your-docker-username
DOCKERHUB_TOKEN=your-docker-token
RENDER_API_TOKEN=your-render-api-token
RENDER_SERVICE_ID=your-render-service-id
RAILWAY_TOKEN=your-railway-token
KUBECONFIG=base64-encoded-kubeconfig
SLACK_WEBHOOK=your-slack-webhook-url (optional)
JWT_SECRET=your-32-char-minimum-jwt-secret
JWT_REFRESH_SECRET=your-32-char-minimum-refresh-secret
```

---

## Render Deployment

### Quick Start

1. **Connect Repository**
   ```bash
   # In Render Dashboard:
   # New → Web Service → GitHub
   # Select repository: Student-Management-System
   # Branch: main
   ```

2. **Configure Services**
   - Render will auto-detect `render.yaml` configuration
   - Services auto-deploy on push to `main` branch

3. **Set Environment Variables**
   ```
   Go to Service Settings → Environment
   Add these variables:
   - MONGO_INITDB_ROOT_PASSWORD: (strong password)
   - JWT_SECRET: (32+ character secret)
   - JWT_REFRESH_SECRET: (32+ character secret)
   ```

### Manual Deployment

```bash
# Using Render CLI (if available)
curl https://install.render.com | sh

# Deploy
render deploy --repo Thrinesh1906/Student-Management-System --branch main
```

### Monitoring Render Deployments

```
Dashboard URL: https://dashboard.render.com
- View logs: Service → Logs
- Monitor metrics: Service → Metrics
- View events: Service → Events
```

### Database Migration on Render

```bash
# SSH into backend service
ssh sms-backend@your-render-url

# Run migrations
npm run db:migrate
npm run db:seed
```

---

## Railway Deployment

### Quick Start

1. **Connect Repository**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Link project
   railway link
   ```

2. **Deploy Services**
   ```bash
   # Deploy to production
   railway up --service backend --environment production
   railway up --service frontend --environment production
   railway up --service mongodb --environment production
   railway up --service redis --environment production
   ```

3. **Configure Environment Variables**
   ```bash
   railway variables set \
     NODE_ENV=production \
     JWT_SECRET="your-32-char-secret" \
     JWT_REFRESH_SECRET="your-refresh-secret"
   ```

### View Railway Logs

```bash
# Backend logs
railway logs --service backend --environment production

# Frontend logs
railway logs --service frontend --environment production

# Real-time streaming
railway logs --follow --service backend
```

### Railway Dashboard

```
Project URL: https://railway.app/project/your-project-id
- Deployments: View deployment history and status
- Logs: Real-time service logs
- Metrics: CPU, memory, network usage
- Integrations: Connected services and databases
```

---

## Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Configure kubeconfig
mkdir -p ~/.kube
# Place your kubeconfig file: ~/.kube/config
chmod 600 ~/.kube/config
```

### Deployment Methods

#### Option 1: kubectl (Raw Manifests)

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets (replace values first!)
kubectl create secret generic sms-secrets \
  --from-literal=JWT_SECRET=your-secret \
  --from-literal=JWT_REFRESH_SECRET=your-refresh-secret \
  -n sms

# Apply configurations
kubectl apply -f k8s/configmap.yaml -n sms
kubectl apply -f k8s/

# Verify
kubectl get pods -n sms
kubectl get svc -n sms
```

#### Option 2: Helm (Recommended)

```bash
# Create namespace
kubectl create namespace sms

# Install/Upgrade
helm upgrade --install sms ./helm/student-mgmt \
  -n sms \
  --set backend.image.tag=latest \
  --set frontend.image.tag=latest \
  --set secrets.jwtSecret="your-32-char-secret" \
  --set secrets.jwtRefreshSecret="your-refresh-secret"

# Verify
helm list -n sms
helm status sms -n sms
```

### Accessing the Application

```bash
# Port forward for testing
kubectl port-forward svc/sms-frontend 3000:80 -n sms
kubectl port-forward svc/sms-backend 5000:5000 -n sms

# Access
Frontend: http://localhost:3000
API: http://localhost:5000/api/v1
API Docs: http://localhost:5000/api/docs
```

### Kubernetes Ingress Configuration

```bash
# Update ingress hostname in k8s/ingress.yaml
kubectl edit ingress sms-ingress -n sms

# Example configuration:
# host: sms.yourdomain.com
# tls:
#   - secretName: sms-tls
#     hosts:
#       - sms.yourdomain.com
```

### Database Management in Kubernetes

```bash
# MongoDB backup
kubectl exec -n sms mongodb-0 -- \
  mongodump --archive > mongodb-backup-$(date +%Y%m%d).archive

# MongoDB restore
kubectl exec -n sms mongodb-0 -- \
  mongorestore --archive < mongodb-backup-20240523.archive

# Check database status
kubectl exec -n sms mongodb-0 -- mongosh --eval "db.stats()"

# View persistent volumes
kubectl get pvc -n sms
kubectl get pv
```

---

## CI/CD Pipelines

### Pipeline Workflow

```
Push to main/develop
         ↓
   GitHub Actions
         ↓
   ┌─────────────────────────────────┐
   │  1. Run Tests (Backend/Frontend) │
   │  2. Security Scan (Trivy)        │
   │  3. Build Docker Images          │
   │  4. Push to Docker Hub           │
   └─────────────────────────────────┘
         ↓
   ┌─────────┬──────────┬──────────────┐
   ▼         ▼          ▼              ▼
 Render   Railway  Kubernetes    Manual Triggers
```

### Available Workflows

#### 1. **CI Tests** (`.github/workflows/ci-tests.yml`)

Runs on every push and PR:

```
✓ Backend unit tests
✓ Frontend unit tests
✓ Linting (ESLint, TypeScript)
✓ Security scanning (Trivy)
✓ Docker build validation
✓ Coverage reports (Codecov)
```

#### 2. **Multi-Platform Deploy** (`.github/workflows/multi-platform-deploy.yml`)

Runs on push to `main`:

```
✓ Build Docker images
✓ Push to Docker Hub
✓ Deploy to Render
✓ Deploy to Railway
✓ Deploy to Kubernetes
✓ Health checks
✓ Slack notifications
```

### Triggering Deployments

#### Automatic (on push to main)
```bash
git commit -m "feat: new feature"
git push origin main
# → Automatically deploys to all platforms
```

#### Manual (via GitHub Actions)
```
Actions → Multi Platform Deploy → Run workflow
→ Select environment: render|railway|kubernetes|all
```

#### Tag-based Release
```bash
git tag v1.0.0
git push origin v1.0.0
# → Builds with semver tags and deploys
```

### Viewing Workflow Results

```
GitHub → Actions tab
→ Select workflow
→ View logs for each job
→ Check deployment status
```

---

## Environment Configuration

### Environment Variables by Platform

#### **Render**

File: `backend/.env.render` and `frontend/.env.render`

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@host/db
REDIS_URL=redis://host:port
JWT_SECRET=your-32-char-minimum-secret
CORS_ORIGIN=https://sms-frontend.onrender.com
```

#### **Railway**

File: `backend/.env.railway` and `frontend/.env.railway`

```env
NODE_ENV=production
MONGODB_URI=${{ plugin.mongodb.DATABASE_URL }}
REDIS_URL=${{ plugin.redis.REDIS_URL }}
JWT_SECRET=your-32-char-minimum-secret
CORS_ORIGIN=https://${{ RAILWAY_PUBLIC_DOMAIN }}
```

#### **Kubernetes**

Files: `k8s/configmap.yaml`, `k8s/secrets.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: sms-config
  namespace: sms
data:
  NODE_ENV: production
  LOG_LEVEL: info
---
apiVersion: v1
kind: Secret
metadata:
  name: sms-secrets
  namespace: sms
type: Opaque
data:
  JWT_SECRET: base64-encoded-secret
  JWT_REFRESH_SECRET: base64-encoded-secret
```

### Secrets Management Best Practices

```bash
# Generate strong secrets
openssl rand -base64 32

# Store securely
# Render: Service Settings → Environment
# Railway: Variables Dashboard
# Kubernetes: kubectl create secret generic
# GitHub: Settings → Secrets

# Never commit .env files
git add .gitignore
# Ensure .env* files are ignored
```

---

## Monitoring & Observability

### Prometheus Metrics

```bash
# Access Prometheus dashboard
# Render: https://sms-prometheus.onrender.com
# Railway: Check service URL
# Kubernetes: kubectl port-forward svc/prometheus 9090:9090

# Query metrics
http_requests_total
backend_response_time_ms
mongodb_connection_status
```

### Grafana Dashboards

```bash
# Access Grafana
# Default credentials: admin/admin
# Render: https://sms-grafana.onrender.com:3001
# Railway: Check service URL
# Kubernetes: kubectl port-forward svc/grafana 3000:3000

# Default dashboards
- Application Metrics
- Database Performance
- System Resources
- Request Latency
```

### Log Aggregation (Loki)

```bash
# Loki is configured in docker-compose and K8s
# Logs are automatically collected from:
# - Application stdout/stderr
# - Container logs
# - System logs

# Query logs in Grafana
# Data Source → Loki
# Example queries:
# {job="backend"}
# {job="frontend"}
# {level="error"}
```

### Health Checks

```bash
# Backend health
curl https://sms-backend.onrender.com/health

# Frontend health
curl https://sms-frontend.onrender.com

# Kubernetes health
kubectl get pods -n sms
kubectl describe pod <pod-name> -n sms
kubectl logs <pod-name> -n sms
```

---

## Troubleshooting

### Common Issues

#### 1. Deployment Fails on Render

```bash
# Check logs
Render Dashboard → Service → Logs

# Common causes:
- Environment variables not set
- Database connection string invalid
- Port conflicts
- Docker build errors

# Solution:
- Verify RENDER_API_TOKEN
- Check environment variables in dashboard
- Review build logs
```

#### 2. Railway Deployment Stuck

```bash
# Check deployment status
railway status --environment production

# View service logs
railway logs --service backend

# Restart service
railway redeploy

# Clear cache
railway variables delete CACHE_CLEAR
railway variables set CACHE_CLEAR=1
```

#### 3. Kubernetes Pod CrashLoopBackOff

```bash
# Check pod status
kubectl describe pod <pod-name> -n sms

# View logs
kubectl logs <pod-name> -n sms --tail=50

# Check events
kubectl get events -n sms --sort-by='.lastTimestamp'

# Restart pod
kubectl delete pod <pod-name> -n sms
kubectl rollout restart deployment/sms-backend -n sms
```

#### 4. Database Connection Failures

```bash
# Test connection
# For Render/Railway:
mongo "mongodb+srv://user:pass@host/db"

# For Kubernetes:
kubectl exec -n sms mongodb-0 -- mongosh

# Check database status
mongo --eval "db.serverStatus()"
```

#### 5. CORS Issues

```bash
# Solution: Update CORS_ORIGIN in environment
# Render: Service Settings → Environment
# Railway: Variables dashboard
# Kubernetes: Edit configmap

kubectl edit configmap sms-config -n sms
# Update CORS_ORIGIN value
```

#### 6. Container Image Pull Failures

```bash
# Check Docker Hub credentials
kubectl get secrets -n sms

# Re-create registry secret
kubectl delete secret docker-registry sms-docker -n sms
kubectl create secret docker-registry sms-docker \
  --docker-server=docker.io \
  --docker-username=your-username \
  --docker-password=your-token \
  -n sms

# Update deployment
kubectl patch deployment sms-backend -n sms \
  -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"sms-docker"}]}}}}'
```

### Recovery Procedures

#### Render Rollback

```
Render Dashboard → Deployment History
→ Click previous version → Redeploy
```

#### Railway Rollback

```bash
railway deployments list
railway redeploy --deployment <deployment-id>
```

#### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/sms-backend -n sms

# Rollback to previous version
kubectl rollout undo deployment/sms-backend -n sms

# Rollback to specific revision
kubectl rollout undo deployment/sms-backend -n sms --to-revision=2
```

---

## Performance Optimization

### Render Optimizations

```yaml
# render.yaml
backend:
  numInstances: 2  # Auto-scale if needed
  resources:
    cpu: 100m
    memory: 256Mi
```

### Railway Optimizations

```json
{
  "deploy": {
    "numReplicas": 2,
    "restartPolicyMaxRetries": 5
  }
}
```

### Kubernetes Optimizations

```yaml
# k8s/backend-deployment.yaml
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
autoscaling:
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilization: 70
```

---

## Support & Documentation

- **Render Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app
- **Kubernetes Docs**: https://kubernetes.io/docs
- **GitHub Actions**: https://docs.github.com/actions
- **Docker Hub**: https://hub.docker.com/

---

## Maintenance Schedule

| Task | Frequency | Command |
|------|-----------|---------|
| Update dependencies | Weekly | `npm audit fix` |
| Database backup | Daily | See backup commands above |
| Security scan | Per commit | Trivy in CI |
| Log review | Daily | Check monitoring dashboards |
| Certificate renewal | 90 days | Auto via Let's Encrypt |
| Performance review | Monthly | Check Prometheus metrics |

---

Generated: May 2026
Last Updated: May 23, 2026
