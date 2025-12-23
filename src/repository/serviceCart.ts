import { ServiceCart } from "@models/serviceCart";
import { ERRORS } from "@utils/error";
import { ResultSetHeader } from "mysql2";
import { PoolConnection } from "mysql2/promise";

/**
 * The ServiceCartRepository class is responsible for all direct database operations
 * related to the `service_cart` table. It abstracts the SQL queries away from the
 * service layer.
 */
export default class ServiceCartRepository {

    /**
     * (For Admins) Retrieves all service cart items from the database, ordered by the newest first.
     */
    async getAllServiceCarts(connection: PoolConnection): Promise<ServiceCart[]> {
        const [rows] = await connection.query<ServiceCart[]>(
            'SELECT * FROM service_cart ORDER BY id DESC'
        );
        return rows;
    }

    /**
     * Retrieves all service cart items for ALL users, joining with the
     * service, branch, and service_time_slot tables to include additional details.
     */
    async getAllServiceCartsWithJoin(connection: PoolConnection): Promise<ServiceCart[]> {
        // First, check if there are any items in the service_cart table
        const [cartRows] = await connection.query<ServiceCart[]>('SELECT * FROM service_cart');
        
        // If there are no items in the cart, return an empty array immediately
        if (!cartRows || cartRows.length === 0) {
            return [];
        }
        
        // Otherwise, proceed with the join
        const query = `
            SELECT
                sc.*,
                s.name_en AS service_name_en,
                s.name_ar AS service_name_ar,
                b.name_en AS branch_name_en, 
                b.name_ar AS branch_name_ar,
                sts.start_time AS time_slot_start,
                sts.end_time AS time_slot_end
            FROM
                service_cart sc
            LEFT JOIN
                service s ON sc.service_id = s.id
            LEFT JOIN
                branch b ON sc.branch_id = b.id
            LEFT JOIN
                service_time_slot sts ON sc.time_slot_id = sts.id
            ORDER BY
                sc.id DESC
        `;
        const [rows] = await connection.query<ServiceCart[]>(query);
        return rows;
    }
       
    /**
     * Retrieves all service cart items for a specific user, joining with the
     * service, branch, and service_time_slot tables to include additional details.
     */


    async getServiceCartsByUser(connection: PoolConnection, userId: number): Promise<ServiceCart[]> {
    const [cartItems] = await connection.query<ServiceCart[]>(
                'SELECT * FROM service_cart WHERE user_id = ?',
                [userId]
            ); 
            if (!cartItems || cartItems.length === 0) {
                return [];
            }
        const query =`SELECT
                        sc.id,
                        sc.user_id,
                        sc.date,
                        sc.vat_percentage,
                        s.id AS service_id,
                        s.name_en     AS service_name_en,
                        s.name_ar     AS service_name_ar,
                        s.about_en,
                        s.about_ar,
                        sca.type      AS category_type,
                        sca.name_en   AS category_name_en,
                        sca.name_ar   AS category_name_ar,
                        s.actual_price,
                        s.discounted_price,
                        s.service_image_en_url,
                        s.service_image_ar_url,
                        b.id AS branch_id,
                        b.name_en     AS branch_name_en,
                        b.name_ar     AS branch_name_ar,
                        sts.id AS time_slot_id,
                        sts.start_time AS time_slot_start,
                        sts.end_time   AS time_slot_end
                    FROM service_cart sc
                    JOIN service s ON s.id = sc.service_id
                    JOIN service_category sca ON sca.id = s.category_id
                    JOIN branch b ON b.id = sc.branch_id
                    JOIN service_time_slot sts ON sts.id = sc.time_slot_id
                    WHERE sc.user_id = ?
                    ORDER BY sc.id DESC`;

        const [rows] = await connection.query<ServiceCart[]>(query, [userId]);
            return rows;
    }
    /**
     * Retrieves a single service cart item by its primary key ID.
     */
    async getServiceCartById(connection: PoolConnection, id: number): Promise<ServiceCart | null> {
        const [rows] = await connection.query<ServiceCart[]>(
            'SELECT * FROM service_cart WHERE id = ?',
            [id]
        );
        // Return the found item, or null if it doesn't exist.
        return rows[0] || null;
    }

    // ==================== NEW METHOD ADDED FOR ROBUST CHECKOUT ====================
    /**
     * Retrieves the raw service cart items for a user, without any joins.
     * This is ideal for internal processing like creating bookings.
     */
    async getRawServiceCartsByUser(connection: PoolConnection, userId: number): Promise<ServiceCart[]> {
        const [rows] = await connection.query<ServiceCart[]>(
            'SELECT * FROM service_cart WHERE user_id = ?',
            [userId]
        );
        return rows;
    }
    // ==============================================================================

    /**
     * Creates a new service cart item in the database.
     */
    async createServiceCart(
        connection: PoolConnection,
        user_id: number,
        branch_id: number,
        service_id: number,
        time_slot_id: number,
        date: Date,
        vat_percentage: number
    ): Promise<ServiceCart> {
        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO service_cart (user_id, branch_id, service_id, time_slot_id, date, vat_percentage) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, branch_id, service_id, time_slot_id, date, vat_percentage]
        );

        // Get the newly created cart item with all joined details
        const query = `
            SELECT
                sc.*,
                s.name_en AS service_name_en,
                s.name_ar AS service_name_ar,
                b.name_en AS branch_name_en, 
                b.name_ar AS branch_name_ar,
                sts.start_time AS time_slot_start,
                sts.end_time AS time_slot_end
            FROM
                service_cart sc
            LEFT JOIN
                service s ON sc.service_id = s.id
            LEFT JOIN
                branch b ON sc.branch_id = b.id
            LEFT JOIN
                service_time_slot sts ON sc.time_slot_id = sts.id
            WHERE
                sc.id = ?
        `;

        const [rows] = await connection.query<ServiceCart[]>(query, [result.insertId]);

        if (!rows[0]) {
            throw ERRORS.INTERNAL_SERVER_ERROR;
        }
        return rows[0];
    }

    /**
     * Updates an existing service cart item in the database.
     */
    async updateServiceCart(
        connection: PoolConnection,
        id: number,
        user_id: number,
        branch_id: number,
        service_id: number,
        time_slot_id: number,
        date: Date,
        vat_percentage: number
    ): Promise<ServiceCart> {
        const [result] = await connection.query<ResultSetHeader>(
            `UPDATE service_cart 
             SET user_id = ?, branch_id = ?, service_id = ?, time_slot_id = ?, date = ?, vat_percentage = ?
             WHERE id = ?`,
            [user_id, branch_id, service_id, time_slot_id, date, vat_percentage, id]
        );

        if (result.affectedRows === 0) {
            throw ERRORS.NOT_FOUND;
        }

        // Get the updated cart item with all joined details
        const query = `
            SELECT
                sc.*,
                s.name_en AS service_name_en,
                s.name_ar AS service_name_ar,
                b.name_en AS branch_name_en, 
                b.name_ar AS branch_name_ar,
                sts.start_time AS time_slot_start,
                sts.end_time AS time_slot_end
            FROM
                service_cart sc
            LEFT JOIN
                service s ON sc.service_id = s.id
            LEFT JOIN
                branch b ON sc.branch_id = b.id
            LEFT JOIN
                service_time_slot sts ON sc.time_slot_id = sts.id
            WHERE
                sc.id = ?
        `;

        const [rows] = await connection.query<ServiceCart[]>(query, [id]);
        return rows[0];
    }

    /**
     * Deletes a service cart item from the database.
     */
    async deleteServiceCart(connection: PoolConnection, id: number): Promise<void> {
        const [result] = await connection.query<ResultSetHeader>(
            'DELETE FROM service_cart WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            throw ERRORS.NOT_FOUND;
        }
    }

    /**
     * Deletes all service cart items for a specific user.
     * This is used during the checkout/booking process.
     */
    async deleteServiceCartsByUser(connection: PoolConnection, userId: number): Promise<void> {
        console.log("$$$$$$$$$$$$$$$$$$$$$delete service cart called......")
        await connection.query<ResultSetHeader>(
            'DELETE FROM service_cart WHERE user_id = ?',
            [userId]
        );
    }
}