
import { EncryptionRepository } from '@repository/encryption';
import UserRepository from '@repository/user';
import SMSRepository from '@repository/sms';
import pool from '@utils/db';
import { ERRORS, RequestError } from '@utils/error';
import createLogger from '@utils/logger';
import { PoolConnection } from 'mysql2/promise';
import { AuthUser, User, UserMetic } from '@models/user';
import { createAuthToken, createRefreshToken, decodeRefreshToken } from '@utils/jwt';
import BookingRepository from '@repository/booking';
import RedeemRepository from '@repository/redeem';
import QPointRepository from '@repository/qpoint';

const logger = createLogger('@userService');

export class UserService {
    userRepository: UserRepository;
    smsRepository: SMSRepository;
    encryptionRepository: EncryptionRepository;
    qpointRepository: QPointRepository;
    redeemRepository: RedeemRepository;
    bookingRepository: BookingRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.smsRepository = new SMSRepository();
        this.encryptionRepository = new EncryptionRepository();
        this.qpointRepository = new QPointRepository();
        this.redeemRepository = new RedeemRepository();
        this.bookingRepository = new BookingRepository();
    }

    async createRegisterUserHash(email: string, name: string, phone_number: string, national_id: string | undefined, photo_url: string | undefined): Promise<string> {
        // Check if user exists
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await this.userRepository.checkIfUserExists(connection, email, phone_number, national_id);
            const otp = await this.smsRepository.sendOTP(phone_number);
           // const otp = 12345; // TODO: Remove hardcoded OTP
            const data = {
                email,
                name,
                phone_number,
                national_id,
                photo_url,
                otp
            };
            console.log('Data to encrypt:', data);

            const encryptedData = await this.encryptionRepository.encryptJSON(data);
            return encryptedData;
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

    async verifyUserAndCreate(hash: string, otp: number): Promise<AuthUser> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const data = await this.encryptionRepository.decryptJSON(hash);
            if (data.otp !== otp) {
                throw ERRORS.INVALID_OTP;
            }
            // const password_hash = await this.encryptionRepository.hashPassword(data.password);
            const user = await this.userRepository.createUser(connection, data.email, data.name, data.phone_number, data.national_id, data.photo_url);
            const accessToken = createAuthToken({ id: user.id, is_admin: user.is_admin });
            const refreshToken = createRefreshToken({ id: user.id, is_admin: user.is_admin });
            return {
                id: user.id,
                full_name: user.full_name,
                email_address: user.email_address,
                phone_number: user.phone_number,
                national_id: user.national_id,
                photo_url: user.photo_url,
                access_token: accessToken,
                refresh_token: refreshToken
            }
        }
        catch (e) {
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

    async createAdminUser(email: string, password: string, name: string, phone_number: string): Promise<AuthUser> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const password_hash = await this.encryptionRepository.hashPassword(password);
            const user = await this.userRepository.createAdminUser(connection, email, password_hash, name, phone_number);
            const accessToken = createAuthToken({ id: user.id, is_admin: user.is_admin });
            const refreshToken = createRefreshToken({ id: user.id, is_admin: user.is_admin });
            return {
                id: user.id,
                full_name: user.full_name,
                email_address: user.email_address,
                phone_number: user.phone_number,
                national_id: user.national_id,
                photo_url: user.photo_url,
                access_token: accessToken,
                refresh_token: refreshToken
            }
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

    async loginWithEmailPassword(email: string, password: string): Promise<AuthUser> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const user = await this.userRepository.getUserByEmail(connection, email);
            if (!user) {
                throw ERRORS.USER_NOT_FOUND;
            }
            const isPasswordCorrect = await this.encryptionRepository.comparePassword(password, user.password_hash);
            console.log(isPasswordCorrect)
            if (!isPasswordCorrect) {
                throw ERRORS.USER_NOT_FOUND;
            }
            const accessToken = createAuthToken({ id: user.id, is_admin: user.is_admin });
            const refreshToken = createRefreshToken({ id: user.id, is_admin: user.is_admin });
            return {
                id: user.id,
                full_name: user.full_name,
                email_address: user.email_address,
                phone_number: user.phone_number,
                national_id: user.national_id,
                photo_url: user.photo_url,
                access_token: accessToken,
                refresh_token: refreshToken
            }
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

    async loginWithPhone(phone_number: string): Promise<string> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const user = await this.userRepository.getUserByPhone(connection, phone_number);
            if (!user) {
                throw ERRORS.USER_NOT_FOUND;
            }
            const otp = await this.smsRepository.sendOTP(phone_number);
            //const otp = 123456; // TODO: Remove hardcoded OTP
            console.log(
                "Generated OTP for phone login:", otp
            );
            const data = {
                phone_number,
                otp
            };
            const encryptedData = await this.encryptionRepository.encryptJSON(data);
            return encryptedData;
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

    async loginPhoneVerify(hash: string, otp: number): Promise<AuthUser> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const data = await this.encryptionRepository.decryptJSON(hash);
            if (data.otp !== otp) {
                throw ERRORS.INVALID_OTP;
            }
            const user = await this.userRepository.getUserByPhone(connection, data.phone_number);
            if (!user) {
                throw ERRORS.USER_NOT_FOUND;
            }
            const accessToken = createAuthToken({ id: user.id, is_admin: user.is_admin });
            const refreshToken = createRefreshToken({ id: user.id, is_admin: user.is_admin });

            console.log("accessToken:", accessToken );
            return {
                id: user.id ,
                full_name: user.full_name,
                email_address: user.email_address,
                phone_number: user.phone_number,
                national_id: user.national_id,
                photo_url: user.photo_url,
                access_token: accessToken,
                refresh_token: refreshToken
            }
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

    async refreshToken(refreshToken: string): Promise<AuthUser> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const payload = decodeRefreshToken(refreshToken);
            const user = await this.userRepository.getUserById(connection, payload.id);
            if (!user) {
                throw ERRORS.USER_NOT_FOUND;
            }
            const accessToken = createAuthToken({ id: user.id, is_admin: user.is_admin });
            return {

                id: user.id,
                full_name: user.full_name,
                email_address: user.email_address,
                phone_number: user.phone_number,
                national_id: user.national_id,
                photo_url: user.photo_url,
                access_token: accessToken,
                refresh_token: refreshToken
            }
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            } else {
                logger.error(e);
                throw ERRORS.INTERNAL_SERVER_ERROR;
            }
        }
    }

    async updateUser(id: number, email_address: string | undefined, full_name: string | undefined, national_id: string | undefined, photo_url: string | undefined): Promise<User> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const user = await this.userRepository.getUserById(connection, id);
            if (!user) {
                throw ERRORS.USER_NOT_FOUND;
            }
            await this.userRepository.updateUser(connection, id, email_address, full_name, national_id, photo_url);
            const updatedUser = await this.userRepository.getUserById(connection, id);
            return updatedUser;
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

    async getUserProfile(id: number): Promise<{
        id: number;
        full_name: string;
        email_address: string;
        phone_number: string;
        national_id?: string;
        photo_url?: string;
    }> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const user = await this.userRepository.getUserById(connection, id);
            if (!user) {
                throw ERRORS.USER_NOT_FOUND;
            }
            return {
                id: user.id,
                full_name: user.full_name,
                email_address: user.email_address,
                phone_number: user.phone_number,
                national_id: user.national_id,
                photo_url: user.photo_url
            };
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

    async creteResetPasswordHash(email_address: string): Promise<String> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const user = await this.userRepository.getUserByEmail(connection, email_address);
            if (!user) {
                throw ERRORS.USER_NOT_FOUND;
            }
            const otp = await this.smsRepository.sendOTP(user.phone_number);
            const data = {
                email: user.email_address,
                otp
            };
            const encryptedData = await this.encryptionRepository.encryptJSON(data);
            return encryptedData
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

    async resetPassword(hash: string, otp: number, password: string): Promise<void> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const data = await this.encryptionRepository.decryptJSON(hash);
            if (data.otp !== otp) {
                throw ERRORS.INVALID_OTP;
            }
            const password_hash = await this.encryptionRepository.hashPassword(password);
            await this.userRepository.updatePassword(connection, data.email, password_hash);
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

    async getUserMetrics(): Promise<UserMetic[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const users = await this.userRepository.getAllUsers(connection);
            const qpointsPerUser = await this.qpointRepository.getQPointsPerUser(connection);
            const qpointsMap = new Map<number, number>();
            qpointsPerUser.forEach((qpoint) => {
                qpointsMap.set(qpoint.user_id, qpoint.points);
            });
            const redeemedPerUser = await this.redeemRepository.getRedeemedPerUser(connection);
            const redeemedMap = new Map<number, number>();
            redeemedPerUser.forEach((redeem) => {
                redeemedMap.set(redeem.user_id, redeem.redeemed);
            });
            const totalDoctorVisitsPerUser = await this.bookingRepository.getTotalDoctorVisitsPerUser(connection);
            const totalDoctorVisitsMap = new Map<number, number>();
            totalDoctorVisitsPerUser.forEach((visit) => {
                totalDoctorVisitsMap.set(visit.user_id, visit.total_visits);
            });

            const totalServiceVisitsPerUser = await this.bookingRepository.getTotalServiceVisitsPerUser(connection);
            const totalServiceVisitsMap = new Map<number, number>();
            totalServiceVisitsPerUser.forEach((visit) => {
                totalServiceVisitsMap.set(visit.user_id, visit.total_visits);
            });
            return users.map((user) => {
                return {
                    id: user.id,
                    full_name: user.full_name,
                    email_address: user.email_address,
                    phone_number: user.phone_number,
                    points: qpointsMap.get(user.id) || 0,
                    redeemed: redeemedMap.get(user.id) || 0,
                    photo_url: user.photo_url,
                    total_visits: (totalDoctorVisitsMap.get(user.id) || 0) + (totalServiceVisitsMap.get(user.id) || 0)
                }
            })
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            } else {
                logger.error(e);
                throw ERRORS.INTERNAL_SERVER_ERROR;
            }
        }
        finally {
            if (connection) {
                connection.release();
            }
        }

    }

    async deleteUser(id: number): Promise<void> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const user = await this.userRepository.getUserById(connection, id);
            if (!user) {
                throw ERRORS.USER_NOT_FOUND;
            }

            // Check if user has any bookings (doctor or service)
            const doctorBookings = await this.bookingRepository.getAllDoctorBookingForUser(connection, id);
            if (doctorBookings && doctorBookings.length > 0) {
                throw ERRORS.USER_HAS_BOOKINGS;
            }
            const serviceBookings = await this.bookingRepository.getAllServiceBookingForUser(connection, id);
            if (serviceBookings && serviceBookings.length > 0) {
                throw ERRORS.USER_HAS_BOOKINGS;
            }

            await this.userRepository.deleteUser(connection, id);
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

    // Delete account via phone + OTP (no prior auth)
    async createDeleteUserHash(phone_number: string): Promise<string> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            // Ensure user exists for this phone
            const user = await this.userRepository.getUserByPhone(connection, phone_number);
            if (!user) {
                throw ERRORS.USER_NOT_FOUND;
            }

            const otp = await this.smsRepository.sendOTP(phone_number);
            console.log(otp);
            const data = {
                intent: 'delete-account',
                phone_number,
                otp
            };
            const encryptedData = await this.encryptionRepository.encryptJSON(data);
            return encryptedData;
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

    async deleteUserByOTP(hash: string, otp: number): Promise<void> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const data = await this.encryptionRepository.decryptJSON(hash);
            if (data.otp !== otp) {
                throw ERRORS.INVALID_OTP;
            }
            // Optional: check intent field
            if (data.intent && data.intent !== 'delete-account') {
                throw ERRORS.INVALID_REQUEST_BODY;
            }

            const user = await this.userRepository.getUserByPhone(connection, data.phone_number);
            if (!user) {
                throw ERRORS.USER_NOT_FOUND;
            }

            // Ensure there are no bookings before deletion (same constraints as authenticated path)
            const doctorBookings = await this.bookingRepository.getAllDoctorBookingForUser(connection, user.id);
            if (doctorBookings && doctorBookings.length > 0) {
                throw ERRORS.USER_HAS_BOOKINGS;
            }
            const serviceBookings = await this.bookingRepository.getAllServiceBookingForUser(connection, user.id);
            if (serviceBookings && serviceBookings.length > 0) {
                throw ERRORS.USER_HAS_BOOKINGS;
            }

            await this.userRepository.deleteUser(connection, user.id);
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
