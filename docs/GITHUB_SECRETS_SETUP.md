# GitHub Secrets Setup for Railway & Kubernetes Deployment

## Overview

This guide shows how to securely configure GitHub Secrets needed for automated deployment.

---

## Prerequisites

- GitHub CLI installed: `brew install gh` or `choco install gh` (Windows)
- GitHub repository access
- Docker Hub account
- Kubernetes cluster credentials (if using K8s)

---

## Step 1: Generate Secure Secrets

Run these commands to generate secure random values:

```bash
# Generate JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Generate database passwords
MONGO_PASS=$(openssl rand -base64 16)
REDIS_PASS=$(openssl rand -base64 16)

# Print them (save in secure location)
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo "MONGO_PASS=$MONGO_PASS"
echo "REDIS_PASS=$REDIS_PASS"
```

⚠️ Save these values in a secure password manager!

---

## Step 2: Docker Hub Credentials

1. Go to [Docker Hub](https://hub.docker.com)
2. Login or create account
3. Go to **Settings** → **Security** → **Access Tokens**
4. Click **New Access Token**
5. Name it: `GitHub-Actions`
6. Grant: Read & Write
7. Copy the token

Store the token securely in GitHub:

```bash
gh secret set DOCKERHUB_USERNAME --body "your-docker-username"
gh secret set DOCKERHUB_TOKEN --body "your-docker-token"
```

Verify:
```bash
gh secret list
```

---

## Step 3: Database Credentials

For MongoDB and Redis credentials:

```bash
# MongoDB
gh secret set MONGODB_USERNAME --body "admin"
gh secret set MONGODB_PASSWORD --body "$(openssl rand -base64 16)"
gh secret set MONGODB_URI --body "mongodb://admin:password@mongodb:27017/sms?authSource=admin"

# Redis
gh secret set REDIS_PASSWORD --body "$(openssl rand -base64 16)"
gh secret set REDIS_URL --body "redis://:password@redis:6379"
```

**Note:** Update the URIs with actual host/port depending on deployment platform.

---

## Step 4: JWT Secrets

```bash
# Generate and store JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

gh secret set JWT_SECRET --body "$JWT_SECRET"
gh secret set JWT_REFRESH_SECRET --body "$JWT_REFRESH_SECRET"
```

---

## Step 5: Railway Secrets

### Get Railway Token

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click your **Account** (top-right)
3. Select **Settings**
4. Go to **API Tokens**
5. Click **Create Token**
6. Copy the token

### Store in GitHub

```bash
gh secret set RAILWAY_TOKEN --body "your-railway-token"
gh secret set RAILWAY_PROJECT_ID --body "your-project-id"
```

**Find Project ID:**
```bash
# In Railway Dashboard, project URL shows:
# https://railway.app/project/PROJECT_ID
# Copy that ID
```

---

## Step 6: Kubernetes Secrets

### For Kubernetes Deployment

1. Get your kubeconfig:
```bash
# This is usually at ~/.kube/config
cat ~/.kube/config
```

2. Encode it:
```bash
KUBE_CONFIG=$(cat ~/.kube/config | base64)
```

3. Store in GitHub:
```bash
gh secret set KUBE_CONFIG --body "$KUBE_CONFIG"
```

### Alternative: Multiple Contexts

If you have multiple clusters:

```bash
# Store each cluster separately
PROD_CONFIG=$(KUBECONFIG=~/.kube/prod-config kubectl config view --flatten | base64)
gh secret set KUBE_CONFIG_PROD --body "$PROD_CONFIG"

STAGING_CONFIG=$(KUBECONFIG=~/.kube/staging-config kubectl config view --flatten | base64)
gh secret set KUBE_CONFIG_STAGING --body "$STAGING_CONFIG"
```

---

## Step 7: Optional - Slack Notifications

For deployment notifications:

1. Create Slack Webhook:
   - Go to your Slack workspace
   - Create incoming webhook at [Slack API](https://api.slack.com/apps)
   - Copy webhook URL

2. Store in GitHub:
```bash
gh secret set SLACK_WEBHOOK --body "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

---

## Step 8: Optional - GitHub Token

For API access within workflows:

```bash
# Create personal access token
# Go to GitHub Settings → Developer Settings → Personal Access Tokens
# Generate new token with: repo, workflow scopes
# Copy token

gh secret set GITHUB_TOKEN --body "ghp_xxxxxxxxxxxx"
```

---

## Step 9: Verify All Secrets

```bash
# List all secrets (shows names only, not values)
gh secret list
```

Expected output:
```
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
JWT_SECRET
JWT_REFRESH_SECRET
MONGODB_URI
REDIS_URL
RAILWAY_TOKEN
RAILWAY_PROJECT_ID
KUBE_CONFIG
SLACK_WEBHOOK
```

---

## Step 10: Environment-Specific Secrets (Optional)

For different environments (dev, staging, prod):

```bash
# Development
gh secret set RAILWAY_TOKEN_DEV --body "dev-token"
gh secret set KUBE_CONFIG_DEV --body "dev-kubeconfig"

# Staging
gh secret set RAILWAY_TOKEN_STAGING --body "staging-token"
gh secret set KUBE_CONFIG_STAGING --body "staging-kubeconfig"

# Production
gh secret set RAILWAY_TOKEN_PROD --body "prod-token"
gh secret set KUBE_CONFIG_PROD --body "prod-kubeconfig"
```

Then use in workflows:
```yaml
env:
  RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN_PROD }}
```

---

## Security Best Practices

### Do's ✅
- ✅ Store secrets in GitHub Secrets, not in code
- ✅ Use unique, strong passwords for each service
- ✅ Rotate secrets regularly (monthly)
- ✅ Use different credentials per environment
- ✅ Limit secret permissions to minimum needed
- ✅ Use short-lived tokens when available

### Don'ts ❌
- ❌ Don't commit `.env` files to git
- ❌ Don't share secrets via email/chat
- ❌ Don't log secrets in CI/CD output
- ❌ Don't reuse secrets across environments
- ❌ Don't use the same password for all services
- ❌ Don't store secrets in plain text

---

## Secret Rotation

Rotate secrets every 30 days:

```bash
# Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# Update in GitHub
gh secret set JWT_SECRET --body "$NEW_SECRET"

# Update in application config
# Update in Kubernetes secrets (if K8s)
# Update in Railway variables (if Railway)

# Log the rotation
echo "Rotated JWT_SECRET on $(date)" >> SECURITY_LOG.md
```

---

## Troubleshooting

### Secret not accessible in workflow

Check workflow file uses correct syntax:
```yaml
env:
  MY_SECRET: ${{ secrets.MY_SECRET }}  # ✅ Correct
  # or
  MY_SECRET: ${{ env.MY_SECRET }}      # For env variables
```

### Secret leaked accidentally

If a secret is exposed:
```bash
# Immediately revoke it
# 1. Regenerate in source (Docker Hub, Railway, etc.)
# 2. Update GitHub secret: gh secret set NAME --body "new-value"
# 3. Rotate in all systems
# 4. Review access logs
# 5. Document in security log
```

### Workflow fails with secret-related errors

```bash
# Debug: Add secret to workflow temporarily (for testing)
- name: Debug
  run: echo "Testing secret access"

# Check secret syntax in workflow file
# Verify secret name spelling
# Confirm secret exists: gh secret list
# Check workflow file permissions
```

---

## Securely Sharing Credentials

When you need to share secrets with team members:

1. **Never share via email/Slack/chat**
2. **Use password manager sharing:**
   - 1Password Teams
   - Bitwarden Organization
   - LastPass Teams

3. **Share individual components only:**
   - Share Docker Hub username separately from token
   - Share Kubernetes config separately from secrets

4. **Document access in wiki (no actual values):**
   ```
   ✅ Document HOW to get secrets
   ❌ Don't document actual secret values
   ```

---

## Quick Reference

```bash
# List secrets
gh secret list

# Create secret
gh secret set NAME --body "value"

# Delete secret
gh secret delete NAME

# Update secret
gh secret set NAME --body "new-value"

# View secret in code (for testing only)
echo ${{ secrets.SECRET_NAME }}
```

---

## Next Steps

1. ✅ Generate all required secrets
2. ✅ Add to GitHub Secrets
3. ✅ Verify with `gh secret list`
4. ✅ Update workflow files with correct secret references
5. ✅ Test deployment
6. ✅ Document secret locations in team wiki
7. ✅ Set up monthly rotation reminder

---

## Support

- GitHub Secrets Docs: https://docs.github.com/actions/security-guides/encrypted-secrets
- Railway API: https://docs.railway.app/reference/api
- Docker Registry: https://docs.docker.com/engine/reference/commandline/login/
