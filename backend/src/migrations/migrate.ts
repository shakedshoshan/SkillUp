import { dbConfig } from '../config/db.config';
import { envConfig } from '../config/env.config';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

interface Migration {
  name: string;
  sql: string;
}

class MigrationRunner {
  private pgClient: Client | null = null;

  private async getPostgresClient(): Promise<Client> {
    if (!this.pgClient) {
      if (!envConfig.database.url) {
        throw new Error('DATABASE_URL environment variable is required for migrations');
      }

      // Use pooled connection if available, otherwise fall back to direct connection
      const connectionString = envConfig.database.pooled || envConfig.database.url;

      this.pgClient = new Client({
        connectionString: connectionString,
        ssl: {
          rejectUnauthorized: false
        },
        // Connection timeout and other settings
        connectionTimeoutMillis: 10000,
        query_timeout: 30000,
        statement_timeout: 30000,
      });

      try {
        await this.pgClient.connect();
        console.log('✅ PostgreSQL client connected successfully');
      } catch (error) {
        console.error('❌ Failed to connect to PostgreSQL:', error);
        throw error;
      }
    }
    return this.pgClient;
  }

  private async loadMigrations(): Promise<Migration[]> {
    const migrationsDir = __dirname;
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return files.map(file => ({
      name: file.replace('.sql', ''),
      sql: readFileSync(join(migrationsDir, file), 'utf8')
    }));
  }

  private async getExecutedMigrations(): Promise<string[]> {
    const client = await this.getPostgresClient();
    
    try {
      const result = await client.query(
        'SELECT migration_name FROM migration_history ORDER BY executed_at'
      );
      return result.rows.map(row => row.migration_name);
    } catch (error: any) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') { // relation does not exist
        console.log('Migration history table not found, will be created by first migration');
        return [];
      }
      throw error;
    }
  }

  private async executeMigration(migration: Migration): Promise<void> {
    const client = await this.getPostgresClient();
    
    console.log(`🔄 Executing migration: ${migration.name}`);
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // Execute the migration SQL
      await client.query(migration.sql);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log(`✅ Migration completed: ${migration.name}`);
    } catch (error) {
      // Rollback on error
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError);
      }
      console.error(`❌ Migration failed: ${migration.name}`, error);
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    try {
      console.log('🚀 Starting database migrations...');

      // Initialize Supabase connection first
      await dbConfig.connect();

      const migrations = await this.loadMigrations();
      const executedMigrations = await this.getExecutedMigrations();

      const pendingMigrations = migrations.filter(
        migration => !executedMigrations.includes(migration.name)
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations. Database is up to date!');
        return;
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migration(s):`);
      pendingMigrations.forEach(migration => {
        console.log(`   - ${migration.name}`);
      });

      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      console.log('🎉 All migrations completed successfully!');
      
      // Test Supabase connection after migrations
      const isHealthy = await dbConfig.healthCheck();
      if (isHealthy) {
        console.log('✅ Supabase connection verified after migrations');
      } else {
        console.warn('⚠️  Supabase connection check failed after migrations');
      }
      
    } catch (error) {
      console.error('💥 Migration process failed:', error);
      throw error;
    } finally {
      if (this.pgClient) {
        await this.pgClient.end();
      }
    }
  }

  async checkMigrationStatus(): Promise<void> {
    try {
      // Initialize Supabase connection
      await dbConfig.connect();
      
      const migrations = await this.loadMigrations();
      const executedMigrations = await this.getExecutedMigrations();

      console.log('\n📊 Migration Status:');
      console.log('─'.repeat(50));

      migrations.forEach(migration => {
        const isExecuted = executedMigrations.includes(migration.name);
        const status = isExecuted ? '✅ Executed' : '⏳ Pending';
        console.log(`${status} - ${migration.name}`);
      });

      const pendingCount = migrations.length - executedMigrations.length;
      console.log('─'.repeat(50));
      console.log(`Total: ${migrations.length} migrations, ${pendingCount} pending`);
      
      // Check Supabase health
      const isHealthy = await dbConfig.healthCheck();
      console.log(`Supabase Health: ${isHealthy ? '✅ Connected' : '❌ Connection Issues'}`);
      
    } catch (error) {
      console.error('Failed to check migration status:', error);
      throw error;
    } finally {
      if (this.pgClient) {
        await this.pgClient.end();
      }
    }
  }

  async rollback(migrationName?: string): Promise<void> {
    console.log('⚠️  Rollback functionality not implemented yet');
    console.log('For now, manually revert changes in Supabase dashboard if needed');
    console.log('Alternatively, create a new migration to revert changes');
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const migrationRunner = new MigrationRunner();

  try {
    switch (command) {
      case 'up':
        await migrationRunner.runMigrations();
        break;
      case 'status':
        await migrationRunner.checkMigrationStatus();
        break;
      case 'rollback':
        await migrationRunner.rollback(process.argv[3]);
        break;
      default:
        console.log('SkillUp Database Migration Tool');
        console.log('Usage:');
        console.log('  npm run migrate up       - Run pending migrations');
        console.log('  npm run migrate status   - Check migration status');
        console.log('  npm run migrate rollback [name] - Rollback migration');
        break;
    }
  } catch (error) {
    console.error('Migration script error:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Migration script error:', error);
    process.exit(1);
  });
}

export { MigrationRunner }; 