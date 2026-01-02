import { verifyAdmin, verifyClient } from "@middleware/auth";
import { NextFunction, Router, Response } from "express";

import { Request } from '@customTypes/connection';
import { ERRORS } from "@utils/error";
import { z } from "zod";
import validateRequest from "@middleware/validaterequest";
import ServiceService from '@services/service';
import { successResponse, successResponseWithZeroData } from "@utils/response";
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
    }),
    GET_FEATURED_SERVICES: z.object({
        branch_id: z.coerce.number().optional()
    })

}

var router = Router();

router.get('/',
    validateRequest({ query: z.object({ branch_id: z.coerce.number().optional() }) }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const { branch_id } = req.query as { branch_id?: number };
            const services = await serviceService.getAll(branch_id);
            if(services.length === 0) { 
                res.status(200).send(successResponseWithZeroData("No services found. for this branch."));
                return;
            }
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
            category_id: z.coerce.number().min(1),
            branch_id: z.coerce.number().optional()
        })
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const category_id = parseInt(req.query.category_id as string);
            const { branch_id } = req.query as { branch_id?: number };
            const services = await serviceService.getAllByCategory(category_id, branch_id);
            if(services.length === 0) {
                res.status(200).send(successResponseWithZeroData("No services found for this category."));
                return;
            }
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
            if(services.length === 0) {
                res.status(200).send(successResponseWithZeroData("No service categories found."));
                return;
            }
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

router.delete('/category/:category_id',
    verifyAdmin,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const category_id = parseInt(req.params.category_id);
            const category = await serviceService.deleteCategory(category_id);
            res.json(successResponse(category,"Category deleted successfully."));
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
            if(branches.length === 0) {
                res.status(200).send(successResponseWithZeroData("No services found for the branch."));
                return;
            }
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
    validateRequest({
        query: SCHEMA.GET_FEATURED_SERVICES
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const { branch_id } = req.query as { branch_id?: number };
            const services = await serviceService.getFeaturedServices(branch_id);
            if(services.length === 0) {
                res.status(200).send(successResponseWithZeroData("No featured services found."));
                return;
            }
            res.json(successResponse(services));
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
