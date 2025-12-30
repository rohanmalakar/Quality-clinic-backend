import { BookingService } from "@models/bookingService";
import { ServiceCart } from "@models/serviceCart";
import { ERRORS } from "@utils/error";
import { ResultSetHeader } from "mysql2";
import { PoolConnection } from "mysql2/promise";

/**
 * Repository for all direct database operations related to the `booking_service` table.
 */
export default class BookingServiceRepository {

    /**
     * Creates a new booking record from a service cart item.
     */
    async createBookingFromCart(
        connection: PoolConnection,
        cartItem: ServiceCart
    ): Promise<BookingService> {
        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO booking_service (user_id, branch_id, service_id, date, vat_percentage) 
             VALUES (?, ?, ?, ?, ?)`,
            [cartItem.user_id, cartItem.branch_id, cartItem.service_id, cartItem.date, cartItem.vat_percentage]
        );

        const [rows] = await connection.query<BookingService[]>(
            'SELECT * FROM booking_service WHERE id = ?',
            [result.insertId]
        );

        if (!rows[0]) {
            throw ERRORS.INTERNAL_SERVER_ERROR;
        }
        return rows[0];
    }
}