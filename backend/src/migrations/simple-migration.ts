import { dbConfig } from '../config/db.config';

// Simple SQL statements to create our schema
const SCHEMA_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    bio TEXT,
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create course table
CREATE TABLE IF NOT EXISTS course (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    content JSONB,
    difficulty_level TEXT,
    estimated_duration_hours INTEGER,
    tags TEXT[],
    is_published BOOLEAN DEFAULT FALSE,
    created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_course_created_by_user_id ON course(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_course_is_published ON course(is_published);
CREATE INDEX IF NOT EXISTS idx_course_difficulty_level ON course(difficulty_level);
`;

class SimpleMigration {
  async runSetup(): Promise<void> {
    try {
      console.log('🚀 Starting simple database setup...');
      
      // Connect to Supabase
      await dbConfig.connect();
      
      // Get admin client
      const adminClient = dbConfig.getAdminClient();
      
      // Execute schema creation using Supabase RPC
      console.log('📝 Creating database schema...');
      
      const { data, error } = await adminClient.rpc('exec_sql', {
        sql: SCHEMA_SQL
      });
      
      if (error) {
        // If RPC doesn't work, provide manual instructions
        console.log('ℹ️  RPC method not available. Please run this SQL manually in Supabase:');
        console.log('─'.repeat(50));
        console.log(SCHEMA_SQL);
        console.log('─'.repeat(50));
        console.log('👆 Copy this SQL and run it in your Supabase SQL Editor');
        console.log('🌐 Go to: https://app.supabase.com/project/moqygkmxepjepqxcbhhk/sql');
      } else {
        console.log('✅ Schema created successfully!');
      }
      
      // Test the setup
      await dbConfig.initializeSchema();
      
      console.log('🎉 Database setup complete!');
      
    } catch (error) {
      console.error('❌ Setup failed:', error);
      console.log('\n💡 Manual Setup Instructions:');
      console.log('1. Go to https://app.supabase.com/project/moqygkmxepjepqxcbhhk/sql');
      console.log('2. Copy and paste this SQL:');
      console.log('─'.repeat(50));
      console.log(SCHEMA_SQL);
      console.log('─'.repeat(50));
      throw error;
    }
  }

  async checkStatus(): Promise<void> {
    try {
      await dbConfig.connect();
      
      const client = dbConfig.getAdminClient();
      
      // Check if tables exist
      const { data: usersData, error: usersError } = await client
        .from('users')
        .select('*')
        .limit(1);
        
      const { data: courseData, error: courseError } = await client
        .from('course')
        .select('*')
        .limit(1);
      
      console.log('\n📊 Database Status:');
      console.log('─'.repeat(30));
      
      if (!usersError || usersError.code === 'PGRST116') {
        console.log('✅ Users table: Ready');
      } else {
        console.log('❌ Users table: Missing');
      }
      
      if (!courseError || courseError.code === 'PGRST116') {
        console.log('✅ Course table: Ready');
      } else {
        console.log('❌ Course table: Missing');
      }
      
      const isHealthy = await dbConfig.healthCheck();
      console.log(`📡 Connection: ${isHealthy ? '✅ Healthy' : '❌ Issues'}`);
      
    } catch (error) {
      console.error('❌ Status check failed:', error);
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const migration = new SimpleMigration();

  try {
    switch (command) {
      case 'setup':
        await migration.runSetup();
        break;
      case 'status':
        await migration.checkStatus();
        break;
      default:
        console.log('Simple SkillUp Database Tool');
        console.log('Usage:');
        console.log('  npm run db:setup  - Setup database schema');
        console.log('  npm run db:status - Check database status');
        break;
    }
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

export { SimpleMigration }; 