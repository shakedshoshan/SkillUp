import { Request, Response } from 'express';
import { dbConfig } from '../config/db.config';
import { v4 as uuidv4 } from 'uuid';

export class UserController {

  // Get user by ID
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

      const supabase = dbConfig.getClient();
      
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
} 