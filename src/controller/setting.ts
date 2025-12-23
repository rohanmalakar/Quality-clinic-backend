import { verifyClient } from "@middleware/auth";
import { NextFunction, Router, Response } from "express";

import { Request } from '@customTypes/connection';
import { ERRORS } from "@utils/error";
import { z } from "zod";
import validateRequest from "@middleware/validaterequest";
import SettingService from '@services/setting';
import { successResponse } from "@utils/response";

var router = Router();

const settingService = new SettingService();

const SCHEMA = {
    UPDATE_SETTING: z.object({
        push_notification_enabled: z.boolean().optional(),
        email_notification_enabled: z.boolean().optional(),
        sms_notification_enabled: z.boolean().optional(),
        preferred_language: z.enum(['en', 'ar']).optional()
    })
}

router.get('/',
    verifyClient,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.userID) {
                next(ERRORS.AUTH_UNAUTHERISED);
            }
            const setting = await settingService.getSettingForUser(req.userID!!);
            res.send(successResponse(setting));
        } catch (e) {
            next(e)
        }
    }
)

router.put('/',
    verifyClient,
    validateRequest({
        body: SCHEMA.UPDATE_SETTING
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        const body: z.infer<typeof SCHEMA.UPDATE_SETTING> = req.body;
        try {
            if (!req.userID) {
                next(ERRORS.AUTH_UNAUTHERISED);
            }
            const setting = await settingService.updateSettingForUser(req.userID!!, body.email_notification_enabled, body.push_notification_enabled, body.sms_notification_enabled, body.preferred_language);
            res.send(successResponse(setting));
        } catch (e) {
            next(e)
        }
    }
)


export default router;