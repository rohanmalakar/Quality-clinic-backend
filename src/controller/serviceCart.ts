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
        time_slot_id: z.number().int().positive("Time Slot ID must be a positive integer."),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
        vat_percentage: z.number().min(0, "VAT percentage cannot be negative."),
    }),
    UPDATE_CART_ITEM: z.object({
        id: z.number().int().positive("Cart item ID must be a positive integer."),
        branch_id: z.number().int().positive(),
        service_id: z.number().int().positive(),
        time_slot_id: z.number().int().positive(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        vat_percentage: z.number().min(0),
    }),
    DELETE_CART_ITEM: z.object({
        id: z.number().int().positive("Cart item ID must be a positive integer."),
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
                body.time_slot_id,
                new Date(body.date),
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
            console.log("User ID from token:", req.userID);
            
            // Get cart items with service details
            const userCartItems = await serviceCartService.getServiceCartsByUser(req.userID as number);
            console.log("User cart from service:", userCartItems);
            
            // Only return the processed cart items with service details
            res.status(200).send(successResponse(userCartItems, "User cart items retrieved successfully"));
        } catch (e) {
            console.error("Error in my-cart:", e);
            next(e);
        }
    }
);
// API 3: Update an existing item in the service cart.
router.post('/update',
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
                body.time_slot_id,
                new Date(body.date),
                body.vat_percentage
            );
            res.status(200).send(successResponse(updatedCartItem, "Cart item updated successfully"));
        } catch (e) {
            next(e);
        }
    }
);

// API 4: Delete an item from the service cart by its ID.
// API 4: Delete an item from the service cart by its ID.
router.post('/delete',
    verifyClient,
    validateRequest({ body: SCHEMA.DELETE_CART_ITEM }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            console.log('Delete request received:');
            console.log('x-access-token:', req.headers['x-access-token']); 
            console.log('User ID from token:', req.userID);
            console.log('Item to delete:', req.body);

            const { id } = req.body;
            await serviceCartService.deleteServiceCart(id, req.userID as number);
            
            console.log('Successfully deleted cart item:', {
                cartItemId: id,
                userId: req.userID
            });

            res.status(200).send(successResponse({ id }, "Service cart item deleted successfully"));
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