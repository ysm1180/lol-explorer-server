import * as console from 'console';
import * as redis from 'redis';
import { promisify } from 'util';

// redis
export const redisClient = redis.createClient({
  host: 'redis-17995.c1.ap-southeast-1-1.ec2.cloud.redislabs.com',
  port: 17995,
});

redisClient.on('connect', () => {
  console.log('Connected to redis server');
});

export const redisGetAsync = promisify(redisClient.get).bind(redisClient);
