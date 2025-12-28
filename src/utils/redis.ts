import { createClient } from 'redis';

const redisClient = createClient({
    username: 'default',
    password: 'Z8sgldLAMU5cpMXejRVY1d8KVgHcpf6v',
    socket: {
        host: 'redis-13532.c241.us-east-1-4.ec2.cloud.redislabs.com',
        port: 13532
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

redisClient.connect();

export default redisClient;