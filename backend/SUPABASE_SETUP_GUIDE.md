# SkillUp Supabase Setup & Migration Guide

## 🚀 Quick Start

This guide will help you connect your SkillUp backend to your Supabase project and run the database migrations.

## 📋 Prerequisites

1. **Supabase Project**: You already have a project at `https://supabase.com/dashboard/project/moqygkmxepjepqxcbhhk`
2. **Node.js**: Ensure you have Node.js installed
3. **Environment Variables**: You'll need your Supabase credentials

## 🔧 Step 1: Environment Setup

### 1.1 Create Environment File

Create a `.env` file in the `backend` directory with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=https://moqygkmxepjepqxcbhhk.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database URL
DATABASE_URL=postgresql://postgres:[YOUR_DB_PASSWORD]@db.moqygkmxepjepqxcbhhk.supabase.co:5432/postgres
```

### 1.2 Get Your Supabase Credentials

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/moqygkmxepjepqxcbhhk/api
2. **Copy the following values**:
   - **Project URL** → Use as `SUPABASE_URL`
   - **anon public** → Use as `SUPABASE_ANON_KEY`
   - **service_role secret** → Use as `SUPABASE_SERVICE_ROLE_KEY`

3. **Get Database Password**:
   - Go to Settings → Database
   - Copy the connection string or reset password if needed
   - Update the `[YOUR_DB_PASSWORD]` in `DATABASE_URL`

## 🗄️ Step 2: Database Migration

### 2.1 Check Migration Status

First, check what migrations are available:

```bash
npm run migrate:status
```

### 2.2 Run Migrations

Execute all pending migrations:

```bash
npm run migrate:up
```

This will create all the necessary tables:
- ✅ `users` - User profiles and authentication
- ✅ `career_paths` - Available career paths
- ✅ `user_skills` - User skill tracking
- ✅ `user_learning_paths` - Personalized learning roadmaps
- ✅ `learning_items` - Individual learning tasks
- ✅ `resources` - Educational resources
- ✅ `mentors` - Mentor profiles
- ✅ `mentorship_requests` - Mentorship requests
- ✅ `mentorship_sessions` - Scheduled mentoring sessions
- ✅ `notifications` - User notifications
- ✅ `migration_history` - Migration tracking

### 2.3 Verify Migration Success

Check that all migrations completed successfully:

```bash
npm run migrate:status
```

You should see all migrations marked as ✅ Executed.

## 🏃‍♂️ Step 3: Start the Application

### 3.1 Start Development Server

```bash
npm run dev
```

### 3.2 Test the Connection

1. **Basic Health Check**: http://localhost:5000
2. **Database Health Check**: http://localhost:5000/health/db

You should see:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-01-03T..."
}
```

## 📡 Step 4: API Testing

### 4.1 Available Endpoints

- `GET /` - Basic health check
- `GET /health/db` - Database connectivity check
- `GET /api/v1` - API documentation placeholder

### 4.2 Test Database Operations

You can now use the Supabase client in your code:

```typescript
import { dbConfig } from './src/config/db.config';

// Get client
const supabase = dbConfig.getClient();

// Example: Query users
const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(10);
```

## 🔄 Migration Flow Explained

### Migration System Features

1. **Version Control**: Each migration has a timestamp-based name
2. **Idempotent**: Safe to run multiple times
3. **Transaction Safety**: Each migration runs in a transaction
4. **Progress Tracking**: Tracks which migrations have been executed
5. **Rollback Ready**: Foundation for future rollback functionality

### Adding New Migrations

1. Create a new SQL file in `src/migrations/`:
   ```
   002_add_new_feature.sql
   ```

2. Write your migration SQL:
   ```sql
   -- Add new table or modify existing ones
   CREATE TABLE IF NOT EXISTS new_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Record migration
   INSERT INTO migration_history (migration_name) 
   VALUES ('002_add_new_feature') 
   ON CONFLICT (migration_name) DO NOTHING;
   ```

3. Run the migration:
   ```bash
   npm run migrate:up
   ```

## 🛠️ Available Scripts

```bash
# Migration commands
npm run migrate          # Show help
npm run migrate:status   # Check migration status
npm run migrate:up       # Run pending migrations

# Development commands
npm run dev             # Start development server
npm run build           # Build for production
npm run start           # Start production server
```

## 🔐 Security Notes

1. **Environment Variables**: Never commit `.env` files to version control
2. **Service Role Key**: Keep your service role key secure - it has admin privileges
3. **Database Access**: The migration system uses the service role key for schema changes
4. **API Keys**: Rotate your API keys regularly

## 🐛 Troubleshooting

### Common Issues

**1. Connection Refused**
- Check your `DATABASE_URL` format
- Verify your database password
- Ensure Supabase project is active

**2. Migration Fails**
- Check the error message in the console
- Verify your service role key has proper permissions
- Ensure your database is accessible

**3. Table Already Exists**
- Migrations use `CREATE TABLE IF NOT EXISTS` - this is safe
- Check migration status to see what's already been executed

### Getting Help

1. Check the Supabase dashboard for connection status
2. Review the migration logs for specific error messages
3. Verify environment variables are correctly set
4. Test database connectivity using the health check endpoint

## 🎉 Next Steps

Once your database is set up and migrations are complete:

1. **Implement API Endpoints**: Add your business logic routes
2. **Add Authentication**: Integrate Supabase Auth
3. **Build Frontend Integration**: Connect your Next.js frontend
4. **Add Real-time Features**: Use Supabase real-time subscriptions
5. **Deploy**: Set up production environment

---

**Your Supabase project is now fully connected and ready for development! 🚀** 