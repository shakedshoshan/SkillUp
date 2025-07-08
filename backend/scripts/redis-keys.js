#!/usr/bin/env node

/**
 * Redis Keys Viewer
 * 
 * Lists and displays Redis cache keys with TTL and values
 * Focused on SkillUp cache patterns
 */

require('dotenv').config();
const { createClient } = require('redis');

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

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTTL(seconds) {
  if (seconds === -1) return 'No expiration';
  if (seconds === -2) return 'Key not found';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
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

async function listKeys(client, pattern = 'skillup:*') {
  console.log(colorize('🔑 SkillUp Redis Cache Keys', 'bold'));
  console.log(colorize('=' .repeat(50), 'cyan'));
  
  try {
    const keys = await client.keys(pattern);
    
    if (keys.length === 0) {
      console.log(colorize('📭 No cache keys found', 'yellow'));
      console.log(colorize(`   Pattern searched: ${pattern}`, 'dim'));
      return;
    }

    console.log(colorize(`📊 Found ${keys.length} cache keys\n`, 'green'));

    // Group keys by type
    const keyGroups = {
      courses: keys.filter(k => k.includes(':courses:')),
      users: keys.filter(k => k.includes(':user:')),
      other: keys.filter(k => !k.includes(':courses:') && !k.includes(':user:'))
    };

    for (const [groupName, groupKeys] of Object.entries(keyGroups)) {
      if (groupKeys.length === 0) continue;
      
      console.log(colorize(`\n📁 ${groupName.toUpperCase()} (${groupKeys.length} keys)`, 'cyan'));
      console.log(colorize('-'.repeat(30), 'dim'));
      
      for (const key of groupKeys.slice(0, 10)) { // Limit to first 10 keys per group
        try {
          const ttl = await client.ttl(key);
          const type = await client.type(key);
          const memory = await client.memoryUsage(key).catch(() => 0);
          
          console.log(colorize(`🔸 ${key}`, 'blue'));
          console.log(colorize(`   TTL: ${formatTTL(ttl)} | Type: ${type} | Size: ${formatBytes(memory)}`, 'dim'));
          
        } catch (error) {
          console.log(colorize(`🔸 ${key} (error: ${error.message})`, 'red'));
        }
      }
      
      if (groupKeys.length > 10) {
        console.log(colorize(`   ... and ${groupKeys.length - 10} more keys`, 'dim'));
      }
    }

  } catch (error) {
    console.error(colorize(`❌ Failed to list keys: ${error.message}`, 'red'));
  }
}

async function viewKey(client, keyName) {
  console.log(colorize(`\n🔍 Viewing key: ${keyName}`, 'cyan'));
  console.log(colorize('-'.repeat(50), 'dim'));
  
  try {
    const exists = await client.exists(keyName);
    if (!exists) {
      console.log(colorize('❌ Key not found', 'red'));
      return;
    }

    const ttl = await client.ttl(keyName);
    const type = await client.type(keyName);
    const memory = await client.memoryUsage(keyName).catch(() => 0);
    
    console.log(colorize(`📋 Key Info:`, 'yellow'));
    console.log(colorize(`   Type: ${type}`, 'blue'));
    console.log(colorize(`   TTL: ${formatTTL(ttl)}`, 'blue'));
    console.log(colorize(`   Memory: ${formatBytes(memory)}`, 'blue'));
    
    if (type === 'string') {
      const value = await client.get(keyName);
      console.log(colorize(`\n📄 Value:`, 'yellow'));
      
      try {
        // Try to parse as JSON for pretty formatting
        const jsonValue = JSON.parse(value);
        console.log(JSON.stringify(jsonValue, null, 2));
      } catch {
        // Not JSON, display as-is
        console.log(value);
      }
    } else {
      console.log(colorize(`\n⚠️  Complex type (${type}) - use Redis CLI for detailed view`, 'yellow'));
    }
    
  } catch (error) {
    console.error(colorize(`❌ Failed to view key: ${error.message}`, 'red'));
  }
}

async function showStats(client) {
  console.log(colorize('\n📊 Redis Cloud Statistics', 'cyan'));
  console.log(colorize('=' .repeat(30), 'dim'));
  
  try {
    const dbSize = await client.dbSize();
    const info = await client.info('memory');
    
    console.log(colorize(`🗄️  Total keys in database: ${dbSize}`, 'blue'));
    
    // Parse memory info
    const memoryLines = info.split('\r\n');
    for (const line of memoryLines) {
      if (line.startsWith('used_memory_human:')) {
        const memory = line.split(':')[1];
        console.log(colorize(`💾 Memory used: ${memory}`, 'blue'));
      }
    }
    
    // Count SkillUp keys
    const skillupKeys = await client.keys('skillup:*');
    console.log(colorize(`🎯 SkillUp cache keys: ${skillupKeys.length}`, 'green'));
    
  } catch (error) {
    console.error(colorize(`❌ Failed to get stats: ${error.message}`, 'red'));
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(colorize('\n🔑 Redis Keys Viewer', 'bold'));
    console.log(colorize('Usage: npm run redis:keys [options] [key-name]', 'blue'));
    console.log(colorize('\nOptions:', 'yellow'));
    console.log(colorize('  --help, -h     Show this help', 'blue'));
    console.log(colorize('  --stats, -s    Show Redis statistics', 'blue'));
    console.log(colorize('  --pattern, -p  Custom key pattern (default: skillup:*)', 'blue'));
    console.log(colorize('\nExamples:', 'yellow'));
    console.log(colorize('  npm run redis:keys                    # List all SkillUp keys', 'blue'));
    console.log(colorize('  npm run redis:keys --stats            # Show Redis stats', 'blue'));
    console.log(colorize('  npm run redis:keys skillup:courses:all # View specific key', 'blue'));
    console.log(colorize('  npm run redis:keys --pattern "*"      # List all keys', 'blue'));
    return;
  }

  let client;
  try {
    client = await connectToRedis();
    console.log(colorize('✅ Connected to Redis Cloud', 'green'));
    
    if (args.includes('--stats') || args.includes('-s')) {
      await showStats(client);
    } else if (args.length > 0 && !args[0].startsWith('--')) {
      // View specific key
      await viewKey(client, args[0]);
    } else {
      // List keys with optional pattern
      const patternIndex = args.indexOf('--pattern') || args.indexOf('-p');
      const pattern = patternIndex >= 0 && args[patternIndex + 1] ? args[patternIndex + 1] : 'skillup:*';
      await listKeys(client, pattern);
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