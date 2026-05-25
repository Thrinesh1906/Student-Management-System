# Railway.com + Kubernetes Deployment Setup Guide

## Complete Step-by-Step Setup

This guide walks you through deploying your SMS application on Railway.com with optional Kubernetes integration.

---

## Part 1: Choose Your Deployment Strategy

### Strategy A: Railway Native Only (Recommended for beginners)
- ✅ Easiest setup (5 minutes)
- ✅ No infrastructure management
- ✅ Automatic scaling
- ✅ Built-in monitoring
- ❌ Less control
- ❌ Limited to Railway's managed services

**Best for:** Startups, MVPs, learning projects

### Strategy B: Railway + Kubernetes (Recommended for production)
- ✅ Full control over infrastructure
- ✅ Multi-cloud capability
- ✅ Advanced networking
- ✅ Cost-effective at scale
- ❌ More complex setup
- ❌ Requires K8s knowledge

**Best for:** Production systems, enterprises, cost-sensitive projects

### Strategy C: Hybrid (Railway CI/CD + K8s workloads)
- ✅ Best of both worlds
- ✅ Railway handles CI/CD
- ✅ K8s handles compute
- ✅ Flexible scaling
- ❌ Multiple platforms to manage

**Best for:** Medium-sized teams with hybrid infrastructure

---

## PART 2: RAILWAY NATIVE DEPLOYMENT

### Prerequisites
- GitHub account
- Railway account ([Sign up free](https://railway.app))

### Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Authorize Railway with GitHub
5. Select: `Thrinesh1906/Student-Management-System`
6. Select branch: `main`
7. Click **Deploy Now**

### Step 2: Add Database Services

Railway will auto-detect your Dockerfile services. Now add databases:

#### MongoDB
1. In Railway Dashboard, click **Add**
2. Search `MongoDB`
3. Click **MongoDB 7.0** → **Add**
4. Wait for MongoDB to start (3-5 minutes)

#### Redis
1. Click **Add**
2. Search `Redis`
3. Click **Redis 7-alpine** → **Add**
4. Wait for Redis to start (1-2 minutes)

### Step 3: Configure Environment Variables

#### Backend Service

1. In Railway Dashboard, click **sms-backend** service
2. Go to **Variables** tab
3. Add these variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=${{ secrets.MONGO_URL }}
REDIS_URL=${{ secrets.REDIS_URL }}
JWT_SECRET=generate-random-secret-32-chars-minimum
JWT_REFRESH_SECRET=generate-random-secret-32-chars-minimum
LOG_LEVEL=info
VITE_API_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app/api
CORS_ORIGIN=https://YOUR-RAILWAY-DOMAIN.up.railway.app
```

**⚠️ IMPORTANT:** Replace `YOUR-RAILWAY-DOMAIN` with actual domain (see Step 4)

#### Frontend Service

1. Click **sms-frontend** service
2. Go to **Variables** tab
3. Add:

```env
VITE_API_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app/api
VITE_APP_NAME=SMS
VITE_APP_VERSION=1.0.0
```

### Step 4: Generate Public Domains

#### For Frontend
1. Click **sms-frontend** service
2. Go to **Settings**
3. Click **Generate Domain** button
4. Copy the domain (e.g., `sms-production-xyz123.up.railway.app`)
5. Update the `VITE_API_URL` and `CORS_ORIGIN` in both services with this domain

#### For Backend (Optional)
1. Click **sms-backend** service
2. Go to **Settings**
3. Click **Generate Domain** (creates separate API endpoint)
4. Copy the domain for API-only access

### Step 5: Deploy

The app auto-deploys when you push to main. To trigger manually:

```bash
git add .
git commit -m "Deploy to Railway"
git push origin main
```

Monitor deployment in Railway Dashboard:
- **Deployments** tab → view logs
- **Metrics** tab → CPU, memory, network
- **Logs** tab → application output

### Step 6: Verify Deployment

```bash
# Test health endpoint
curl https://YOUR-RAILWAY-DOMAIN.up.railway.app/health

# Test API
curl https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/health

# Access application
# Frontend: https://YOUR-RAILWAY-DOMAIN.up.railway.app
# Swagger Docs: https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/docs
```

### Step 7: Login to Application

Open your browser to `https://YOUR-RAILWAY-DOMAIN.up.railway.app`

Login with:
```
Email:    admin@sms.local
Password: Admin@123
```

### Step 8: Enable Monitoring (Optional)

In Railway Dashboard:
1. Click **Integrations**
2. Add **Datadog** or **Sentry** for monitoring
3. Configure alerts

---

## PART 3: RAILWAY + KUBERNETES DEPLOYMENT

### Prerequisites
- All Prerequisites from Part 2
- Kubernetes cluster (AWS EKS, DigitalOcean, GKE, self-hosted)
- kubectl installed and configured
- Docker Hub account

### Step 1: Prepare GitHub Secrets

Add these secrets to your GitHub repository:

```bash
# Generate secure tokens
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Add to GitHub
gh secret set JWT_SECRET --body "$JWT_SECRET"
gh secret set JWT_REFRESH_SECRET --body "$JWT_REFRESH_SECRET"
gh secret set DOCKERHUB_USERNAME --body "your-docker-username"
gh secret set DOCKERHUB_TOKEN --body "your-docker-token"

# Encode and add kubeconfig
KUBE_CONFIG=$(cat ~/.kube/config | base64)
gh secret set KUBE_CONFIG --body "$KUBE_CONFIG"

# Optional: Add GitHub token
gh secret set GITHUB_TOKEN --body "your-github-token"
```

### Step 2: Configure Kubernetes Cluster

#### Initialize Namespace and Secrets

```bash
# Create namespace
kubectl create namespace sms

# Create database credentials secret
MONGO_USER=$(openssl rand -base64 8)
MONGO_PASS=$(openssl rand -base64 16)

kubectl create secret generic sms-secrets \
  --from-literal=mongodb-root-username="$MONGO_USER" \
  --from-literal=mongodb-root-password="$MONGO_PASS" \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --from-literal=jwt-refresh-secret="$JWT_REFRESH_SECRET" \
  -n sms

# Verify
kubectl get secrets -n sms
```

#### Create ConfigMap for Application Config

```bash
kubectl create configmap sms-config \
  --from-literal=NODE_ENV=production \
  --from-literal=LOG_LEVEL=info \
  -n sms
```

### Step 3: Deploy Initial Infrastructure

```bash
# Deploy in this order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/mongodb-pvc.yaml    # PersistentVolume for MongoDB
kubectl apply -f k8s/redis.yaml          # Redis cache
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml        # Ingress for routing
kubectl apply -f k8s/hpa.yaml            # Auto-scaling

# Verify all resources
kubectl get all -n sms
```

### Step 4: Configure Ingress (External Access)

Update [k8s/ingress.yaml](../k8s/ingress.yaml):

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
    secretName: sms-tls-cert
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

Get Ingress IP:
```bash
kubectl get ingress -n sms
# Copy EXTERNAL-IP
# Create DNS record: sms.yourdomain.com → EXTERNAL-IP
```

### Step 5: Enable CI/CD Automation

The GitHub Actions workflows will auto-deploy on push to main:

**File:** [.github/workflows/railway-deploy.yml](./.github/workflows/railway-deploy.yml)
- Auto-builds Docker images
- Pushes to Docker Hub
- Deploys to Railway

**File:** [.github/workflows/k8s-deploy.yml](./.github/workflows/k8s-deploy.yml)
- Auto-builds Docker images
- Pushes to Docker Hub
- Deploys to Kubernetes cluster
- Runs health checks

To trigger manual deployment:
```bash
# Push to main (triggers automatic deployment)
git push origin main

# Or manually via GitHub Actions UI
# Repository → Actions → Select workflow → Run workflow
```

### Step 6: Monitor Kubernetes Deployments

```bash
# Watch pod status
kubectl get pods -n sms -w

# View logs
kubectl logs -f deployment/sms-backend -n sms
kubectl logs -f deployment/sms-frontend -n sms

# Check resource usage
kubectl top nodes
kubectl top pods -n sms

# Get events
kubectl get events -n sms --sort-by='.lastTimestamp'

# Check deployments
kubectl get deployments -n sms -o wide
kubectl get svc -n sms
kubectl get ingress -n sms
```

### Step 7: Access Application

```bash
# Get the ingress IP/hostname
kubectl get ingress -n sms

# If using port-forward for testing:
kubectl port-forward -n sms svc/sms-frontend 3000:80

# Open browser
# http://localhost:3000 (if port-forwarding)
# or
# https://sms.yourdomain.com (if ingress configured)
```

### Step 8: Enable Auto-Scaling

The HPA (HorizontalPodAutoscaler) is already configured in [k8s/hpa.yaml](../k8s/hpa.yaml):

```bash
# Verify HPA is active
kubectl get hpa -n sms

# View HPA status
kubectl describe hpa sms-backend-hpa -n sms

# Adjust scaling parameters (edit file and reapply)
kubectl apply -f k8s/hpa.yaml
```

---

## PART 4: HYBRID APPROACH (Railway + K8s)

### Setup

1. **Follow Steps 1-5 from Railway Native**
   - This sets up CI/CD and monitoring on Railway

2. **Follow Steps 1-8 from Railway + Kubernetes**
   - This sets up actual workloads on K8s

3. **Result:**
   - Railway manages: GitHub Actions, image registry, monitoring
   - Kubernetes manages: Containers, networking, storage, auto-scaling

---

## PART 5: MONITORING & OBSERVABILITY

### Railway Dashboard
- **Logs** → Real-time application output
- **Metrics** → CPU, memory, network
- **Analytics** → Performance trends
- **Alerts** → Set up notifications

### Kubernetes Monitoring

#### View Metrics
```bash
# Enable metrics-server (if not installed)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# View resource usage
kubectl top nodes
kubectl top pods -n sms

# View HPA metrics
kubectl get hpa sms-backend-hpa -n sms --watch
```

#### Prometheus + Grafana (Optional)

Create monitoring stack:
```bash
# Add Prometheus helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace

# Port-forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Open http://localhost:3000
# Default: admin/prom-operator
```

### Loki Log Aggregation

```bash
# Install Loki stack
helm install loki loki-stack/loki-stack -n logging --create-namespace

# View logs from all pods
# Use Grafana to query logs
```

---

## PART 6: BACKUP & RECOVERY

### Database Backups

#### MongoDB Backup

```bash
# One-time backup
kubectl exec -it deployment/sms-mongodb -n sms -- \
  mongodump --out=/backups/$(date +%Y%m%d_%H%M%S)

# Automated backup (CronJob)
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mongodb-backup
  namespace: sms
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: mongodb-backup
            image: mongo:7.0
            command:
            - /bin/sh
            - -c
            - mongodump --uri=mongodb://sms-mongodb:27017 --out=/backups/\$(date +%Y%m%d_%H%M%S)
            volumeMounts:
            - name: backups
              mountPath: /backups
          volumes:
          - name: backups
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
EOF
```

#### Restore from Backup

```bash
# List available backups
kubectl exec -it deployment/sms-mongodb -n sms -- ls /backups

# Restore specific backup
kubectl exec -it deployment/sms-mongodb -n sms -- \
  mongorestore --uri=mongodb://sms-mongodb:27017 /backups/BACKUP_DATE
```

---

## PART 7: ROLLBACK & UPDATES

### Kubernetes Rollback

```bash
# View deployment history
kubectl rollout history deployment/sms-backend -n sms

# Rollback to previous version
kubectl rollout undo deployment/sms-backend -n sms

# Rollback to specific revision
kubectl rollout undo deployment/sms-backend --to-revision=3 -n sms

# Watch rollout status
kubectl rollout status deployment/sms-backend -n sms
```

### Railway Rollback

In Railway Dashboard:
1. Go to **Deployments**
2. Click deployment to rollback
3. Click **Rollback** button
4. Confirm

---

## PART 8: TROUBLESHOOTING

### Railway Issues

**Application won't start:**
```bash
# Check build logs
# Railway Dashboard → Deployments → failed deployment → View logs

# Check environment variables
railway variables

# Rebuild
railway up --detach
```

**Can't connect to database:**
```bash
# Check connection string
railway env | grep MONGO_URL

# Test connection
railway run mongosh $MONGO_URL
```

### Kubernetes Issues

**Pods in pending state:**
```bash
# Check pod details
kubectl describe pod POD_NAME -n sms

# Common issues:
# - Insufficient resources (check node capacity)
# - PVC not bound (check PVC status)
# - Image pull errors (check registry credentials)
```

**Service not accessible:**
```bash
# Check endpoints
kubectl get endpoints -n sms

# Check ingress
kubectl describe ingress sms-ingress -n sms

# Test connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -n sms -- \
  wget -qO- http://sms-backend:5000/health
```

**Image pull errors:**
```bash
# Verify image exists in registry
docker images | grep sms

# Check image pull secret
kubectl get secrets -n sms

# Re-create if needed
kubectl create secret docker-registry regcred \
  --docker-server=docker.io \
  --docker-username=USERNAME \
  --docker-password=PASSWORD \
  -n sms --dry-run=client -o yaml | kubectl apply -f -
```

---

## PART 9: COST OPTIMIZATION

### Railway Optimization
- Use **Starter** instances for dev/test
- Enable **Auto-sleep** for non-critical services
- Monitor **Usage** dashboard
- Set **Spending limits**

### Kubernetes Optimization
- Use **spot/preemptible instances** (3-4x cheaper)
- Set **resource requests/limits** properly
- Implement **cluster autoscaling**
- Use **Reserved Instances** for base load

Example cost-optimized deployment:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sms-backend
spec:
  template:
    spec:
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            preference:
              matchExpressions:
              - key: cloud.google.com/gke-spot
                operator: In
                values:
                - "true"
      containers:
      - name: sms-backend
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

## PART 10: NEXT STEPS

1. ✅ Choose deployment strategy
2. ✅ Set up GitHub secrets
3. ✅ Deploy to Railway OR Kubernetes
4. ✅ Configure monitoring
5. ✅ Set up backups
6. ⬜ Configure DNS domain
7. ⬜ Set up SSL/TLS certificates
8. ⬜ Configure auto-scaling policies
9. ⬜ Set up alerting
10. ⬜ Document runbooks

---

## SUPPORT & RESOURCES

- **Railway Docs:** https://docs.railway.app
- **Kubernetes Docs:** https://kubernetes.io/docs
- **GitHub Actions:** https://docs.github.com/actions
- **Docker Hub:** https://docs.docker.com
- **Your Repo Issues:** https://github.com/your-repo/issues

## Quick Commands Reference

```bash
# Railway
railway login
railway project select
railway env
railway logs
railway up

# Kubernetes
kubectl config current-context
kubectl get pods -n sms
kubectl logs -f deployment/sms-backend -n sms
kubectl port-forward svc/sms-backend 5000:5000 -n sms
kubectl get events -n sms --sort-by='.lastTimestamp'

# GitHub CLI
gh secret set NAME --body "value"
gh secret list
gh workflow run railway-deploy.yml
```
