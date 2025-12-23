import { Pool } from "mysql2/promise";
import { PayTabsService } from "@services/payment";
import pool from "@utils/db";
import { InitiatePaymentSchema } from "@schema/payment";
import { Router, Response, NextFunction } from "express";
import { verifyClient } from "@middleware/auth";
import { Request } from '@customTypes/connection';
import { ERRORS } from "@utils/error";
import { z } from "zod";
import validateRequest from "@middleware/validaterequest";
import { successResponse } from "@utils/response";

const router = Router();


// router.post("/initiate", verifyClient, validateRequest({ body: InitiatePaymentSchema }),
//     async (req: Request, res: Response, next: NextFunction) => {
//         const connection = await pool.getConnection();
//         try {
//             const userId = (req as any).userID as number;
//             const service = new PayTabsService(connection);

//             const result = await service.initiatePayment({
//                 user_id: userId,
//                 cart_id: req.body.cart_id,
//                 cart_amount: req.body.cart_amount,
//                 cart_currency: req.body.cart_currency,
//                 cart_description: req.body.cart_description,
//                 booking_ids: req.body.booking_ids,
//                 service_ids: req.body.service_ids,
//                 redeemed_coupon_id: req.body.redeemed_coupon_id,
//                 redeemed_points: req.body.redeemed_points
//             });

//             res.status(200).json(result);
//         } catch (err: any) {
//             res.status(400).json({ error: true, message: err.message });
//         } finally {
//             connection.release();
//         }
//     }
// );


router.post(
    "/initiate",
    verifyClient,
    validateRequest({ body: InitiatePaymentSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
        const connection = await pool.getConnection();
        try {
            const userId = (req as any).userID as number;
            const service = new PayTabsService(connection);

            // Check duplicates by booking/service ids before creating the payment
            const bookingIds: number[] | undefined = req.body.booking_ids;
            const serviceIds: number[] | undefined = req.body.service_ids;

            // // If any already billed, respond 409 with helpful details
            // const duplicateInfo = await service.checkDuplicateBilling({
            //     booking_ids: bookingIds,
            //     service_ids: serviceIds
            // });

            // if (duplicateInfo.hasDuplicate) {
            //     return res.status(409).json({
            //     error: true,
            //     message: "One or more items are already billed in an active payment",
            //     details: duplicateInfo.duplicates // e.g., { booking_ids: [...], service_ids: [...] }
            //     });
            // }

            const result = await service.initiatePayment({
                user_id: userId,
                cart_id: req.body.cart_id,
                cart_amount: req.body.cart_amount,
                cart_currency: req.body.cart_currency,
                cart_description: req.body.cart_description,
                booking_ids: bookingIds,
                service_ids: serviceIds,
                redeemed_coupon_id: req.body.redeemed_coupon_id,
                redeemed_points: req.body.redeemed_points
            });

            res.status(200).json(result);
        } catch (err: any) {
            console.log(err.message);
            res.status(400).json({ error: true, message: err.message });
        } finally {
            connection.release();
        }
    }
);


// POST /payment/callback
router.post("/callback", async (req: Request, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    try {
        const service = new PayTabsService(connection);
        await service.handleCallback(req.body.cart_id, req.body.status);
        res.status(200).json({ message: "Callback processed" });
    } catch (err) {
        next(err);
    } finally {
        connection.release();
    }
});

// POST /payment/return
// return URL that PayTabs/ACS redirects to after 3DS or direct returns
router.post('/return', async (req, res) => {
    console.log("############",req.body);

  // Normalize and null-safe fields
    const cartId = req.body.cartId ?? req.body.cart_id ?? null;
    const tranRef = req.body.tranRef ?? req.body.tran_ref ?? null;
    const respCode = req.body.respCode ?? req.body.response_code ?? null;
    const respMessage = req.body.respMessage ?? req.body.resp_message ?? null;
    const respStatus = (req.body.respStatus ?? req.body.status ?? '').toString().toUpperCase() || null;

    console.log("Status ::::: ",respStatus);
    
    // Build payment_result safely (no undefined)
    const paymentResult = {
        response_status: respStatus ?? (respCode === '309' ? 'D' : null) ?? 'D',
        response_message: respMessage ?? null,
        resp_code: respCode ?? null,
        tran_ref: tranRef ?? null,
        three_d_outcome: respCode === '309' ? 'not_available' : (req.body.three_d_status ?? null),
        is_3d_supported: respCode === '309' ? 0 : (req.body.is_3d ? 1 : null)
    };

    // persist using your service/repository; ensure DB binding uses null not undefined
    try {
        const conn = await pool.getConnection();
        const service = new PayTabsService(conn);
        await service.updatePaymentFromReturn(cartId, {
            tran_ref: tranRef ?? null,
            payment_result: paymentResult,
            cart_amount: req.body.cart_amount ?? null,
            cart_currency: req.body.cart_currency ?? null,
            respMessage: respMessage ?? null,
            raw_payload: JSON.stringify(req.body)
        });

        // If 309, show user friendly message page; otherwise show status
        const humanStatus = respCode === '309' ? '3D Secure not available for this card' : (paymentResult.response_status === 'A' ? 'paid' : 'failed');

        res.status(200).send(`
            <html><body>
            <h1>Payment ${humanStatus}</h1>
            <p>TranRef: ${tranRef}</p>
            <p>Message: ${respMessage ?? 'N/A'}</p>
            </body></html>
        `);
    } catch (err) {
        console.error('Error updating payment return', err);
        res.status(500).send('Server error');
    }
});

export default router;
