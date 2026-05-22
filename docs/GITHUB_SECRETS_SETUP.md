# GitHub Secrets Setup Guide

This guide helps you configure all required GitHub Secrets for multi-platform deployment.

## Step 1: Access GitHub Secrets

1. Go to your repository: https://github.com/Thrinesh1906/Student-Management-System
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

## Step 2: Add Each Secret

### Docker Hub Credentials

**`DOCKERHUB_USERNAME`**
- Value: Your Docker Hub username
- Find at: https://hub.docker.com/settings/general

**`DOCKERHUB_TOKEN`**
- Value: Your Docker Hub Personal Access Token
- Generate at: https://hub.docker.com/settings/security
- Click "New Access Token"
- Scopes: Read, Write, Delete

### Render Configuration

**`RENDER_API_TOKEN`**
- Go to: https://dashboard.render.com/account/api-tokens
- Click "Create API Token"
- Copy the token value

**`RENDER_SERVICE_ID`** (Optional)
- Find in Render Dashboard under your service
- Service Settings → API ID

### Railway Configuration

**`RAILWAY_TOKEN`**
- Go to: https://railway.app/account/tokens
- Click "Create New Token"
- Set appropriate permissions
- Copy token value

### Kubernetes Configuration

**`KUBECONFIG`** (If using K8s)
- Get your kubeconfig file
- Base64 encode it:
  ```bash
  cat ~/.kube/config | base64 | tr -d '\n'
  ```
- Paste the encoded value as secret

### Security & Notifications

**`SLACK_WEBHOOK`** (Optional)
- Create a Slack App: https://api.slack.com/apps
- Enable Incoming Webhooks
- Create a webhook for your channel
- Copy the webhook URL

### Application Secrets

**`JWT_SECRET`**
- Generate a 32+ character random string:
  ```bash
  openssl rand -base64 32
  ```
- **Keep this secure!** Do not share or commit.

**`JWT_REFRESH_SECRET`**
- Generate another 32+ character random string:
  ```bash
  openssl rand -base64 32
  ```

## Step 3: Verify Secrets

```bash
# List all secrets (GitHub CLI)
gh secret list

# Expected output:
# DOCKERHUB_USERNAME        *
# DOCKERHUB_TOKEN           *
# RENDER_API_TOKEN          *
# RAILWAY_TOKEN             *
# JWT_SECRET                *
# JWT_REFRESH_SECRET        *
```

## Step 4: Test Configuration

After adding all secrets:

1. Push a test commit to main branch
2. Check GitHub Actions → multi-platform-deploy workflow
3. Verify all deployment jobs complete successfully

## Troubleshooting Secrets

### Secret Not Found Error

```
Error: The secret RENDER_API_TOKEN is not defined
```

**Solution:**
- Verify secret name matches exactly (case-sensitive)
- Ensure secret is in repository secrets, not organization
- Check "Settings" → "Secrets and variables" → "Actions"

### Invalid Token Error

```
Error: Invalid API token provided
```

**Solution:**
- Regenerate the token
- Copy entire token without extra spaces
- Verify token has required permissions
- Check token hasn't expired

### Build Fails Silently

**Solution:**
- Add secrets in order listed above
- Don't skip optional secrets (some workflows depend on them)
- Run workflow again after adding all secrets

## Security Best Practices

✅ **DO:**
- Rotate secrets periodically
- Use strong, unique secrets (32+ chars)
- Limit token permissions to minimum needed
- Monitor secret usage in logs

❌ **DON'T:**
- Store secrets in .env files or committed code
- Share secrets via email or chat
- Use the same secret across environments
- Log or print secret values

## Regenerating Secrets

If a secret is compromised:

1. **Immediately revoke the old token** at its source
2. **Create a new token**
3. **Update GitHub secret** with new value
4. **Monitor deployments** for any issues

---

## Quick Reference

| Secret | Source | Regenerate Command |
|--------|--------|-------------------|
| DOCKERHUB_USERNAME | Docker Hub profile | N/A |
| DOCKERHUB_TOKEN | hub.docker.com/settings/security | Create new token |
| RENDER_API_TOKEN | dashboard.render.com/api-tokens | Create new token |
| RAILWAY_TOKEN | railway.app/account/tokens | Create new token |
| JWT_SECRET | Generated | `openssl rand -base64 32` |
| JWT_REFRESH_SECRET | Generated | `openssl rand -base64 32` |
| KUBECONFIG | Your cluster | `cat ~/.kube/config \| base64` |
| SLACK_WEBHOOK | Slack API | api.slack.com/apps |

---

Created: May 2026
Last Updated: May 23, 2026
