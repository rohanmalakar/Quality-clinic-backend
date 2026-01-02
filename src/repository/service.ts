import { MaxBooking, Service, ServiceBranch, ServiceCategory, ServiceTimeSlot } from "@models/service";
import { ERRORS, RequestError } from "@utils/error";
import createLogger from "@utils/logger";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

const logger = createLogger('@serviceRepository')

interface ServiceRow extends Service, RowDataPacket {}
interface ServiceCategoryRow extends ServiceCategory, RowDataPacket {}
interface ServiceTimeSlotRow extends ServiceTimeSlot, RowDataPacket {}
interface ServiceBranchRow extends ServiceBranch, RowDataPacket {}
interface MaxBookingRow extends MaxBooking, RowDataPacket {}
export default class ServiceRepository {
    async getAllServices(connection: PoolConnection, branch_id?: number): Promise<Service[]> {
        try {
            if (!branch_id || branch_id === 0) {
                const [services,] = await connection.query<ServiceRow[]>('SELECT * from service');
                return services;
            } else {
                const [services,] = await connection.query<ServiceRow[]>(
                    `SELECT DISTINCT s.* FROM service s
                    JOIN service_branch sb ON s.id = sb.service_id
                    WHERE sb.branch_id = ?`,
                    [branch_id]
                );
                return services;
            }
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getServiceById(connection: PoolConnection, service_id: number): Promise<Service> {
        try {
            const [services,] = await connection.query<ServiceRow[]>('SELECT * from service WHERE id = ?', [service_id]);
            if(services.length === 0) {
                throw ERRORS.SERVICE_NOT_FOUND;
            }
            return services[0];
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async setAllServiceTimeSlotsInactive(connection: PoolConnection, service_id: number): Promise<void> {
        try {
            await connection.query<ResultSetHeader>(
                'UPDATE service_time_slot SET is_active = 0 WHERE service_id = ?',
                [service_id]
            );
        } catch (error) {
            logger.error(`Error setting all service time slots inactive: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async getServiceByIdOrNull(connection: PoolConnection, service_id: number): Promise<Service | null> {
        try {
            const [services,] = await connection.query<ServiceRow[]>('SELECT * from service WHERE id = ?', [service_id]);
            if(services.length === 0) {
                return null;
            }
            return services[0];
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getAllServicesCategories(connection: PoolConnection): Promise<ServiceCategory[]> {
        try {
            const [services,] = await connection.query<ServiceCategoryRow[]>('SELECT * from service_category');
            return services;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getServiceCategoryById(connection: PoolConnection, category_id: number): Promise<ServiceCategory> {
        try {
            const [services,] = await connection.query<ServiceCategoryRow[]>('SELECT * from service_category WHERE id = ?', [category_id]);
            return services[0];
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getServiceCategoryByIdOrNull(connection: PoolConnection, category_id: number): Promise<ServiceCategory | null> {
        try {
            const [services,] = await connection.query<ServiceCategoryRow[]>('SELECT * from service_category WHERE id = ?', [category_id]);
            if (services.length === 0) {
                return null;
            }
            return services[0];
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    // async create(connection: PoolConnection, name_en: string, name_ar: string, category_id: number, about_en: string, about_ar: string, actual_price: number, discounted_price: number, service_image_en_url: string, service_image_ar_url: string, can_redeem: boolean): Promise<Service> {
    //     try {
    //         const [result] = await connection.query<ResultSetHeader>('INSERT INTO service (name_en, name_ar, category_id, about_en, about_ar, actual_price, discounted_price, service_image_en_url, service_image_ar_url, can_redeem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [name_en, name_ar, category_id, about_en, about_ar, actual_price, discounted_price, service_image_en_url, service_image_ar_url, can_redeem]);
    //         const service = await this.getServiceById(connection, result.insertId);
    //         return service;
    //     } catch (error) {
    //         logger.error(`Error creating service: ${error}`);
    //         throw ERRORS.DATABASE_ERROR;
    //     } finally {
    //         if (connection) {
    //             connection.release();
    //         }
    //     }
    // }


    async create(
        connection: PoolConnection,
        name_en: string,
        name_ar: string,
        category_id: number,
        about_en: string,
        about_ar: string,
        actual_price: number,
        discounted_price: number,
        service_image_en_url: string,
        service_image_ar_url: string,
        can_redeem: boolean
    ): Promise<Service> {
        try {
            // Check for duplicate service by name and category
            const [rows] = await connection.query<any[]>(
                `SELECT id FROM service 
                WHERE (name_en = ? OR name_ar = ?) 
                AND category_id = ?`,
                [name_en, name_ar, category_id]
            );

            if (rows.length > 0) {
                throw ERRORS.DUPLICATE_RECORD;
            }

            const [result] = await connection.query<ResultSetHeader>(
                `INSERT INTO service 
                (name_en, name_ar, category_id, about_en, about_ar, actual_price, discounted_price, service_image_en_url, service_image_ar_url, can_redeem) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name_en, name_ar, category_id, about_en, about_ar, actual_price, discounted_price, service_image_en_url, service_image_ar_url, can_redeem]
            );

            const service = await this.getServiceById(connection, result.insertId);
            return service;
        } catch (error) {
            logger.error(`Error creating service: ${error}`);
            if (error === ERRORS.DUPLICATE_RECORD) throw error;
            throw ERRORS.DATABASE_ERROR;
        }
    }


    async update(connection: PoolConnection, id: number, name_en: string, name_ar: string, category_id: number, about_en: string, about_ar: string, actual_price: number, discounted_price: number, service_image_en_url: string, service_image_ar_url: string, can_redeem: boolean): Promise<Service> {
        try {
            await connection.query<ResultSetHeader>(
                'UPDATE service SET name_en = ?, name_ar = ?, category_id = ?, about_en = ?, about_ar = ?, actual_price = ?, discounted_price = ?, service_image_en_url = ?, service_image_ar_url = ?, can_redeem = ? WHERE id = ?',
                [name_en, name_ar, category_id, about_en, about_ar, actual_price, discounted_price, service_image_en_url, service_image_ar_url, can_redeem, id]
            );
            const updatedService = await this.getServiceById(connection, id);
            return updatedService;
        } catch (error) {
            logger.error(`Error updating service: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async deleteCategory(connection: PoolConnection, category_id: number): Promise<void> {
        try {
            await connection.query<ResultSetHeader>('DELETE FROM service_category WHERE id = ?', [category_id]);
        } catch (error) {
            logger.error(`Error deleting category: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async updateCategory(connection: PoolConnection, id: number, name_en: string, name_ar: string, image_ar: string, image_en: string, type: string): Promise<ServiceCategory> {
        try {
            await connection.query<ResultSetHeader>(
                'UPDATE service_category SET name_en = ?, name_ar = ?, image_ar = ?, image_en = ?, type = ? WHERE id = ?',
                [name_en, name_ar, image_ar, image_en, type, id]
            );
            const updatedCategory = await this.getServiceCategoryById(connection, id);
            return updatedCategory;
        } catch (error) {
            logger.error(`Error updating category: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async getAllServicesByCategory(connection: PoolConnection, category_id: number, branch_id?: number): Promise<Service[]> {
        console.log(category_id,branch_id);
        try {
            if (!branch_id || branch_id === 0) {
                const [services,] = await connection.query<ServiceRow[]>('SELECT * from service WHERE category_id = ?', [category_id]);
                return services;
            } else {
                const [services,] = await connection.query<ServiceRow[]>(
                    'SELECT DISTINCT s.* FROM service s INNER JOIN service_branch sb ON s.id = sb.service_id WHERE s.category_id = ? AND sb.branch_id = ?',
                    [category_id, branch_id]
                );
                return services;
            }
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getServicesByIds(connection: PoolConnection, serviceIds: number[]): Promise<Service[]> {
        try {
            if (serviceIds.length === 0) {
                return [];
            }
            const placeholders = serviceIds.map(() => '?').join(',');
            const [services,] = await connection.query<ServiceRow[]>(
                `SELECT * FROM service WHERE id IN (${placeholders})`,
                serviceIds
            );
            return services;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    // async createCategory(connection: PoolConnection, name_en: string, name_ar: string, image_ar: string, image_en: string, type: string): Promise<ServiceCategory> {
    //     try {
    //         const [result] = await connection.query<ResultSetHeader>('INSERT INTO service_category (name_en, name_ar, image_ar, image_en, type) VALUES (?, ?, ?, ?, ?)', [name_en, name_ar, image_ar, image_en, type]);
    //         const category = await this.getServiceCategoryById(connection, result.insertId);
    //         return category;
    //     } catch (error) {
    //         logger.error(`Error creating category: ${error}`);
    //         throw ERRORS.DATABASE_ERROR;
    //     } finally {
    //         if (connection) {
    //             connection.release();
    //         }
    //     }
    // }

    async createCategory(
        connection: PoolConnection,
        name_en: string,
        name_ar: string,
        image_ar: string,
        image_en: string,
        type: string
    ): Promise<ServiceCategory> {
        try {
            // Check for duplicate
            const [rows] = await connection.query<any[]>(
                'SELECT id FROM service_category WHERE (name_en = ? OR name_ar = ?) AND type = ?',
                [name_en, name_ar, type]
            );

            if (rows.length > 0) {
                throw ERRORS.DUPLICATE_CATEGORY;
            }

            const [result] = await connection.query<ResultSetHeader>(
                'INSERT INTO service_category (name_en, name_ar, image_ar, image_en, type) VALUES (?, ?, ?, ?, ?)',
                [name_en, name_ar, image_ar, image_en, type]
            );

            const category = await this.getServiceCategoryById(connection, result.insertId);
            return category;
        } catch (error) {
            logger.error(`Error creating category: ${error}`);
            if (error === ERRORS.DUPLICATE_CATEGORY) throw error;
            throw ERRORS.DATABASE_ERROR;
        } 
        // finally {
        //     if (connection) {
        //         connection.release();
        //     }
        // }
    }


    async getTimeSlots(connection: PoolConnection, service_id: number): Promise<ServiceTimeSlot[]> {
        try {
            const [timeSlots,] = await connection.query<ServiceTimeSlotRow[]>('SELECT * from service_time_slot WHERE service_id = ? and is_active = 1', [service_id]);
            return timeSlots;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getServiceTimeSlotByIdOrNull(connection: PoolConnection, time_slot_id: number): Promise<ServiceTimeSlot | null> {
        try {
            const [timeSlots,] = await connection.query<ServiceTimeSlotRow[]>('SELECT * from service_time_slot WHERE id = ? and is_active = 1', [time_slot_id]);
            if (timeSlots.length === 0) {
                return null;
            }
            return timeSlots[0];
        }
        catch (error) {
            logger.error(`Error getting service time slot: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async searchServiceTimeSlot(connection: PoolConnection, service_id: number, start_time: string, end_time: string): Promise<ServiceTimeSlot | null> {
        try {
            const [timeSlots,] = await connection.query<ServiceTimeSlotRow[]>('SELECT * from service_time_slot WHERE service_id = ? AND start_time = ? AND end_time = ?', [service_id, start_time, end_time]);
            if (timeSlots.length === 0) {
                return null;
            }
            return timeSlots[0];
        }
        catch (error) {
            logger.error(`Error getting service time slot: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async setActiveDoctorTimeSlot(connection: PoolConnection, time_slot_id: number, is_active: boolean): Promise<ServiceTimeSlot> {
        try {
            await connection.query<ResultSetHeader>(
                'UPDATE service_time_slot SET is_active = ? WHERE id = ?',
                [is_active, time_slot_id]
            );
            const updatedTimeSlot = await this.getServiceTimeSlotByIdOrNull(connection, time_slot_id);
            if (!updatedTimeSlot) {
                throw ERRORS.SERVICE_TIME_SLOT_NOT_FOUND;
            }
            return updatedTimeSlot;
        } catch (error) {
            logger.error(`Error updating service time slot: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async createServiceTimeSlot(connection: PoolConnection, service_id: number, start_time: string, end_time: string): Promise<ServiceTimeSlot> {
        try {
            const service_time_slots = await this.searchServiceTimeSlot(connection, service_id, start_time, end_time);
            if (service_time_slots) {
                const doctorTimeSlot = await this.setActiveDoctorTimeSlot(connection, service_time_slots.id, true);
                return doctorTimeSlot;
            } else {
                const [result] = await connection.query<ResultSetHeader>(
                    'INSERT INTO service_time_slot (service_id, start_time, end_time) VALUES (?, ?, ?)',
                    [service_id, start_time, end_time]
                );
                const [timeSlots,] = await connection.query<ServiceTimeSlotRow[]>('SELECT * from service_time_slot WHERE id = ?', [result.insertId]);
                return timeSlots[0];
            }
        } catch (error) {
            logger.error(`Error creating service time slot: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        } 
        // finally {
        //     if (connection) {
        //         connection.release();
        //     }
        // }
    }

    async addServiceToBranch(connection: PoolConnection, service_id: number, branch_id: number, maximum_booking_per_slot: number): Promise<ServiceBranch> {
        try {
            const [result] = await connection.query<ResultSetHeader>(
                'INSERT INTO service_branch (branch_id, service_id, maximum_booking_per_slot) VALUES (?, ?, ?)',
                [branch_id, service_id, maximum_booking_per_slot]
            );
            const service_branch = this.getServiceBranchOrNull(connection, service_id, branch_id);
            // We know that it will never be null
            return service_branch as unknown as ServiceBranch;
        } catch (error) {
            logger.error(`Error adding service to branch: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }
    async updateServiceBranchActiveAndMaxTimeSlot(connection: PoolConnection, service_id: number, branch_id: number, is_active: boolean, maximum_booking_per_slot: number): Promise<ServiceBranch> {
        try {
            await connection.query<ResultSetHeader>(
                'UPDATE service_branch SET is_active = ?, maximum_booking_per_slot = ? WHERE service_id = ? AND branch_id = ?',
                [is_active, maximum_booking_per_slot, service_id, branch_id]
            );
            const [serviceBranch,] = await connection.query<ServiceBranchRow[]>('SELECT * from service_branch WHERE service_id = ? AND branch_id = ?', [service_id, branch_id]);
            return serviceBranch[0];
        }
        catch (error) {
            logger.error(`Error updating service branch: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async createServiceBranch(connection: PoolConnection, service_id: number, branch_id: number, maximum_booking_per_slot: number): Promise<ServiceBranch> {
        try {
            const service_branch = await this.getServiceBranchOrNull(connection, service_id, branch_id);
            if (service_branch) {
                return this.updateServiceBranchActiveAndMaxTimeSlot(connection, service_branch.service_id, service_branch.branch_id, true, maximum_booking_per_slot);
            } else {
                const [result] = await connection.query<ResultSetHeader>(
                    'INSERT INTO service_branch (branch_id, service_id, maximum_booking_per_slot) VALUES (?, ?, ?)',
                    [branch_id, service_id, maximum_booking_per_slot]
                );
                
                return {
                    branch_id,
                    service_id,
                    maximum_booking_per_slot,
                    is_active: true
                }
            }
        } catch (error) {
            logger.error(`Error creating service branch: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async setAllServiceBranchesInactive(connection: PoolConnection, service_id: number): Promise<void> {
        try {
            await connection.query('UPDATE service_branch SET is_active = 0 WHERE service_id = ?', [service_id]);
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getServiceBranchOrNull(connection: PoolConnection, service_id: number, branch_id: number): Promise<ServiceBranch | null> {
        try {
            const [serviceBranch,] = await connection.query<ServiceBranchRow[]>('SELECT * from service_branch WHERE branch_id = ? AND service_id = ?', [branch_id, service_id]);
            if (serviceBranch.length === 0) {
                return null
            }
            return serviceBranch[0];
        }
        catch (error) {
            logger.error(`Error getting service branch: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async getServicesForBranch(connection: PoolConnection, branch_id: number): Promise<Service[]> {
        try {
            const [services,] = await connection.query<ServiceRow[]>(
                'SELECT s.* FROM service s JOIN branch_service bs ON s.id = bs.service_id WHERE bs.branch_id = ?',
                [branch_id]
            );
            return services;
        } catch (error) {
            logger.error(`Error getting services for branch: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async getRedeemableServices(connection: PoolConnection): Promise<Service[]> {
        try {
            const [services,] = await connection.query<ServiceRow[]>(
                'SELECT * FROM service WHERE can_redeem = 1'
            );
            return services;
        } catch (error) {
            logger.error(`Error getting redeemable services: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }
    
    async getMaximumBooking(connection: PoolConnection, service_id: number, branch_id: number): Promise<MaxBooking> {
        try {
            const [result,] = await connection.query<MaxBookingRow[]>(
                'SELECT maximum_booking_per_slot FROM service_branch WHERE service_id = ? AND branch_id = ?',
                [service_id, branch_id]
            );
            if (result.length === 0) {
                throw ERRORS.BOOKING_NOT_FOUND_FOR_SERVICE;
            }
            return result[0]
        } catch (error) {
            logger.error(`Error getting maximum booking: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async getAllServicesForBranch(connection: PoolConnection, branch_id: number): Promise<ServiceBranch[]> {
        try {
            const [services,] = await connection.query<ServiceBranchRow[]>(
                'SELECT * FROM service_branch WHERE branch_id = ?',
                [branch_id]
            );
            return services;
        } catch (error) {
            logger.error(`Error getting all services for branch: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async getAllBranchesForService(connection: PoolConnection, service_id: number): Promise<ServiceBranch[]> {
        try {
            const [services,] = await connection.query<ServiceBranchRow[]>(
                'SELECT * FROM service_branch WHERE service_id = ?',
                [service_id]
            );
            return services;
        } catch (error) {
            logger.error(`Error getting all branches for service: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async getFeaturedServices(connection: PoolConnection, branch_id?: number): Promise<Service[]> {
        try {
            if (!branch_id || branch_id === 0) {
                // Show all featured services from all branches
                const [services,] = await connection.query<ServiceRow[]>('SELECT * FROM service LIMIT 5');
                return services;
            } else {
                // Show featured services only from the specified branch
                const [services,] = await connection.query<ServiceRow[]>(
                    `SELECT DISTINCT s.* 
                    FROM service s 
                    INNER JOIN service_branch sb ON s.id = sb.service_id 
                    WHERE sb.branch_id = ?
                    LIMIT 5`,
                    [branch_id]
                );
                return services;
            }
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async deleteService(connection: PoolConnection, service_id: number): Promise<void> {
        try {
            await connection.query<ResultSetHeader>('DELETE FROM service WHERE id = ?', [service_id]);
        } catch (error) {
            logger.error(`Error deleting service: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }

    async getMaximumBookingBulkForUpdate(
        connection: PoolConnection,
        pairs: Array<{ service_id: number; branch_id: number }>
    ): Promise<Record<string, { maximum_booking_per_slot: number }>> {
        if (pairs.length === 0) return {};

        const conditions = pairs.map(() => `(service_id = ? AND branch_id = ?)`).join(' OR ');
        const values = pairs.flatMap(p => [p.service_id, p.branch_id]);

        const [rows] = await connection.query(
            `SELECT service_id, branch_id, maximum_booking_per_slot
            FROM service_capacity
            WHERE ${conditions}
            FOR UPDATE`,
            values
        );

        const result: Record<string, { maximum_booking_per_slot: number }> = {};
        for (const row of rows as Array<{ service_id: number; branch_id: number; maximum_booking_per_slot: number }>) {
            const key = `${row.service_id}::${row.branch_id}`;
            result[key] = { maximum_booking_per_slot: row.maximum_booking_per_slot };
        }

        return result;
    }

    async getServiceBranchesByServiceId(connection: PoolConnection, service_id: number): Promise<ServiceBranch[]> {
        try {
            const [serviceBranches,] = await connection.query<ServiceBranchRow[]>('SELECT * from service_branch WHERE service_id = ?', [service_id]);
            return serviceBranches;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }
    async deleteServiceBranch(connection: PoolConnection, service_id: number, branch_id: number): Promise<void> {
        try {
            await connection.query<ResultSetHeader>(
                'DELETE FROM service_branch WHERE service_id = ? AND branch_id = ?',
                [service_id, branch_id]
            );
        } catch (error) {
            logger.error(`Error deleting service branch: ${error}`);
            throw ERRORS.DATABASE_ERROR;
        }
    }
}