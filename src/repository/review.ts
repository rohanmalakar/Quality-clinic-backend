import { Review, ReviewComment, ReviewView } from "@models/review";
import { ERRORS, RequestError } from "@utils/error";
import createLogger from "@utils/logger";
import { PoolConnection, ResultSetHeader } from "mysql2/promise";

const logger = createLogger('@reviewRepository')

export default class ReviewRepository {
    async checkIfReviewExists(connection: PoolConnection, reviewID: number): Promise<void> {
        try {
            const [reviews,] = await connection.query<Review[]>('SELECT * from review where id  = ?', [reviewID]);
            if (reviews.length === 0) {
                throw ERRORS.REVIEW_NOT_FOUND;
            }
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }
    
    async getCommentForReview(connection: PoolConnection, reviewID: number): Promise<ReviewComment> {
        try {
            const [comments,] = await connection.query<ReviewComment[]>('SELECT * from comment where review_id = ?', [reviewID]);
            return comments[0];
        }
        catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getAllReviews(connection: PoolConnection): Promise<ReviewView[]> {
        try {
            const [doctorReview,] = await connection.query<ReviewView[]>('select  review.review, review.id, review.booking_type, review.created_timestamp, review.rating, doctor.name_en, user.full_name as user_name, user.photo_url as user_photo_url from review join booking_doctor on review.booking_id = booking_doctor.id join doctor on booking_doctor.doctor_id = doctor.id  join user on review.user_id = user.id where review.booking_type = "DOCTOR"');
            const [serviceReview,] = await connection.query<ReviewView[]>('select review.review, review.id, review.booking_type, review.created_timestamp, review.rating, service.name_en, user.full_name as user_name, user.photo_url as user_photo_url from review join booking_service on review.booking_id = booking_service.id join service on booking_service.service_id = service.id  join user on review.user_id = user.id where review.booking_type = "SERVICE"');
            return [...doctorReview, ...serviceReview];
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async checkIfReviewExistsForBooking(connection: PoolConnection, bookingID: number, type: string): Promise<boolean> {
        try {
            const [reviews,] = await connection.query<Review[]>('SELECT * from review where booking_id  = ? and booking_type = ?', [bookingID, type]);
            if (reviews.length === 0) {
                return false;
            }
            return true;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async createReviewComment(connection: PoolConnection, reviewID: number, comment: string): Promise<ReviewComment> {
        try {
            const [result,] = await connection.query<ResultSetHeader>('INSERT INTO comment (review_id,comment) VALUES (?,?)', [reviewID, comment]);
            const [reviews,] = await connection.query<ReviewComment[]>('SELECT * from review where id = ?', [result.insertId]);
            return reviews[0];
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async createReview(connection: PoolConnection, userID: number, bookingID: number, rating: number, review: string, type: string): Promise<Review> {
        try {
            const [result,] = await connection.query<ResultSetHeader>('INSERT INTO review (user_id, booking_id, rating, review, booking_type) VALUES (?,?,?,?,?)', [userID, bookingID, rating, review, type]);
            const [reviews,] = await connection.query<Review[]>('SELECT * from review where id = ?', [result.insertId]);
            return reviews[0];
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getReviews(connection: PoolConnection, id: number): Promise<Review[]> {
        try {
            const [reviews,] = await connection.query<Review[]>('SELECT * from user where id = ?', [id]);
            return reviews;
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getAllReviewsForDoctor(connection: PoolConnection, doctorID: number): Promise<Review[]> {
        try {
            const [reviews,] = await connection.query<Review[]>('SELECT review.*, photo_url, full_name from review join user on user.id = review.user_id where booking_id in (SELECT id from booking_doctor where doctor_id = ?)', [doctorID]);
            return reviews;
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async getAllReviewsForService(connection: PoolConnection, serviceID: number): Promise<Review[]> {
        try {
            const [reviews,] = await connection.query<Review[]>('SELECT * from review where booking_id in (SELECT id from booking_service where service_id = ?)', [serviceID]);
            return reviews;
        } catch (e) {
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }
}
