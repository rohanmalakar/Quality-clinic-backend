CREATE TABLE booking_service (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    branch_id INT,
    service_id INT,
    time_slot_id INT,
    date DATE NOT NULL,
    vat_percentage DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    status ENUM('PENDING','SCHEDULED', 'RESCHEDULE' ,'CANCELED', 'REFUND_INITIATED', 'REFUND_COMPLETED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    created_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS review (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    booking_id INT,
    review TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rating INT
);

CREATE TABLE IF NOT EXISTS comment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    review_id INT,
    comment TEXT
);

CREATE TABLE booking_doctor (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status ENUM('PENDING','SCHEDULED', 'RESCHEDULE', 'CANCELED', 'REFUND_INITIATED', 'REFUND_COMPLETED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    doctor_id INT NOT NULL,
    branch_id INT NOT NULL,
    time_slot_id INT NOT NULL,
    vat_percentage DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE branch (
    id INT NOT NULL AUTO_INCREMENT,
    name_ar VARCHAR(1024) NOT NULL,
    name_en VARCHAR(1024) NOT NULL,
    city_en TEXT NOT NULL,
    city_ar TEXT NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE doctor (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    session_fees INT NOT NULL,
    attended_patient INT DEFAULT 0,
    total_experience INT NOT NULL,
    rating DECIMAL(3,2) DEFAULT 4.50,
    about_en TEXT,
    about_ar TEXT,
    qualification TEXT,
    languages TEXT,
    name_en VARCHAR(1024) NOT NULL,
    name_ar VARCHAR(1024) NOT NULL,
    photo_url TEXT,
    is_active tinyint(1) NOT NULL DEFAULT '1'
);

CREATE TABLE doctor_branch (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    day INT NOT NULL,
    branch_id INT NOT NULL,
    is_active tinyint(1) NOT NULL DEFAULT '1',
    UNIQUE KEY (doctor_id, branch_id)
);

CREATE TABLE doctor_time_slot (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active tinyint(1) NOT NULL DEFAULT '1'
);

CREATE TABLE notification (
    id INT NOT NULL AUTO_INCREMENT,
    title_en VARCHAR(255) DEFAULT NULL,
    title_ar VARCHAR(255) DEFAULT NULL,
    message_en VARCHAR(255) DEFAULT NULL,
    message_ar VARCHAR(255) DEFAULT NULL,
    scheduled_timestamp DATETIME DEFAULT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE qpoint (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points INT NOT NULL,
    created_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE redeem (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    booking_id INT,
    service_id INT,
    created_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE service (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(1024) NOT NULL,
    name_ar VARCHAR(1024) NOT NULL,
    category_id INT NOT NULL,
    about_en TEXT,
    about_ar TEXT,
    actual_price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2),
    service_image_en_url TEXT,
    service_image_ar_url TEXT,
    can_redeem TINYINT(1) DEFAULT 0
);

CREATE TABLE service_category (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    type ENUM('DENTIST', 'DERMATOLOGIST') NOT NULL,
    image_ar VARCHAR(1024) NOT NULL,
    image_en VARCHAR(1024) NOT NULL,
    name_en VARCHAR(1024) NOT NULL,
    name_ar VARCHAR(1024) NOT NULL
);

CREATE TABLE IF NOT EXISTS banner (
    id INT NOT NULL AUTO_INCREMENT,
    image_en VARCHAR(1024) NOT NULL,
    image_ar VARCHAR(1024) NOT NULL,
    link VARCHAR(1024) NOT NULL,
    start_timestamp TIMESTAMP NOT NULL,
    end_timestamp TIMESTAMP NOT NULL,
    created_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE service_time_slot (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE service_branch (
    service_id INT NOT NULL,
    branch_id INT NOT NULL,
    maximum_booking_per_slot INT,
    is_active BOOLEAN DEFAULT TRUE
    PRIMARY KEY (branch_id, service_id)
);

CREATE TABLE setting (
    user_id INT NOT NULL,
    push_notification_enabled TINYINT(1) DEFAULT NULL,
    email_notification_enabled TINYINT(1) DEFAULT NULL,
    sms_notification_enabled TINYINT(1) DEFAULT NULL,
    preferred_language ENUM('en','ar') DEFAULT NULL,
    PRIMARY KEY (user_id)
);

CREATE TABLE user (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(1024) NOT NULL,
    email_address VARCHAR(512) NOT NULL,
    password_hash VARCHAR(512) NULL,
    phone_number VARCHAR(255) NOT NULL,
    national_id VARCHAR(512),
    photo_url TEXT,
    created_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_admin TINYINT(1) NOT NULL DEFAULT 0,
    UNIQUE KEY national_id_index (national_id),
    UNIQUE KEY phone_number_index (phone_number),
    UNIQUE KEY email_index (email_address)
);

CREATE TABLE vat (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    vat_percentage DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE review (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    booking_id INT,
    review TEXT,
    booking_type ENUM('SERVICE', 'DOCTOR'),
    created_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    rating INT
);
CREATE TABLE comment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT,
    comment TEXT
);


-- CREATE TABLE payments (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     cart_id VARCHAR(100) NOT NULL,
--     cart_amount DECIMAL(12,2) NOT NULL,
--     cart_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
--     cart_description VARCHAR(255),

--     tran_type VARCHAR(50) NOT NULL DEFAULT 'sale',
--     tran_class VARCHAR(50) NOT NULL DEFAULT 'ecom',

--     paytabs_transaction_id VARCHAR(100),   -- returned by PayTabs
--     status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
--     redirect_url TEXT,                     -- PayTabs redirect link
--     callback_url TEXT,
--     return_url TEXT,

--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

--     CONSTRAINT fk_payments_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- );


CREATE TABLE payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cart_id VARCHAR(100) NOT NULL UNIQUE,
  cart_amount DECIMAL(12,2) NOT NULL,
  cart_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  cart_description VARCHAR(255),

  tran_type VARCHAR(50) NOT NULL DEFAULT 'sale',
  tran_class VARCHAR(50) NOT NULL DEFAULT 'ecom',

  paytabs_transaction_id VARCHAR(100),
  status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  redirect_url TEXT,
  callback_url TEXT,
  return_url TEXT,

  -- 🎟️ Coupon or points redemption
  redeemed_coupon_id INT DEFAULT NULL,
  redeemed_points INT DEFAULT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_payments_users FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_redeem FOREIGN KEY (redeemed_coupon_id) REFERENCES redeem(id) ON DELETE SET NULL
);



CREATE TABLE payment_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    booking_doctor_id INT NULL,
    booking_service_id INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_items_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
--   CONSTRAINT fk_payment_items_booking FOREIGN KEY (booking_doctor_id) REFERENCES booking_doctor(id) ON DELETE CASCADE,
--   CONSTRAINT fk_payment_items_service FOREIGN KEY (booking_service_id) REFERENCES booking_service(id) ON DELETE CASCADE
);

ALTER TABLE booking_doctor
ADD COLUMN locked_until DATETIME DEFAULT NULL,
ADD COLUMN lock_source ENUM('REDIS','DB') DEFAULT 'REDIS';

ALTER TABLE payments
ADD COLUMN expires_at DATETIME DEFAULT NULL;