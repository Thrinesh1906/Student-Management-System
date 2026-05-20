# DevOps-Driven Student Management System

A production-grade, full-stack Student Management System built as a **portfolio-level DevOps showcase** — featuring React, Node.js, MongoDB, Redis, Docker, Kubernetes, CI/CD, monitoring, and Infrastructure as Code.

## CI/CD Pipeline Status

[![Backend CI](https://github.com/Thrinesh1906/Student-Management-System/actions/workflows/backend-ci.yml/badge.svg?branch=main)](https://github.com/Thrinesh1906/Student-Management-System/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/Thrinesh1906/Student-Management-System/actions/workflows/frontend-ci.yml/badge.svg?branch=main)](https://github.com/Thrinesh1906/Student-Management-System/actions/workflows/frontend-ci.yml)
[![CD Pipeline](https://github.com/Thrinesh1906/Student-Management-System/actions/workflows/cd.yml/badge.svg?branch=main)](https://github.com/Thrinesh1906/Student-Management-System/actions/workflows/cd.yml)
[![PR Checks](https://github.com/Thrinesh1906/Student-Management-System/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/Thrinesh1906/Student-Management-System/actions/workflows/pr-checks.yml)

![Architecture](docs/ARCHITECTURE.md)

## Features

- **Authentication**: JWT + refresh tokens, RBAC (Admin, Teacher, Student)
- **Student Management**: CRUD, search, filter
- **Subjects & Enrollments**: Assign teachers/students, enrollment history
- **Attendance**: Mark attendance, analytics, CSV export, alerts
- **Marks**: Internal/exam marks, GPA, performance dashboards
- **Notifications**: Email (SMTP), optional SMS
- **Dashboards**: Role-specific analytics with charts

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React, TypeScript, Tailwind, Zustand, Recharts |
| Backend | Node.js, Express, TypeScript, Mongoose |
| Database | MongoDB |
| Cache | Redis |
| DevOps | Docker, K8s, Helm, Terraform, GitHub Actions |
| Monitoring | Prometheus, Grafana, Loki |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- (Optional) Node.js 20+ for local development

### Run with Docker Compose

```bash
# Clone and start all services
docker-compose up -d --build

# Seed demo data
docker-compose --profile seed run --rm backend-seed
```

Open **http://localhost** and login:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sms.local | Admin@123 |
| Teacher | teacher1@sms.local | Teacher@123 |
| Student | student1@sms.local | Student@123 |

### Makefile Commands

```bash
make docker-up    # Start all containers
make seed         # Seed database
make test         # Run all tests
make deploy       # Build + start + seed
make clean        # Tear down volumes
make k8s-deploy   # Deploy via Helm
```

## Project Structure

```
├── backend/          # Express API
├── frontend/         # React SPA
├── nginx/            # Reverse proxy config
├── k8s/              # Kubernetes manifests
├── helm/             # Helm charts
├── terraform/        # AWS EKS + VPC + ALB
├── monitoring/       # Prometheus & Grafana
├── logging/          # Loki & Promtail
├── .github/workflows # CI/CD pipelines
├── scripts/          # Backup & setup scripts
└── docs/             # Architecture & deployment guides
```

## API Documentation

- Swagger UI: http://localhost/api/docs
- Health: http://localhost/api/v1/../health → `GET /health`
- Metrics: http://localhost/metrics (Prometheus format)

## DevOps Highlights

### Git Workflow
- Branches: `main`, `develop`, `feature/*`
- Conventional Commits
- Semantic Versioning (`VERSION` file)

### CI/CD (GitHub Actions)
- **Backend CI**: lint, test, Trivy scan, Docker build
- **Frontend CI**: lint, test, production build
- **CD**: Push to Docker Hub, deploy to K8s, auto-rollback
- **PR Checks**: quality gates, coverage

### Monitoring
- Prometheus scrapes `/metrics` (request count, latency, errors)
- Grafana dashboards at port 3001
- Loki centralizes API and container logs

### Security
- Helmet.js, CORS, rate limiting
- bcrypt password hashing
- Input validation (express-validator)
- Secret management via K8s Secrets / env vars
- Trivy vulnerability scanning in CI

## Local Development

```bash
# Backend
cd backend && npm install && cp .env.example .env && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

## Kubernetes Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full instructions.

```bash
kubectl apply -f k8s/
# or
helm upgrade --install sms ./helm/student-mgmt -n sms --create-namespace
```

## Cloud Deployment (AWS)

```bash
cd terraform && terraform init && terraform apply
```

Provisions: VPC, EKS cluster, ALB, security groups.

## Testing

```bash
cd backend && npm test      # Jest + Supertest
cd frontend && npm test     # Vitest
```

## License

MIT — Built for portfolio, interviews, and DevOps demonstrations.
