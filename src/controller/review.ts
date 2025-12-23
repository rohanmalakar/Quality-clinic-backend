import { verifyAdmin, verifyClient } from "@middleware/auth";
import { NextFunction, Router, Response } from "express";

import { Request } from '@customTypes/connection';
import { ERRORS } from "@utils/error";
import { z } from "zod";
import validateRequest from "@middleware/validaterequest";
import ReviewService from "@services/review";
import { successResponse } from "@utils/response";


var router = Router();

const reviewService = new ReviewService();

const SCHEMA = {
    REVIEW_DETAILS: z.object({
        booking_id: z.number().min(1),
        type: z.enum(['SERVICE', 'DOCTOR']),
        review: z.string(),
        rating: z.number().min(1).max(5),
    }),
    REVIEW_COMMENT: z.object({
        comment: z.string().min(1),
        review_id: z.number().min(1)
    })
}

router.get('/',
    verifyAdmin,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.userID) {
                next(ERRORS.AUTH_UNAUTHERISED);
            }
            const reviews = await reviewService.getAllReviews();
            res.send(successResponse(reviews));
        } catch (e) {
            next(e)
        }
    }
)

router.get('/doctor/:doctor_id',
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const doctor_id = parseInt(req.params.doctor_id);
            const reviews = await reviewService.getAllReviewsForDoctor(doctor_id);
            res.send(successResponse(reviews));
        } catch (e) {
            next(e)
        }
    }
)

router.get('/service/:service_id',
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const service_id = parseInt(req.params.service_id);
            const reviews = await reviewService.getAllReviewsForService(service_id);
            res.send(successResponse(reviews));
        } catch (e) {
            next(e)
        }
    }
)

router.post('/',
    verifyClient,
    async function (req: Request, res: Response, next: NextFunction) {
        const body: z.infer<typeof SCHEMA.REVIEW_DETAILS> = req.body;
        try {
            if (!req.userID) {
                next(ERRORS.AUTH_UNAUTHERISED);
            }
            const review = await reviewService.createReview(req.userID!!, body.booking_id, body.rating, body.review, body.type);
            res.send(successResponse(review));
        } catch (e) {
            next(e)
        }
    }
)

router.post('/comment',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.REVIEW_COMMENT
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        const body: z.infer<typeof SCHEMA.REVIEW_COMMENT> = req.body;
        try {
            if (!req.userID) {
                next(ERRORS.AUTH_UNAUTHERISED);
            }
            const comment = await reviewService.createComment(body.review_id, body.comment);
            res.send(successResponse(comment));
        } catch (e) {
            next(e)
        }
    }
)

router.get('/comment/:review_id',
    verifyClient,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.userID) {
                next(ERRORS.AUTH_UNAUTHERISED);
            }
            const review_id = parseInt(req.params.review_id);
            const comment = await reviewService.getCommentForReview(review_id);
            res.send(successResponse(comment));
        } catch (e) {
            next(e)
        }
    }
)


export default router;
