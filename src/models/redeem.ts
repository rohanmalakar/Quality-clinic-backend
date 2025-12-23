
import { RowDataPacket } from "mysql2";

const DEFINATION = `
CREATE TABLE redeem (
    id INT PRIMARY KEY,
    user_id INT,
    booking_id INT,
    service_id INT,
    created_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`
export interface Redeem extends RowDataPacket {
    id: number;
    user_id: number;
    booking_id: number;
    service_id: number;
    created_timestamp: Date;
}


const QPOINT_DEFINATION = `
CREATE TABLE qpoint (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points INT NOT NULL,
    created_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`
export interface QPoint {
    id: number;
    user_id: number;
    points: number;
    created_timestamp: Date;
}

export interface QPointUser {
    user_id: number;
    points: number;
}

export interface QPointUserView {
    total: number;
    redeemed: number;
}

export interface RedeemedPerUser {
    user_id: number;
    redeemed: number;
}