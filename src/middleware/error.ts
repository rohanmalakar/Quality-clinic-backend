import { NextFunction, Request, Response } from "express";

import createLogger from '@utils/logger';
import { ERRORS, RequestError } from "@utils/error";
const localLogger = createLogger('@error')

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    localLogger.error(err)
    if (err instanceof RequestError) {
        res.status(err.statusCode).send({
            success: false,
            error: {
                code: err.code,
                message: err.message
            }
        })
    } else {
        res.status(ERRORS.UNHANDLED_ERROR.statusCode).send({
            success: false,
            error: {
                code: ERRORS.UNHANDLED_ERROR.code,
                message: ERRORS.UNHANDLED_ERROR.message
            }
        })
    }
}
