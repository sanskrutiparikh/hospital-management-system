-- ==========================================
-- HOSPITAL MANAGEMENT SYSTEM DATABASE SCHEMA
-- ==========================================

CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

-- 1. Users table (managed by auth-service)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

-- 2. Patients table (managed by patient-service)
CREATE TABLE IF NOT EXISTS patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    age INT NOT NULL,
    gender VARCHAR(50) NOT NULL,
    blood_group VARCHAR(50) NOT NULL,
    address VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    medical_history TEXT
);

-- 3. Doctors table (managed by doctor-service)
CREATE TABLE IF NOT EXISTS doctors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    years_of_experience INT NOT NULL,
    availability_status VARCHAR(50) NOT NULL
);

-- 4. Patient-Doctor Assignments table (managed by patient-service)
CREATE TABLE IF NOT EXISTS patient_doctor_assignments (
    assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    assigned_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE
);

-- 5. Appointments table (managed by appointment-service)
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(50) NOT NULL,
    appointment_status VARCHAR(50) NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE
);

-- 6. Bills table (managed by billing-service)
CREATE TABLE IF NOT EXISTS bills (
    bill_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    service_rendered VARCHAR(255) NOT NULL,
    amount DOUBLE NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    generated_date DATE NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

-- ==========================================
-- SEED DATA
-- ==========================================

-- Insert Users (Password: 'password' hashed using BCrypt)
-- Admin User: admin@medpulse.com / password
-- Doctor Users: sarah.jenkins@medpulse.com, robert.chen@medpulse.com, lisa.wong@medpulse.com, alan.turing@medpulse.com
-- Patient Users: david.miller@gmail.com, emma.watson@yahoo.com, robert.downey@gmail.com, sophia.loren@gmail.com
INSERT INTO users (name, email, password, role) VALUES
('System Admin', 'admin@medpulse.com', '$2a$10$wAna63YiOwpxnWa4hndL1eYemMlP0OxBmjyYr6kMoBmvNcANb5dra', 'ADMIN'),
('Dr. Sarah Jenkins', 'sarah.jenkins@medpulse.com', '$2a$10$wAna63YiOwpxnWa4hndL1eYemMlP0OxBmjyYr6kMoBmvNcANb5dra', 'DOCTOR'),
('Dr. Robert Chen', 'robert.chen@medpulse.com', '$2a$10$wAna63YiOwpxnWa4hndL1eYemMlP0OxBmjyYr6kMoBmvNcANb5dra', 'DOCTOR'),
('Dr. Lisa Wong', 'lisa.wong@medpulse.com', '$2a$10$wAna63YiOwpxnWa4hndL1eYemMlP0OxBmjyYr6kMoBmvNcANb5dra', 'DOCTOR'),
('Dr. Alan Turing', 'alan.turing@medpulse.com', '$2a$10$wAna63YiOwpxnWa4hndL1eYemMlP0OxBmjyYr6kMoBmvNcANb5dra', 'DOCTOR'),
('David Miller', 'david.miller@gmail.com', '$2a$10$wAna63YiOwpxnWa4hndL1eYemMlP0OxBmjyYr6kMoBmvNcANb5dra', 'PATIENT'),
('Emma Watson', 'emma.watson@yahoo.com', '$2a$10$wAna63YiOwpxnWa4hndL1eYemMlP0OxBmjyYr6kMoBmvNcANb5dra', 'PATIENT'),
('Robert Downey', 'robert.downey@gmail.com', '$2a$10$wAna63YiOwpxnWa4hndL1eYemMlP0OxBmjyYr6kMoBmvNcANb5dra', 'PATIENT'),
('Sophia Loren', 'sophia.loren@gmail.com', '$2a$10$wAna63YiOwpxnWa4hndL1eYemMlP0OxBmjyYr6kMoBmvNcANb5dra', 'PATIENT')
ON DUPLICATE KEY UPDATE email=email;

-- Insert Doctors
INSERT INTO doctors (doctor_id, full_name, specialization, email, phone, years_of_experience, availability_status) VALUES
('DOC-200001', 'Dr. Sarah Jenkins', 'Cardiology', 'sarah.jenkins@medpulse.com', '+1 (555) 111-2222', 12, 'AVAILABLE'),
('DOC-200002', 'Dr. Robert Chen', 'Endocrinology', 'robert.chen@medpulse.com', '+1 (555) 333-4444', 8, 'AVAILABLE'),
('DOC-200003', 'Dr. Lisa Wong', 'Pulmonology', 'lisa.wong@medpulse.com', '+1 (555) 555-6666', 15, 'AVAILABLE'),
('DOC-200004', 'Dr. Alan Turing', 'Neurology', 'alan.turing@medpulse.com', '+1 (555) 777-8888', 20, 'AVAILABLE')
ON DUPLICATE KEY UPDATE doctor_id=doctor_id;

-- Insert Patients
INSERT INTO patients (patient_id, full_name, email, age, gender, blood_group, address, contact_number, medical_history) VALUES
('PAT-100001', 'David Miller', 'david.miller@gmail.com', 42, 'Male', 'O+', '123 Maple St', '+1 (555) 123-4567', 'Hypertension'),
('PAT-100002', 'Emma Watson', 'emma.watson@yahoo.com', 29, 'Female', 'A-', '456 Oak Ave', '+1 (555) 987-6543', 'Type 2 Diabetes'),
('PAT-100003', 'Robert Downey', 'robert.downey@gmail.com', 58, 'Male', 'AB+', '789 Pine Rd', '+1 (555) 234-5678', 'Chronic Bronchitis'),
('PAT-100004', 'Sophia Loren', 'sophia.loren@gmail.com', 34, 'Female', 'B+', '321 Cedar Ln', '+1 (555) 876-5432', 'Acute Migraine')
ON DUPLICATE KEY UPDATE patient_id=patient_id;

-- Insert Patient-Doctor Assignments
INSERT INTO patient_doctor_assignments (patient_id, doctor_id, assigned_date, status) VALUES
('PAT-100001', 'DOC-200002', '2026-05-14', 'ACTIVE'),
('PAT-100002', 'DOC-200001', '2026-05-15', 'ACTIVE'),
('PAT-100003', 'DOC-200003', '2026-05-16', 'ACTIVE'),
('PAT-100004', 'DOC-200001', '2026-05-17', 'ACTIVE')
ON DUPLICATE KEY UPDATE patient_id=patient_id;

-- Insert Appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, appointment_status) VALUES
('PAT-100001', 'DOC-200002', '2026-06-13', '09:00 AM', 'COMPLETED'),
('PAT-100002', 'DOC-200001', '2026-06-13', '10:30 AM', 'PENDING'),
('PAT-100003', 'DOC-200003', '2026-06-13', '02:00 PM', 'PENDING'),
('PAT-100004', 'DOC-200001', '2026-06-13', '04:15 PM', 'PENDING')
ON DUPLICATE KEY UPDATE patient_id=patient_id;

-- Insert Bills
INSERT INTO bills (patient_id, service_rendered, amount, payment_status, generated_date) VALUES
('PAT-100001', 'General ICU Care', 4800.0, 'UNPAID', '2026-06-13'),
('PAT-100002', 'Endocrine Screening', 650.0, 'PAID', '2026-06-13'),
('PAT-100003', 'Pulmonary Therapy', 1200.0, 'PAID', '2026-06-13'),
('PAT-100004', 'Migraine Therapeutics', 350.0, 'UNPAID', '2026-06-13')
ON DUPLICATE KEY UPDATE patient_id=patient_id;
