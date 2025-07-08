import { createClient, RedisClientType } from 'redis';
import { envConfig } from './env.config';

export class RedisConfig {
  private static instance: RedisConfig;
  private client: RedisClientType;
  private isConnected: boolean = false;

  private constructor() {
    if (!envConfig.redis.url) {
      throw new Error('❌ REDIS_URL is required for Redis Cloud connection');
    }

    // Create Redis client optimized for Redis Cloud
    this.client = createClient({
      url: envConfig.redis.url,
      socket: {
        reconnectStrategy: (retries) => {
          // Exponential backoff optimized for cloud environments
          return Math.min(retries * 100, 5000); // Max 5 second delay for cloud
        },
        connectTimeout: 10000, // 10 second timeout for cloud connections
      },
    });

    // Set up event listeners
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    this.client.on('ready', () => {
      console.log('Redis Client Ready');
      this.isConnected = true;
    });

    this.client.on('end', () => {
      console.log('Redis Client Disconnected');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('Redis Client Reconnecting...');
    });
  }

  public static getInstance(): RedisConfig {
    if (!RedisConfig.instance) {
      RedisConfig.instance = new RedisConfig();
    }
    return RedisConfig.instance;
  }

  public async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
        console.log('Redis connection established successfully');
      }
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
        console.log('Redis connection closed');
      }
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  public isClientConnected(): boolean {
    return this.isConnected;
  }

  // Graceful shutdown
  public async gracefulShutdown(): Promise<void> {
    try {
      console.log('Initiating Redis graceful shutdown...');
      await this.disconnect();
    } catch (error) {
      console.error('Error during Redis graceful shutdown:', error);
    }
  }
}

// Export singleton instance
export const redisConfig = RedisConfig.getInstance(); 