import { verifyAdmin, verifyClient } from "@middleware/auth";
import { NextFunction, Router, Response } from "express";

import { Request } from '@customTypes/connection';
import { ERRORS } from "@utils/error";
import { z } from "zod";
import validateRequest from "@middleware/validaterequest";
import ServiceService from '@services/service';
import { successResponse } from "@utils/response";
import { time } from "console";

var router = Router();

const serviceService = new ServiceService();

const SCHEMA = {
    CREATE_SERVICE: z.object({
        name_en: z.string(),
        name_ar: z.string(),
        category_id: z.number(),
        about_en: z.string(),
        about_ar: z.string(),
        actual_price: z.number(),
        discounted_price: z.number(),
        service_image_en_url: z.string(),
        service_image_ar_url: z.string(),
        can_redeem: z.boolean().default(false)
    }),
    UPDATE_SERVICE: z.object({
        name_en: z.string().optional(),
        name_ar: z.string().optional(),
        category_id: z.number().optional(),
        about_en: z.string().optional(),
        about_ar: z.string().optional(),
        actual_price: z.number().optional(),
        discounted_price: z.number().optional(),
        service_image_en_url: z.string().optional(),
        service_image_ar_url: z.string().optional(),
        can_redeem: z.boolean().optional()
    }),
    CREATE_SERVICE_CATEGORY: z.object({
        name_en: z.string(),
        name_ar: z.string(),
        image_ar: z.string(),
        image_en: z.string(),
        type: z.enum(['DENTIST', 'DERMATOLOGIST'])
    }),
    UPDATE_SERVICE_CATEGORY: z.object({
        name_en: z.string().optional(),
        name_ar: z.string().optional(),
        image_ar: z.string().optional(),
        image_en: z.string().optional(),
        type: z.enum(['DENTIST', 'DERMATOLOGIST']).optional()
    }),
    CREATE_TIME_SLOT: z.object({
        service_id: z.number(),
        start_time: z.string().time(),
        end_time: z.string().time()
    }),
    CREATE_TIME_SLOTS: z.object({
        service_id: z.number(),
        time_slots: z.array(z.object({
            start_time: z.string().time(),
            end_time: z.string().time()
        }))
    }),
    UPDATE_TIME_SLOTS: z.object({
        service_id: z.number(),
        time_slots: z.array(z.object({
            start_time: z.string().time(),
            end_time: z.string().time()
        }))
    }),
    ADD_SERVICE_TO_BRANCH: z.object({
        service_id: z.number(),
        branch_id: z.number(),
        maximum_booking_per_slot: z.number()
    }),
    ADD_SERVICE_TO_BRANCHES: z.object({
        service_id: z.number(),
        branches: z.array(z.object({
            branch_id: z.number(),
            maximum_booking_per_slot: z.number()
        }))
    }),
    UPDATE_SERVICE_BRANCHES: z.object({
        service_id: z.number(),
        branches: z.array(z.object({
            branch_id: z.number(),
            maximum_booking_per_slot: z.number()
        }))
    })

}

var router = Router();

router.get('/',
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const services = await serviceService.getAll();
            res.json(successResponse(services));
        } catch (error) {
            next(error);
        }
    }
)

router.post('/',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.CREATE_SERVICE
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const body: z.infer<typeof SCHEMA.CREATE_SERVICE> = req.body;
            const service = await serviceService.create(body.name_en, body.name_ar, body.category_id, body.about_en, body.about_ar, body.actual_price, body.discounted_price, body.service_image_en_url, body.service_image_ar_url, body.can_redeem);
            res.json(successResponse(service));
        } catch (error) {
            next(error);
        }
    }
)

// Get all services for a category
router.get('/all/category',
    validateRequest({
        query: z.object({
            category_id: z.coerce.number().min(1)
        })
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const category_id = parseInt(req.query.category_id as string);
            const services = await serviceService.getAllByCategory(category_id);
            res.json(successResponse(services));
        } catch (error) {
            next(error);
        }
    }
)


router.get('/category',
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const services = await serviceService.getAllCategory();
            res.json(successResponse(services));
        } catch (error) {
            next(error);
        }
    }
)

router.post('/category',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.CREATE_SERVICE_CATEGORY
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const body: z.infer<typeof SCHEMA.CREATE_SERVICE_CATEGORY> = req.body;
            const category = await serviceService.createCategory(body.name_en, body.name_ar, body.image_ar, body.image_en, body.type);
            res.json(successResponse(category));
        } catch (error) {
            next(error);
        }
    }
)

router.put('/category/:category_id',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.UPDATE_SERVICE_CATEGORY
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const body: z.infer<typeof SCHEMA.UPDATE_SERVICE_CATEGORY> = req.body;
            const category_id = parseInt(req.params.category_id);
            const category = await serviceService.updateCategory(category_id, body.name_ar, body.name_en, body.image_ar, body.image_en, body.type);
            res.json(successResponse(category));
        } catch (error) {
            next(error);
        }
    }
)

router.get('/time_slots',
    validateRequest({
        query: z.object({
            service_id: z.string(),
        })
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const service_id = parseInt(req.query.service_id as string);
            const timeSlots = await serviceService.getTimeSlots(service_id);
            res.json(successResponse(timeSlots));
        } catch (error) {
            next(error);
        }
    }
)

router.get('/time_slot/available',
    verifyClient,
    validateRequest({
        query: z.object({
            service_id: z.string(),
            date: z.string().date(),
            branch_id: z.string()
        })
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const service_id = parseInt(req.query.service_id as string);
            const branch_id = parseInt(req.query.branch_id as string);
            const date = req.query.date as string;
            const timeSlots = await serviceService.getAvailableTimeSlots(service_id, branch_id, date);
            res.json(successResponse(timeSlots));
        } catch (error) {
            next(error);
        }
    }
)

router.post('/time_slot',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.CREATE_TIME_SLOT
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const body: z.infer<typeof SCHEMA.CREATE_TIME_SLOT> = req.body;
            const timeSlot = await serviceService.createServiceTimeSlot(body.service_id, body.start_time, body.end_time);
            res.json(successResponse(timeSlot));
        } catch (error) {
            next(error);
        }
    }
)

router.post('/time_slots',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.CREATE_TIME_SLOTS
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const body: z.infer<typeof SCHEMA.CREATE_TIME_SLOTS> = req.body;
            const timeSlot = await serviceService.createServiceTimeSlots(body.service_id, body.time_slots);
            res.json(successResponse(timeSlot));
        } catch (error) {
            next(error);
        }
    }
)

router.put('/time_slots',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.UPDATE_TIME_SLOTS
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const body: z.infer<typeof SCHEMA.UPDATE_TIME_SLOTS> = req.body;
            const timeSlot = await serviceService.updateServiceTimeSlots(body.service_id, body.time_slots);
            res.json(successResponse(timeSlot));
        } catch (error) {
            next(error);
        }
    }
)

// Get all services for a branch
router.get('/branch',
    validateRequest({
        query: z.object({
            branch_id: z.coerce.number().min(1)
        })
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const branch_id = parseInt(req.query.branch_id as string);
            const branches = await serviceService.getServicesForBranch(branch_id);
            res.json(successResponse(branches));
        } catch (error) {
            next(error);
        }
    }
)

router.post('/branch',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.ADD_SERVICE_TO_BRANCH
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const body: z.infer<typeof SCHEMA.ADD_SERVICE_TO_BRANCH> = req.body;
            const branch = await serviceService.addServiceToBranch(body.service_id, body.branch_id, body.maximum_booking_per_slot);
            res.json(successResponse(branch));
        } catch (error) {
            next(error);
        }
    }
)

router.get('/featured',
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const doctors = await serviceService.getFeaturedServices();
            res.json(successResponse(doctors));
        } catch (e) {
            next(e)
        }
})

router.post('/branches',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.ADD_SERVICE_TO_BRANCHES
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const body: z.infer<typeof SCHEMA.ADD_SERVICE_TO_BRANCHES> = req.body;
            const branch = await serviceService.addServiceToBranches(body.service_id, body.branches);
            res.json(successResponse(branch));
        } catch (error) {
            next(error);
        }
    }
)

router.put('/branches',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.UPDATE_SERVICE_BRANCHES
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const body: z.infer<typeof SCHEMA.UPDATE_SERVICE_BRANCHES> = req.body;
            const branch = await serviceService.updateServiceToBranches(body.service_id, body.branches);
            res.json(successResponse(branch));
        } catch (error) {
            next(error);
        }
    }
)

// get all services that can be redeemed
router.get('/can_redeem',
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const canRedeem = await serviceService.getRedeemableServices();
            res.json(successResponse(canRedeem));
        } catch (error) {
            next(error);
        }
    }
)

router.put('/:service_id',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.UPDATE_SERVICE
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const body: z.infer<typeof SCHEMA.UPDATE_SERVICE> = req.body;
            const service_id = parseInt(req.params.service_id);
            const service = await serviceService.update(service_id, body.name_en, body.name_ar, body.category_id, body.about_en, body.about_ar, body.actual_price, body.discounted_price, body.service_image_en_url, body.service_image_ar_url, body.can_redeem);
            res.json(successResponse(service));
        } catch (error) {
            next(error);
        }
    }
)

router.delete('/:service_id',
    verifyAdmin,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const service_id = parseInt(req.params.service_id);
            const service = await serviceService.delete(service_id);
            res.json(successResponse(service));
        } catch (error) {
            next(error);
        }
    }
)


export default router;
