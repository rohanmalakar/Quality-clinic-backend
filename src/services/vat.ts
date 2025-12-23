import VatRepository from "@repository/vat";
import pool from "@utils/db";
import { ERRORS, RequestError } from "@utils/error";
import createLogger from "@utils/logger";

import { PoolConnection } from "mysql2/promise";

const logger = createLogger('@userService');

export default class VatService {
    vatRepository: VatRepository;

    constructor() {
        this.vatRepository = new VatRepository();
    }

    async updateVat(vat: number): Promise<number> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await this.vatRepository.updateVat(connection, vat);
            return vat;
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

    async getVat(): Promise<string> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.vatRepository.getVat(connection);
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