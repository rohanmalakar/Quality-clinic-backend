import { verifyAdmin } from "@middleware/auth";
import validateRequest from "@middleware/validaterequest";
import BranchService from "@services/branch";
import { successResponse, successResponseWithZeroData } from "@utils/response";
import { verify } from "crypto";
import { NextFunction, Request, Response, Router } from "express";
import z from 'zod'


const SCHEMA = {
    BRANCH_DETAILS: z.object({
        name_ar: z.string(),
        name_en: z.string(),
        city_en: z.string(),
        city_ar: z.string(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
    }),
    BRANCH_UPDATE: z.object({
        name_ar: z.string().optional(),
        name_en: z.string().optional(),
        city_en: z.string().optional(),
        city_ar: z.string().optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
    })
}

var router = Router();
const branchService = new BranchService();

router.get('/',
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const branchs = await branchService.getBranch();
            if(branchs.length === 0) {
                res.status(200).send(successResponseWithZeroData("No branches found."));
                return;
            }
            res.send(successResponse(branchs));
        } catch (e) {
            next(e)
        }
    }
)

router.put('/:id',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.BRANCH_UPDATE
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        const body: z.infer<typeof SCHEMA.BRANCH_UPDATE> = req.body
        try {
            const id = parseInt(req.params.id)
            const branch = await branchService.updateBranch(id, body.name_ar, body.name_en, body.city_en, body.city_ar, body.latitude, body.longitude);
            res.send(successResponse(branch));
        } catch (e) {
            next(e)
        }
    }
)

router.post('/',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.BRANCH_DETAILS
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        const body: z.infer<typeof SCHEMA.BRANCH_DETAILS> = req.body
        try {
            const branch = await branchService.createBranch(body.name_ar, body.name_en, body.city_en, body.city_ar, body.latitude, body.longitude);
            res.send(successResponse(branch));
        } catch (e) {
            next(e)
        }
    }
)

// Get all branch for a service
router.get('/service',
    validateRequest({
        query: z.object({
            service_id: z.string()
        })
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const service_id = parseInt(req.query.service_id as string);
            const branches = await branchService.getAllBranchForService(service_id);
            if(branches.length === 0) {
                res.status(200).send(successResponseWithZeroData("No branches found for the service."));
                return;
            }
            res.json(successResponse(branches));
        } catch (error) {
            next(error);
        }
    }
)

router.delete('/:id',
    verifyAdmin,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id)
            const banner = await branchService.deleteBranch(id);
            res.send(successResponse(banner.id));
        } catch (e) {
            next(e)
        }
    }
)



export default router;
