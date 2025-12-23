import { verifyAdmin, verifyClient } from "@middleware/auth";
import { NextFunction, Router, Response } from "express";

import { Request } from '@customTypes/connection';
import { ERRORS } from "@utils/error";
import RedeemService from '@services/redeem';
import { z } from "zod";
import validateRequest from "@middleware/validaterequest";
import { successResponse } from "@utils/response";


var router = Router();


const redeemService = new RedeemService();

const SCHEMA = {
    REDEEM: z.object({
        booking_id: z.number(),
        service_id: z.number()
    })
}

router.post('/',
    verifyClient,
    validateRequest({
        body: SCHEMA.REDEEM
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.userID) {
                next(ERRORS.AUTH_UNAUTHERISED);
            }
            const body: z.infer<typeof SCHEMA.REDEEM> = req.body;
            const redeem = await redeemService.redeem(req.userID!!, body.booking_id, body.service_id);
            res.send(successResponse(redeem));
        } catch (e) {
            next(e)
        }
    }
)

router.get('/qpoint',
    verifyClient,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.userID) {
                next(ERRORS.AUTH_UNAUTHERISED);
            }
            const redeem = await redeemService.getQPoints(req.userID!!);
            res.send(successResponse(redeem));
        } catch (e) {
            next(e)
        }
    }
)


router.get('/user_list',
    verifyAdmin,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const redeem = await redeemService.getUserList()
            res.send(successResponse(redeem));
        } catch (e) {
            next(e)
        }
    }
)

router.get('/history',
    verifyAdmin,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const redeem = await redeemService.getAllRedeems()
            res.send(successResponse(redeem));
        } catch (e) {
            next(e)
        }
    }
)
export default router;
