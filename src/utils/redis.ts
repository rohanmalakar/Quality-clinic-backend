import { createClient } from 'redis';

const redisClient = createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD || 'your_redis_password_here',
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

redisClient.connect();

export default redisClient;