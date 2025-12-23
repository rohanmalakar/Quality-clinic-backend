import { ERRORS } from "@utils/error";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import createLogger from "@utils/logger";
import { Branch } from "@models/branch";

const logger = createLogger('@branchRepository')

interface BranchRow extends Branch, RowDataPacket {}
export default class BranchRepository {
    async getBranch(connection: PoolConnection): Promise<Branch[]> {
        try {
            const [branch,] = await connection.query<BranchRow[]>('SELECT * from branch');
            return branch
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }
    async updateBranch(connection: PoolConnection, id: number, name_ar: string, name_en: string, city_en: string, city_ar: string, latitude: number, longitude: number): Promise<Branch> {
        try {
            const [result,] = await connection.query<ResultSetHeader>('UPDATE branch SET name_ar = ?, name_en = ?, city_en = ?, city_ar = ?, latitude = ?, longitude = ? WHERE id = ?', [name_ar, name_en, city_en, city_ar, latitude, longitude, id]);
            const [branch,] = await connection.query<BranchRow[]>('SELECT * from branch where id = ?', [id]);
            return branch[0]
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }
    // async createBranch(connection: PoolConnection, name_ar: string, name_en: string, city_en: string, city_ar: string, latitude: number, longitude: number): Promise<Branch> {
    //     try {
    //         const [result,] = await connection.query<ResultSetHeader>('INSERT INTO branch (name_ar, name_en, city_en, city_ar, latitude, longitude) VALUES (?,?,?,?,?,?)', [name_ar, name_en, city_en, city_ar, latitude, longitude]);
    //         const [branch,] = await connection.query<BranchRow[]>('SELECT * from branch where id = ?', [result.insertId]);
    //         return branch[0]
    //     } catch (e) {
    //         logger.error(e)
    //         throw ERRORS.DATABASE_ERROR
    //     }
    // }

    async createBranch(
        connection: PoolConnection,
        name_ar: string,
        name_en: string,
        city_en: string,
        city_ar: string,
        latitude: number,
        longitude: number
    ): Promise<Branch> {
        try {
            // Check for duplicate branch by name and city (either language)
            const [rows] = await connection.query<any[]>(
                `SELECT id FROM branch 
                WHERE (name_en = ? OR name_ar = ?) 
                AND (city_en = ? OR city_ar = ?)`,
                [name_en, name_ar, city_en, city_ar]
            );

            if (rows.length > 0) {
                throw ERRORS.DUPLICATE_RECORD;
            }

            const [result] = await connection.query<ResultSetHeader>(
                'INSERT INTO branch (name_ar, name_en, city_en, city_ar, latitude, longitude) VALUES (?,?,?,?,?,?)',
                [name_ar, name_en, city_en, city_ar, latitude, longitude]
            );

            const [branch] = await connection.query<BranchRow[]>(
                'SELECT * FROM branch WHERE id = ?',
                [result.insertId]
            );
            return branch[0];
        } catch (e) {
            logger.error(e);
            if (e === ERRORS.DUPLICATE_RECORD) throw e;
            throw ERRORS.DATABASE_ERROR;
        }
    }


    async getBranchById(connection: PoolConnection, branch_id: number): Promise<Branch> {
        try {
            const [branch,] = await connection.query<BranchRow[]>('SELECT * from branch WHERE id = ?', [branch_id]);
            return branch[0];
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getBranchByIdOrNull(connection: PoolConnection, branch_id: number): Promise<Branch | null> {
        try {
            const [branch,] = await connection.query<BranchRow[]>('SELECT * from branch WHERE id = ?', [branch_id]);
            if (branch.length === 0) {
                return null;
            }
            return branch[0];
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getBranchForBranch(connection: PoolConnection, branch_id: number): Promise<Branch[]> {
        try {
            const [branch,] = await connection.query<BranchRow[]>('SELECT * from branch WHERE id = ?', [branch_id]);
            return branch;
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async deleteBranch(connection: PoolConnection, branch_id: number): Promise<Branch> {
        try {
            const [branch,] = await connection.query<BranchRow[]>('SELECT * from branch where id = ?', [branch_id]);
            const [result,] = await connection.query<ResultSetHeader>('DELETE FROM branch WHERE id = ?', [branch_id]);
            return branch[0];
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getAllBranchForService(connection: PoolConnection, service_id: number): Promise<Branch[]> {
        try {
            const [branch,] = await connection.query<BranchRow[]>(`SELECT 
                    b.id AS branch_id,
                    b.name_en AS branch_name_en,
                    b.name_ar AS branch_name_ar,
                    b.city_en,
                    b.city_ar,
                    b.latitude,
                    b.longitude,
                    sb.maximum_booking_per_slot
                FROM service_branch sb
                JOIN branch b ON sb.branch_id = b.id
                WHERE sb.service_id = ?;
                `, [service_id]);
            return branch
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }
}
