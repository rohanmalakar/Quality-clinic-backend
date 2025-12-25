import multer from 'multer';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createHmac } from 'crypto';
import {
    AWS_ACCESS_KEY_ID,
    AWS_ENDPOINT_URL_S3,
    AWS_FILE_LOCATION,
    AWS_REGION,
    AWS_S3_BUCKET,
    AWS_SECRET_ACCESS_KEY,
    FILE_CREATION_SECRET_KEY,
} from "@utils/contants";
import { ERRORS } from '@utils/error';

// S3 Client Configuration
const s3Client = new S3Client({
    region: AWS_REGION!,
    endpoint: AWS_ENDPOINT_URL_S3!,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID!,
        secretAccessKey: AWS_SECRET_ACCESS_KEY!,
    },
});

// Multer Configuration
export const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max size
    },
});

// Helper function to create unique file names
function createFileName(num: number): string {
    const secret = FILE_CREATION_SECRET_KEY;
    const hash = createHmac('sha256', secret)
        .update(num.toString())
        .digest('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 16);
    return hash;
}

// Upload Service Class
export class UploadService {
    private s3: S3Client;
    private allowedMimeTypes: string[];
    private maxSizeInBytes: number;

    constructor() {
        this.s3 = s3Client;
        this.allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        this.maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    }

    /**
     * Validates file type and size
     */
    validateFile(file: Express.Multer.File): void {
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw ERRORS.INVALID_FILE_TYPE;
        }

        if (file.size > this.maxSizeInBytes) {
            throw new Error(`File size must be less than or equal to ${this.maxSizeInBytes / (1024 * 1024)}MB`);
        }
    }

    /**
     * Uploads a file to S3 and returns the URL
     * @param file - The multer file object
     * @param identifier - Unique identifier for the file name (user ID, timestamp, etc.)
     * @returns The URL of the uploaded file
     */
    async uploadToS3(file: Express.Multer.File, identifier: number): Promise<string> {
        // Validate file
        this.validateFile(file);

        const fileName = createFileName(identifier);
        const params = {
            Bucket: AWS_S3_BUCKET!,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        await this.s3.send(new PutObjectCommand(params));
        return `${AWS_FILE_LOCATION}/${fileName}`;
    }

    /**
     * Get S3 client instance
     */
    getS3Client(): S3Client {
        return this.s3;
    }
}
