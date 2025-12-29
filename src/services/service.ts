import { createServiceView, Service, ServiceBranch, ServiceCategory, ServiceTimeSlot, ServiceTimeSlotAvailableView, ServiceView } from "@models/service";
import BookingRepository from "@repository/booking";
import BranchRepository from "@repository/branch";
import ServiceRepository from "@repository/service";
import pool from "@utils/db";
import { ERRORS, RequestError } from "@utils/error";
import createLogger from "@utils/logger";
import { log } from "console";
import e from "express";

import { PoolConnection } from "mysql2/promise";

const logger = createLogger('@serviceService');

export default class SettingService {
    serviceRepository: ServiceRepository;
    branchRepository: BranchRepository;
    bookingRepository: BookingRepository;

    constructor() {
        this.serviceRepository = new ServiceRepository();
        this.branchRepository = new BranchRepository();
        this.bookingRepository = new BookingRepository();
    }

    async getAll(branch_id?: number): Promise<ServiceView[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const services = await this.serviceRepository.getAllServices(connection, branch_id);
            const ServiceCategory = await this.serviceRepository.getAllServicesCategories(connection);
            const serviceCategoryMap = new Map<number, ServiceCategory>();
            ServiceCategory.forEach((category) => {
                serviceCategoryMap.set(category.id, category);
            });
            const serviceViews: ServiceView[] = []
            for (let i = 0; i < services.length; i++) {
                const service = services[i];
                const serviceCategory = serviceCategoryMap.get(service.category_id);
                if (!serviceCategory) {
                    continue;
                }
                serviceViews.push(createServiceView(service, serviceCategory));
            }
            return serviceViews;
        } catch (error) {
            logger.error(`Error getting all settings: ${error}`);
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async create(name_en: string, name_ar: string, category_id: number, about_en: string, about_ar: string, actual_price: number, discounted_price: number, service_image_en_url: string, service_image_ar_url: string, can_redeem: boolean ): Promise<ServiceView> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const service_category = await this.serviceRepository.getServiceCategoryByIdOrNull(connection, category_id);
            if (!service_category) {
                throw ERRORS.INVALID_SERVICE_CATEGORY;
            }
            const service = await this.serviceRepository.create(connection, name_en, name_ar, category_id, about_en, about_ar, actual_price, discounted_price, service_image_en_url, service_image_ar_url, can_redeem);
            return createServiceView(service, service_category);
        } catch (error) {
            if(error instanceof RequestError) {
                throw error;
            }
            logger.error(`Error creating service: ${error}`);
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async update(id: number, name_en: string | undefined, name_ar: string | undefined, category_id: number | undefined, about_en: string | undefined, about_ar: string | undefined, actual_price: number | undefined, discounted_price: number | undefined, service_image_en_url: string | undefined, service_image_ar_url: string | undefined, can_redeem: boolean | undefined): Promise<ServiceView> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const service = await this.serviceRepository.getServiceByIdOrNull(connection, id);
            logger.error(`service: ${service}`);
            if (!service) {
                throw ERRORS.SERVICE_NOT_FOUND;
            }
            if(name_en !== undefined) {
                service.name_en = name_en;
            }
            if(name_ar !== undefined) {
                service.name_ar = name_ar;
            }
            if(about_en !== undefined) {
                service.about_en = about_en;
            }
            if(about_ar !== undefined) {
                service.about_ar = about_ar;
            }
            if(actual_price !== undefined) {
                service.actual_price = actual_price;
            }
            if(discounted_price !== undefined) {
                service.discounted_price = discounted_price;
            }
            if(service_image_en_url !== undefined) {
                service.service_image_en_url = service_image_en_url;
            }
            if(service_image_ar_url !== undefined) {
                service.service_image_ar_url = service_image_ar_url;
            }
            if(can_redeem !== undefined) {
                service.can_redeem = can_redeem;
            }
            
            let serviceCategory: ServiceCategory;
            if(category_id !== undefined) {
                const serviceCategory_temp = await this.serviceRepository.getServiceCategoryByIdOrNull(connection, category_id);
                if (!serviceCategory_temp) {
                    throw ERRORS.INVALID_SERVICE_CATEGORY;
                }
                serviceCategory = serviceCategory_temp
                service.category_id = category_id;
            } else {
                serviceCategory = await this.serviceRepository.getServiceCategoryById(connection, service.category_id);
            }

            const updatedService = await this.serviceRepository.update(connection, id, service.name_en, service.name_ar, service.category_id, service.about_en, service.about_ar, service.actual_price, service.discounted_price, service.service_image_en_url, service.service_image_ar_url, service.can_redeem);
            return createServiceView(updatedService, serviceCategory);
        } catch (error) {
            if(error instanceof RequestError) {
                throw error;
            }
            logger.error(`Error updating service: ${error}`);
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
        }
    }

    async getAllByCategory( category_id: number): Promise<ServiceView[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const serviceCategory = await this.serviceRepository.getServiceCategoryById(connection, category_id);
            if (!serviceCategory) {
                throw ERRORS.INVALID_SERVICE_CATEGORY;
            }
            const services = await this.serviceRepository.getAllServicesByCategory(connection, category_id);
            const serviceViews: ServiceView[] = []
            for (let i = 0; i < services.length; i++) {
                const service = services[i];
                serviceViews.push(createServiceView(service, serviceCategory));
            }
            return serviceViews;
        } catch (error) {
            if(error instanceof RequestError) {
                throw error;
            }
            logger.error(`Error updating service: ${error}`);
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async createCategory(name_en: string, name_ar: string, image_ar: string, image_en: string, type: string): Promise<ServiceCategory> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const category = await this.serviceRepository.createCategory(connection, name_en, name_ar, image_ar, image_en, type);
            return category;
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            logger.error(`Error creating category: ${error}`);
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async updateCategory(category_id: number, name_ar: string | undefined, name_en: string | undefined, image_ar: string | undefined, image_en: string | undefined, type: string | undefined): Promise<ServiceCategory> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            let category = await this.serviceRepository.getServiceCategoryByIdOrNull(connection, category_id);
            if (!category) {
                throw ERRORS.INVALID_SERVICE_CATEGORY;
            }
            if (name_ar) {
                category.name_ar = name_ar;
            }
            if (name_en) {
                category.name_en = name_en;
            }
            if (image_ar) {
                category.image_ar = image_ar;
            }
            if (image_en) {
                category.image_en = image_en;
            }
            if (type) {
                category.type = type;
            }
            const newCategory = await this.serviceRepository.updateCategory(connection, category_id, category.name_en, category.name_ar, category.image_ar, category.image_en, category.type);
            return newCategory;
        } catch (error) {
            if(error instanceof RequestError) {
                throw error;
            }
            logger.error(`Error updating service: ${error}`);
            throw ERRORS.INTERNAL_SERVER_ERROR;
        }
    }
        

    async getTimeSlots(service_id: number): Promise<ServiceTimeSlot[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const service = await this.serviceRepository.getServiceById(connection, service_id);
            if (!service) {
                throw ERRORS.SERVICE_NOT_FOUND;
            }
            const timeSlots = await this.serviceRepository.getTimeSlots(connection, service_id);
            return timeSlots;
        } catch (error) {
            if (error instanceof RequestError) {
                throw error;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getAvailableTimeSlots(service_id: number, branch_id: number, date: string): Promise<ServiceTimeSlotAvailableView[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const service = await this.serviceRepository.getServiceById(connection, service_id);
            if (!service) {
                throw ERRORS.SERVICE_NOT_FOUND;
            }
            const service_branch =  await this.serviceRepository.getServiceBranchOrNull(connection, service_id, branch_id);
            if (!service_branch) {
                throw ERRORS.BRANCH_NOT_FOUND;
            }
            const timeSlots = await this.serviceRepository.getTimeSlots(connection, service_id);
            if(!timeSlots) {
                throw ERRORS.SERVICE_TIME_SLOT_NOT_FOUND;
            }
            const booking = await this.bookingRepository.getAllServiceBookingForBranch(connection, service_id, branch_id, date);

            const time_slot_ids = booking.map((bookingService) => bookingService.time_slot_id);
            const time_slot_map = new Map<number, number>();
            time_slot_ids.forEach((time_slot_id) => {
                if (time_slot_map.has(time_slot_id)) {
                    const current = time_slot_map.get(time_slot_id) ?? 0;
                    time_slot_map.set(time_slot_id, current + 1);
                } else {
                    time_slot_map.set(time_slot_id, 1);
                }
            });
            return timeSlots.map((timeSlot) => {
                const available = time_slot_map.get(timeSlot.id) ?? 0;
                return {
                    id: timeSlot.id,
                    service_id: timeSlot.service_id,
                    start_time: timeSlot.start_time,
                    end_time: timeSlot.end_time,
                    available: available < service_branch.maximum_booking_per_slot
                }
            })
        } catch (error) {
            if (error instanceof RequestError) {
                throw error;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async createServiceTimeSlot(service_id: number, start_time: string, end_time: string): Promise<ServiceTimeSlot> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const service = await this.serviceRepository.getServiceById(connection, service_id);
            if (!service) {
                throw ERRORS.SERVICE_NOT_FOUND;
            }
            const timeSlot = await this.serviceRepository.createServiceTimeSlot(connection, service_id, start_time, end_time);
            return timeSlot;
        } catch (error) {
            if (error instanceof RequestError) {
                throw error;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
        }
    }

    async createServiceTimeSlots(service_id: number, time_slots: {start_time: string, end_time: string}[]): Promise<ServiceTimeSlot[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const service = await this.serviceRepository.getServiceById(connection, service_id);
            if (!service) {
                throw ERRORS.SERVICE_NOT_FOUND;
            }
            const timeSlots: ServiceTimeSlot[] = [];
            for(const time_slot of time_slots) {
                if (!time_slot.start_time || !time_slot.end_time) {
                    throw ERRORS.INVALID_TIME_SLOT;
                }
                const timeSlot = await this.serviceRepository.createServiceTimeSlot(connection, service_id, time_slot.start_time, time_slot.end_time);
                timeSlots.push(timeSlot);
            }
            return timeSlots;
        } catch (error) {
            if (error instanceof RequestError) {
                throw error;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
        }
    }

    async updateServiceTimeSlots(service_id: number, time_slots: {start_time: string, end_time: string}[]): Promise<ServiceTimeSlot[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const service = await this.serviceRepository.getServiceByIdOrNull(connection, service_id);
            if (!service) {
                throw ERRORS.SERVICE_NOT_FOUND;
            }
            const timeSlots: ServiceTimeSlot[] = [];
            await this.serviceRepository.setAllServiceTimeSlotsInactive(connection, service_id);
            for(const time_slot of time_slots) {
                if (!time_slot.start_time || !time_slot.end_time) {
                    throw ERRORS.INVALID_TIME_SLOT;
                }
                const timeSlot = await this.serviceRepository.createServiceTimeSlot(connection, service_id, time_slot.start_time, time_slot.end_time);
                timeSlots.push(timeSlot);
            }
            return timeSlots;
        } catch (error) {
            if (error instanceof RequestError) {
                throw error;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
        }
    }

    async getServicesForBranch(branch_id: number): Promise<ServiceView[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const branch = await this.branchRepository.getBranchById(connection, branch_id);
            if (!branch) {
                throw ERRORS.BRANCH_NOT_FOUND;
            }
            const services = await this.serviceRepository.getServicesForBranch(connection, branch_id);
            const serviceCategory = await this.serviceRepository.getAllServicesCategories(connection);
            let serviceCategoryMap = new Map<number, ServiceCategory>();
            serviceCategory.forEach((category) => {
                serviceCategoryMap.set(category.id, category);
            });
            const serviceViews: ServiceView[] = []
            for (let i = 0; i < services.length; i++) {
                const service = services[i];
                const serviceCategory = serviceCategoryMap.get(service.category_id);
                if (!serviceCategory) {
                    continue;
                }
                serviceViews.push(createServiceView(service, serviceCategory));
            }
            return serviceViews;
        } catch (error) {
            if (error instanceof RequestError) {
                throw error;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async addServiceToBranch(service_id: number, branch_id: number, maximum_booking_per_slot: number): Promise<ServiceBranch> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const service = await this.serviceRepository.getServiceById(connection, service_id);
            if (!service) {
                throw ERRORS.SERVICE_NOT_FOUND;
            }
            const branch = await this.branchRepository.getBranchById(connection, branch_id);
            if (!branch) {
                throw ERRORS.BRANCH_NOT_FOUND;
            }
            const serviceBranch = await this.serviceRepository.addServiceToBranch(connection, service_id, branch_id, maximum_booking_per_slot);
            return serviceBranch;
        } catch (error) {
            if (error instanceof RequestError) {
                throw error;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
        }
    }

    async addServiceToBranches(service_id: number, branches: {branch_id: number, maximum_booking_per_slot: number}[]): Promise<ServiceBranch[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const service = await this.serviceRepository.getServiceById(connection, service_id);
            if (!service) {
                throw ERRORS.SERVICE_NOT_FOUND;
            }
            const serviceBranches: ServiceBranch[] = [];
            for(const branch of branches) {
                const branch_new = await this.branchRepository.getBranchByIdOrNull(connection, branch.branch_id);
                if (!branch_new) {
                    throw ERRORS.BRANCH_NOT_FOUND;
                }
                const service_branch = await this.serviceRepository.createServiceBranch(connection, service_id, branch.branch_id, branch.maximum_booking_per_slot);
                serviceBranches.push(service_branch);
            }
            return serviceBranches;
        } catch (error) {
            if (error instanceof RequestError) {
                throw error;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
        }
    }

    async updateServiceToBranches(service_id: number, branches: {branch_id: number, maximum_booking_per_slot: number}[]): Promise<ServiceBranch[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const service = await this.serviceRepository.getServiceById(connection, service_id);
            if (!service) {
                throw ERRORS.SERVICE_NOT_FOUND;
            }
            const serviceBranches: ServiceBranch[] = [];
            await this.serviceRepository.setAllServiceBranchesInactive(connection, service_id);
            for(const branch of branches) {
                const branch_new = await this.branchRepository.getBranchByIdOrNull(connection, branch.branch_id);
                if (!branch_new) {
                    throw ERRORS.BRANCH_NOT_FOUND;
                }
                const service_branch = await this.serviceRepository.createServiceBranch(connection, service_id, branch.branch_id, branch.maximum_booking_per_slot);
                serviceBranches.push(service_branch);
            }
            return serviceBranches;
        } catch (error) {
            if (error instanceof RequestError) {
                throw error;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
        }
    }


    async getRedeemableServices(): Promise<ServiceView[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const services = await this.serviceRepository.getRedeemableServices(connection);
            const serviceCategory = await this.serviceRepository.getAllServicesCategories(connection);
            let serviceCategoryMap = new Map<number, ServiceCategory>();
            serviceCategory.forEach((category) => {
                serviceCategoryMap.set(category.id, category);
            });
            const serviceViews: ServiceView[] = []
            for (let i = 0; i < services.length; i++) {
                const service = services[i];
                const serviceCategory = serviceCategoryMap.get(service.category_id);
                if (!serviceCategory) {
                    continue;
                }
                serviceViews.push(createServiceView(service, serviceCategory));
            }
            return serviceViews;
        } catch (error) {
            logger.error(`Error getting redeemable services: ${error}`);
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getAllCategory(): Promise<ServiceCategory[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const categories = await this.serviceRepository.getAllServicesCategories(connection);
            return categories;
        } catch (error) {
            logger.error(`Error getting all categories: ${error}`);
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getFeaturedServices(branch_id?: number): Promise<Service[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.serviceRepository.getFeaturedServices(connection, branch_id);
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

    async delete(id: number): Promise<Service> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const service = await this.serviceRepository.getServiceByIdOrNull(connection, id);
            if (!service) {
                throw ERRORS.SERVICE_NOT_FOUND;
            }
            await this.serviceRepository.deleteService(connection, id);
            return service;
        } catch (error) {
            if (error instanceof RequestError) {
                throw error;
            }
            logger.error(`Error deleting service: ${error}`);
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}