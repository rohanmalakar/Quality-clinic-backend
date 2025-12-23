import { Vat } from "@models/vat";
import { ERRORS } from "@utils/error";
import createLogger from "@utils/logger";
import { PoolConnection, ResultSetHeader } from "mysql2/promise";

const logger = createLogger('@vatRepository')

export default class VatRepository {

    async updateVat(connection: PoolConnection, vat: number): Promise<number> {
        try {
            const [result,] = await connection.query<ResultSetHeader>('UPDATE vat SET vat_percentage = ?', [vat]);
            return vat
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getVat(connection: PoolConnection): Promise<string> {
        try {
            const [vats,] = await connection.query<Vat[]>('SELECT * from vat limit 1');
            return vats[0].vat_percentage
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }
}

