#!/usr/bin/env node

/**
 * Redis Cache Cleaner
 * 
 * Safely clears Redis cache with confirmation prompts
 * Supports selective clearing by pattern
 */

require('dotenv').config();
const { createClient } = require('redis');
const readline = require('readline');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function connectToRedis() {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.error(colorize('❌ REDIS_URL not found in environment variables', 'red'));
    process.exit(1);
  }

  const client = createClient({ url: redisUrl });
  
  client.on('error', (err) => {
    console.error(colorize(`❌ Redis Error: ${err.message}`, 'red'));
  });

  await client.connect();
  return client;
}

async function clearByPattern(client, pattern) {
  console.log(colorize(`🔍 Searching for keys matching: ${pattern}`, 'blue'));
  
  try {
    const keys = await client.keys(pattern);
    
    if (keys.length === 0) {
      console.log(colorize('📭 No keys found matching the pattern', 'yellow'));
      return;
    }

    console.log(colorize(`\n📋 Found ${keys.length} keys to delete:`, 'cyan'));
    
    // Show first 10 keys as preview
    keys.slice(0, 10).forEach((key, index) => {
      console.log(colorize(`   ${index + 1}. ${key}`, 'blue'));
    });
    
    if (keys.length > 10) {
      console.log(colorize(`   ... and ${keys.length - 10} more keys`, 'dim'));
    }

    const rl = createReadlineInterface();
    
    try {
      const confirm = await askQuestion(rl, 
        colorize(`\n⚠️  Delete ${keys.length} keys? (yes/no): `, 'yellow')
      );
      
      if (confirm === 'yes' || confirm === 'y') {
        console.log(colorize('\n🗑️  Deleting keys...', 'yellow'));
        
        const deletedCount = await client.del(keys);
        console.log(colorize(`✅ Deleted ${deletedCount} keys successfully`, 'green'));
        
      } else {
        console.log(colorize('❌ Operation cancelled', 'yellow'));
      }
      
    } finally {
      rl.close();
    }
    
  } catch (error) {
    console.error(colorize(`❌ Failed to clear keys: ${error.message}`, 'red'));
  }
}

async function clearAllSkillUpCache(client) {
  console.log(colorize('🧹 SkillUp Cache Cleaner', 'bold'));
  console.log(colorize('=' .repeat(40), 'cyan'));
  
  try {
    const patterns = [
      'skillup:courses:*',
      'skillup:user:*',
      'skillup:*'
    ];
    
    let totalKeys = 0;
    const keysByPattern = {};
    
    for (const pattern of patterns) {
      const keys = await client.keys(pattern);
      keysByPattern[pattern] = keys;
      totalKeys += keys.length;
    }
    
    if (totalKeys === 0) {
      console.log(colorize('📭 No SkillUp cache keys found', 'yellow'));
      return;
    }

    console.log(colorize(`📊 Cache Overview:`, 'blue'));
    for (const [pattern, keys] of Object.entries(keysByPattern)) {
      if (keys.length > 0) {
        console.log(colorize(`   ${pattern}: ${keys.length} keys`, 'blue'));
      }
    }
    console.log(colorize(`   Total: ${totalKeys} keys`, 'cyan'));

    const rl = createReadlineInterface();
    
    try {
      console.log(colorize('\n⚠️  WARNING: This will delete ALL SkillUp cache data!', 'red'));
      console.log(colorize('   Your application will need to rebuild cache from database.', 'yellow'));
      
      const confirm = await askQuestion(rl, 
        colorize(`\n🔥 Are you sure? Type 'DELETE ALL' to confirm: `, 'red')
      );
      
      if (confirm === 'delete all') {
        console.log(colorize('\n🗑️  Clearing all SkillUp cache...', 'yellow'));
        
        let totalDeleted = 0;
        for (const [pattern, keys] of Object.entries(keysByPattern)) {
          if (keys.length > 0) {
            const deleted = await client.del(keys);
            totalDeleted += deleted;
            console.log(colorize(`   Cleared ${pattern}: ${deleted} keys`, 'blue'));
          }
        }
        
        console.log(colorize(`\n✅ Successfully deleted ${totalDeleted} cache keys`, 'green'));
        console.log(colorize('🔄 Cache will be rebuilt on next API requests', 'blue'));
        
      } else {
        console.log(colorize('❌ Operation cancelled', 'yellow'));
      }
      
    } finally {
      rl.close();
    }
    
  } catch (error) {
    console.error(colorize(`❌ Failed to clear cache: ${error.message}`, 'red'));
  }
}

async function clearExpiredKeys(client) {
  console.log(colorize('🧹 Clearing Expired Keys', 'cyan'));
  
  try {
    const keys = await client.keys('skillup:*');
    let expiredCount = 0;
    
    for (const key of keys) {
      const ttl = await client.ttl(key);
      if (ttl === -2) { // Key doesn't exist (expired and removed)
        expiredCount++;
      }
    }
    
    if (expiredCount === 0) {
      console.log(colorize('✅ No expired keys found - Redis auto-cleanup is working', 'green'));
    } else {
      console.log(colorize(`🗑️  Found ${expiredCount} expired keys`, 'yellow'));
    }
    
    // Force expire keys with TTL < 60 seconds
    const soonExpiring = [];
    for (const key of keys) {
      const ttl = await client.ttl(key);
      if (ttl > 0 && ttl < 60) {
        soonExpiring.push(key);
      }
    }
    
    if (soonExpiring.length > 0) {
      console.log(colorize(`⏰ ${soonExpiring.length} keys expire in < 60 seconds`, 'blue'));
    }
    
  } catch (error) {
    console.error(colorize(`❌ Failed to check expired keys: ${error.message}`, 'red'));
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(colorize('\n🧹 Redis Cache Cleaner', 'bold'));
    console.log(colorize('Usage: npm run redis:clear [options]', 'blue'));
    console.log(colorize('\nOptions:', 'yellow'));
    console.log(colorize('  --help, -h           Show this help', 'blue'));
    console.log(colorize('  --pattern <pattern>  Clear keys matching pattern', 'blue'));
    console.log(colorize('  --all                Clear all SkillUp cache', 'blue'));
    console.log(colorize('  --expired            Check for expired keys', 'blue'));
    console.log(colorize('\nExamples:', 'yellow'));
    console.log(colorize('  npm run redis:clear --all                    # Clear all cache', 'blue'));
    console.log(colorize('  npm run redis:clear --pattern "skillup:courses:*" # Clear courses', 'blue'));
    console.log(colorize('  npm run redis:clear --expired                # Check expired keys', 'blue'));
    return;
  }

  let client;
  try {
    client = await connectToRedis();
    console.log(colorize('✅ Connected to Redis Cloud', 'green'));
    
    if (args.includes('--all')) {
      await clearAllSkillUpCache(client);
    } else if (args.includes('--expired')) {
      await clearExpiredKeys(client);
    } else if (args.includes('--pattern')) {
      const patternIndex = args.indexOf('--pattern');
      const pattern = args[patternIndex + 1] || 'skillup:*';
      await clearByPattern(client, pattern);
    } else {
      // Interactive mode
      console.log(colorize('🧹 Interactive Cache Cleaner', 'bold'));
      console.log(colorize('What would you like to clear?', 'blue'));
      console.log(colorize('1. All SkillUp cache', 'blue'));
      console.log(colorize('2. Course cache only', 'blue'));
      console.log(colorize('3. User cache only', 'blue'));
      console.log(colorize('4. Custom pattern', 'blue'));
      console.log(colorize('5. Check expired keys', 'blue'));
      
      const rl = createReadlineInterface();
      try {
        const choice = await askQuestion(rl, colorize('\nChoice (1-5): ', 'yellow'));
        
        switch (choice) {
          case '1':
            await clearAllSkillUpCache(client);
            break;
          case '2':
            await clearByPattern(client, 'skillup:courses:*');
            break;
          case '3':
            await clearByPattern(client, 'skillup:user:*');
            break;
          case '4':
            const pattern = await askQuestion(rl, colorize('Enter pattern: ', 'yellow'));
            await clearByPattern(client, pattern || 'skillup:*');
            break;
          case '5':
            await clearExpiredKeys(client);
            break;
          default:
            console.log(colorize('❌ Invalid choice', 'red'));
        }
      } finally {
        rl.close();
      }
    }
    
  } catch (error) {
    console.error(colorize(`❌ Error: ${error.message}`, 'red'));
    process.exit(1);
  } finally {
    if (client) {
      await client.quit();
      console.log(colorize('\n👋 Disconnected from Redis', 'dim'));
    }
  }
}

main(); 