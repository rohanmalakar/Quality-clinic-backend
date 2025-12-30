


// src/models/serviceCart.ts (UPDATED)

import { RowDataPacket } from "mysql2";

/**
 * The SQL definition for the 'service_cart' table.
 * This is kept for documentation and reference purposes.
 */
export const DEFINITION = `
CREATE TABLE "service_cart" (
    "id" int NOT NULL AUTO_INCREMENT,
    "user_id" int NOT NULL,
    "branch_id" int NOT NULL,
    "service_id" int NOT NULL,
    "date" varchar(255) NOT NULL,
    "vat_percentage" decimal(5,2) NOT NULL,
    PRIMARY KEY ("id")
)
`;

/**
 * Defines the TypeScript interface for a ServiceCart object.
 * 
 * This interface ensures that any data representing a service cart item
 * within the application conforms to a specific structure, providing strong type safety.
 * 
 * It extends `RowDataPacket` from the 'mysql2' library for compatibility.
 */
export interface ServiceCart extends RowDataPacket {
  id: number;
  user_id: number;
  date: string;
  vat_percentage: number;
  branch: {
    id: number;
    name_en: string;
    name_ar: string;
  };
  time_slot: {
    id: number;
    start_time: string;
    end_time: string;
  };
  service: {
    id: number;
    name_en: string;
    name_ar: string;
    about_en: string;
    about_ar: string;
    actual_price: number;
    discounted_price: number;
    service_image_en_url: string;
    service_image_ar_url: string;
    category: {
      id: number;
      type: string;
      name_en: string;
      name_ar: string;
    };
  };
}

