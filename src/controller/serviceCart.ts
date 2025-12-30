import validateRequest from "@middleware/validaterequest";
import pool from "@utils/db";
import { verifyAdmin, verifyClient } from "@middleware/auth";
import ServiceCartService from "@services/serviceCart";
import { successResponse } from "@utils/response";
import { NextFunction, Response, Router } from "express";
import { Request } from "@customTypes/connection";
import z from 'zod';

// Zod schemas for validating request data for each API endpoint
const SCHEMA = {
    ADD_TO_CART: z.object({
        branch_id: z.number().int().positive("Branch ID must be a positive integer."),
        service_id: z.number().int().positive("Service ID must be a positive integer."),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
        vat_percentage: z.number().min(0, "VAT percentage cannot be negative."),
    }),
    UPDATE_CART_ITEM: z.object({
        id: z.number().int().positive("Cart item ID must be a positive integer."),
        branch_id: z.number().int().positive(),
        service_id: z.number().int().positive(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        vat_percentage: z.number().min(0),
    }),
    MOVE_TO_BOOKING: z.object({})
};

const router = Router();
const serviceCartService = new ServiceCartService();

// API 1: Add a new item to the user's service cart.
router.post('/add',
    verifyClient,
    validateRequest({ body: SCHEMA.ADD_TO_CART }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body;
            const newCartItem = await serviceCartService.createServiceCart(
                req.userID as number,
                body.branch_id,
                body.service_id,
                body.date,
                body.vat_percentage
            );
            res.status(201).send(successResponse(newCartItem, "Item added to cart successfully"));
        } catch (e) {
            next(e);
        }
    }
);

// API: Get ALL service cart items for ALL users with service details.
router.get('/all',
    verifyAdmin,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const allCartItems = await serviceCartService.getAllServiceCartsWithDetails();
            res.status(200).send(successResponse(allCartItems, "All cart items retrieved successfully"));
        } catch (e) {
            next(e);
        }
    }
);

// DEBUG API: Test auth token (keep this for future testing)
router.get('/debug-auth',
    verifyClient,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            res.status(200).send({
                success: true,
                user: {
                    id: req.userID,
                    isAdmin: req.isAdmin
                },
                message: "Auth token decoded successfully"
            });
        } catch (e) {
            next(e);
        }
    }
);

// API 2: Get service cart items for the authenticated user.
router.get('/my-cart',
    verifyClient,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            // Get cart items with service details
            const userCartItems = await serviceCartService.getServiceCartsByUser(req.userID as number);
            
            // Only return the processed cart items with service details
            res.status(200).send(successResponse(userCartItems, "User cart items retrieved successfully"));
        } catch (e) {
            console.error("Error in my-cart:", e);
            next(e);
        }
    }
);
// API 3: Update an existing item in the service cart.
router.patch('/update',
    verifyClient,
    validateRequest({ body: SCHEMA.UPDATE_CART_ITEM }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const body = req.body;
            const updatedCartItem = await serviceCartService.updateServiceCart(
                body.id,
                req.userID as number,
                body.branch_id,
                body.service_id,
                body.date,
                body.vat_percentage
            );
            res.status(200).send(successResponse(updatedCartItem, "Cart item updated successfully"));
        } catch (e) {
            next(e);
        }
    }
);

// API 4: Delete an item from the service cart by its ID.
router.delete('/:id',
    verifyClient,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const cartItemId = parseInt(id, 10);
            await serviceCartService.deleteServiceCart(cartItemId, req.userID as number);
            
            console.log('Successfully deleted cart item:', {
                cartItemId: id,
                userId: req.userID
            });

            res.status(200).send(successResponse({ id: cartItemId }, "Service cart item deleted successfully"));
        } catch (e) {
            console.error('Error deleting cart item:', {
                error: e,
                cartItemId: req.body.id,
                userId: req.userID
            });
            next(e);
        }
    }
);

// API 5: Move all items from a user's cart to a confirmed booking.
router.post('/checkout',
    verifyClient,
    validateRequest({ body: SCHEMA.MOVE_TO_BOOKING }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const newBookings = await serviceCartService.moveCartToBookingByUserId(req.userID as number);
            res.status(201).send(successResponse(newBookings, "All cart items successfully moved to bookings."));
        } catch (e) {
            next(e);
        }
    }
);

export default router;