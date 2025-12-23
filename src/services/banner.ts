
import { Banner } from "@models/banner";
import BannerRepository from "@repository/banner";
import pool from "@utils/db";
import { ERRORS, RequestError } from "@utils/error";
import createLogger from "@utils/logger";
import { PoolConnection } from "mysql2/promise";


const logger = createLogger('@bannerService');

export default class BannerService {
    bannerRepository: BannerRepository;
    constructor() {
        this.bannerRepository = new BannerRepository();
    }

    async getBanners(): Promise<Banner[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.bannerRepository.getBanners(connection);
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            } else {
                logger.error(e);
                throw ERRORS.INTERNAL_SERVER_ERROR;
            }
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getAllBanners(): Promise<Banner[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.bannerRepository.getAllBanners(connection);
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            } else {
                logger.error(e);
                throw ERRORS.INTERNAL_SERVER_ERROR;
            }
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    // async createBanner(image_en: string, image_ar: string, link: string, start_timestamp: Date, end_timestamp: Date): Promise<Banner> {
    //     let connection: PoolConnection | null = null;
    //     try {
    //         connection = await pool.getConnection();
    //         return await this.bannerRepository.createBanner(connection, image_en, image_ar, link, start_timestamp, end_timestamp);
    //     } catch (e) {
    //         if (e instanceof RequestError) {
    //             throw e;
    //         } else {
    //             logger.error(e);
    //             throw ERRORS.INTERNAL_SERVER_ERROR;
    //         }
    //     } finally {
    //         if (connection) {
    //             connection.release();
    //         }
    //     }
    // }

    async createBanner(
        image_en: string,
        image_ar: string,
        link: string,
        start_timestamp: Date,
        end_timestamp: Date
    ): Promise<Banner> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();

            // Duplication check: same link with overlapping dates
            const [rows] = await connection.query<any[]>(
                `SELECT id FROM banner
                WHERE link = ?
                AND (
                    (start_timestamp <= ? AND end_timestamp >= ?) OR
                    (start_timestamp <= ? AND end_timestamp >= ?) OR
                    (start_timestamp >= ? AND end_timestamp <= ?)
                )`,
                [
                    link,
                    start_timestamp, start_timestamp,
                    end_timestamp, end_timestamp,
                    start_timestamp, end_timestamp
                ]
            );

            if (rows.length > 0) {
                throw ERRORS.DUPLICATE_RECORD;
            }

            return await this.bannerRepository.createBanner(
                connection,
                image_en,
                image_ar,
                link,
                start_timestamp,
                end_timestamp
            );
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            } else {
                logger.error(e);
                if (e === ERRORS.DUPLICATE_RECORD) throw e;
                throw ERRORS.INTERNAL_SERVER_ERROR;
            }
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }


    async deleteBanner(id: number): Promise<void> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await this.bannerRepository.deleteBanner(connection, id);
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            } else {
                logger.error(e);
                throw ERRORS.INTERNAL_SERVER_ERROR;
            }
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

}
