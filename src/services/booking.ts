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

    async bookService(service_id: number, time_slot_id: number, user_id: number, date: string, branch_id: number): Promise<BookingServiceI> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const maximumBooking = await this.serviceRepository.getMaximumBooking(connection, service_id, branch_id);
            const isValidtimeSlot = await this.bookingRepository.checkTimeSlotExists(connection, service_id,time_slot_id)

            if(!isValidtimeSlot){
                throw ERRORS.SERVICE_NOT_FOUND
            }
            const existingBooking = await this.bookingRepository.getAllServiceBookingForSlot(connection, service_id, date, time_slot_id, branch_id);
            if (existingBooking.length >= maximumBooking.maximum_booking_per_slot) {
                throw ERRORS.ALL_SLOTS_ALREADY_BOOKED_FOR_THIS_SERVICE;
            }
            const vat = await this.vatRepository.getVat(connection);
            const booking = await this.bookingRepository.bookService(connection, service_id, time_slot_id, user_id, date, branch_id, vat);
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
        items: Array<{ service_id: number; time_slot_id: number; date: string; branch_id: number }>,
        user_id: number,
        user_note?: string
    ): Promise<BookingServiceI[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1) Validate time slots exist for all items (single DB call preferred)
            const distinctPairs = Array.from(
            new Set(items.map(i => `${i.service_id}::${i.time_slot_id}`))
            ).map(s => {
            const [service_id, time_slot_id] = s.split('::').map(Number);
            return { service_id, time_slot_id };
            });

            const validMap = await this.bookingRepository.checkTimeSlotsExistBulk(connection, distinctPairs);
            console.log("########",validMap);

            for (const p of distinctPairs) {
                const key = `${p.service_id}::${p.time_slot_id}`;
                console.log(key);
                if (!validMap[key]) {
                    console.log("**************************")
                    throw ERRORS.SERVICE_TIME_SLOT_NOT_FOUND;
                }
            }

            // 2) Lock relevant service-slot capacity rows to avoid race conditions
            // Use repository to fetch maximumBooking rows with SELECT ... FOR UPDATE
            // const capacityMap = await this.serviceRepository.getMaximumBookingBulkForUpdate(
            // connection,
            // items.map(i => ({ service_id: i.service_id, branch_id: i.branch_id }))
            // );

            // 3) For each item, count existing bookings in the same slot (use FOR SHARE or rely on committed rows after lock)
            // const countsMap = await this.bookingRepository.countBookingsForSlotsBulk(
            //     connection,
            //     items.map(i => ({ service_id: i.service_id, date: i.date, time_slot_id: i.time_slot_id, branch_id: i.branch_id }))
            // );

            // // 4) Validate capacities
            // for (const it of items) {
            // const key = `${it.service_id}::${it.branch_id}`;
            // const cap = capacityMap[key];
            // if (!cap) throw ERRORS.ALL_SLOTS_ALREADY_BOOKED_FOR_THIS_SERVICE;
            // const current = countsMap[`${it.service_id}::${it.date}::${it.time_slot_id}::${it.branch_id}`] ?? 0;
            // if (current + 1 > cap.maximum_booking_per_slot) {
            //     throw ERRORS.ALL_SLOTS_ALREADY_BOOKED_FOR_THIS_SERVICE;
            // }
            // }

            // 5) Fetch VAT once (or per-service if necessary)
            const vat = await this.vatRepository.getVat(connection);

            // 6) Insert bookings one-by-one (or batch) and collect results
            const created: BookingServiceI[] = [];
            for (const it of items) {
                // Optional: prevent duplicate booking by same user for same service/time/date/branch
                const duplicate = await this.bookingRepository.findDuplicateBooking(connection, it.service_id, it.time_slot_id, user_id, it.date, it.branch_id);
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
                    it.time_slot_id,
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

    async rescheduleService(booking_id: number, time_slot_id: number, user_id: number, date: string, is_admin: boolean): Promise<any> {
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
            const existingBooking = await this.bookingRepository.getServiceBookingOrNull(connection, booking.service_id, date, time_slot_id, booking_id);
            if (existingBooking) {
                throw ERRORS.DOCTOR_ALREADY_BOOKED_FOR_THIS_SLOT;
            }
            const oldBooking = await this.bookingRepository.rescheduleService(connection, booking_id);
            const newBooking = await this.bookingRepository.bookService(connection, booking.service_id, time_slot_id, user_id, date, booking.branch_id, booking.vat_percentage);
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

    async getCompletedBookings(branch_id: number, user_id: number): Promise<BookingDoctorDetails[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const doctorBookings = await this.bookingRepository.getPastDoctorBookings(connection, branch_id, user_id);
            return doctorBookings;
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
}
