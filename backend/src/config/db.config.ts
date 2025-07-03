import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { envConfig } from './env.config';

// Supabase client instance
let supabase: SupabaseClient;

// Database schema interface for type safety
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
      // Add more table types as needed
    };
  };
}

export const dbConfig = {
  connect: async (): Promise<void> => {
    try {
      if (!envConfig.supabase.url || !envConfig.supabase.anonKey) {
        throw new Error('Supabase URL and Anon Key must be provided');
      }

      // Initialize Supabase client
      supabase = createClient<Database>(
        envConfig.supabase.url,
        envConfig.supabase.anonKey
      );

      // Test connection
      const { data, error } = await supabase
        .from('users')
        .select('count(*)')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" - expected before migration
        throw error;
      }

      console.log('✅ Supabase connection established successfully');
    } catch (error) {
      console.error('❌ Supabase connection error:', error);
      process.exit(1);
    }
  },

  // Get Supabase client instance
  getClient: (): SupabaseClient<Database> => {
    if (!supabase) {
      throw new Error('Database not initialized. Call dbConfig.connect() first.');
    }
    return supabase;
  },

  // Get admin client for privileged operations
  getAdminClient: (): SupabaseClient<Database> => {
    if (!envConfig.supabase.url || !envConfig.supabase.anonKey) {
      throw new Error('Supabase URL and Service Role Key must be provided for admin operations');
    }

    return createClient<Database>(
      envConfig.supabase.url,
      envConfig.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
}; 