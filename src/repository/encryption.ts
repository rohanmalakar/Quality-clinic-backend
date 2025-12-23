
import * as crypto from 'crypto';
import bcrypt from 'bcrypt';

import createLogger from "@utils/logger";
import { IV_ENCRYPTION_SECRET, REGISTRATION_ENCRYPTION_SECRET } from '@utils/contants';
import { ERRORS } from '@utils/error';

const logger = createLogger('@encryptionRepository')


export class EncryptionRepository {
  async encryptJSON(jsonObject: any): Promise<string> {
    try {
        const jsonString = JSON.stringify(jsonObject);
        //const iv = IV_ENCRYPTION_SECRET
	const iv = Buffer.from(IV_ENCRYPTION_SECRET, 'hex');
        const secretKey = Buffer.from(REGISTRATION_ENCRYPTION_SECRET, 'hex');
        const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
        let encrypted = cipher.update(jsonString, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted
      } catch (error) {
        logger.debug('Encryption error:', error);
        throw ERRORS.INTERNAL_SERVER_ERROR
      }
  }

  async decryptJSON(encryptedData: string): Promise<any> {
    try {
        //const iv = IV_ENCRYPTION_SECRET
	const iv = Buffer.from(IV_ENCRYPTION_SECRET, 'hex');
        const secretKey = Buffer.from(REGISTRATION_ENCRYPTION_SECRET, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, iv);
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
      } catch (error) {
        logger.debug('Decryption error:', error);
        throw ERRORS.INTERNAL_SERVER_ERROR
      }
  }

  async hashPassword (password: string): Promise<string> {
    const saltRounds = 10; // You can adjust this number to balance speed and security.
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (error) {
      throw new Error('Error hashing password');
    }
  };

  async comparePassword (password: string, hashedPassword: string): Promise<boolean> {
    try {
      const match = await bcrypt.compare(password, hashedPassword);
      return match;
    } catch (error) {
      throw new Error('Error comparing password');
    }
  };
}
