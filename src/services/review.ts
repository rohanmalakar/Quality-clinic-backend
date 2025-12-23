import { Review, ReviewComment, ReviewView } from "@models/review";
import BookingRepository from "@repository/booking";
import ReviewRepository from "@repository/review";
import pool from "@utils/db";
import { ERRORS, RequestError } from "@utils/error";
import createLogger from "@utils/logger";

import { PoolConnection } from "mysql2/promise";

const logger = createLogger('@settingService');

export default class ReviewService {
    reviewRepository: ReviewRepository;
    bookingRepository: BookingRepository;

    constructor() {
        this.reviewRepository = new ReviewRepository();
        this.bookingRepository = new BookingRepository();
    }

    async getAllReviews(): Promise<ReviewView[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.reviewRepository.getAllReviews(connection);
        } catch (e) {
            logger.error(e);
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getCommentForReview(reviewID: number): Promise<ReviewComment> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await this.reviewRepository.checkIfReviewExists(connection, reviewID);
            return await this.reviewRepository.getCommentForReview(connection, reviewID);
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            } else {
                logger.error(e);
                throw ERRORS.INTERNAL_SERVER_ERROR
            }   
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async createReview(userID: number, bookingID: number, rating: number, review: string, type: string): Promise<Review> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            if (type == 'DOCTOR') {
                let booking = await this.bookingRepository.getBookingDoctor(connection, bookingID);
                if (!booking) {
                    throw ERRORS.BOOKING_NOT_FOUND;
                }
            } else if (type == 'SERVICE') {
                let booking = await this.bookingRepository.getBookingService(connection, bookingID);
                if (!booking) {
                    throw ERRORS.BOOKING_NOT_FOUND;
                }
            }
            const reviewExists = await this.reviewRepository.checkIfReviewExistsForBooking(connection, bookingID, type);
            if (reviewExists) {
                throw ERRORS.REVIEW_ALREADY_EXISTS;
            }
            return await this.reviewRepository.createReview(connection, userID, bookingID, rating, review, type);
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

    async createComment(reviewID: number, comment: string): Promise<ReviewComment> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            await this.reviewRepository.checkIfReviewExists(connection, reviewID);
            let com = await this.reviewRepository.createReviewComment(connection, reviewID, comment);
            return com;
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

    async getAllReviewsForDoctor(doctorID: number): Promise<Review[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.reviewRepository.getAllReviewsForDoctor(connection, doctorID);
        } catch (e) {
            logger.error(e);
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async getAllReviewsForService(doctorID: number): Promise<Review[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.reviewRepository.getAllReviewsForService(connection, doctorID);
        } catch (e) {
            logger.error(e);
            throw ERRORS.INTERNAL_SERVER_ERROR;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}
