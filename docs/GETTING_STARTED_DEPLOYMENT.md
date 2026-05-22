# Quick Start Guide: Multi-Platform Deployment

Welcome! This guide will get you deploying to **Render**, **Railway**, and **Kubernetes** in minutes.

## 📋 Prerequisites

Before you begin, ensure you have:

- [ ] GitHub account with access to the repository
- [ ] Render account (https://render.com)
- [ ] Railway account (https://railway.app)
- [ ] Docker Hub account (for image registry)
- [ ] GitHub CLI installed: `brew install gh` (macOS) or follow [installation guide](https://cli.github.com/)

## 🚀 5-Minute Setup

### Step 1: Generate Secrets (2 minutes)

```bash
# Generate JWT secrets (use these in GitHub Secrets)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
```

### Step 2: Add GitHub Secrets (2 minutes)

```bash
# Login to GitHub CLI
gh auth login

# Add secrets one by one
gh secret set DOCKERHUB_USERNAME --body "your-docker-username"
gh secret set DOCKERHUB_TOKEN --body "your-docker-token"
gh secret set RENDER_API_TOKEN --body "your-render-api-token"
gh secret set RAILWAY_TOKEN --body "your-railway-token"
gh secret set JWT_SECRET --body "$JWT_SECRET"
gh secret set JWT_REFRESH_SECRET --body "$JWT_REFRESH_SECRET"
```

### Step 3: Deploy (1 minute)

```bash
# Make a small change to trigger CI/CD
git commit --allow-empty -m "chore: trigger deployment"
git push origin main

# Monitor deployment
# GitHub → Actions → Multi Platform Deploy
```

## 📚 Next Steps

### For Render Deployment
```
1. Go to https://render.com/dashboard
2. Connect your GitHub repository
3. Select render.yaml as the config file
4. Set environment variables from Step 1
5. Click "Deploy"
```

### For Railway Deployment
```
1. Go to https://railway.app/dashboard
2. Create new project → Import from GitHub
3. Select your repository
4. Railway auto-detects railway.json config
5. Set environment variables and deploy
```

### For Kubernetes Deployment
```
# If using self-hosted or cloud K8s cluster:
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
helm install sms ./helm/student-mgmt -n sms
```

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [MULTI_PLATFORM_DEPLOYMENT.md](MULTI_PLATFORM_DEPLOYMENT.md) | **Detailed deployment guide** |
| [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) | **Step-by-step secret setup** |
| [DEPLOYMENT_QUICK_REF.md](DEPLOYMENT_QUICK_REF.md) | **Quick reference & troubleshooting** |

## ✅ Verify Deployment

```bash
# Check all platforms status
./scripts/check-deployment-status.sh

# Expected output:
# ✓ Render Backend: available
# ✓ Railway Status: ...
# ✓ Kubernetes: 2/2 Running
```

## 🎯 Common Tasks

### View Logs

```bash
# Render
curl https://api.render.com/v1/services/$RENDER_SERVICE_ID/logs \
  -H "Authorization: Bearer $RENDER_API_TOKEN"

# Railway
railway logs --service backend --follow

# Kubernetes
kubectl logs deployment/sms-backend -n sms -f
```

### Deploy Specific Platform

```bash
# Use the deploy script
./scripts/deploy.sh render      # Deploy only to Render
./scripts/deploy.sh railway     # Deploy only to Railway
./scripts/deploy.sh kubernetes  # Deploy only to Kubernetes
./scripts/deploy.sh all         # Deploy to all platforms
```

### Rollback Deployment

```bash
# Render: Use dashboard or
curl -X POST https://api.render.com/v1/services/$RENDER_SERVICE_ID/rollback \
  -H "Authorization: Bearer $RENDER_API_TOKEN"

# Railway
railway deployments list
railway redeploy --deployment <deployment-id>

# Kubernetes
kubectl rollout undo deployment/sms-backend -n sms
```

## 🔧 Troubleshooting

### Deployment Fails

1. **Check GitHub Actions logs**
   ```
   GitHub → Actions → Multi Platform Deploy → Check failed job
   ```

2. **Verify secrets are set**
   ```bash
   gh secret list
   ```

3. **Check service health**
   ```bash
   ./scripts/check-deployment-status.sh
   ```

### Database Connection Error

```bash
# Verify connection string
echo $MONGODB_URI

# Test connection
mongosh "$MONGODB_URI" --eval "db.serverStatus()"
```

### Application Not Responding

```bash
# Check Render/Railway logs
# Check Kubernetes pod status
kubectl get pods -n sms
kubectl describe pod <pod-name> -n sms
```

For detailed troubleshooting, see [DEPLOYMENT_QUICK_REF.md](DEPLOYMENT_QUICK_REF.md)

## 🎓 Learning Path

1. **Start Here** → Read this file
2. **Setup Secrets** → Follow [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)
3. **Deploy First Platform** → Try Render or Railway
4. **Advanced Config** → Read [MULTI_PLATFORM_DEPLOYMENT.md](MULTI_PLATFORM_DEPLOYMENT.md)
5. **Daily Operations** → Bookmark [DEPLOYMENT_QUICK_REF.md](DEPLOYMENT_QUICK_REF.md)

## 📞 Support

| Issue | Resource |
|-------|----------|
| Render help | https://render.com/docs |
| Railway help | https://docs.railway.app |
| K8s help | https://kubernetes.io/docs |
| GitHub Actions | https://docs.github.com/actions |
| Docker | https://docs.docker.com |

## 🔐 Security Checklist

- [ ] All secrets added to GitHub
- [ ] JWT secrets are 32+ characters
- [ ] Docker Hub token has limited permissions
- [ ] `.env` files are in `.gitignore`
- [ ] Regular security scans enabled (Trivy)
- [ ] MongoDB credentials strong
- [ ] HTTPS enabled on all endpoints

---

**Ready to deploy?** 🚀

Start with Step 1 above or jump to [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) for detailed instructions.

Created: May 2026
Last Updated: May 23, 2026
