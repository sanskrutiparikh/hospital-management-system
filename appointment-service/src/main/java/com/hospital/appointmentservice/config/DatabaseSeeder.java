package com.hospital.appointmentservice.config;

import com.hospital.appointmentservice.model.Appointment;
import com.hospital.appointmentservice.repository.AppointmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final AppointmentRepository appointmentRepository;

    public DatabaseSeeder(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (appointmentRepository.count() == 0) {
            log.info("Seeding database with default appointments...");

            Appointment app1 = new Appointment("PAT-100001", "DOC-200002", LocalDate.now(), "09:00 AM", "COMPLETED");
            Appointment app2 = new Appointment("PAT-100002", "DOC-200001", LocalDate.now(), "10:30 AM", "PENDING");
            Appointment app3 = new Appointment("PAT-100003", "DOC-200003", LocalDate.now(), "02:00 PM", "PENDING");
            Appointment app4 = new Appointment("PAT-100004", "DOC-200001", LocalDate.now(), "04:15 PM", "PENDING");

            appointmentRepository.save(app1);
            appointmentRepository.save(app2);
            appointmentRepository.save(app3);
            appointmentRepository.save(app4);

            log.info("Default appointments seeded successfully!");
        } else {
            log.info("Appointments database is already seeded.");
        }
    }
}
