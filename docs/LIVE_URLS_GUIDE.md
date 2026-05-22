# Live URLs Guide

This guide helps you access and configure your application using live URLs instead of localhost.

## 🌐 Your Live URLs

### **Render Deployment**

Once deployed to Render, your application is accessible at:

```
Frontend:       https://sms-frontend.onrender.com
Backend API:    https://sms-backend.onrender.com/api/v1
API Docs:       https://sms-backend.onrender.com/api/docs
Health Check:   https://sms-backend.onrender.com/health
Metrics:        https://sms-backend.onrender.com/metrics
```

### **Railway Deployment**

Once deployed to Railway, your application is accessible at:

```
Frontend:       https://<your-project>.railway.app
Backend API:    https://<your-project>.railway.app/api/v1
API Docs:       https://<your-project>.railway.app/api/docs
Health Check:   https://<your-project>.railway.app/health
Metrics:        https://<your-project>.railway.app/metrics
```

### **Local Development (for reference)**

```
Frontend:       http://localhost:3000
Backend API:    http://localhost:5000/api/v1
API Docs:       http://localhost:5000/api/docs
Health Check:   http://localhost:5000/health
```

---

## 📍 How to Find Your Live URLs

### Finding Render URLs

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **View your services:**
   - Click "sms-frontend" service
   - Copy the URL at the top (e.g., `https://sms-frontend.onrender.com`)
   - Do the same for "sms-backend"

### Finding Railway URLs

1. **Go to Railway Dashboard:** https://railway.app/dashboard
2. **Select your project**
3. **For each service:**
   - Click the service
   - Look for "Deployments" → "Domain"
   - Copy the public URL

---

## 🔗 Accessing Your Application

### Frontend Application

```bash
# Visit in your browser
https://sms-frontend.onrender.com

# Or for Railway (replace with your domain)
https://your-project.railway.app
```

### Backend API

```bash
# Health check
curl https://sms-backend.onrender.com/health

# API documentation
curl https://sms-backend.onrender.com/api/docs

# Example API call
curl -X GET https://sms-backend.onrender.com/api/v1/students \
  -H "Authorization: Bearer <your-token>"
```

### API Documentation (Swagger)

**Render:** https://sms-backend.onrender.com/api/docs
**Railway:** https://<your-railway-domain>/api/docs

---

## 🔧 Configuring Your Application to Use Live URLs

### Step 1: Environment Variables are Already Set

Your backend is already configured to use environment variables:

```typescript
// backend/src/config/index.ts
export const config = {
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  // ... other config
};
```

### Step 2: Set Environment Variables on the Platform

#### For Render:

Go to **Service Settings → Environment** and add:

```env
CORS_ORIGIN=https://sms-frontend.onrender.com
API_HOST=sms-backend.onrender.com
API_PROTOCOL=https
```

#### For Railway:

Go to **Variables** dashboard and add:

```env
CORS_ORIGIN=https://${{ RAILWAY_PUBLIC_DOMAIN }}
API_HOST=${{ RAILWAY_PUBLIC_DOMAIN }}
API_PROTOCOL=https
```

### Step 3: Update Frontend Configuration

Update your frontend environment files:

**`frontend/.env.render`:**
```env
VITE_API_URL=https://sms-backend.onrender.com/api/v1
```

**`frontend/.env.railway`:**
```env
VITE_API_URL=https://${{ RAILWAY_PUBLIC_DOMAIN }}/api/v1
```

### Step 4: Update Frontend Code

Ensure your frontend uses the environment variable:

```typescript
// src/api/client.ts (or similar)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});
```

---

## ✅ Testing Your Live URLs

### Quick Test with curl

```bash
# Test backend health
curl https://sms-backend.onrender.com/health

# Expected response:
# {"status":"ok","timestamp":"2024-05-23T...","uptime":1234}
```

### Test in Browser

1. **Visit frontend:** https://sms-frontend.onrender.com
2. **Open browser console** (F12 → Console tab)
3. **Look for any errors** related to API calls
4. **Check Network tab** for API request status
5. **Test login/authentication** to verify API connectivity

### Test with Postman

```
1. Create a request: GET
2. URL: https://sms-backend.onrender.com/api/v1/health
3. Send
4. Verify response is 200 OK
```

---

## 🔐 CORS & Security Configuration

### CORS Setup

Your backend handles CORS via environment variable:

```typescript
// backend/src/app.ts
app.use(
  cors({
    origin: config.corsOrigin.split(','),
    credentials: true,
  })
);
```

**Update CORS_ORIGIN to include your live URLs:**

```env
# For multiple origins (separated by comma)
CORS_ORIGIN=https://sms-frontend.onrender.com,https://sms-backend.onrender.com
```

### HTTPS Enforcement

All live URLs use HTTPS. Your backend is already configured:

```typescript
app.set('trust proxy', 1); // Important for HTTPS behind reverse proxy
```

---

## 🔄 Switching Between Environments

### Development (localhost)

```bash
# Terminal 1: Start backend
cd backend
npm install
npm start
# Runs on http://localhost:5000

# Terminal 2: Start frontend
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

**Frontend will use:** `VITE_API_URL=http://localhost:5000/api/v1`

### Production (Live URLs)

```bash
# Push to main branch
git commit -m "feat: update live URLs"
git push origin main

# GitHub Actions automatically deploys to:
# Render: https://sms-frontend.onrender.com
# Railway: https://<your-domain>
```

**Frontend will use:** Deployed environment files with live URLs

---

## 🧪 Testing Checklist

Before considering your live deployment complete:

```
API Connectivity:
- [ ] Backend health endpoint responds (https://sms-backend.onrender.com/health)
- [ ] Frontend can reach backend (check Network tab in browser)
- [ ] API documentation is accessible (https://sms-backend.onrender.com/api/docs)
- [ ] No CORS errors in browser console

Authentication:
- [ ] Login works with live backend
- [ ] JWT tokens are created and valid
- [ ] Refresh token mechanism works
- [ ] Logout clears tokens properly

Data Operations:
- [ ] Can fetch data from backend
- [ ] Can create new records
- [ ] Can update existing records
- [ ] Can delete records

Performance:
- [ ] API responses are fast (< 500ms)
- [ ] No timeout errors
- [ ] Database queries are efficient
- [ ] Static assets load quickly
```

---

## 🆘 Troubleshooting

### Issue: "Cannot reach backend" / Network Error

**Cause:** Backend service may still be deploying
**Solution:**
```bash
# Check backend health endpoint
curl -v https://sms-backend.onrender.com/health

# Check service logs
# Render: Dashboard → Service → Logs
# Railway: railway logs --service backend
```

### Issue: CORS Error in Browser Console

**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:**
1. Check CORS_ORIGIN is set correctly
2. Verify frontend URL matches CORS_ORIGIN
3. Restart backend service

```bash
# Check current CORS setting
kubectl get configmap sms-config -n sms -o yaml | grep CORS
```

### Issue: 404 Not Found

**Cause:** API URL is incorrect

**Solution:**
1. Verify API_BASE_URL in frontend env file
2. Check route exists in backend

```bash
# Test correct endpoint
curl https://sms-backend.onrender.com/api/v1/health
```

### Issue: SSL Certificate Error

**Cause:** Using http:// instead of https://

**Solution:**
```
All live URLs MUST use https://
Update any http:// references to https://
```

---

## 📊 Monitoring Your Live Application

### Check Service Status

```bash
# Render
curl https://api.render.com/v1/services/$RENDER_SERVICE_ID \
  -H "Authorization: Bearer $RENDER_API_TOKEN"

# Railway
railway status --environment production

# Kubernetes
kubectl get pods -n sms
```

### View Application Logs

```bash
# Render Dashboard → Service → Logs

# Railway
railway logs --service backend --follow

# Kubernetes
kubectl logs deployment/sms-backend -n sms -f
```

### Monitor Performance

```
Render:    Dashboard → Service → Metrics
Railway:   Project → Metrics
K8s:       Prometheus at http://localhost:9090 (port-forward)
```

---

## 🚀 Next Steps

1. **Verify your live URLs work** using the testing checklist above
2. **Share your live application** with others
3. **Monitor logs** for any errors
4. **Set up alerting** for production issues
5. **Configure custom domain** (optional):
   - Render: https://render.com/docs/custom-domains
   - Railway: https://docs.railway.app/deploy/expose-your-app

---

## Reference

| Platform | Frontend URL | Backend URL | Docs URL |
|----------|-------------|------------|----------|
| **Render** | https://sms-frontend.onrender.com | https://sms-backend.onrender.com | https://sms-backend.onrender.com/api/docs |
| **Railway** | https://<domain> | https://<domain> | https://<domain>/api/docs |
| **Local** | http://localhost:3000 | http://localhost:5000 | http://localhost:5000/api/docs |

---

Last Updated: May 23, 2026
