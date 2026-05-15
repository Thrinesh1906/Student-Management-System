# Architecture

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Clients
        Browser[Web Browser]
    end

    subgraph Edge
        Nginx[Nginx Reverse Proxy]
    end

    subgraph Application
        FE[React Frontend]
        BE[Express API]
    end

    subgraph Data
        MongoDB[(MongoDB)]
        Redis[(Redis Cache)]
    end

    subgraph Observability
        Prometheus[Prometheus]
        Grafana[Grafana]
        Loki[Loki]
    end

    Browser --> Nginx
    Nginx --> FE
    Nginx --> BE
    BE --> MongoDB
    BE --> Redis
    BE --> Prometheus
    BE --> Loki
    Prometheus --> Grafana
    Loki --> Grafana
```

## Components

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React, TypeScript, Tailwind, Zustand | Role-based dashboards |
| API | Express, JWT, RBAC | REST business logic |
| Database | MongoDB | Persistent data |
| Cache | Redis | Sessions, caching |
| Proxy | Nginx | Load balancing, routing |
| Metrics | Prometheus + Grafana | API latency, errors, CPU |
| Logs | Loki + Promtail | Centralized logging |

## Microservice-Ready Design

The monolith is modularized into domain services (auth, students, subjects, enrollment, attendance, marks) with clear boundaries for future extraction.

## Deployment Targets

- **Local**: `docker-compose up`
- **Kubernetes**: Manifests + Helm charts
- **Cloud**: Terraform provisions AWS EKS + ALB
