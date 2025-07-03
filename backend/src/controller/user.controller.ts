import { Request, Response } from 'express';
import { dbConfig } from '../config/db.config';
import { v4 as uuidv4 } from 'uuid';

export class UserController {
  // Get all users
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const supabase = dbConfig.getClient();
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch users',
          message: error.message
        });
        return;
      }

      res.json({
        success: true,
        data: data || [],
        count: data?.length || 0
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

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

  // Create new user
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const {
        firebase_id,
        email,
        username,
        full_name,
        bio,
        tokens,
        skill_score,
        profile_picture_url,
      } = req.body;

      // Validate required fields
      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required'
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
        return;
      }

      const supabase = dbConfig.getClient();
      
      // Check if user with email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        res.status(500).json({
          success: false,
          error: 'Failed to check existing user',
          message: checkError.message
        });
        return;
      }

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
        return;
      }

      // Create new user
      const newUser = {
        id: uuidv4(),
        firebase_id: firebase_id || null,
        email,
        username: username || null,
        full_name: full_name || null,
        bio: bio || null,
        profile_picture_url: profile_picture_url || null,
        tokens: tokens || 0,
        skill_score: skill_score || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to create user',
          message: error.message
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: data,
        message: 'User created successfully'
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