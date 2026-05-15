import client from 'prom-client';
import { config } from '../config';

export const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestErrors = new client.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export function initMetrics(): void {
  if (config.metricsEnabled) {
    register.setDefaultLabels({ app: 'sms-backend' });
  }
}
