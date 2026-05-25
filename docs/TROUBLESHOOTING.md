# 🔧 Railway & Kubernetes Troubleshooting Guide

## Quick Diagnostics

### Railway
```bash
# Check logs
railway logs -s sms-backend

# Check environment
railway env

# Check service health
railway logs --raw | grep -i error
```

### Kubernetes
```bash
# Check pods
kubectl get pods -n sms

# Check events
kubectl get events -n sms

# Check services
kubectl get svc -n sms

# Check logs
kubectl logs -f deployment/sms-backend -n sms
```

---

## Railway Troubleshooting

### "Build Failed"

**Symptom:** GitHub Actions build completes but Railway shows build error

**Causes & Solutions:**

```bash
# 1. Check build logs in Railway Dashboard
Dashboard → Deployments → Failed Build → View Logs

# 2. Common Docker issues:
# ❌ Missing dependencies
# Fix: Add to package.json and rebuild

# ❌ Wrong Dockerfile path
# Fix: Verify file exists at correct location

# ❌ Port mismatch
# Fix: Ensure PORT env var matches Dockerfile EXPOSE

# 3. Fix and retry
git add .
git commit -m "fix: build issue"
git push origin main
```

### "Deploy Failed"

**Symptom:** Build succeeds, deployment fails

**Check:**

```bash
# 1. Environment variables
railway variables | grep -i "MONGODB\|REDIS"

# 2. Database connectivity
railway run mongosh $MONGO_URL
railway run redis-cli -u $REDIS_URL

# 3. Service dependencies
# Do MongoDB and Redis show "Running" in Dashboard?

# 4. Memory/CPU
# Dashboard → Service → Metrics → Check resource usage
```

### "No Domain/Can't Access App"

**Symptom:** App deployed but `https://service.up.railway.app` doesn't work

```bash
# 1. Generate domain
Dashboard → Service → Settings → Generate Domain

# 2. Update environment variables
railway variables set VITE_API_URL "https://your-domain.up.railway.app/api"

# 3. Rebuild to pick up new variables
railway up --detach

# 4. Wait for health check
# Service shows green checkmark = ready
```

### "Database Connection Refused"

**Symptom:** Application logs show "Cannot connect to MongoDB"

```bash
# 1. Check MongoDB service
Dashboard → MongoDB service → Health tab

# 2. Is MongoDB running?
# Should show "Running" not "Building" or "Failed"

# 3. Check connection string
railway variables
# Should show: MONGO_URL=mongodb+srv://...

# 4. Test connection
railway run mongosh $MONGO_URL
# If successful: "test> " prompt appears

# 5. If still failing:
# Delete MongoDB service
# Add fresh MongoDB from marketplace
# Reconfigure application
```

### "Out of Memory / OOM Killed"

**Symptom:** Service crashes with "OOMKilled" or memory errors

```bash
# 1. Check memory usage
Dashboard → Metrics → Memory usage graph

# 2. Increase instance type
Settings → Instance Type → Select larger tier

# 3. Check for memory leaks
# View logs for repeated allocations:
railway logs -s sms-backend | grep -i "memory\|heap"

# 4. Optimize code
# Check backend/src for unnecessary data structures
# Review for unhandled promises/callbacks
```

### "CORS Errors"

**Symptom:** Frontend throws "CORS policy" errors in browser console

```bash
# 1. Check CORS_ORIGIN variable
railway variables | grep CORS_ORIGIN

# 2. Should match frontend domain
# If frontend: https://sms-prod-xyz.up.railway.app
# Then CORS_ORIGIN should be: https://sms-prod-xyz.up.railway.app

# 3. Update if needed
railway variables set CORS_ORIGIN "https://your-frontend-domain"

# 4. Restart service
railway up --detach

# 5. Verify in browser
# Console should not show CORS errors
```

### "Stuck in Building State"

**Symptom:** Service shows "Building" for 30+ minutes

```bash
# 1. Check build logs
Dashboard → Deployments → View build logs

# 2. Look for stuck processes:
# - npm install taking too long?
# - Large file uploads?

# 3. Cancel and retry
Dashboard → Deployments → Cancel

# 4. Rebuild
railway up --detach

# 5. If still failing:
# Check Dockerfile for infinite loops
# Check package.json for problematic dependencies
git add .
git commit -m "fix: build optimization"
git push origin main
```

---

## Kubernetes Troubleshooting

### Pods Won't Start (Pending)

**Symptom:** `kubectl get pods -n sms` shows Pending

```bash
# 1. Describe pod to see reason
kubectl describe pod <pod-name> -n sms

# Look for:
# - "Insufficient cpu": Node doesn't have CPU capacity
# - "Insufficient memory": Node doesn't have memory
# - "PersistentVolumeClaim": Storage not available
# - "ImagePullBackOff": Can't pull Docker image

# 2. Fix resource issues
# Edit deployment:
kubectl edit deployment sms-backend -n sms

# Reduce resource requests:
resources:
  requests:
    memory: "256Mi"    # Lower from 512Mi
    cpu: "100m"        # Lower from 250m
  limits:
    memory: "512Mi"
    cpu: "500m"

# 3. Fix PVC issues
kubectl get pvc -n sms
# If not bound:
kubectl delete pvc sms-mongodb-pvc -n sms
kubectl apply -f k8s/mongodb-pvc.yaml -n sms

# 4. Fix image pull issues
kubectl get secrets -n sms
# If missing regcred:
kubectl create secret docker-registry regcred \
  --docker-server=docker.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_TOKEN \
  -n sms
```

### Pods Crashing (CrashLoopBackOff)

**Symptom:** Pod starts then immediately crashes

```bash
# 1. Check logs
kubectl logs <pod-name> -n sms
# Shows actual error message

# 2. Common causes:
# ❌ Missing environment variables
# ❌ Database connection failed
# ❌ Port already in use
# ❌ Application error

# 3. Get detailed pod info
kubectl describe pod <pod-name> -n sms
# Look for Last State → Reason → Message

# 4. Fix:
# - Check environment variables in ConfigMap/Secrets
# - Ensure database is running
# - Check application logs for errors

# 5. Restart pod
kubectl delete pod <pod-name> -n sms
# Will restart automatically
```

### Service Not Accessible

**Symptom:** Can't reach application via ingress URL

```bash
# 1. Check service exists
kubectl get svc -n sms
# Should show sms-frontend and sms-backend

# 2. Check endpoints
kubectl get endpoints -n sms
# Should show IPs for each service

# 3. If endpoints empty:
kubectl describe svc sms-frontend -n sms
# Check Selector matches pod labels

# 4. Check ingress
kubectl get ingress -n sms
kubectl describe ingress sms-ingress -n sms
# Should show backend services mapped to paths

# 5. Check ingress controller
kubectl get pods -n ingress-nginx
# Should show running ingress-nginx pods

# 6. Test connectivity directly
kubectl run -it --rm debug --image=busybox --restart=Never -n sms -- \
  wget -qO- http://sms-frontend:80/
# Should return HTML
```

### High Memory/CPU Usage

**Symptom:** Pods using excessive resources, HPA scaling out

```bash
# 1. Check current usage
kubectl top pods -n sms
kubectl top nodes

# 2. Identify heavy pods
kubectl top pods -n sms --sort-by=memory
kubectl top pods -n sms --sort-by=cpu

# 3. Check HPA status
kubectl describe hpa sms-backend-hpa -n sms

# 4. Common causes:
# ❌ Memory leak in application
# ❌ Inefficient database queries
# ❌ Stuck connections

# 5. View pod logs
kubectl logs <heavy-pod> -n sms | tail -100

# 6. Check HPA configuration
kubectl get hpa -n sms -o yaml
# Adjust cpu/memory thresholds if needed

# 7. Optimize application:
# - Profile code for leaks
# - Optimize queries
# - Increase resource limits if needed
```

### Pods Keep Getting Evicted

**Symptom:** Pods scale up, then get evicted by kubelet

```bash
# 1. Check node conditions
kubectl describe node <node-name>
# Look for MemoryPressure, DiskPressure

# 2. Check node usage
kubectl top node <node-name>

# 3. Check which pods were evicted
kubectl describe pod <pod-name> -n sms
# Look for "Evicted" in Last State

# 4. Solutions:
# Option A: Add more nodes to cluster
# Option B: Reduce resource requests
# Option C: Remove unused pods/services

# 5. Prevent future evictions:
# Set resource requests to realistic values
kubectl edit deployment sms-backend -n sms
# Increase requests based on actual usage
```

### DNS/Network Issues

**Symptom:** "Cannot resolve service-name"

```bash
# 1. Check DNS
kubectl run -it --rm debug --image=busybox --restart=Never -n sms -- \
  nslookup sms-backend
# Should return service IP

# 2. Check service discovery
kubectl get svc -n sms
# Verify service name matches your requests

# 3. Test DNS from pod
kubectl exec -it <pod-name> -n sms -- \
  ping sms-mongodb
# Should get responses

# 4. Check network policies
kubectl get networkpolicies -n sms
# May be blocking traffic

# 5. Check CoreDNS
kubectl get pods -n kube-system | grep coredns
# Should show 2 running coredns pods

# 6. Restart CoreDNS if needed
kubectl rollout restart deployment/coredns -n kube-system
```

### Ingress/SSL Certificate Issues

**Symptom:** Connection refused, SSL errors, or invalid certificate

```bash
# 1. Check ingress status
kubectl get ingress -n sms
kubectl describe ingress sms-ingress -n sms

# 2. Check certificate
kubectl get certificate -n sms
kubectl describe certificate sms-tls-cert -n sms

# 3. Check cert-manager is installed
kubectl get pods -n cert-manager
# Should show cert-manager pods running

# 4. If cert fails to issue:
kubectl describe certificaterequest <name> -n sms

# 5. Common issues:
# ❌ DNS not configured (CNAME record missing)
# ❌ Ingress controller not installed
# ❌ cert-manager not installed

# 6. Fix:
# Set up DNS CNAME: sms.yourdomain.com → ingress-ip
# Ensure ingress-nginx is installed
# Ensure cert-manager is installed

# 7. Manually check certificate
echo | openssl s_client -servername sms.yourdomain.com \
  -connect sms.yourdomain.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

### Database Connection Timeout

**Symptom:** Pods get database connection timeout

```bash
# 1. Check MongoDB pod
kubectl get pods -l app=sms-mongodb -n sms
kubectl logs sms-mongodb-0 -n sms

# 2. Test MongoDB directly
kubectl run -it --rm debug --image=mongo:7.0 --restart=Never -n sms -- \
  mongosh mongodb://sms-mongodb:27017
# Should connect successfully

# 3. Check MongoDB service
kubectl get svc sms-mongodb -n sms
kubectl describe svc sms-mongodb -n sms

# 4. Check MongoDB PVC
kubectl get pvc -n sms | grep mongodb
# Should be "Bound"

# 5. If PVC not bound:
kubectl delete pvc sms-mongodb-pvc -n sms
kubectl apply -f k8s/mongodb-pvc.yaml -n sms

# 6. Check connection string in secrets
kubectl get secret sms-secrets -n sms -o yaml | grep mongodb

# 7. Restart MongoDB
kubectl delete statefulset sms-mongodb -n sms
kubectl apply -f k8s/mongodb.yaml -n sms
```

---

## GitHub Actions Troubleshooting

### Workflow Fails on Secret Access

**Symptom:** Workflow fails with "undefined" secrets

```bash
# 1. Check secrets exist
gh secret list

# 2. Check workflow syntax
# Should use: ${{ secrets.SECRET_NAME }}
# NOT: ${{ env.SECRET_NAME }} (different)

# 3. Verify secret is in env section or steps
# ✅ Correct:
env:
  MY_SECRET: ${{ secrets.MY_SECRET }}

# ❌ Wrong:
run: echo $MY_SECRET  # Will be empty

# 4. Verify step can access secrets
# Some actions have their own secret input:
uses: actions/some-action@v1
with:
  token: ${{ secrets.GITHUB_TOKEN }}
```

### Build Fails in GitHub Actions but Works Locally

**Symptom:** `docker build` succeeds locally but fails in Actions

```bash
# 1. Check runner OS
# GitHub Actions uses Linux (ubuntu-latest)
# Your machine might be Windows/Mac

# 2. Check Docker buildkit
# Enable: export DOCKER_BUILDKIT=1

# 3. Check for local-only files
# .dockerignore might exclude files in CI

# 4. Check dependencies
# npm ci (not npm install) should be used in CI

# 5. Check environment
# CI=true is set in GitHub Actions automatically
# Check for CI-specific code paths
```

### Deployment Fails After Build

**Symptom:** Docker image built successfully but deployment fails

```bash
# Check job logs in GitHub Actions:
# Repository → Actions → Failed workflow → View logs

# Common causes:
# ❌ Kube config invalid
# ❌ Docker registry credentials invalid
# ❌ Network connectivity issues

# 1. Test kube config
echo "$KUBE_CONFIG" | base64 -d > test-config
kubectl --kubeconfig=test-config get nodes

# 2. Test Docker credentials
echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin

# 3. Test image push
docker tag myapp myregistry/myapp:latest
docker push myregistry/myapp:latest
```

---

## Performance Troubleshooting

### Slow Response Times

**Symptom:** Requests taking 30+ seconds

```bash
# 1. Check application metrics
kubectl logs deployment/sms-backend -n sms | grep -i "duration\|latency"

# 2. Check database performance
kubectl exec -it deployment/sms-mongodb -n sms -- \
  mongosh --eval "db.serverStatus()" | grep -i "operationTime"

# 3. Profile application
# Add timing logs to backend code
console.time('database-query');
// database operation
console.timeEnd('database-query');

# 4. Check network latency
kubectl run -it --rm debug --image=busybox --restart=Never -n sms -- \
  ping sms-backend
# Look for RTT (round trip time)

# 5. Check resource constraints
kubectl top pods -n sms
# If CPU/memory maxed out, scale up
```

---

## Quick Fix Checklist

### Service Won't Start
- [ ] Check pod logs: `kubectl logs <pod>`
- [ ] Check pod description: `kubectl describe pod <pod>`
- [ ] Check environment variables
- [ ] Check resource availability
- [ ] Check database connectivity

### Can't Access Service
- [ ] Check service exists: `kubectl get svc`
- [ ] Check endpoints: `kubectl get endpoints`
- [ ] Check ingress: `kubectl get ingress`
- [ ] Check DNS resolution: `nslookup service-name`
- [ ] Check network policies

### Deployment Fails
- [ ] Check Docker image exists
- [ ] Check image pull credentials
- [ ] Check node capacity
- [ ] Check resource limits
- [ ] Check for conflicts with existing pods

---

## Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `ImagePullBackOff` | Can't pull image | Check credentials, image name, registry access |
| `CrashLoopBackOff` | App crashes immediately | Check logs, env vars, database connectivity |
| `Pending` | No resources available | Add nodes or reduce resource requests |
| `OOMKilled` | Out of memory | Increase memory limit or reduce usage |
| `Connection refused` | Service not running | Check pod status, restart if needed |
| `CORS error` | Wrong origin configured | Update CORS_ORIGIN env variable |
| `Failed to mount volume` | Storage issue | Check PVC status and binding |

---

## When All Else Fails

```bash
# Nuclear option: Delete and redeploy everything

# 1. Backup database
kubectl exec -it deployment/sms-mongodb -n sms -- \
  mongodump --out=/backups/emergency

# 2. Delete namespace (removes all resources)
kubectl delete namespace sms

# 3. Redeploy
kubectl apply -f k8s/

# 4. Restore database if needed
kubectl exec -it deployment/sms-mongodb -n sms -- \
  mongorestore /backups/emergency
```

⚠️ Use only as last resort!

---

## Getting Help

1. **Check logs first:** Most issues visible in logs
2. **Search documentation:** Solutions often documented
3. **Ask in communities:** Kubernetes Slack, Railway Discord
4. **Open issue:** Include logs, steps to reproduce, environment info

---

**Last Updated:** May 2026
