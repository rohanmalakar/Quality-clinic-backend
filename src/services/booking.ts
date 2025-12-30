import { BookingDoctor, BookingDoctorDetails, BookingDoctorView, BookingServiceDetails, BookingServiceI, BookingServiceView } from "@models/booking";
import { Doctor } from "@models/doctor";
import BookingRepository from "@repository/booking";
import BranchRepository from "@repository/branch";
import DoctorRepository from "@repository/doctor";
import QPointRepository from "@repository/qpoint";
import ServiceRepository from "@repository/service";
import UserRepository from "@repository/user";
import VatRepository from "@repository/vat";
import pool from "@utils/db";
import { ERRORS, RequestError } from "@utils/error";
import createLogger from "@utils/logger";
import redisClient from "@utils/redis";

import { PoolConnection } from "mysql2/promise";

const logger = createLogger('@bookingService');

export default class BookingService {
    bookingRepository: BookingRepository;
    userRepository: UserRepository;
    serviceRepository: ServiceRepository;
    doctorRepository: DoctorRepository;
    branchRepository: BranchRepository;
    qpointRepository: QPointRepository;
    vatRepository: VatRepository

    constructor() {
        this.bookingRepository = new BookingRepository();
        this.userRepository = new UserRepository();
        this.serviceRepository = new ServiceRepository();
        this.doctorRepository = new DoctorRepository();
        this.branchRepository = new BranchRepository();
        this.qpointRepository = new QPointRepository();
        this.vatRepository = new VatRepository();
    }

    async bookDoctor(doctor_id: number, time_slot_id: number, user_id: number, date: string, branch_id: number): Promise<BookingDoctor> {
        let connection: PoolConnection | null = null;

        const lockKey = `lock:doctor:${doctor_id}:slot:${time_slot_id}:date:${date}`;
        const lockTTL = 15 * 60; // 15 minutes
        try {

            // Check if slot is already locked
            const existingLock = await redisClient.get(lockKey);
            if (existingLock) {
                throw ERRORS.DOCTOR_ALREADY_BOOKED_FOR_THIS_SLOT;
            }

            // Lock the slot temporarily
            const lockValue = JSON.stringify({ user_id, timestamp: Date.now() });
            const lockSet = await redisClient.set(lockKey, lockValue, { EX: lockTTL, NX: true });

            if (lockSet !== 'OK') {
                throw ERRORS.DOCTOR_ALREADY_BOOKED_FOR_THIS_SLOT;
            }
            connection = await pool.getConnection();
            await connection.beginTransaction();
            const doctor = await this.doctorRepository.getDoctorByIdOrNull(connection, doctor_id);
            if (!doctor) {
                throw ERRORS.DOCTOR_NOT_FOUND;
            }
            // check if the timeslot exists or not
            const timeSlot = await this.doctorRepository.getDoctorTimeSlotByIdOrNull(connection, time_slot_id);
            if (!timeSlot) {
                throw ERRORS.TIME_SLOT_NOT_FOUND_FOR_DOCTOR;
            }
            // check if the doctor branch exists or not
            const doctor_branch = await this.doctorRepository.getActiveDoctorBranchOrNull(connection, doctor_id, branch_id);
            console.log(doctor_branch);
            if (!doctor_branch) {
                throw ERRORS.DOCTOR_NOT_FOUND;
            }
    
            const existingBooking = await this.bookingRepository.getDoctorBookingOrNull(connection, doctor_id, date, time_slot_id, branch_id);
            if (existingBooking) {
                throw ERRORS.DOCTOR_ALREADY_BOOKED_FOR_THIS_SLOT;
            }
            const vat = await this.vatRepository.getVat(connection);
            const booking = await this.bookingRepository.bookDoctor(connection, doctor_id, time_slot_id, user_id, date, branch_id, vat);
            await connection.commit();
            return booking;
        } catch (e) {
            // Optional: release lock on error
            await redisClient.del(lockKey);
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async cancelDoctor(booking_id: number, user_id: number, is_admin: boolean): Promise<BookingDoctor> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();
            const booking = await this.bookingRepository.getBookingDoctorOrNull(connection, booking_id);
            if (!booking) {
                throw ERRORS.BOOKING_NOT_FOUND
            }
            if (!is_admin) {
                if (booking.user_id !== user_id) {
                    throw ERRORS.BOOKING_NOT_FOUND;
                }
            }
            const newBooking = await this.bookingRepository.cancelDoctor(connection, booking_id);
            await connection.commit();
            return newBooking;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }

    }

    async completeDoctor(booking_id: number, user_id: number, is_admin: boolean): Promise<BookingDoctor> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();
            const booking = await this.bookingRepository.getBookingDoctorOrNull(connection, booking_id);
            if (!booking) {
                throw ERRORS.BOOKING_NOT_FOUND
            }
            if (!is_admin) {
                if (booking.user_id !== user_id) {
                    throw ERRORS.BOOKING_NOT_FOUND;
                }
            }
            const newBooking = await this.bookingRepository.completeDoctor(connection, booking_id);
            await this.qpointRepository.insertQPoint(connection, booking.user_id, 1);
            await connection.commit();
            return newBooking;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async rescheduleDoctor(booking_id: number, time_slot_id: number, user_id: number, date: string, is_admin: boolean): Promise<BookingDoctor> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();
            const booking = await this.bookingRepository.getBookingDoctorOrNull(connection, booking_id);
            if (!booking) {
                throw ERRORS.BOOKING_NOT_FOUND
            }
            if (!is_admin) {
                if (booking.user_id !== user_id) {
                    throw ERRORS.BOOKING_NOT_FOUND;
                }
            }
            const timeSlot = await this.doctorRepository.getDoctorTimeSlotByIdOrNull(connection, time_slot_id);
            if (!timeSlot) {
                throw ERRORS.TIME_SLOT_NOT_FOUND_FOR_DOCTOR;
            }
            const existingBooking = await this.bookingRepository.getDoctorBookingOrNull(connection, booking.doctor_id, date, time_slot_id, booking.branch_id);
            if (existingBooking) {
                throw ERRORS.DOCTOR_ALREADY_BOOKED_FOR_THIS_SLOT;
            }
            const oldBooking = await this.bookingRepository.rescheduleDoctor(connection, booking_id);
            const newBooking = await this.bookingRepository.bookDoctor(connection, booking.doctor_id, time_slot_id, user_id, date, booking.branch_id, booking.vat_percentage);
            await connection.commit();
            return newBooking;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async bookService(service_id: number, user_id: number, date: string, branch_id: number): Promise<BookingServiceI> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const maximumBooking = await this.serviceRepository.getMaximumBooking(connection, service_id, branch_id);
            const existingBooking = await this.bookingRepository.getAllServiceBookingForSlot(connection, service_id, date, branch_id);
            if (existingBooking.length >= maximumBooking.maximum_booking_per_slot) {
                throw ERRORS.ALL_SLOTS_ALREADY_BOOKED_FOR_THIS_SERVICE;
            }
            const vat = await this.vatRepository.getVat(connection);
            const booking = await this.bookingRepository.bookService(connection, service_id, user_id, date, branch_id, vat);
            await connection.commit();
            return booking;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }


    async bookMultipleServices(
        items: Array<{ service_id: number; date: string; branch_id: number }>,
        user_id: number,
        user_note?: string
    ): Promise<BookingServiceI[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Fetch VAT once
            const vat = await this.vatRepository.getVat(connection);

            // Insert bookings one-by-one and collect results
            const created: BookingServiceI[] = [];
            for (const it of items) {
                // Optional: prevent duplicate booking by same user for same service/date/branch
                const duplicate = await this.bookingRepository.findDuplicateBooking(connection, it.service_id, user_id, it.date, it.branch_id);
                console.log("!!!!!!!!!!!!!!",duplicate);
                if (duplicate.length > 0) {
                    
                    const isSameUser = duplicate[0].user_id === user_id;
                    const createdAt = new Date(duplicate[0].created_at);
                    const now = new Date();

                    const ageInMs = now.getTime() - createdAt.getTime();

                    console.log("now",now);
                    console.log(ageInMs, 5 * 60 * 1000);

                    if (isSameUser || ageInMs > 5 * 60 * 1000) {
                        await this.bookingRepository.deleteBookingById(connection, duplicate[0].id);
                    } else {
                        
                        throw ERRORS.DUPLICATE_RECORD;
                    }
                }

                const b = await this.bookingRepository.bookService(
                    connection,
                    it.service_id,
                    user_id,
                    it.date,
                    it.branch_id,
                    vat
                );
                created.push(b);
            }

            await connection.commit();
            return created;
        } catch (e) {
            console.log(e)
            if (connection) {
            await connection.rollback();
            }
            if (e instanceof RequestError) throw e;
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) connection.release();
        }
    }


    async cancelService(booking_id: number, user_id: number, is_admin: boolean): Promise<BookingServiceI> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();
            const booking = await this.bookingRepository.getServiceBookingByIdOrNull(connection, booking_id);
            if (!booking) {
                throw ERRORS.BOOKING_NOT_FOUND
            }
            if (!is_admin) {
                if (booking.user_id !== user_id) {
                    throw ERRORS.BOOKING_NOT_FOUND;
                }
            }
            const newBooking = await this.bookingRepository.cancelService(connection, booking_id);
            await connection.commit();
            return newBooking;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async completeService(booking_id: number, user_id: number, is_admin: boolean): Promise<any> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();
            const booking = await this.bookingRepository.getServiceBookingByIdOrNull(connection, booking_id);
            if (!booking) {
                throw ERRORS.BOOKING_NOT_FOUND
            }
            if (!is_admin) {
                if (booking.user_id !== user_id) {
                    throw ERRORS.BOOKING_NOT_FOUND;
                }
            }
            const newBooking = await this.bookingRepository.completeService(connection, booking_id);
            await this.qpointRepository.insertQPoint(connection, booking.user_id, 1);
            await connection.commit();
            return newBooking;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async rescheduleService(booking_id: number, user_id: number, date: string, is_admin: boolean): Promise<any> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();
            await connection.beginTransaction();
            const booking = await this.bookingRepository.getServiceBookingByIdOrNull(connection, booking_id);
            if (!booking) {
                throw ERRORS.BOOKING_NOT_FOUND
            }
            if (!is_admin) {
                if (booking.user_id !== user_id) {
                    throw ERRORS.BOOKING_NOT_FOUND;
                }
            }
            const existingBooking = await this.bookingRepository.getServiceBookingOrNull(connection, booking.service_id, date, booking_id);
            if (existingBooking) {
                throw ERRORS.DOCTOR_ALREADY_BOOKED_FOR_THIS_SLOT;
            }
            const oldBooking = await this.bookingRepository.rescheduleService(connection, booking_id);
            const newBooking = await this.bookingRepository.bookService(connection, booking.service_id, user_id, date, booking.branch_id, booking.vat_percentage);
            await connection.commit();
            return newBooking;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getAllDoctorBookingsForUser(user_id: number): Promise<BookingDoctorView[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const user = await this.userRepository.getUserByIdOrNull(connection, user_id);
            if (!user) {
                throw ERRORS.USER_NOT_FOUND;
            }
            const booking = await this.bookingRepository.getAllDoctorBookingForUser(connection, user_id);
            return booking;

        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getAllServiceBookingsMetric(): Promise<BookingServiceDetails[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const booking = await this.bookingRepository.getAllServiceBookingsMetrics(connection);
            return booking;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getAllDoctorBookingsMetric(): Promise<BookingDoctorDetails[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const booking = await this.bookingRepository.getAllDoctorBookingsMetrics(connection);
            return booking;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getAllServiceBookingsForUser(user_id: number): Promise<BookingServiceView[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const user = await this.userRepository.getUserByIdOrNull(connection, user_id);
            if (!user) {
                throw ERRORS.USER_NOT_FOUND;
            }
            const booking = await this.bookingRepository.getAllServiceBookingForUser(connection, user_id);
            return booking;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getDoctorBookingDetails(bookingId: number): Promise<BookingDoctorDetails> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const booking = await this.bookingRepository.getDoctorBookingDetailOrNull(connection, bookingId);
            if (!booking) {
                throw ERRORS.BOOKING_NOT_FOUND;
            }
            return booking;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getServiceBookingDetails(bookingId: number): Promise<BookingServiceDetails> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const booking = await this.bookingRepository.getServiceBookingDetailOrNull(connection, bookingId);
            if (!booking) {
                throw ERRORS.BOOKING_NOT_FOUND;
            }
            return booking;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getUpcomingBookings(branch_id: number, user_id: number): Promise<BookingDoctorDetails[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const doctorBookings = await this.bookingRepository.getFutureDoctorBookings(connection, branch_id, user_id);
            return doctorBookings;
        } catch (e) {
            logger.error('Error in getUpcomingBookings:', e);
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getCompletedBookings(branch_id: number, user_id: number): Promise<any[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const doctorBookings = await this.bookingRepository.getPastDoctorBookings(connection, branch_id, user_id);
        
            return doctorBookings;
        } catch (e) {
            logger.error('Error in getCompletedBookings:', e);
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getUserServices(userId: number): Promise<any[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            
            // Get all bookings for the user (including duplicate service_ids)
            const bookings = await this.bookingRepository.getUserBookings(connection, userId);
            
            if (bookings.length === 0) {
                return [];
            }
            
            // Get unique service IDs to fetch service details
            const uniqueServiceIds = Array.from(new Set(bookings.map(b => b.service_id)));
            
            // Get all services and categories
            const services = await this.serviceRepository.getServicesByIds(connection, uniqueServiceIds);
            const serviceCategory = await this.serviceRepository.getAllServicesCategories(connection);
            
            // Create maps for quick lookup
            const serviceMap = new Map();
            services.forEach((service) => {
                serviceMap.set(service.id, service);
            });
            
            const serviceCategoryMap = new Map();
            serviceCategory.forEach((category) => {
                serviceCategoryMap.set(category.id, category);
            });
            
            // Build response with booking details and service info
            const serviceViews: any[] = [];
            for (const booking of bookings) {
                const service = serviceMap.get(booking.service_id);
                if (!service) {
                    continue;
                }
                
                const category = serviceCategoryMap.get(service.category_id);
                if (!category) {
                    continue;
                }
                
                serviceViews.push({
                    booking_id: booking.id,
                    booking_date: booking.date,
                    ...service,
                    category: category
                });
            }
            
            return serviceViews;
        } catch (e) {
            logger.error('Error in getUserServices:', e);
            if (e instanceof RequestError) {
                throw e;
            }
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}
