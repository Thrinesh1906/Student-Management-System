# How to Connect Backend & Frontend Services in Railway

## Overview

The frontend needs to know where the backend API is located. In Railway, you need to configure environment variables to establish this connection.

---

## Architecture

```
┌──────────────────────────────────────────┐
│         Railway Project                  │
│                                          │
│  ┌──────────────┐    ┌──────────────┐  │
│  │  Frontend    │    │  Backend     │  │
│  │  (Port 80)   │───→│  (Port 5000) │  │
│  │ sms-frontend │    │ sms-backend  │  │
│  └──────────────┘    └──────────────┘  │
│         ↑                                │
│         │                                │
│    Public Domain                         │
│  (your-domain.up.railway.app)           │
└──────────────────────────────────────────┘
```

---

## Step 1: Get Your Domain

### For Frontend Service

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **sms-frontend** service
3. Go to **Settings** tab
4. Click **Generate Domain** button
5. Copy the domain
   - Example: `sms-production-abc123.up.railway.app`

### For Backend Service (Optional)

1. Click **sms-backend** service
2. Go to **Settings** tab
3. Click **Generate Domain** button
4. Copy the domain
   - Example: `sms-api-xyz789.up.railway.app`

---

## Step 2: Configure Backend Environment Variables

The backend needs these variables set:

### In Railway Dashboard

1. Click **sms-backend** service
2. Go to **Variables** tab
3. Add or update these variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=${{ secrets.MONGO_URL }}
REDIS_URL=${{ secrets.REDIS_URL }}
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-secret-refresh-key
LOG_LEVEL=info
CORS_ORIGIN=https://YOUR-FRONTEND-DOMAIN.up.railway.app
```

**Important:** Replace `YOUR-FRONTEND-DOMAIN` with your actual frontend domain from Step 1.

Example:
```env
CORS_ORIGIN=https://sms-production-abc123.up.railway.app
```

---

## Step 3: Configure Frontend Environment Variables

The frontend needs to know where the backend API is:

### In Railway Dashboard

1. Click **sms-frontend** service
2. Go to **Variables** tab
3. Add or update these variables:

```env
VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api/v1
VITE_APP_NAME=SMS
```

**Two Options:**

### Option A: Use Backend's Public Domain (Recommended for clarity)

```env
VITE_API_URL=https://sms-api-xyz789.up.railway.app/api/v1
```

### Option B: Use Frontend's Domain with Nginx Reverse Proxy

```env
VITE_API_URL=https://YOUR-FRONTEND-DOMAIN.up.railway.app/api/v1
```

This requires Nginx to route `/api/*` to backend service (more complex).

---

## Step 4: Deploy and Test

### Deploy Changes

Push your code to trigger redeploy:

```bash
git add .
git commit -m "Configure Railway backend-frontend connection"
git push origin main
```

Or manually redeploy in Railway Dashboard:
- Click **sms-backend** → **Deployments** → **Redeploy**
- Click **sms-frontend** → **Deployments** → **Redeploy**

### Test the Connection

1. Open your browser to frontend domain:
   ```
   https://sms-production-abc123.up.railway.app
   ```

2. Open **Developer Tools** (F12) → **Console** tab

3. Try to login with:
   ```
   Email: admin@sms.local
   Password: Admin@123
   ```

4. Check console for errors:
   - ✅ No CORS errors → Connection working!
   - ❌ CORS error → Check CORS_ORIGIN variable
   - ❌ Network error → Check VITE_API_URL
   - ❌ 404 error → Check backend is running

---

## Step 5: Troubleshooting Connection Issues

### Issue 1: CORS Error in Console

**Error:** "Access to XMLHttpRequest blocked by CORS policy"

**Fix:**
1. Check CORS_ORIGIN in backend variables:
   ```bash
   railway variables | grep CORS_ORIGIN
   ```

2. Must match frontend domain exactly:
   - ✅ Correct: `https://sms-production-abc123.up.railway.app`
   - ❌ Wrong: `http://sms-production-abc123.up.railway.app` (missing https)
   - ❌ Wrong: `https://sms-production-abc123.up.railway.app/` (trailing slash)

3. Rebuild backend:
   ```bash
   railway up --detach
   ```

### Issue 2: Cannot Connect to API

**Error:** "Cannot connect to API" or network timeout

**Fix:**
1. Check VITE_API_URL in frontend variables:
   ```bash
   railway variables | grep VITE_API_URL
   ```

2. Test the URL in browser address bar:
   ```
   https://your-backend-domain.up.railway.app/api/v1/health
   ```

3. Should return:
   ```json
   {"status":"OK"}
   ```

4. If not working:
   - Is backend service running?
   - Check backend logs:
     ```bash
     railway logs -s sms-backend
     ```

### Issue 3: 404 Not Found

**Error:** "POST /auth/login 404 Not Found"

**Fix:**
1. Check backend is running:
   ```bash
   railway logs -s sms-backend | head -20
   ```

2. Verify API prefix is correct:
   - Backend serves routes at: `/api/v1`
   - Frontend calls: `{VITE_API_URL}/auth/login`
   - Total URL: `{VITE_API_URL}/api/v1/auth/login`

3. Check backend Routes:
   ```bash
   # Backend should have:
   # app.use('/api/v1/auth', authRoutes);
   ```

### Issue 4: 401 Unauthorized on Login

**Issue:** Login endpoint exists but returns 401

**Check:**
1. Is demo user seeded in database?
   ```bash
   railway logs -s sms-backend | grep -i "seed"
   ```

2. Try login with correct credentials:
   - Email: `admin@sms.local`
   - Password: `Admin@123`

3. Check database is connected:
   ```bash
   railway logs -s sms-backend | grep -i "mongodb\|connected"
   ```

---

## Complete Working Example

### Backend Variables (sms-backend service)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=${{ secrets.MONGO_URL }}
REDIS_URL=${{ secrets.REDIS_URL }}
JWT_SECRET=abcdef1234567890abcdef1234567890ab
JWT_REFRESH_SECRET=xyz1234567890xyz1234567890xyzab
LOG_LEVEL=info
CORS_ORIGIN=https://sms-frontend-production-xyz123.up.railway.app
```

### Frontend Variables (sms-frontend service)

```env
VITE_API_URL=https://sms-backend-production-abc789.up.railway.app/api/v1
VITE_APP_NAME=SMS
VITE_APP_VERSION=1.0.0
```

### Expected Flow

1. User opens frontend:
   ```
   https://sms-frontend-production-xyz123.up.railway.app
   ```

2. Frontend loads, shows login page

3. User enters credentials and submits

4. Frontend makes API call to:
   ```
   https://sms-backend-production-abc789.up.railway.app/api/v1/auth/login
   ```

5. Backend receives request, validates credentials

6. Backend responds with tokens (if valid)

7. Frontend stores tokens and redirects to dashboard

---

## Advanced: Using Nginx Reverse Proxy

If you want both frontend and backend on same domain:

### Frontend Domain
```
https://sms.yourdomain.com
```

### Routes via Nginx
```
https://sms.yourdomain.com/     → sms-frontend (Port 80)
https://sms.yourdomain.com/api/ → sms-backend (Port 5000)
```

### Configuration

**nginx.conf:**
```nginx
upstream frontend {
    server sms-frontend:80;
}

upstream backend {
    server sms-backend:5000;
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Frontend Environment:**
```env
VITE_API_URL=/api/v1
```

---

## Quick Checklist

- [ ] Frontend service has public domain generated
- [ ] Backend service has public domain generated (or use Nginx)
- [ ] CORS_ORIGIN in backend matches frontend domain exactly
- [ ] VITE_API_URL in frontend matches backend domain
- [ ] Both services are running (green checkmark in Dashboard)
- [ ] MongoDB and Redis services are running
- [ ] Demo user is seeded in database
- [ ] Test API health endpoint: `{VITE_API_URL}/health`
- [ ] Test login: check browser console for errors

---

## Testing Script

Run this to verify everything works:

```bash
# Test frontend is accessible
curl -I https://sms-frontend-domain.up.railway.app

# Test backend is accessible
curl https://sms-backend-domain.up.railway.app/api/v1/health

# Should return: {"status":"OK"}

# Test login endpoint
curl -X POST https://sms-backend-domain.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sms.local","password":"Admin@123"}'

# Should return tokens if user exists
```

---

## Summary

| Component | Configuration | Value |
|-----------|---|---|
| Frontend Domain | Generate in Settings | `https://sms-frontend-*.up.railway.app` |
| Backend Domain | Generate in Settings | `https://sms-backend-*.up.railway.app` |
| Backend CORS_ORIGIN | Variables | `https://sms-frontend-*.up.railway.app` |
| Frontend VITE_API_URL | Variables | `https://sms-backend-*.up.railway.app/api/v1` |
| MongoDB | Marketplace service | Auto-connected via ${{MONGO_URL}} |
| Redis | Marketplace service | Auto-connected via ${{REDIS_URL}} |

Once configured correctly, the login and all API calls will work seamlessly! ✅
