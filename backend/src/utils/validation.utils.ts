import { ValidationError } from '../middleware/error.middleware';

// Common validation utilities
export class ValidationUtils {
  
  // Validate required parameter
  static validateRequiredParam(value: any, paramName: string): void {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new ValidationError(`${paramName} is required`);
    }
  }

  // Validate UUID format
  static validateUUID(value: string, paramName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new ValidationError(`${paramName} must be a valid UUID`);
    }
  }

  // Validate email format
  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  // Validate number parameter
  static validateNumber(value: any, paramName: string, min?: number, max?: number): number {
    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationError(`${paramName} must be a valid number`);
    }
    if (min !== undefined && num < min) {
      throw new ValidationError(`${paramName} must be at least ${min}`);
    }
    if (max !== undefined && num > max) {
      throw new ValidationError(`${paramName} must be at most ${max}`);
    }
    return num;
  }

  // Validate array parameter
  static validateArray(value: any, paramName: string, minLength?: number, maxLength?: number): any[] {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${paramName} must be an array`);
    }
    if (minLength !== undefined && value.length < minLength) {
      throw new ValidationError(`${paramName} must contain at least ${minLength} items`);
    }
    if (maxLength !== undefined && value.length > maxLength) {
      throw new ValidationError(`${paramName} must contain at most ${maxLength} items`);
    }
    return value;
  }

  // Validate string length
  static validateStringLength(value: string, paramName: string, minLength?: number, maxLength?: number): void {
    if (minLength !== undefined && value.length < minLength) {
      throw new ValidationError(`${paramName} must be at least ${minLength} characters long`);
    }
    if (maxLength !== undefined && value.length > maxLength) {
      throw new ValidationError(`${paramName} must be at most ${maxLength} characters long`);
    }
  }

  // Validate enum value
  static validateEnum(value: any, validValues: any[], paramName: string): void {
    if (!validValues.includes(value)) {
      throw new ValidationError(`${paramName} must be one of: ${validValues.join(', ')}`);
    }
  }

  // Sanitize input (remove dangerous characters)
  static sanitizeString(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/[<>]/g, '') // Remove HTML tags
      .trim();
  }

  // Parse pagination parameters
  static parsePagination(query: any): { page: number; limit: number; offset: number } {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10)); // Max 100 items per page
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
  }

  // Parse sorting parameters
  static parseSorting(query: any, allowedFields: string[]): { sortBy: string; sortOrder: 'asc' | 'desc' } {
    const sortBy = query.sortBy && allowedFields.includes(query.sortBy) ? query.sortBy : allowedFields[0];
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
    
    return { sortBy, sortOrder };
  }
} 