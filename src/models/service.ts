
import { RowDataPacket } from "mysql2";

const DEFINATION = `
CREATE TABLE service (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name_en VARCHAR(1024) NOT NULL,
    name_ar VARCHAR(1024) NOT NULL,
    category_id INT NOT NULL,
    about_en TEXT,
    about_ar TEXT,
    actual_price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2),
    service_image_en_url TEXT,
    service_image_ar_url TEXT,
    can_redeem BOOLEAN DEFAULT FALSE,
)`


const DEFINATION_CATEGORY = `
CREATE TABLE service_category (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('DENTIST', 'DERMATOLOGIST') NOT NULL,
    name_en VARCHAR(1024) NOT NULL,
    name_ar VARCHAR(1024) NOT NULL,
    image_ar VARCHAR(1024) NOT NULL,
    image_en VARCHAR(1024) NOT NULL
);`

export interface ServiceCategory  {
    id: number;
    type: string;
    name_en: string;
    name_ar: string;
    image_ar: string;
    image_en: string;
}

export interface Service {
    id: number;
    name_en: string;
    name_ar: string;
    category_id: number;
    about_en: string;
    about_ar: string;
    actual_price: number;
    discounted_price: number;
    service_image_en_url: string;
    service_image_ar_url: string;
    can_redeem: boolean;
}

export interface ServiceView {
    id: number;
    name_en: string;
    name_ar: string;
    type: string;
    category_en: string;
    category_ar: string;
    category_id: number;
    about_en: string;
    about_ar: string;
    actual_price: number;
    discounted_price: number;
    service_image_en_url: string;
    service_image_ar_url: string;
    can_redeem: boolean;
}

export function createServiceView(service: Service, serviceCategory: ServiceCategory): ServiceView {
    return {
        id: service.id,
        name_ar: service.name_ar,
        name_en: service.name_en,
        about_ar: service.about_ar,
        about_en: service.about_en,
        type: serviceCategory.type,
        category_en: serviceCategory.name_en,
        category_ar: serviceCategory.name_en,
        category_id: service.category_id,
        actual_price: service.actual_price,
        discounted_price: service.discounted_price,
        service_image_en_url: service.service_image_en_url,
        service_image_ar_url: service.service_image_ar_url,
        can_redeem: service.can_redeem
    }
}

const SERVICE_TIME_SLOT_DEFINATION = `
CREATE TABLE service_time_slot (
    id INT PRIMARY KEY,
    service_id INT,
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN DEFAULT TRUE
);
`

export interface ServiceTimeSlot  {
    id: number;
    service_id: number;
    start_time: string;
    end_time: string;
}

export interface ServiceTimeSlotAvailableView {
    id: number;
    service_id: number;
    start_time: string;
    end_time: string;
    available: boolean;
}

const SERVICE_BRANCH_DEFINATION = `
CREATE TABLE service_branch (
    service_id INT,
    branch_id INT,
    maximum_booking_per_slot INT,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (branch_id, service_id)
);`

export interface ServiceBranch  {
    service_id: number;
    branch_id: number;
    maximum_booking_per_slot: number;
    is_active: boolean;
}


export interface MaxBooking {
    maximum_booking_per_slot: number;
}