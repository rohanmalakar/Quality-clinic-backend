import { NotificationView } from "@models/notification";
import NotificationRepository from "@repository/notification";
import VatRepository from "@repository/vat";
import pool from "@utils/db";
import { ERRORS, RequestError } from "@utils/error";
import createLogger from "@utils/logger";

import { PoolConnection } from "mysql2/promise";

const logger = createLogger('@notificationService');

export default class NotificationService {
    notificationRepository: NotificationRepository;
    
    constructor() {
        this.notificationRepository = new NotificationRepository()
    }

    async getNotifications(): Promise<NotificationView[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const notifications = await this.notificationRepository.getNotifications(connection);
            return notifications.map(notification => {
                    return {
                        title_ar: notification.title_ar,
                        title_en: notification.title_en,
                        message_ar: notification.message_ar,
                        message_en: notification.message_en,
                        scheduled_timestamp: notification.scheduled_timestamp
                    }
                }
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

    async getAllNotifications(): Promise<NotificationView[]> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const notifications = await this.notificationRepository.getAllNotifications(connection);
            return notifications.map(notification => {
                    return {
                        title_ar: notification.title_ar,
                        title_en: notification.title_en,
                        message_ar: notification.message_ar,
                        message_en: notification.message_en,
                        scheduled_timestamp: notification.scheduled_timestamp
                    }
                }
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

    async createNotification(message_ar: string, message_en: string, title_ar: string, title_en: string, scheduled_timestamp: Date): Promise<NotificationView> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            const notification = await this.notificationRepository.insertNotification(connection, message_ar, message_en, title_ar, title_en, scheduled_timestamp);
            return {
                message_ar: notification.message_ar,
                message_en: notification.message_en,
                title_ar: notification.title_ar,
                title_en: notification.title_en,
                scheduled_timestamp: notification.scheduled_timestamp
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

}