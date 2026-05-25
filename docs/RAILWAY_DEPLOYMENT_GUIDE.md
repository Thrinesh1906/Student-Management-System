# Railway.com Deployment Guide

## Overview

This guide covers deploying the Student Management System on Railway.com with optional Kubernetes integration for advanced use cases.

### Two Deployment Approaches

1. **Railway.com Native** (Recommended for beginners) - Simple, Railway manages everything
2. **Railway.com + Self-Hosted Kubernetes** (Advanced) - Railway for CI/CD, your K8s cluster for compute

---

## Approach 1: Railway.com Native Deployment (Recommended)

### Prerequisites

- Railway.com account ([sign up free](https://railway.app))
- GitHub account with repository access
- Docker Hub account (optional, for private images)

### Step 1: Connect GitHub Repository to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project** → **Deploy from GitHub**
3. Select your repository
4. Authorize Railway to access GitHub
5. Select main branch for auto-deployment

### Step 2: Create Services in Railway

Railway will auto-detect services. You need to configure:

#### Backend Service
```bash
# Service name: sms-backend
# Root directory: ./backend
# Dockerfile: ./backend/Dockerfile
# Port: 5000
# Build command: (leave default)
# Start command: npm start
```

#### Frontend Service
```bash
# Service name: sms-frontend
# Root directory: ./frontend
# Dockerfile: ./frontend/Dockerfile
# Port: 3000
# Build command: npm run build
# Start command: npm run preview
```

#### Database Services

Railway provides marketplace integrations:

1. **MongoDB**
   - Click **Add** in Railway Dashboard
   - Search "MongoDB"
   - Add MongoDB service
   - Configure storage as needed

2. **Redis**
   - Click **Add**
   - Search "Redis"
   - Add Redis service

### Step 3: Set Environment Variables

In Railway Dashboard:

1. Go to **sms-backend** service → **Variables**
2. Add variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=${{ MONGO_URL }}
   REDIS_URL=${{ REDIS_URL }}
   JWT_SECRET=<your-secret-key>
   JWT_REFRESH_SECRET=<your-secret-key>
   LOG_LEVEL=info
   VITE_API_URL=https://<your-railway-domain>.up.railway.app/api
   ```

3. Go to **sms-frontend** service → **Variables**
   ```
   VITE_API_URL=https://<your-railway-domain>.up.railway.app/api
   VITE_APP_NAME=SMS
   ```

### Step 4: Configure Networking

1. **Frontend** → **Settings** → **Generate Domain**
   - This creates your public URL

2. **Backend** → **Settings** → **Generate Domain**
   - Backend gets its own domain

3. Update **nginx** configuration to route traffic:
   ```nginx
   upstream frontend {
       server sms-frontend:3000;
   }
   upstream backend {
       server sms-backend:5000;
   }
   
   server {
       listen 80;
       server_name _;
       
       location / {
           proxy_pass http://frontend;
       }
       
       location /api {
           proxy_pass http://backend;
       }
   }
   ```

### Step 5: Deploy

Railway auto-deploys on push to main:

```bash
# Just push to main branch
git push origin main

# Watch deployment in Railway Dashboard
# or
railway logs
```

### Verify Deployment

```bash
# Check logs
railway logs sms-backend
railway logs sms-frontend

# Health check
curl https://<your-domain>.up.railway.app/health
```

---

## Approach 2: Railway.com + Self-Hosted Kubernetes

### When to Use This Approach

- You need more control over infrastructure
- You want to run on your own Kubernetes cluster
- You need multi-region deployment
- You want to use existing K8s investments

### Architecture

```
┌─────────────────────┐
│  Railway.com        │
│  - GitHub CI/CD     │
│  - Image Registry   │
│  - Deployment Logs  │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Your K8s Cluster   │
│  - Backend Pods     │
│  - Frontend Pods    │
│  - MongoDB          │
│  - Redis            │
└─────────────────────┘
```

### Prerequisites

- Self-hosted Kubernetes cluster (AWS EKS, DigitalOcean, GKE, or local)
- `kubectl` configured and authenticated
- Railway CLI installed
- Docker registry credentials

### Step 1: Set Up Railway CI/CD Pipeline

1. Go to Railway Dashboard → **New Project**
2. Select **Deploy from GitHub**
3. Create GitHub Actions workflow for image building:

```yaml
# .github/workflows/railway-k8s-deploy.yml
name: Build & Push to K8s

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Backend Image
        run: |
          docker build -t ${{ secrets.REGISTRY }}/sms-backend:${{ github.sha }} ./backend
          docker push ${{ secrets.REGISTRY }}/sms-backend:${{ github.sha }}
      
      - name: Build Frontend Image
        run: |
          docker build -t ${{ secrets.REGISTRY }}/sms-frontend:${{ github.sha }} ./frontend
          docker push ${{ secrets.REGISTRY }}/sms-frontend:${{ github.sha }}
      
      - name: Deploy to K8s
        uses: actions-hub/kubectl@master
        env:
          KUBE_CONFIG: ${{ secrets.KUBE_CONFIG }}
        with:
          args: |
            set image deployment/sms-backend \
              sms-backend=${{ secrets.REGISTRY }}/sms-backend:${{ github.sha }} \
              -n sms
            set image deployment/sms-frontend \
              sms-frontend=${{ secrets.REGISTRY }}/sms-frontend:${{ github.sha }} \
              -n sms
            rollout status deployment/sms-backend -n sms
```

### Step 2: Update Kubernetes Manifests

Edit [k8s/backend-deployment.yaml](../k8s/backend-deployment.yaml):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sms-backend
  namespace: sms
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sms-backend
  template:
    metadata:
      labels:
        app: sms-backend
    spec:
      containers:
      - name: sms-backend
        image: your-registry/sms-backend:latest  # Update this
        imagePullPolicy: Always
        ports:
        - containerPort: 5000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: sms-secrets
              key: mongodb-uri
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: sms-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
```

### Step 3: Create K8s Secrets

Store sensitive data in Kubernetes:

```bash
# Create namespace
kubectl create namespace sms

# Create secrets
kubectl create secret generic sms-secrets \
  --from-literal=mongodb-uri=$MONGODB_URI \
  --from-literal=redis-url=$REDIS_URL \
  --from-literal=jwt-secret=$JWT_SECRET \
  --from-literal=jwt-refresh-secret=$JWT_REFRESH_SECRET \
  -n sms

# Verify
kubectl get secrets -n sms
```

### Step 4: Deploy to K8s Cluster

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/mongodb-pvc.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/ingress.yaml

# Verify deployments
kubectl get deployments -n sms
kubectl get pods -n sms
kubectl get svc -n sms
```

### Step 5: Configure Ingress

Edit [k8s/ingress.yaml](../k8s/ingress.yaml):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sms-ingress
  namespace: sms
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - sms.yourdomain.com
    secretName: sms-tls
  rules:
  - host: sms.yourdomain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: sms-backend
            port:
              number: 5000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: sms-frontend
            port:
              number: 80
```

### Step 6: Set GitHub Secrets for K8s Deployment

```bash
# Add secrets to GitHub
gh secret set REGISTRY --body "your-docker-registry-url"
gh secret set REGISTRY_USERNAME --body "your-username"
gh secret set REGISTRY_PASSWORD --body "your-password"
gh secret set KUBE_CONFIG --body "$(cat ~/.kube/config | base64)"
```

---

## Hybrid Approach: Railway Components + K8s Workloads

Best of both worlds - use Railway for easy setup, K8s for control:

### Setup

1. **Use Railway for**: CI/CD, monitoring dashboards, easy logging
2. **Deploy workloads to**: Your K8s cluster
3. **Keep managed services on Railway**: Optional Redis/MongoDB from marketplace

### GitHub Actions Workflow

```yaml
name: Hybrid Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker Images
        run: |
          docker build -t my-registry/sms-backend:${{ github.sha }} ./backend
          docker build -t my-registry/sms-frontend:${{ github.sha }} ./frontend
      
      - name: Push to Registry
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | docker login -u ${{ secrets.REGISTRY_USERNAME }} --password-stdin
          docker push my-registry/sms-backend:${{ github.sha }}
          docker push my-registry/sms-frontend:${{ github.sha }}
      
      - name: Deploy to K8s
        uses: actions-hub/kubectl@master
        env:
          KUBE_CONFIG: ${{ secrets.KUBE_CONFIG }}
        with:
          args: set image deployment/sms-backend sms-backend=my-registry/sms-backend:${{ github.sha }} -n sms
```

---

## Monitoring & Logging

### Railway Dashboard Monitoring

1. **Metrics** tab - CPU, memory, network
2. **Logs** tab - Real-time application logs
3. **Analytics** - Performance insights

### K8s Monitoring (if using K8s)

```bash
# Watch pod status
kubectl get pods -n sms -w

# View logs
kubectl logs deployment/sms-backend -n sms -f

# Check resource usage
kubectl top nodes
kubectl top pods -n sms

# View events
kubectl get events -n sms --sort-by='.lastTimestamp'
```

### Integrate with Prometheus + Grafana

Edit [monitoring/prometheus.yml](../monitoring/prometheus.yml):

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'sms-backend'
    kubernetes_sd_configs:
    - role: pod
      namespaces:
        names:
        - sms
    relabel_configs:
    - source_labels: [__meta_kubernetes_pod_label_app]
      action: keep
      regex: sms-backend
```

---

## Scaling

### Railway Native

1. Go to service settings
2. Adjust **Instance Type** (shared to dedicated)
3. Set **Min/Max Replicas** for auto-scaling

### Kubernetes

```bash
# Manual scaling
kubectl scale deployment sms-backend --replicas=5 -n sms

# Auto-scaling with HPA
kubectl apply -f k8s/hpa.yaml
```

**k8s/hpa.yaml:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sms-backend-hpa
  namespace: sms
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sms-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Rollback

### Railway

```bash
railway logs --service sms-backend
# Go to Railway Dashboard → Deployments → Rollback to previous version
```

### Kubernetes

```bash
# View rollout history
kubectl rollout history deployment/sms-backend -n sms

# Rollback to previous version
kubectl rollout undo deployment/sms-backend -n sms

# Rollback to specific revision
kubectl rollout undo deployment/sms-backend --to-revision=2 -n sms
```

---

## Cost Optimization

### Railway Native
- Use shared instances for dev/test
- Set auto-scaling limits to prevent runaway costs
- Monitor usage in Railway dashboard

### K8s on Cloud Providers
- Use spot/preemptible instances for non-critical workloads
- Implement resource quotas per namespace
- Use Kubernetes cost optimization tools (Kubecost, CloudZero)

---

## Troubleshooting

### Railway Issues

**Service won't start:**
```bash
# Check logs
railway logs sms-backend

# Check build logs
# Go to Railway Dashboard → Deployments → View build logs
```

**Database connection issues:**
```bash
# Verify environment variables
railway variables

# Check MongoDB connection
railway run mongosh mongodb://...
```

### Kubernetes Issues

**Pod stuck in pending:**
```bash
kubectl describe pod <pod-name> -n sms
# Check resource limits, node capacity, PVC availability
```

**Service not accessible:**
```bash
kubectl get svc -n sms
kubectl get ingress -n sms
kubectl describe ingress sms-ingress -n sms
```

---

## Next Steps

1. Choose deployment approach (Railway Native or Railway + K8s)
2. Set up environment variables in your chosen platform
3. Connect GitHub for auto-deployment
4. Deploy and test the application
5. Configure monitoring and alerts
6. Document your deployment in team wiki

## Resources

- [Railway Documentation](https://docs.railway.app)
- [Kubernetes Official Docs](https://kubernetes.io/docs)
- [Your Existing K8s Manifests](../k8s/)
- [Your Existing Helm Charts](../helm/)
