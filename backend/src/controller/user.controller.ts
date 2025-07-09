import { Request, Response, NextFunction } from 'express';
import { dbConfig } from '../config/db.config';
import { asyncHandler } from '../middleware/error.middleware';
import { ValidationUtils } from '../utils/validation.utils';

export class UserController {

  // Get user by ID
  static getUserById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    // Validate required parameter and UUID format
    ValidationUtils.validateRequiredParam(id, 'User ID');
    ValidationUtils.validateUUID(id, 'User ID');

    const supabase = dbConfig.getClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // The error middleware will handle Supabase errors automatically
      throw error;
    }

    res.json({
      success: true,
      data: data
    });
  });
} 