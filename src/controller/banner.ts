import { verifyAdmin } from "@middleware/auth";
import validateRequest from "@middleware/validaterequest";
import BannerService from "@services/banner";
import { successResponse, successResponseWithZeroData } from "@utils/response";
import { NextFunction, Request, Response, Router } from "express";
import z from 'zod'

const SCHEMA = {
    BANNER_DETAILS: z.object({
        image_en: z.string(),
        image_ar: z.string(),
        link: z.string(),
        start_timestamp: z.string().datetime(),
        end_timestamp: z.string().datetime(),
    }),
}

var router = Router();
const bannerService = new BannerService();


router.get('/',
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const banner = await bannerService.getBanners();
            if(banner.length === 0) {
                res.status(200).send(successResponseWithZeroData("No active banners found."));
                return;
            }
            res.send(successResponse(banner));
        } catch (e) {
            next(e)
        }
    }
)

router.get('/all',
    verifyAdmin,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const banner = await bannerService.getAllBanners();
            if(banner.length === 0) {
                res.status(200).send(successResponseWithZeroData("No banners found."));
                return;
            }
            res.send(successResponse(banner));
        } catch (e) {
            next(e)
        }
    }
)

router.post('/',
    verifyAdmin,
    validateRequest({
        body: SCHEMA.BANNER_DETAILS
    }),
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const body: z.infer<typeof SCHEMA.BANNER_DETAILS> = req.body
            const start_timestamp = new Date(body.start_timestamp);
            const end_timestamp = new Date(body.end_timestamp);
            const banner = await bannerService.createBanner(body.image_en, body.image_ar, body.link, start_timestamp, end_timestamp);
            res.send(successResponse(banner));
        } catch (e) {
            next(e)
        }
    }
)


router.delete('/:id',
    verifyAdmin,
    async function (req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id);
            await bannerService.deleteBanner(id);
            res.send(successResponse({}));
        } catch (e) {
            next(e)
        }
    }
)

export default router;
