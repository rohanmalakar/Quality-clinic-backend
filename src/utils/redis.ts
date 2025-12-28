import { createClient } from 'redis';

const redisClient = createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD || 'Z8sgldLAMU5cpMXejRVY1d8KVgHcpf6v',
    socket: {
        host: process.env.REDIS_HOST || 'redis-13532.c241.us-east-1-4.ec2.cloud.redislabs.com',
        port: parseInt(process.env.REDIS_PORT || '13532')
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

redisClient.connect();

export default redisClient;