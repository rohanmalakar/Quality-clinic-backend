import { Request as ExpressRequest } from 'express';

export interface Request extends ExpressRequest {
    userID?: number; 
    isAdmin?: boolean;
    file?: Express.Multer.File;
}
