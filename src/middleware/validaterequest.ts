
import { NextFunction, Response } from 'express';
import { ZodSchema } from 'zod';

import { Request } from '@customTypes/connection';
import { ERRORS } from '@utils/error';
import createLogger from '@utils/logger';
const logger = createLogger('@validateRequest')

export declare type RequestValidation = {
    params?: ZodSchema;
    query?: ZodSchema;
    body?: ZodSchema;
  };

const validateRequest = ({body, query, params}: RequestValidation) => (req: Request, res: Response, next: NextFunction) => {
    if(body) {
        const parsed = body.safeParse(req.body)
        if(!parsed.success) {
            logger.error(parsed.error)
            next(ERRORS.INVALID_REQUEST_BODY)
        }
    }
    if(query) {
        const parsed = query.safeParse(req.query)
        if(!parsed.success) {
            logger.error(parsed.error)
            next(ERRORS.INVALID_QUERY_PARAMETER)
        } 
    }
    next()
}

export default validateRequest;
