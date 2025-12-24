import { NextFunction, Router, Response } from "express";
import { successResponse } from "@utils/response";
import { ERRORS } from "@utils/error";
import { verifyAdmin, verifyClient } from "@middleware/auth";
import { Request } from '@customTypes/connection';
import { UploadService, uploadMiddleware } from "@services/uploadService";

var router = Router();
const uploadService = new UploadService();

router.post("/",
  verifyClient,
  // @ts-ignore
  uploadMiddleware.single('photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw ERRORS.FILE_NOT_FOUND;
      }
      if (!req.userID) {
        throw ERRORS.AUTH_UNAUTHERISED;
      }

      const url = await uploadService.uploadToS3(req.file, req.userID!!);
      res.send(successResponse({ url }));
    } catch (error) {
      next(error);
    }
  });


router.post("/admin",
  verifyAdmin,
  // @ts-ignore
  uploadMiddleware.single('photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw ERRORS.FILE_NOT_FOUND;
      }
      if (!req.userID) {
        throw ERRORS.AUTH_UNAUTHERISED;
      }

      const url = await uploadService.uploadToS3(req.file, Date.now());
      res.send(successResponse({ url }));
    } catch (error) {
      next(error);
    }
  });

export default router;