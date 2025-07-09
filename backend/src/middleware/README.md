# Error Handling Middleware System

## Overview

This professional error handling system provides centralized error management, consistent response formats, and clean controller code. It includes custom error classes, automatic error catching, request logging, and performance monitoring.

## Features

- 🎯 **Custom Error Classes** - Specific error types for different scenarios
- 🔄 **Automatic Error Catching** - No more repetitive try-catch blocks
- 📊 **Consistent Response Format** - Standardized error responses
- 📝 **Request Logging** - Detailed request/response logging
- 🚀 **Performance Monitoring** - Track slow requests and memory usage
- 🛡️ **Security** - Prevents error details leaking in production
- 🧰 **Validation Utilities** - Common validation patterns

## Architecture

```
Request → Logger → Routes → Controllers → Validation → Database
    ↓                                           ↓
Response ← Error Handler ← Async Handler ← Throw Error
```

## Custom Error Classes

### Base Error Class
```typescript
import { AppError } from '../middleware/error.middleware';

// Generic application error
throw new AppError('Something went wrong', 500, 'GENERIC_ERROR');
```

### Specific Error Types

```typescript
import { 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  DatabaseError 
} from '../middleware/error.middleware';

// Validation errors (400)
throw new ValidationError('Email is required');
throw new ValidationError('Invalid email format');

// Not found errors (404)
throw new NotFoundError('User');
throw new NotFoundError('Course');

// Authentication errors (401)
throw new UnauthorizedError('Invalid credentials');
throw new UnauthorizedError(); // Uses default message

// Authorization errors (403)
throw new ForbiddenError('Access denied to this resource');
throw new ForbiddenError(); // Uses default message

// Database errors (500)
throw new DatabaseError('Failed to connect to database');
```

## Using AsyncHandler

The `asyncHandler` wrapper automatically catches async errors and passes them to the error middleware:

### Before (Old Way)
```typescript
static async getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

### After (New Way)
```typescript
static getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Validate parameters
  ValidationUtils.validateRequiredParam(id, 'User ID');
  ValidationUtils.validateUUID(id, 'User ID');

  const supabase = dbConfig.getClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error; // Error middleware handles Supabase errors automatically
  }

  res.json({
    success: true,
    data: data
  });
});
```

## Validation Utilities

Use the `ValidationUtils` class for common validation patterns:

```typescript
import { ValidationUtils } from '../utils/validation.utils';

// Validate required parameters
ValidationUtils.validateRequiredParam(req.params.id, 'User ID');
ValidationUtils.validateRequiredParam(req.body.email, 'Email');

// Validate data types
ValidationUtils.validateUUID(id, 'User ID');
ValidationUtils.validateEmail(email);
ValidationUtils.validateNumber(age, 'Age', 18, 120); // min: 18, max: 120

// Validate arrays
ValidationUtils.validateArray(tags, 'Tags', 1, 10); // min: 1, max: 10 items

// Validate string length
ValidationUtils.validateStringLength(password, 'Password', 8, 50);

// Validate enum values
ValidationUtils.validateEnum(status, ['active', 'inactive'], 'Status');

// Parse pagination
const { page, limit, offset } = ValidationUtils.parsePagination(req.query);

// Parse sorting
const { sortBy, sortOrder } = ValidationUtils.parseSorting(req.query, ['name', 'email', 'created_at']);
```

## Error Response Format

### Development Environment
```json
{
  "success": false,
  "error": "User not found",
  "status": "fail",
  "code": "NOT_FOUND",
  "stack": "Error: User not found\n    at...",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/users/123",
  "method": "GET"
}
```

### Production Environment
```json
{
  "success": false,
  "error": "User not found",
  "code": "NOT_FOUND",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Request Logging

The system automatically logs all requests with detailed information:

```
📥 2024-01-15T10:30:00.000Z - GET /api/v1/users/123 - IP: 127.0.0.1
📋 Request Body: { "email": "user@example.com" }
✅ 2024-01-15T10:30:00.500Z - GET /api/v1/users/123 - 200 - 500ms
📤 Response: { "success": true, "data": {...} }
```

### Performance Monitoring
```
🐌 SLOW REQUEST: GET /api/v1/courses/123 - 1250.50ms
💾 Memory: RSS=150MB, Heap=75MB
```

## Supabase Error Handling

The system automatically converts Supabase errors to appropriate HTTP responses:

| Supabase Code | HTTP Status | Error Type |
|---------------|-------------|------------|
| PGRST116 | 404 | NotFoundError |
| 23505 | 400 | ValidationError (Duplicate) |
| 23503 | 400 | ValidationError (Invalid Reference) |
| 42P01 | 500 | DatabaseError (Table not found) |

## Migration Guide

To migrate existing controllers:

1. **Import the necessary modules:**
```typescript
import { asyncHandler, ValidationError } from '../middleware/error.middleware';
import { ValidationUtils } from '../utils/validation.utils';
```

2. **Wrap controller methods with asyncHandler:**
```typescript
static methodName = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Controller logic
});
```

3. **Replace manual validation with ValidationUtils:**
```typescript
// Before
if (!id) {
  res.status(400).json({ error: 'ID required' });
  return;
}

// After
ValidationUtils.validateRequiredParam(id, 'ID');
```

4. **Replace manual error responses with thrown errors:**
```typescript
// Before
if (error) {
  res.status(500).json({ error: 'Database error' });
  return;
}

// After
if (error) {
  throw error; // Let middleware handle it
}
```

## Best Practices

1. **Always use asyncHandler** for async controller methods
2. **Use specific error classes** instead of generic Error
3. **Validate input early** using ValidationUtils
4. **Let the middleware handle responses** - just throw errors
5. **Don't catch errors manually** unless you need custom handling
6. **Use meaningful error messages** that help users understand the issue
7. **Keep controller methods focused** on business logic, not error handling

## Security Considerations

- Error details are hidden in production environment
- Sensitive data is sanitized from logs
- Stack traces are only shown in development
- Request bodies are logged only in development mode
- Sensitive fields (password, token, secret) are automatically hidden 