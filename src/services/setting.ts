import { SettingView } from "@models/setting";
import SettingRepository from "@repository/setting";
import pool from "@utils/db";
import { ERRORS, RequestError } from "@utils/error";
import createLogger from "@utils/logger";

import { PoolConnection } from "mysql2/promise";

const logger = createLogger('@settingService');

export default class SettingService {
    settingRepository: SettingRepository;

    constructor() {
        this.settingRepository = new SettingRepository();
    }

    async getSettingForUser(userID: number): Promise<SettingView> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            return await this.settingRepository.getSettingForUser(connection, userID);
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

    async updateSettingForUser(userID: number, email_notification_enabled: boolean | undefined,  push_notification_enabled: boolean | undefined, sms_notification_enabled: boolean | undefined, preferred_language: string | undefined ): Promise<SettingView> {
        let connection: PoolConnection | null = null;
        try {
            connection = await pool.getConnection();
            let setting = await this.settingRepository.getSettingForUser(connection, userID);
            if (email_notification_enabled !== undefined) {
                setting.email_notification_enabled = email_notification_enabled;
            }
            if (push_notification_enabled !== undefined) {
                setting.push_notification_enabled = push_notification_enabled;
            }
            if (sms_notification_enabled !== undefined) {
                setting.sms_notification_enabled = sms_notification_enabled;
            }
            if (preferred_language !== undefined) {
                setting.preferred_language = preferred_language;
            }
            setting = await this.settingRepository.updateSettingForUser(connection, userID, setting.email_notification_enabled, setting.push_notification_enabled, setting.sms_notification_enabled, setting.preferred_language);
            return setting;
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