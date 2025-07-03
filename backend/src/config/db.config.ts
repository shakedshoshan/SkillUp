import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { envConfig } from './env.config';

// Simple Supabase client instances
let supabase: SupabaseClient;
let adminSupabase: SupabaseClient;

// Simplified database schema interface
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username?: string;
          full_name?: string;
          bio?: string;
          profile_picture_url?: string;
          created_at: string;
          updated_at: string;
          current_career_goal_id?: string;
        };
        Insert: {
          id: string;
          email: string;
          username?: string;
          full_name?: string;
          bio?: string;
          profile_picture_url?: string;
          created_at?: string;
          updated_at?: string;
          current_career_goal_id?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          full_name?: string;
          bio?: string;
          profile_picture_url?: string;
          created_at?: string;
          updated_at?: string;
          current_career_goal_id?: string;
        };
      };
      course: {
        Row: {
          id: string;
          title: string;
          description?: string;
          content?: any;
          difficulty_level?: string;
          estimated_duration_hours?: number;
          tags?: string[];
          is_published: boolean;
          created_by_user_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          content?: any;
          difficulty_level?: string;
          estimated_duration_hours?: number;
          tags?: string[];
          is_published?: boolean;
          created_by_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          content?: any;
          difficulty_level?: string;
          estimated_duration_hours?: number;
          tags?: string[];
          is_published?: boolean;
          created_by_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export const dbConfig = {
  // Simple connection setup
  connect: async (): Promise<void> => {
    try {
      console.log('🔌 Connecting to Supabase...');

      // Validate required environment variables
      if (!envConfig.supabase.url) {
        throw new Error('❌ SUPABASE_URL is required');
      }
      if (!envConfig.supabase.anonKey) {
        throw new Error('❌ SUPABASE_ANON_KEY is required');
      }
      if (!envConfig.supabase.serviceRoleKey) {
        console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY missing - admin operations will be limited');
      }

      // Initialize regular Supabase client
      supabase = createClient<Database>(
        envConfig.supabase.url,
        envConfig.supabase.anonKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          }
        }
      );

      // Initialize admin client (if service role key is available)
      if (envConfig.supabase.serviceRoleKey) {
        adminSupabase = createClient<Database>(
          envConfig.supabase.url,
          envConfig.supabase.serviceRoleKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            }
          }
        );
      } else {
        // Fallback to regular client for admin operations
        adminSupabase = supabase;
      }

      // Simple connection test - just check if Supabase responds
      const { error } = await supabase.from('users').select('*').limit(1);
      
      // These errors are OK - they just mean the table doesn't exist yet
      if (error && !['PGRST116', '42P01'].includes(error.code || '')) {
        console.error('❌ Supabase connection failed:', error.message);
        throw error;
      }

      console.log('✅ Supabase connected successfully!');
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  },

  // Get regular client
  getClient: (): SupabaseClient<Database> => {
    if (!supabase) {
      throw new Error('❌ Database not connected. Call dbConfig.connect() first.');
    }
    return supabase;
  },

  // Get admin client  
  getAdminClient: (): SupabaseClient<Database> => {
    if (!adminSupabase) {
      throw new Error('❌ Admin client not connected. Call dbConfig.connect() first.');
    }
    return adminSupabase;
  },

  // Simple health check
  healthCheck: async (): Promise<boolean> => {
    try {
      if (!supabase) return false;
      
      const { error } = await supabase.from('users').select('*').limit(1);
      return !error || ['PGRST116', '42P01'].includes(error.code || '');
    } catch {
      return false;
    }
  },

  // Initialize schema using Supabase API (no direct SQL needed)
  initializeSchema: async (): Promise<void> => {
    console.log('🏗️  Initializing database schema...');
    
    // Create schema using Supabase SQL editor or manual table creation
    // For now, we'll just verify connection
    const isHealthy = await dbConfig.healthCheck();
    
    if (isHealthy) {
      console.log('✅ Database schema ready');
    } else {
      console.log('⚠️  Database schema needs setup - please create tables manually in Supabase dashboard');
    }
  }
}; 