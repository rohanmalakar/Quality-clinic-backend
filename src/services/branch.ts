import { Branch } from "@models/branch";
import BranchRepository from "@repository/branch";
import pool from "@utils/db";
import { ERRORS, RequestError } from "@utils/error";
import createLogger from "@utils/logger";
import { PoolConnection } from "mysql2/promise";


const logger = createLogger('@branchService');

export default class BranchService {
    branchRepository: BranchRepository;
    constructor() {
        this.branchRepository = new BranchRepository();
    }

    async getBranch(): Promise<Branch[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.branchRepository.getBranch(connection);
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

    async updateBranch(id: number, name_ar: string | undefined, name_en: string | undefined, city_en: string | undefined, city_ar: string | undefined, latitude: number| undefined, longitude: number| undefined): Promise<Branch> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const branch = await this.branchRepository.getBranchById(connection, id);
            if (!branch) {
                throw ERRORS.BRANCH_NOT_FOUND;
            }
            if (name_ar) {
                branch.name_ar = name_ar;
            }
            if (name_en) {
                branch.name_en = name_en;
            }
            if (city_en) {
                branch.city_en = city_en;
            }
            if (city_ar) {
                branch.city_ar = city_ar;
            }
            if (latitude) {
                branch.latitude = latitude;
            }
            if (longitude) {
                branch.longitude = longitude;
            }
            return await this.branchRepository.updateBranch(connection, id, branch.name_ar, branch.name_en, branch.city_en, branch.city_ar, branch.latitude, branch.longitude);
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

    async getBranchById(id: number): Promise<Branch> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.branchRepository.getBranchById(connection, id);
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

    async createBranch(name_ar: string, name_en: string, city_en: string, city_ar: string, latitude: number, longitude: number): Promise<Branch> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.branchRepository.createBranch(connection, name_ar, name_en, city_en, city_ar, latitude, longitude);
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

    async deleteBranch(id: number): Promise<Branch> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.branchRepository.deleteBranch(connection, id);
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

    async getAllBranchForService(service_id: number): Promise<any> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.branchRepository.getAllBranchForService(connection, service_id);
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
