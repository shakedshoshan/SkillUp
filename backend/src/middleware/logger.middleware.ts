import { Request, Response, NextFunction } from 'express';
import { envConfig } from '../config/env.config';

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log the incoming request
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  // Log request body for non-GET requests (but sanitize sensitive data)
  if (req.method !== 'GET' && envConfig.nodeEnv === 'development') {
    const body = { ...req.body };
    
    // Sanitize sensitive fields
    if (body.password) body.password = '[HIDDEN]';
    if (body.token) body.token = '[HIDDEN]';
    if (body.secret) body.secret = '[HIDDEN]';
    
    console.log(`📋 Request Body:`, JSON.stringify(body, null, 2));
  }

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data: any) {
    const duration = Date.now() - start;
    const statusEmoji = res.statusCode >= 400 ? '❌' : '✅';
    
    console.log(`${statusEmoji} ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    // Log response data in development (but limit size)
    if (envConfig.nodeEnv === 'development' && data) {
      const responseStr = JSON.stringify(data);
      if (responseStr.length > 1000) {
        console.log(`📤 Response: [Large response ${responseStr.length} chars - truncated]`);
      } else {
        console.log(`📤 Response:`, JSON.stringify(data, null, 2));
      }
    }
    
    return originalJson.call(this, data);
  };

  next();
};

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Log slow requests
    if (duration > 1000) { // Slower than 1 second
      console.warn(`🐌 SLOW REQUEST: ${req.method} ${req.originalUrl} - ${duration.toFixed(2)}ms`);
    }
    
    // Log memory usage for monitoring
    if (envConfig.nodeEnv === 'development') {
      const memUsage = process.memoryUsage();
      console.log(`💾 Memory: RSS=${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap=${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    }
  });
  
  next();
}; 