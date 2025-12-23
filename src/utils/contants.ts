
import dotenv from 'dotenv';
dotenv.config();

export const PORT = 3002
export const JWT_AUTH_SECRET = process.env.JWT_AUTH_SECRET || '3f8a2e9b4c6d1f5e7a9b2c8d4e6f1a3c';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '3f8a2e9b4c6d1f5e7a9b2c8d4e6f1a3w';
export const JWT_AUTH_EXPIRATION = 60*60*24*7; // 1 week

export const IV_ENCRYPTION_SECRET = process.env.IV_ENCRYPTION_SECRET || '1f2e3d4c5b6a79888796a5b4c3d2e1f0';
export const REGISTRATION_ENCRYPTION_SECRET = process.env.REGISTRATION_ENCRYPTION_SECRET || '00112233445566778899aabbccddeeff00112233445566778899aabbccddeefe';

export const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || ''
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || ''
export const AWS_ENDPOINT_URL_S3 = process.env.AWS_ENDPOINT_URL_S3 || 'https://s3.eu-north-1.amazonaws.com'
export const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || 'quality-care-bucket-1'

export const AWS_FILE_LOCATION = process.env.AWS_FILE_LOCATION || 'https://quality-care-bucket-1.s3.eu-north-1.amazonaws.com' 

export const FILE_CREATION_SECRET_KEY = process.env.FILE_CREATION_SECRET_KEY || 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d'

export const SMS_PASSWORD = process.env.SMS_PASSWORD || ''
export const SMS_USER = process.env.SMS_USER || ''
export const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'ALJAWDAH'
export const SMS_TEMPLATE_ID = process.env.SMS_TEMPLATE_ID || '920004864'

export const MYSQL_DB_CONFIG_NEW = {
    'host': process.env.DB_HOST || 'localhost',
    'user': process.env.DB_USER || 'root',
    'password': process.env.DB_PASSWORD || '',
    'port': parseInt(process.env.DB_PORT || '3306'),
    'database': process.env.DB_NAME || 'qualitycare_db',
    'connection_limit':100
}