#!/usr/bin/env node

/**
 * Redis Cloud CLI Connection Script
 * 
 * Connects to Redis Cloud using REDIS_URL from .env file
 * Provides interactive Redis CLI session
 */

require('dotenv').config();
const { spawn } = require('child_process');
const { URL } = require('url');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function parseRedisUrl(redisUrl) {
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: url.port || 6379,
      password: url.password || null,
      username: url.username || 'default'
    };
  } catch (error) {
    throw new Error(`Invalid REDIS_URL: ${error.message}`);
  }
}

function connectToRedis() {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.error(colorize('❌ REDIS_URL not found in environment variables', 'red'));
    console.error(colorize('   Please check your .env file', 'yellow'));
    process.exit(1);
  }

  console.log(colorize('🔴 Connecting to Redis Cloud...', 'cyan'));
  console.log(colorize(`📡 URL: ${redisUrl.replace(/:([^:@]+)@/, ':****@')}`, 'blue'));

  try {
    const { host, port, password } = parseRedisUrl(redisUrl);
    
    // Build redis-cli command arguments
    const args = [
      '-h', host,
      '-p', port.toString()
    ];
    
    if (password) {
      args.push('-a', password);
    }

    console.log(colorize('\n🚀 Starting Redis CLI...', 'green'));
    console.log(colorize('💡 Useful commands:', 'yellow'));
    console.log(colorize('   KEYS skillup:*           - List all your cache keys', 'blue'));
    console.log(colorize('   GET skillup:courses:all  - View cached courses list', 'blue'));
    console.log(colorize('   TTL skillup:courses:*    - Check time to live', 'blue'));
    console.log(colorize('   FLUSHDB                  - Clear all cache (be careful!)', 'blue'));
    console.log(colorize('   QUIT                     - Exit Redis CLI', 'blue'));
    console.log(colorize('\n' + '='.repeat(50), 'cyan'));

    // Spawn redis-cli process
    const redisCli = spawn('npx', ['redis-cli', ...args], {
      stdio: 'inherit',
      shell: true
    });

    redisCli.on('error', (error) => {
      console.error(colorize(`❌ Failed to start Redis CLI: ${error.message}`, 'red'));
      console.error(colorize('   Make sure redis-cli is installed: npm install -g redis-cli', 'yellow'));
    });

    redisCli.on('close', (code) => {
      if (code === 0) {
        console.log(colorize('\n👋 Redis CLI session ended', 'green'));
      } else {
        console.error(colorize(`\n❌ Redis CLI exited with code ${code}`, 'red'));
      }
    });

  } catch (error) {
    console.error(colorize(`❌ Connection failed: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(colorize('\n\n👋 Goodbye!', 'yellow'));
  process.exit(0);
});

connectToRedis(); 