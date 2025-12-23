import { PoolConnection, RowDataPacket } from "mysql2/promise";
import { ERRORS, RequestError } from "@utils/error";
export interface PaymentRow extends RowDataPacket {
    user_id: number;
    redeemed_coupon_id: number;
}

export class PaymentRepository {
    constructor(private db: PoolConnection) {}

    async create(payment: {
            user_id: number;
            cart_id: string;
            cart_amount: number;
            cart_currency: string;
            cart_description?: string;
            tran_type?: string;
            tran_class?: string;
            callback_url?: string;
            return_url?: string;
            redeemed_coupon_id?: number;
            redeemed_points?: number;
    }): Promise<number> {
        const query = `
        INSERT INTO payments (
            user_id, cart_id, cart_amount, cart_currency, cart_description,
            tran_type, tran_class, callback_url, return_url,
            redeemed_coupon_id, redeemed_points
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            payment.user_id,
            payment.cart_id,
            payment.cart_amount,
            payment.cart_currency,
            payment.cart_description ?? '',
            payment.tran_type ?? 'sale',
            payment.tran_class ?? 'ecom',
            payment.callback_url ?? '',
            payment.return_url ?? '',
            payment.redeemed_coupon_id ?? null,
            payment.redeemed_points ?? null
        ];
        const [result]: any = await this.db.execute(query, values);
        return result.insertId;
    }

    async createItems(paymentId: number, items: { booking_doctor_id: number | null; booking_service_id: number | null }[]) {
        if (!items || items.length === 0) return;
        // const values = items.map(i => [paymentId, i.booking_doctor_id, i.booking_service_id]);
        
        const values = items.map(i => [
            paymentId,
            i.booking_doctor_id ?? null,
            i.booking_service_id ?? null,
        ]);

        await this.db.query(
            "INSERT INTO payment_items (payment_id, booking_doctor_id, booking_service_id) VALUES ?",
            [values]
        );
    }

    async findActivePaymentsByBookingIds(bookingIds: number[]): Promise<number[]> {
        const [rows] = await this.db.query(
            "SELECT DISTINCT pi.booking_doctor_id FROM payment_items pi JOIN payments p ON pi.payment_id = p.id WHERE pi.booking_doctor_id IS NOT NULL AND pi.booking_doctor_id IN (?) AND p.status IN ('pending', 'authorized', 'processing')",
            [bookingIds]
        );
        return (rows as any[]).map(r => r.booking_doctor_id);
    }

    async findActivePaymentsByServiceIds(serviceIds: number[]): Promise<number[]> {
        const [rows] = await this.db.query(
            "SELECT DISTINCT pi.booking_service_id FROM payment_items pi JOIN payments p ON pi.payment_id = p.id WHERE pi.booking_service_id IS NOT NULL AND pi.booking_service_id IN (?) AND p.status IN ('pending', 'authorized', 'processing')",
            [serviceIds]
        );
        return (rows as any[]).map(r => r.booking_service_id);
    }

    async updateTransaction(cart_id: string, status: string, transaction_id: string, redirect_url: string) {
        const query = `
        UPDATE payments
        SET status = ?, paytabs_transaction_id = ?, redirect_url = ?
        WHERE cart_id = ?
        `;
        await this.db.execute(query, [status, transaction_id, redirect_url, cart_id]);
    }

    async updateFromReturn(cart_id: string, data: {
        paytabs_transaction_id: string;
        status: 'paid' | 'failed' | 'refunded';
        cart_amount?: number;
        cart_currency?: string;
        cart_description?: string;
    }) {
        const query = `
        UPDATE payments
        SET
            paytabs_transaction_id = ?,
            status = ?,
            cart_amount = COALESCE(?, cart_amount),
            cart_currency = COALESCE(?, cart_currency),
            cart_description = COALESCE(?, cart_description)
        WHERE cart_id = ?
        `;
        const values = [
        data.paytabs_transaction_id,
        data.status,
        data.cart_amount ?? null,
        data.cart_currency ?? null,
        data.cart_description ?? null,
        cart_id
        ];
        await this.db.execute(query, values);

        // const bquery = 'UPDATE booking_doctor set status = "SCHEDULED" where id = ?';
    }

    async findByCartId(cart_id: string): Promise<PaymentRow | null> {
        const [rows] = await this.db.execute(`SELECT * FROM payments WHERE cart_id = ?`, [cart_id]);
        return Array.isArray(rows) && rows.length > 0 ? rows[0] as PaymentRow : null;
    }

    async getItemsByCartId(cart_id: string): Promise<{ booking_doctor_id: number; booking_service_id: number }[]> {
        const query = `
        SELECT pi.booking_doctor_id, pi.booking_service_id
        FROM payment_items pi
        JOIN payments p ON pi.payment_id = p.id
        WHERE p.cart_id = ?
        `;
        const [rows]: any = await this.db.execute(query, [cart_id]);
        return rows;
    }


    async scheduleDoctor(booking_id: number) {
        try {
            await this.db.execute('UPDATE booking_doctor set status = "SCHEDULED" where id = ?', [booking_id]);
            return true;
        } catch (e) {
            throw ERRORS.DATABASE_ERROR
        }
    }

    async scheduleService(booking_id: number) {
        try {
            console.log("booking_id ::: ",booking_id)
            await this.db.execute('UPDATE booking_service set status = "SCHEDULED" where id = ?', [booking_id]);
            return true;
        } catch (e) {
            throw ERRORS.DATABASE_ERROR
        }
    }
}
