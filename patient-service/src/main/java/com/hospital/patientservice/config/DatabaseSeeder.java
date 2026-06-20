package com.hospital.patientservice.config;

import com.hospital.patientservice.model.Patient;
import com.hospital.patientservice.model.PatientDoctorAssignment;
import com.hospital.patientservice.repository.AssignmentRepository;
import com.hospital.patientservice.repository.PatientRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final PatientRepository patientRepository;
    private final AssignmentRepository assignmentRepository;

    public DatabaseSeeder(PatientRepository patientRepository, AssignmentRepository assignmentRepository) {
        this.patientRepository = patientRepository;
        this.assignmentRepository = assignmentRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (patientRepository.count() == 0) {
            log.info("Seeding database with default patients...");

            // 1. Seed Patients
            Patient p1 = new Patient("PAT-100001", "David Miller", "david.miller@gmail.com", 42, "Male", "O+", "123 Maple St", "+1 (555) 123-4567", "Hypertension");
            Patient p2 = new Patient("PAT-100002", "Emma Watson", "emma.watson@yahoo.com", 29, "Female", "A-", "456 Oak Ave", "+1 (555) 987-6543", "Type 2 Diabetes");
            Patient p3 = new Patient("PAT-100003", "Robert Downey", "robert.downey@gmail.com", 58, "Male", "AB+", "789 Pine Rd", "+1 (555) 234-5678", "Chronic Bronchitis");
            Patient p4 = new Patient("PAT-100004", "Sophia Loren", "sophia.loren@gmail.com", 34, "Female", "B+", "321 Cedar Ln", "+1 (555) 876-5432", "Acute Migraine");

            patientRepository.save(p1);
            patientRepository.save(p2);
            patientRepository.save(p3);
            patientRepository.save(p4);

            log.info("Default patients seeded successfully!");

            // 2. Seed Assignments
            log.info("Seeding patient-doctor assignments...");
            // David Miller -> Dr. Robert Chen (DOC-200002)
            PatientDoctorAssignment a1 = new PatientDoctorAssignment("PAT-100001", "DOC-200002", LocalDate.now().minusDays(30), "ACTIVE");
            // Emma Watson -> Dr. Sarah Jenkins (DOC-200001)
            PatientDoctorAssignment a2 = new PatientDoctorAssignment("PAT-100002", "DOC-200001", LocalDate.now().minusDays(15), "ACTIVE");
            // Robert Downey -> Dr. Lisa Wong (DOC-200003)
            PatientDoctorAssignment a3 = new PatientDoctorAssignment("PAT-100003", "DOC-200003", LocalDate.now().minusDays(10), "ACTIVE");
            // Sophia Loren -> Dr. Sarah Jenkins (DOC-200001)
            PatientDoctorAssignment a4 = new PatientDoctorAssignment("PAT-100004", "DOC-200001", LocalDate.now().minusDays(5), "ACTIVE");

            assignmentRepository.save(a1);
            assignmentRepository.save(a2);
            assignmentRepository.save(a3);
            assignmentRepository.save(a4);

            log.info("Default patient-doctor assignments seeded successfully!");
        } else {
            log.info("Patients database is already seeded.");
        }
    }
}
