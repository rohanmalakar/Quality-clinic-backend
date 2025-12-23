import axios from "axios";
import { PaymentRepository } from "@repository/payment";
import RedeemService from "@services/redeem";
import { PoolConnection } from "mysql2/promise";
import BookingService from "./booking";
import BookingRepository from "@repository/booking";

import ServiceCartService from "@services/serviceCart";


const redeemService = new RedeemService();
const serviceCartService = new ServiceCartService();

const PAYTABS_API = process.env.PAYTABS_ENV === 'sandbox' ? 'https://secure.paytabs.sa/payment/request' : 'https://secure.paytabs.sa/payment/request';
const SERVER_KEY = process.env.PAYTABS_ENV === 'sandbox' ? process.env.TEST_PAYTABS_SERVER_KEY : process.env.PAYTABS_SERVER_KEY;
const PROFILE_ID = process.env.PAYTABS_ENV === 'sandbox' ? Number(process.env.TEST_PAYTABS_PROFILE_ID) : Number(process.env.PAYTABS_PROFILE_ID);

// console.log("!!!!!!!!!!!!!!!",SERVER_KEY,PROFILE_ID,PAYTABS_API);
// const SERVER_KEY = process.env.PAYTABS_SERVER_KEY!;
// const PROFILE_ID = Number(process.env.PAYTABS_PROFILE_ID!);

const RETURN_URL = process.env.PAYTABS_RETURN_URL!;
const CALLBACK_URL = process.env.PAYTABS_CALLBACK_URL!;

export class PayTabsService {
    private repo: PaymentRepository;

    

    constructor(private db: PoolConnection) {
        this.repo = new PaymentRepository(db);
    }


    // Returns { hasDuplicate: boolean, duplicates: { booking_ids?: number[], service_ids?: number[] } }
    async checkDuplicateBilling(params: {
        booking_ids?: number[]; service_ids?: number[];
    }): Promise<{ hasDuplicate: boolean; duplicates: { booking_ids?: number[]; service_ids?: number[] } }> {
        const duplicates: { booking_ids?: number[]; service_ids?: number[] } = {};

        if (Array.isArray(params.booking_ids) && params.booking_ids.length) {
        const already = await this.repo.findActivePaymentsByBookingIds(params.booking_ids);
        if (already.length) duplicates.booking_ids = already;
        }

        if (Array.isArray(params.service_ids) && params.service_ids.length) {
        const already = await this.repo.findActivePaymentsByServiceIds(params.service_ids);
        if (already.length) duplicates.service_ids = already;
        }

        return { hasDuplicate: Boolean(duplicates.booking_ids || duplicates.service_ids), duplicates };
    }

    
    async initiatePayment(paymentData: {
        user_id: number;
        cart_id: string;
        cart_amount: number;
        cart_currency: string;
        cart_description?: string;
        booking_ids?: number[];
        service_ids?: number[];
        redeemed_coupon_id?: number;
        redeemed_points?: number;
    }) {

        console.log("/initiate payload : ",paymentData);

        const existing = await this.repo.findByCartId(paymentData.cart_id);
        if (existing) throw new Error(`Duplicate cart_id: ${paymentData.cart_id}`);

        // // Re-check duplicate just before insert to avoid TOCTOU where necessary
        // const dupCheck = await this.checkDuplicateBilling({
        //     booking_ids: paymentData.booking_ids,
        //     service_ids: paymentData.service_ids
        // });
        // if (dupCheck.hasDuplicate) {
        //     throw new Error("One or more items are already billed in an active payment");
        // }

        const payload = {
            profile_id: PROFILE_ID,
            tran_type: "sale",
            tran_class: "ecom",
            cart_id: paymentData.cart_id,
            cart_currency: paymentData.cart_currency,
            cart_amount: paymentData.cart_amount,
            cart_description: paymentData.cart_description || "Order Payment",
            callback: CALLBACK_URL,
            return: RETURN_URL
        };

        const headers = {
            Authorization: SERVER_KEY,
            "Content-Type": "application/json"
        };

        const response = await axios.post(PAYTABS_API, payload, { headers });
        const { redirect_url, tran_ref } = response.data;

        const paymentId = await this.repo.create({
            ...paymentData,
            callback_url: CALLBACK_URL,
            return_url: RETURN_URL
        });

        const bookingIds = Array.isArray(paymentData.booking_ids) ? paymentData.booking_ids : [];
        const serviceIds = Array.isArray(paymentData.service_ids) ? paymentData.service_ids : [];

        const maxLen = Math.max(bookingIds.length, serviceIds.length);
        if (maxLen > 0) {
        const items = Array.from({ length: maxLen }, (_, i) => ({
            booking_doctor_id: bookingIds[i] ?? null,
            booking_service_id: serviceIds[i] ?? null
        }));
        await this.repo.createItems(paymentId, items);
        }

        await this.repo.updateTransaction(paymentData.cart_id, "pending", tran_ref, redirect_url);
        return response.data;
    }


    async updatePaymentFromReturn(cart_id: string, payload: any) {
        const status = payload.payment_result?.response_status === 'A' ? 'paid' : 'failed';
        const failureReason = payload.payment_result?.response_message || payload.respMessage || 'Unknown failure';

        await this.repo.updateFromReturn(cart_id, {
            paytabs_transaction_id: payload.tran_ref,
            status,
            cart_amount: payload.cart_amount ?? null,
            cart_currency: payload.cart_currency ?? null,
            cart_description: failureReason
        });

        if (status === 'paid') {
            const payment = await this.repo.findByCartId(cart_id);
            if (!payment) {
                console.warn(`No payment found for cart_id: ${cart_id}`);
                return;
            }

            const items = await this.repo.getItemsByCartId(cart_id);
            for (const item of items) {
                console.log("&&&&&&&&&&&&&&&&",item.booking_doctor_id, item.booking_service_id);
                try {
                    if(item.booking_doctor_id){
                        await this.repo.scheduleDoctor(item.booking_doctor_id);
                    }else{
                        await this.repo.scheduleService(item.booking_service_id);
                    }
                    await this.db.commit();
                    await serviceCartService.moveCartToBookingByUserId(payment.user_id as number);

                    if(payment.redeemed_coupon_id){
                        await redeemService.redeem(payment.user_id, item.booking_doctor_id, item.booking_service_id);
                    }
                    
                    
                } catch (err) {
                console.error(`Redemption failed for cart ${cart_id}:`, err);
                }
            }
        }
    }

    async handleCallback(cart_id: string, status: 'pending' | 'paid' | 'failed' | 'refunded', tran_ref?: string, redirect_url?: string) {
        // Normalize inputs
        const txId = tran_ref ?? '';
        const rUrl = redirect_url ?? '';

        // Update status and optional transaction id / redirect url
        console.log("!!!!!!! handleCallback :: ", cart_id, status, txId, rUrl);
        
        await this.repo.updateTransaction(cart_id, status, txId, rUrl);

        // Optionally return the payment row or a boolean
        const payment = await this.repo.findByCartId(cart_id);
        return payment;
    }
}
