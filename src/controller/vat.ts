import { verifyAdmin } from "@middleware/auth";
import { NextFunction, Router } from "express";
import { Response } from 'express';
import { Request } from '@customTypes/connection';

import z from 'zod';
import VatService from "@services/vat";
import { successResponse } from "@utils/response";
import validateRequest from "@middleware/validaterequest";

var router = Router();
const vatService = new VatService();


const SCHEMA = {
    UPDATE_VAT: z.object({
        vat: z.number().min(1)
    }),
}

router.put('/',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.UPDATE_VAT
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        const body: z.infer<typeof SCHEMA.UPDATE_VAT> = req.body
        try {
            const vat = await vatService.updateVat(body.vat);
            res.send(successResponse({ vat }));
        } catch (e) {
            next(e)
        }
    }
)

router.get('/',
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const vat = await vatService.getVat();
            res.send(successResponse({ vat }));
        } catch (e) {
            next(e)
        }
    })

export default router;

