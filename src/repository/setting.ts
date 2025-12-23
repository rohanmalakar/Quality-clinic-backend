import { DefaultSetting, Setting, SettingView } from "@models/setting";
import { ERRORS, RequestError } from "@utils/error";
import createLogger from "@utils/logger";
import { PoolConnection, ResultSetHeader } from "mysql2/promise";

const logger = createLogger('@settingRepository')

export default class SettingRepository {
    async getSettingForUser (connection: PoolConnection, userID: number): Promise<SettingView> {
        try {
            const [settings,] = await connection.query<Setting[]>('SELECT * from setting where user_id = ?', [userID]);
            if (settings.length === 0) {
                return DefaultSetting;
            }
            const setting = settings[0];
            return {
                email_notification_enabled: setting.email_notification_enabled,
                push_notification_enabled: setting.push_notification_enabled,
                sms_notification_enabled: setting.sms_notification_enabled,
                preferred_language: setting.preferred_language
            }
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e)
            throw ERRORS.DATABASE_ERROR
        }
    }

    async updateSettingForUser(connection: PoolConnection, userID: number, email_notification_enabled: boolean | undefined, push_notification_enabled: boolean | undefined, sms_notification_enabled: boolean | undefined, preferred_language: string | undefined): Promise<SettingView> {
        try {
            const [result,] = await connection.query<ResultSetHeader>('INSERT INTO setting (user_id, email_notification_enabled, push_notification_enabled, sms_notification_enabled, preferred_language) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE email_notification_enabled = ?, push_notification_enabled = ?, sms_notification_enabled = ?, preferred_language = ?', [userID, email_notification_enabled, push_notification_enabled, sms_notification_enabled, preferred_language, email_notification_enabled, push_notification_enabled, sms_notification_enabled, preferred_language]);
            if (result.affectedRows === 0) {
                throw ERRORS.DATABASE_ERROR;
            }
            return await this.getSettingForUser(connection, userID);
        } catch (e) {
            if (e instanceof RequestError) {
                throw e;
            }
            logger.error(e);
            throw ERRORS.DATABASE_ERROR;
        }
    }
}



