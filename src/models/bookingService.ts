import { RowDataPacket } from "mysql2";

/**
 * The SQL definition for the 'booking_service' table.
 * -- The 'status' column has been removed. --
 */
export const DEFINITION = `
CREATE TABLE "booking_service" (
    "id" int NOT NULL AUTO_INCREMENT,
    "user_id" int NOT NULL,
    "branch_id" int NOT NULL,
    "service_id" int NOT NULL,
    "date" date NOT NULL,
    "vat_percentage" decimal(5,2) NOT NULL,
    PRIMARY KEY ("id")
)
`;

/**
 * Defines the TypeScript interface for a BookingService object.
 */
export interface BookingService extends RowDataPacket {
    id: number;
    user_id: number;
    branch_id: number;
    service_id: number;
    date: Date;
    vat_percentage: number;
}