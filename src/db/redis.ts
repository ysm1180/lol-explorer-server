import * as dotenv from 'dotenv';
import * as redis from 'redis';
dotenv.config();

interface IRedisOptions {
  password?: string;
  host?: string;
  port?: number;
}

export class Redis {
  private client: redis.RedisClient | undefined = undefined;

  private host: string;
  private port: number;
  private password: string;

  constructor(options: IRedisOptions) {
    this.host = options.host || '';
    this.port = options.port || 0;
    this.password = options.password || '';
  }

  public connect() {
    this.client = redis.createClient({
      host: this.host,
      port: this.port,
    });

    if (this.client && this.password) {
      this.client.auth(this.password);
    }
  }

  public get(key: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.client) {
        this.client.get(key, (err, value) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(value);
        });
      } else {
        resolve('');
      }
    });
  }

  public set(key: string, value: string, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client) {
        this.client.set(key, value, 'EX', duration, (err, ok) => {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

const redisOptions: IRedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
};

export default new Redis(redisOptions);
