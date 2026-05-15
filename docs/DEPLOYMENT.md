# Deployment Guide

## Docker Compose (Local / Demo)

```bash
docker-compose up -d --build
docker-compose --profile seed run --rm backend-seed
```

Access:
- App: http://localhost
- API Docs: http://localhost/api/docs
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

## Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

Or with Helm:

```bash
helm upgrade --install sms ./helm/student-mgmt -n sms --create-namespace
```

## AWS (Terraform)

```bash
cd terraform
terraform init
terraform plan
terraform apply
aws eks update-kubeconfig --name sms
kubectl apply -f ../k8s/
```

## Blue-Green / Canary

Use Argo Rollouts or Flagger with the Helm chart. ArgoCD application manifest: `k8s/argocd-application.yaml`.

## Rollback

```bash
kubectl rollout undo deployment/sms-backend -n sms
```
