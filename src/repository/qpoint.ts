import { ERRORS } from "@utils/error";
import createLogger from "@utils/logger";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { QPoint } from "@models/redeem";

const logger = createLogger('@qPointRepository')

interface TotalPointRow extends RowDataPacket {
    points: number;
}

interface QPointRow extends RowDataPacket, QPoint {}
interface QPointUser extends RowDataPacket {}

export default class QPointRepository {

    async getTotalQPointsByUser(connection: PoolConnection, user_id: number): Promise<number> {
        try {
            const [qpoints,] = await connection.query<TotalPointRow[]>('SELECT sum(points) as points from qpoint where user_id = ?', [user_id]);
            return qpoints[0].points ?? 0;
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async insertQPoint(connection: PoolConnection, user_id: number, points: number): Promise<QPoint> {
        try {
            const [result,] = await connection.query<ResultSetHeader>('INSERT INTO qpoint (user_id, points) VALUES (?, ?)', [user_id, points]);
            const [qpoint,] = await connection.query<QPointRow[]>('SELECT * from qpoint where id = ?', [result.insertId]);
            return qpoint[0]
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getQPointsPerUser(connection: PoolConnection): Promise<QPointUser[]> {
        try {
            const [qpoints,] = await connection.query<QPointUser[]>('SELECT user_id, sum(points) as points from qpoint group by user_id');
            return qpoints
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }
}

