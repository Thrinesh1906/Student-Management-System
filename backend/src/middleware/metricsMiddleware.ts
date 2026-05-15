import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal, httpRequestErrors } from '../utils/metrics';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const route = req.route?.path || req.path;
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    const duration = Number(process.hrtime.bigint() - start) / 1e9;

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);

    if (res.statusCode >= 400) {
      httpRequestErrors.inc(labels);
    }
  });

  next();
};
