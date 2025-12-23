INSERT INTO user (full_name, email_address, password_hash, phone_number, national_id, photo_url, is_admin)
VALUES
('John Doe', 'john.doe@example.com', 'hashed_password_1', '1234567890', '12345', 'https://example.com/john.jpg', 0),
('Jane Smith', 'jane.smith@example.com', 'hashed_password_2', '0987654321', '54321', 'https://example.com/jane.jpg', 0),
('Admin User', 'admin@example.com', 'hashed_password_admin', '1122334455', '11111', 'https://example.com/admin.jpg', 1),
('Alice Johnson', 'alice.johnson@example.com', 'hashed_password_3', '1231231234', '33333', 'https://example.com/alice.jpg', 0),
('Bob Williams', 'bob.williams@example.com', 'hashed_password_4', '3213214321', '44444', 'https://example.com/bob.jpg', 0);

INSERT INTO branch (name_ar, name_en, city_en, city_ar, latitude, longitude)
VALUES
('فرع الرياض', 'Riyadh Branch', 'Riyadh', 'الرياض', 24.7136, 46.6753),
('فرع جدة', 'Jeddah Branch', 'Jeddah', 'جدة', 21.4858, 39.1925),
('فرع الدمام', 'Dammam Branch', 'Dammam', 'الدمام', 26.4207, 50.0888);

INSERT INTO doctor (session_fees, attended_patient, total_experience, about_en, about_ar, qualification, languages, name_en, name_ar, photo_url)
VALUES
(500, 100, 10, 'Expert in cardiology', 'خبير في أمراض القلب', 'MD', 'English, Arabic', 'Dr. Ahmed', 'د. أحمد', 'https://example.com/dr-ahmed.jpg'),
(600, 200, 12, 'Expert in dermatology', 'خبير في الأمراض الجلدية', 'MD', 'English, Arabic', 'Dr. Fatima', 'د. فاطمة', 'https://example.com/dr-fatima.jpg'),
(700, 150, 8, 'Expert in pediatrics', 'خبير في طب الأطفال', 'MD', 'English, Arabic', 'Dr. Khalid', 'د. خالد', 'https://example.com/dr-khalid.jpg');

INSERT INTO doctor_branch (doctor_id, branch_id)
VALUES
(1, 1),
(2, 2),
(3, 3);

INSERT INTO doctor_time_slot (day, doctor_branch, start_time, end_time)
VALUES
(1, 1, '09:00:00', '12:00:00'),
(2, 2, '14:00:00', '17:00:00'),
(3, 3, '10:00:00', '13:00:00');

INSERT INTO service_category (type, name_en, name_ar)
VALUES
('DENTIST', 'Dental Care', 'رعاية الأسنان'),
('DERMATOLOGIST', 'Skin Care', 'رعاية الجلد');

INSERT INTO service (name_en, name_ar, category_id, about_en, about_ar, actual_price, discounted_price, service_image_en_url, service_image_ar_url, can_redeem)
VALUES
('Teeth Whitening', 'تبييض الأسنان', 1, 'Teeth whitening service', 'خدمة تبييض الأسنان', 1000.00, 800.00, 'https://example.com/teeth-whitening.jpg', 'https://example.com/teeth-whitening-ar.jpg', 1),
('Acne Treatment', 'علاج حب الشباب', 2, 'Acne treatment service', 'خدمة علاج حب الشباب', 1200.00, 1000.00, 'https://example.com/acne-treatment.jpg', 'https://example.com/acne-treatment-ar.jpg', 1);

INSERT INTO service_branch (branch_id, service_id, maximum_booking_per_slot)
VALUES
(1, 1, 5),
(2, 2, 3);

INSERT INTO booking_service (user_id, branch_id, service_id, time_slot_id, date, status)
VALUES
(1, 1, 1, 1, '2025-04-01', 'SCHEDULED'),
(2, 2, 2, 2, '2025-04-02', 'COMPLETED');

INSERT INTO review (user_id, booking_id, review, rating, booking_type)
VALUES
(1, 1, 'Great service!', 5, "SERVICE"),
(2, 2, 'Very satisfied!', 4, "SERVICE"),
(1, 1, 'Great service!', 5, "DOCTOR"),
(2, 2, 'Very satisfied!', 4, "DOCTOR");

INSERT INTO comment (review_id, comment)
VALUES
(1, 'Thank you for the feedback!'),
(2, 'Glad to hear that!');

INSERT INTO redeem (user_id, booking_id, service_id)
VALUES
(1, 1, 1),
(2, 2, 2);

INSERT INTO banner (image_en, image_ar, link, start_timestamp, end_timestamp)
VALUES
('https://example.com/banner1.jpg', 'https://example.com/banner1-ar.jpg', 'https://example.com', '2025-03-01 08:00:00', '2025-04-01 18:00:00');

INSERT INTO setting (user_id, push_notification_enabled, email_notification_enabled, sms_notification_enabled, preferred_language)
VALUES
(1, 1, 1, 0, 'en'),
(2, 0, 1, 1, 'ar');

INSERT INTO vat (vat_percentage)
VALUES
(5.00),
(10.00);


