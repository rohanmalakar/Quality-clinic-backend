import { BookingService } from "@models/bookingService";
import { ServiceCart } from "@models/serviceCart";
import BookingServiceRepository from "@repository/bookingService";
import ServiceCartRepository from "@repository/serviceCart";
import BranchRepository from "@repository/branch";
import ServiceRepository from "@repository/service";
import pool from "@utils/db";
import { ERRORS, RequestError } from "@utils/error";
import createLogger from "@utils/logger";
import { PoolConnection } from "mysql2/promise";

const logger = createLogger('@serviceCartService');

export default class ServiceCartService {
    serviceCartRepository: ServiceCartRepository;
    bookingServiceRepository: BookingServiceRepository;
    branchRepository: BranchRepository;
    serviceRepository: ServiceRepository;

    constructor() {
        this.serviceCartRepository = new ServiceCartRepository();
        this.bookingServiceRepository = new BookingServiceRepository();
        this.branchRepository = new BranchRepository();
        this.serviceRepository = new ServiceRepository();
    }

    /**
     * Moves ALL items from a user's service cart to the booking_service table.
     * This operation is transactional.
     * @param userId The ID of the user whose cart items are to be booked.
     * @returns An array of the newly created booking items.
     */
    async moveCartToBookingByUserId(userId: number) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // ==================== THIS LINE HAS BEEN UPDATED ====================
            // Find all service cart items using the new, safer raw method.
            const cartItems = await this.serviceCartRepository.getRawServiceCartsByUser(connection, userId);
            // ====================================================================

            // 2. Check if the cart is empty. If so, there's nothing to do.
            if (cartItems.length === 0) {
                return []; 
            }

            // // 3. Loop through each cart item and create a corresponding booking.
            const newBookings: BookingService[] = [];
            for (const item of cartItems) {
                const newBooking = await this.bookingServiceRepository.createBookingFromCart(connection, item);
                newBookings.push(newBooking);
            }

            // 4. After successfully creating all bookings, delete all original items from the user's cart.
            await this.serviceCartRepository.deleteServiceCartsByUser(connection, userId);

            // 5. If all steps were successful, commit the transaction.
            await connection.commit();

            return true;
        } catch (e) {
            // If any error occurred during the loop or delete, roll back the entire transaction.
            await connection.rollback();
            if (e instanceof RequestError) {
                throw e;
            } else {
                logger.error(e);
                throw ERRORS.INTERNAL_SERVER_ERROR;
            }
        } finally {
            // Always release the connection back to the pool.
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Corresponds to API 1: Add an item to the cart.
     */
    async createServiceCart(
        user_id: number,
        branch_id: number,
        service_id: number,
        date: string,
        vat_percentage: number
    ): Promise<ServiceCart | Record<string, never>> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();

            // Validate branch exists
            const branch = await this.branchRepository.getBranchByIdOrNull(connection, branch_id);
            if (!branch) {
                throw ERRORS.BRANCH_NOT_FOUND;
            }

            // Validate service exists
            const service = await this.serviceRepository.getServiceByIdOrNull(connection, service_id);
            if (!service) {
                throw ERRORS.SERVICE_NOT_FOUND;
            }

            //check if the cartItem already exists for the user with same branch_id, service_id and date
            const existingCartItem = await this.serviceCartRepository.getServiceCartByUserBranchService(
                connection,
                user_id,
                branch_id,
                service_id,
            );


            if (existingCartItem) {
                // If item already exists, return empty object to indicate success but no new item created
                return {};
            }


            return await this.serviceCartRepository.createServiceCart(
                connection,
                user_id,
                branch_id,
                service_id,
                date,
                vat_percentage
            );
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

    /**
     * Corresponds to the API for getting all user carts with details.
     */
    async getAllServiceCartsWithDetails(): Promise<ServiceCart[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.serviceCartRepository.getAllServiceCartsWithJoin(connection);
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
    
    /**
     * Corresponds to API 2: Get all cart items for a user.
     */
    async getServiceCartsByUser(userId: number): Promise<ServiceCart[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.serviceCartRepository.getServiceCartsByUser(connection, userId);
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

    /**
     * Corresponds to API 3: Update an existing item in the cart.
     * With ownership verification to ensure only the owner can update their cart items.
     */
    async updateServiceCart(
        id: number,
        user_id: number,
        branch_id: number,
        service_id: number,
        date: string,
        vat_percentage: number
    ): Promise<ServiceCart> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            
            // First, verify that this cart item belongs to the user
            const cartItem = await this.serviceCartRepository.getServiceCartById(connection, id);
            
            // If cart item doesn't exist, throw error
            if (!cartItem) {
                throw ERRORS.NOT_FOUND;
            }
            
            // If cart item exists but doesn't belong to this user, throw unauthorized error
            if (cartItem.user_id !== user_id) {
                throw ERRORS.AUTH_UNAUTHERISED;
            }
            
            // If ownership verified, proceed with update
            return await this.serviceCartRepository.updateServiceCart(
                connection,
                id,
                user_id,
                branch_id,
                service_id,
                date,
                vat_percentage
            );
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

    /**
     * Corresponds to API 4: Delete an item from the cart.
     * With ownership verification to ensure only the owner can delete their cart items.
     */
    async deleteServiceCart(id: number, user_id: number): Promise<void> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            
            // First, verify that this cart item belongs to the user
            const cartItem = await this.serviceCartRepository.getServiceCartById(connection, id);
            
            // If cart item doesn't exist, throw error
            if (!cartItem) {
                throw ERRORS.NOT_FOUND;
            }
            
            // If cart item exists but doesn't belong to this user, throw unauthorized error
            if (cartItem.user_id !== user_id) {
                throw ERRORS.AUTH_UNAUTHERISED;
            }
            
            // If ownership verified, proceed with deletion
            await this.serviceCartRepository.deleteServiceCart(connection, id);
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

    async getAllServiceCarts(): Promise<ServiceCart[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.serviceCartRepository.getAllServiceCarts(connection);
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
