import { verifyAdmin, verifyClient } from "@middleware/auth";
import validateRequest from "@middleware/validaterequest";
import { NextFunction, Router, Response } from "express";
import { Request } from '@customTypes/connection';
import { z } from "zod";
import NotificationService from '@services/notification';
import { successResponse, successResponseWithZeroData } from "@utils/response";

var router = Router();

const notificationService = new NotificationService();

const SCHEMA = {
    CREATE_NOTIFICATION: z.object({
        message_en: z.string(),
        message_ar: z.string(),
        title_ar: z.string(),
        title_en: z.string(),
        scheduled_timestamp: z.string().datetime(),
    })
}

router.get('/',
    verifyClient,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const notifications = await notificationService.getNotifications();
            res.send(successResponse(notifications));
        } catch (e) {
            next(e)
        }
    }
)

router.get('/all',
    verifyClient,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const notifications = await notificationService.getAllNotifications();
            if(notifications.length === 0) {
                res.status(200).send(successResponseWithZeroData("No notifications found."));
                return;
            }
            res.send(successResponse(notifications));
        } catch (e) {
            next(e)
        }
    }
)

router.post('/',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.CREATE_NOTIFICATION
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const body: z.infer<typeof SCHEMA.CREATE_NOTIFICATION> = req.body;
            const scheduled_timestamp = new Date(body.scheduled_timestamp);
            const notification = await notificationService.createNotification(body.message_ar, body.message_en, body.title_ar, body.title_en, scheduled_timestamp);
            res.send(successResponse(notification));
        } catch (e) {
            next(e)
        }
    }
)


export default router;