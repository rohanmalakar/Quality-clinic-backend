
import { RowDataPacket } from "mysql2";

const DEFINATION = `
CREATE TABLE notification (
    id int NOT NULL AUTO_INCREMENT,
    message_en varchar(255) DEFAULT NULL,
    message_ar varchar(255) DEFAULT NULL,
    title_en VARCHAR(255) DEFAULT NULL,
    title_ar VARCHAR(255) DEFAULT NULL,
    scheduled_timestamp datetime DEFAULT NULL,
    PRIMARY KEY (id)
)`

export interface Notification extends RowDataPacket {
    id: number;
    message_en: string;
    message_ar: string;
    title_en: string;
    title_ar: string;
    scheduled_timestamp: Date;
}

export interface NotificationView {
    message_en: string;
    message_ar: string;
    title_en: string;
    title_ar: string;
    scheduled_timestamp: Date;
}