package com.hospital.doctorservice.config;

import com.hospital.doctorservice.model.Doctor;
import com.hospital.doctorservice.repository.DoctorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final DoctorRepository doctorRepository;

    public DatabaseSeeder(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (doctorRepository.count() == 0) {
            log.info("Seeding database with default doctors...");

            Doctor d1 = new Doctor("DOC-200001", "Dr. Sarah Jenkins", "Cardiology", "sarah.jenkins@medpulse.com", "+1 (555) 111-2222", 12, "AVAILABLE");
            Doctor d2 = new Doctor("DOC-200002", "Dr. Robert Chen", "Endocrinology", "robert.chen@medpulse.com", "+1 (555) 333-4444", 8, "AVAILABLE");
            Doctor d3 = new Doctor("DOC-200003", "Dr. Lisa Wong", "Pulmonology", "lisa.wong@medpulse.com", "+1 (555) 555-6666", 15, "AVAILABLE");
            Doctor d4 = new Doctor("DOC-200004", "Dr. Alan Turing", "Neurology", "alan.turing@medpulse.com", "+1 (555) 777-8888", 20, "AVAILABLE");

            doctorRepository.save(d1);
            doctorRepository.save(d2);
            doctorRepository.save(d3);
            doctorRepository.save(d4);

            log.info("Default doctors seeded successfully!");
        } else {
            log.info("Doctors database is already seeded.");
        }
    }
}
