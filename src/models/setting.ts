import { RowDataPacket } from "mysql2";

const DEFINATION = `
CREATE TABLE setting (
  user_id int NOT NULL,
  push_notification_enabled tinyint(1) DEFAULT NULL,
  email_notification_enabled tinyint(1) DEFAULT NULL,
  sms_notification_enabled tinyint(1) DEFAULT NULL,
  preferred_language enum('en','ar') DEFAULT NULL,
  PRIMARY KEY (user_id)
)`

export interface Setting extends RowDataPacket {
  user_id: number;
  push_notification_enabled: boolean;
  email_notification_enabled: boolean;
  sms_notification_enabled: boolean;
  preferred_language: string;
}

export interface SettingView {
  push_notification_enabled: boolean;
  email_notification_enabled: boolean;
  sms_notification_enabled: boolean;
  preferred_language: string;
}

export const DefaultSetting = {
    push_notification_enabled: true,
    email_notification_enabled: true,
    sms_notification_enabled: true,
    preferred_language: 'en'
}