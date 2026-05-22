# Quick Reference: Multi-Platform Deployment

## Platform Comparison Matrix

| Feature | Render | Railway | Kubernetes |
|---------|--------|---------|-----------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Cost** | $$ | $ | $-$$$ |
| **Scalability** | Limited | Good | Excellent |
| **Control** | Low | Medium | High |
| **DevOps Overhead** | Minimal | Low | High |
| **Auto-scaling** | ✓ | ✓ | ✓ |
| **Database Included** | ✓ | ✓ | Manual |
| **Monitoring** | Basic | Good | DIY/Prometheus |
| **Free Tier** | No | Yes | No |

---

## Deployment Status Dashboard

Check deployment status across all platforms:

```bash
# Script to check all deployments
./scripts/check-deployment-status.sh
```

### Quick Commands

#### Render
```bash
# View latest deployment
curl https://api.render.com/v1/services/$(RENDER_SERVICE_ID) \
  -H "Authorization: Bearer $RENDER_API_TOKEN"

# Trigger manual deploy
curl -X POST https://api.render.com/v1/services/$(RENDER_SERVICE_ID)/deploys \
  -H "Authorization: Bearer $RENDER_API_TOKEN"
```

#### Railway
```bash
# Check status
railway status --environment production

# View logs
railway logs --service backend --tail 100

# Restart service
railway redeploy --service backend
```

#### Kubernetes
```bash
# View all services
kubectl get svc -n sms

# Check pod health
kubectl get pods -n sms -o wide

# View recent events
kubectl get events -n sms --sort-by='.lastTimestamp'
```

---

## Rollout Strategy

### Blue-Green Deployment

**For Production:**

1. **Deploy New Version (Green)**
   ```bash
   kubectl set image deployment/sms-backend \
     sms-backend=docker.io/sms-backend:v1.1.0 -n sms
   ```

2. **Test Green Environment**
   ```bash
   kubectl port-forward svc/sms-backend-green 5000:5000 -n sms
   ```

3. **Switch Traffic**
   ```bash
   kubectl patch service sms-backend -n sms \
     -p '{"spec":{"selector":{"version":"v1.1.0"}}}'
   ```

4. **Keep Blue for Rollback**
   ```bash
   # Immediately revert if needed
   kubectl patch service sms-backend -n sms \
     -p '{"spec":{"selector":{"version":"v1.0.0"}}}'
   ```

---

## Maintenance Checklist

### Weekly
- [ ] Check deployment logs for errors
- [ ] Review security scan results
- [ ] Monitor resource usage (CPU, memory)
- [ ] Verify backups completed successfully

### Monthly
- [ ] Update dependencies
- [ ] Review and update monitoring dashboards
- [ ] Test disaster recovery procedures
- [ ] Security audit

### Quarterly
- [ ] Performance optimization review
- [ ] Cost analysis and optimization
- [ ] Update documentation
- [ ] Plan major upgrades

---

## Emergency Procedures

### Application Down (All Platforms)

1. **Check service status**
   ```bash
   # Render: Dashboard → Service Status
   # Railway: railway status --environment production
   # K8s: kubectl get pods -n sms
   ```

2. **View error logs**
   ```bash
   # Platform-specific log commands above
   ```

3. **Attempt restart**
   ```bash
   # Render: Manual redeploy from dashboard
   # Railway: railway redeploy
   # K8s: kubectl rollout restart deployment/sms-backend -n sms
   ```

4. **Rollback if needed**
   ```bash
   # Use platform-specific rollback commands
   ```

5. **Notify team** via Slack webhook

### Database Connection Issue

```bash
# 1. Verify connection string
echo $MONGODB_URI

# 2. Test connectivity
mongosh "$MONGODB_URI" --eval "db.serverStatus()"

# 3. Check database service status
# Render: Check MongoDB service
# Railway: railway logs --service mongodb
# K8s: kubectl describe pod mongodb-0 -n sms

# 4. Restart service and clear cache
```

### Memory/CPU Issue

```bash
# 1. Check resource usage
kubectl top nodes
kubectl top pods -n sms

# 2. Increase resource limits
kubectl edit deployment sms-backend -n sms
# Increase memory/CPU limits

# 3. Scale replicas
kubectl scale deployment sms-backend --replicas=3 -n sms

# 4. Check for memory leaks
# View application logs for patterns
```

---

## Cost Optimization Tips

### Render
- Use shared database instances for non-production
- Enable auto-scale to reduce idle resources
- Use starter plan for development

### Railway
- Leverage free tier with development environment
- Monitor usage metrics regularly
- Archive old logs

### Kubernetes
- Use spot/preemptible instances
- Implement resource requests/limits properly
- Auto-scale based on metrics

---

## Monitoring & Alerting

### Key Metrics to Monitor

```
- Application Response Time: < 500ms (P95)
- Error Rate: < 0.1%
- CPU Usage: < 70%
- Memory Usage: < 80%
- Database Connection Pool: < 90% utilized
- Request Rate: Track for capacity planning
```

### Set Alerts For

- Deployment failures
- High error rates
- Resource exhaustion
- Database connection issues
- Certificate expiration (if applicable)

### Alerting Destinations

```
Slack: Deploy failures, critical errors
Email: Daily digest, weekly reports
PagerDuty: Critical issues requiring immediate attention
```

---

## Data Backup & Recovery

### Backup Schedule

| Database | Frequency | Retention |
|----------|-----------|-----------|
| MongoDB | Daily | 30 days |
| Logs | Weekly | 90 days |
| Configs | Per change | Infinite (Git) |

### Backup Commands

```bash
# MongoDB backup
mongoindump --uri "$MONGODB_URI" --archive > backup-$(date +%Y%m%d).archive

# Restore from backup
mongorestore --uri "$MONGODB_URI" --archive < backup-20240523.archive

# S3 backup (for production)
aws s3 cp backup-20240523.archive s3://sms-backups/
```

---

## Traffic Routing

### Load Balancing

**Render:** Automatic load balancing across instances

**Railway:** Automatic with service mesh

**Kubernetes:** Via Ingress controller
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sms-ingress
spec:
  rules:
  - host: sms.example.com
    http:
      paths:
      - path: /api
        backend:
          service:
            name: sms-backend
            port:
              number: 5000
```

---

## Documentation Files

| File | Purpose |
|------|---------|
| `MULTI_PLATFORM_DEPLOYMENT.md` | Detailed deployment guide |
| `GITHUB_SECRETS_SETUP.md` | Secret configuration steps |
| `DEPLOYMENT_QUICK_REF.md` | This file - quick commands |
| `render.yaml` | Render configuration |
| `railway.json` | Railway configuration |
| `k8s/` | Kubernetes manifests |
| `helm/` | Helm charts |

---

## Support Contacts

- **Render Support:** https://support.render.com
- **Railway Support:** https://railway.app/support
- **Kubernetes Help:** https://kubernetes.io/docs/tasks/debug-application-cluster/
- **Repository Issues:** GitHub Issues

---

Last Updated: May 23, 2026
