import { RowDataPacket } from "mysql2";

const DEFINATION = `
CREATE TABLE user (
    "id" int NOT NULL AUTO_INCREMENT,
    "full_name" varchar(1024) NOT NULL,
    "email_address" varchar(1024) NOT NULL,
    "password_hash" varchar(1024) NULL,
    "phone_number" varchar(255) NOT NULL,
    "national_id" varchar(1024),
    "photo_url" timestamp NULL DEFAULT NULL,
    "is_admin" bool NOT NULL DEFAULT false,
    "created_timestamp" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id"),
    UNIQUE KEY "national_id_index" ("national_id"),
    UNIQUE KEY "phone_number_index" ("phone_number"),
    UNIQUE KEY "email_index" ("email_address")
)
`

export interface User extends RowDataPacket {
    id: number;
    full_name: string;
    email_address: string;
    password_hash: string;
    phone_number: string;
    national_id?: string;
    photo_url?: string;
    is_admin: boolean;
    created_timestamp: Date;
}


export interface AuthUser {
    full_name: string;
    email_address: string;
    phone_number: string;
    national_id?: string;
    photo_url?: string;
    refresh_token: string;
    access_token: string;
}

export interface UserMetic {
    id: number;
    full_name: string;
    email_address: string;
    phone_number: string;
    points: number;
    redeemed: number;
    photo_url?: string;
    total_visits: number;
}