# Railway.com Quick Start - 5 Minute Setup

## Option A: Railway Native (Easiest)

### 1. Sign Up
Go to [Railway.app](https://railway.app) and sign up with GitHub

### 2. Create Project
- Dashboard → New Project → Deploy from GitHub
- Select your Student Management System repository
- Authorize Railway

### 3. Add Services from Railway Marketplace
```
Click "Add"
↓
Search "MongoDB" → Add MongoDB 7.0
↓
Search "Redis" → Add Redis
↓
Search "PostgreSQL" (optional) or skip
```

### 4. Configure Your Repo Services
Railway auto-detects your Dockerfile:
- ✅ Backend (./backend/Dockerfile)
- ✅ Frontend (./frontend/Dockerfile)
- ✅ Nginx (./nginx/Dockerfile) - optional

### 5. Set Environment Variables

**For Backend Service:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=${{ MONGO_URL }}
REDIS_URL=${{ REDIS_URL }}
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-secret-refresh-key
LOG_LEVEL=info
VITE_API_URL=https://YOUR_DOMAIN.up.railway.app/api
```

**For Frontend Service:**
```env
VITE_API_URL=https://YOUR_DOMAIN.up.railway.app/api
VITE_APP_NAME=SMS
```

### 6. Generate Domain
- Frontend Service → Settings → **Generate Domain**
- Copy the domain (e.g., `sms-production-abc123.up.railway.app`)
- Update VITE_API_URL with this domain

### 7. Deploy
```bash
git push origin main
```
✅ Auto-deploys! Check Railway Dashboard for logs

### 8. Access App
```
Frontend: https://sms-production-abc123.up.railway.app
API Docs: https://sms-production-abc123.up.railway.app/api/docs
```

### 9. Login
```
Email:    admin@sms.local
Password: Admin@123
```

---

## Option B: Railway + Your Kubernetes Cluster

### 1-5. Follow Steps 1-5 from Option A

### 6. Create K8s Deployment Workflow

Create `.github/workflows/k8s-deploy.yml`:

```yaml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Build & push images
      - name: Build Backend
        run: docker build -t registry/sms-backend:${{ github.sha }} ./backend
      
      - name: Build Frontend
        run: docker build -t registry/sms-frontend:${{ github.sha }} ./frontend
      
      # Setup K8s
      - name: Setup Kubernetes
        env:
          KUBE_CONFIG: ${{ secrets.KUBE_CONFIG }}
        run: |
          mkdir -p $HOME/.kube
          echo "$KUBE_CONFIG" | base64 -d > $HOME/.kube/config
          kubectl apply -f k8s/
      
      # Update images
      - name: Update Deployments
        run: |
          kubectl set image deployment/sms-backend \
            sms-backend=registry/sms-backend:${{ github.sha }} \
            -n sms
          kubectl set image deployment/sms-frontend \
            sms-frontend=registry/sms-frontend:${{ github.sha }} \
            -n sms
          kubectl rollout status deployment/sms-backend -n sms
```

### 7. Add GitHub Secrets
```bash
# Store your kubeconfig
gh secret set KUBE_CONFIG --body "$(cat ~/.kube/config | base64)"

# Store image registry credentials
gh secret set REGISTRY_USERNAME --body "your-username"
gh secret set REGISTRY_PASSWORD --body "your-password"
```

### 8. Deploy to K8s
```bash
# Initial setup
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl create secret generic sms-secrets \
  --from-literal=mongodb-uri="mongodb://..." \
  --from-literal=redis-url="redis://..." \
  -n sms

# Deploy
kubectl apply -f k8s/

# Check status
kubectl get pods -n sms
```

### 9. Access App
```bash
# Get ingress URL
kubectl get ingress -n sms

# Or use port-forward for testing
kubectl port-forward svc/sms-backend 5000:5000 -n sms
# Visit: http://localhost:5000
```

---

## Comparison

| Feature | Railway Native | Railway + K8s |
|---------|------------------|---------------|
| Setup Time | ⚡ 5 min | ⏱️ 15 min |
| Complexity | 🟢 Simple | 🟡 Medium |
| Cost | 💰 $5-50/mo | 💰 $20-200/mo |
| Control | 📍 Limited | 📍 Full |
| Scaling | 🔄 Automatic | 🔄 Manual + HPA |
| Best For | Startups/Demo | Production |

---

## Verify Deployment

### Railway Native
```bash
# Check logs in Railway Dashboard
# or via CLI:
railway logs -s sms-backend

# Health check
curl https://YOUR_DOMAIN.up.railway.app/health
```

### K8s
```bash
# Check pods
kubectl get pods -n sms

# View logs
kubectl logs -f deployment/sms-backend -n sms

# Test access
kubectl port-forward svc/sms-backend 5000:5000 -n sms
curl http://localhost:5000/health
```

---

## Common Issues & Fixes

### "Build failed" on Railway
```
❌ Check: Dockerfile path correct? Dependencies installed?
✅ Fix: railway logs --failed
✅ Fix: Ensure Dockerfile exists at ./backend/Dockerfile
```

### "Connection refused" to MongoDB
```
❌ Check: MONGODB_URI environment variable set?
✅ Fix: Go to service → Variables → verify MONGO_URL
✅ Fix: MongoDB service running (check health in Railway)
```

### K8s pods not starting
```
❌ Check: Image pull errors?
✅ Fix: kubectl describe pod <name> -n sms
✅ Fix: kubectl get events -n sms
```

### Frontend can't reach API
```
❌ Check: VITE_API_URL correct?
✅ Fix: Rebuild frontend: docker build -t img ./frontend
✅ Fix: Check API domain in env variables
```

---

## Next: Monitoring & Backups

- [Set up Prometheus + Grafana](./docs/DEPLOYMENT.md)
- [Configure MongoDB backups](./scripts/backup-mongodb.sh)
- [Enable log aggregation](./logging/loki-config.yml)

## Support

- Railway Docs: https://docs.railway.app
- GitHub Issues: https://github.com/your-repo/issues
- Kubernetes: `kubectl get events -n sms`
