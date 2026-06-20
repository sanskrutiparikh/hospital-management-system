package com.hospital.patientservice.service;

import com.hospital.patientservice.model.Patient;
import com.hospital.patientservice.model.PatientDoctorAssignment;
import com.hospital.patientservice.repository.AssignmentRepository;
import com.hospital.patientservice.repository.PatientRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class PatientService {

    private static final Logger log = LoggerFactory.getLogger(PatientService.class);

    private final PatientRepository patientRepository;
    private final AssignmentRepository assignmentRepository;
    private final RestTemplate restTemplate;

    public PatientService(PatientRepository patientRepository, AssignmentRepository assignmentRepository, RestTemplate restTemplate) {
        this.patientRepository = patientRepository;
        this.assignmentRepository = assignmentRepository;
        this.restTemplate = restTemplate;
    }

    public Patient createPatient(Patient patient) {
        if (patient.getPatientId() == null || patient.getPatientId().trim().isEmpty()) {
            patient.setPatientId(generatePatientId());
        }
        if (patientRepository.existsByPatientId(patient.getPatientId())) {
            throw new IllegalArgumentException("Patient with ID " + patient.getPatientId() + " already exists!");
        }
        if (patientRepository.existsByEmail(patient.getEmail())) {
            throw new IllegalArgumentException("Patient with email " + patient.getEmail() + " already exists!");
        }
        log.info("Creating new patient profile: Name = {}, Email = {}, PatientId = {}", patient.getFullName(), patient.getEmail(), patient.getPatientId());
        return patientRepository.save(patient);
    }

    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    public Optional<Patient> getPatientByPatientId(String patientId) {
        return patientRepository.findByPatientId(patientId);
    }

    public Optional<Patient> getPatientByEmail(String email) {
        return patientRepository.findByEmail(email);
    }

    public Patient updatePatient(String patientId, Patient updatedPatient) {
        Patient existingPatient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient with ID " + patientId + " not found."));

        existingPatient.setFullName(updatedPatient.getFullName());
        existingPatient.setAge(updatedPatient.getAge());
        existingPatient.setGender(updatedPatient.getGender());
        existingPatient.setBloodGroup(updatedPatient.getBloodGroup());
        existingPatient.setAddress(updatedPatient.getAddress());
        existingPatient.setContactNumber(updatedPatient.getContactNumber());
        existingPatient.setMedicalHistory(updatedPatient.getMedicalHistory());

        log.info("Updating patient profile for PatientId = {}", patientId);
        return patientRepository.save(existingPatient);
    }

    public void deletePatient(String patientId) {
        Patient patient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient with ID " + patientId + " not found."));
        
        // Deactivate all assignments
        assignmentRepository.findByPatientIdAndStatus(patientId, "ACTIVE")
                .ifPresent(assignment -> {
                    assignment.setStatus("INACTIVE");
                    assignmentRepository.save(assignment);
                });

        log.info("Deleting patient record for PatientId = {}", patientId);
        patientRepository.delete(patient);
    }

    // ==========================================
    // Patient-Doctor Assignment Logic
    // ==========================================

    public PatientDoctorAssignment assignDoctor(String patientId, String doctorId) {
        // 1. Verify Patient exists
        Patient patient = patientRepository.findByPatientId(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient with ID " + patientId + " not found."));

        // 2. Verify Doctor exists via DOCTOR-SERVICE
        verifyDoctorExists(doctorId);

        // 3. Check if there's already an active assignment
        Optional<PatientDoctorAssignment> currentAssignment = assignmentRepository.findByPatientIdAndStatus(patientId, "ACTIVE");
        if (currentAssignment.isPresent()) {
            PatientDoctorAssignment assignment = currentAssignment.get();
            if (assignment.getDoctorId().equals(doctorId)) {
                log.info("Doctor {} is already active assignment for patient {}", doctorId, patientId);
                return assignment; // Already assigned
            }
            // Deactivate current
            assignment.setStatus("INACTIVE");
            assignmentRepository.save(assignment);
            log.info("Deactivated assignment for patient {} with doctor {}", patientId, assignment.getDoctorId());
        }

        // 4. Create new assignment
        PatientDoctorAssignment newAssignment = new PatientDoctorAssignment(patientId, doctorId, LocalDate.now(), "ACTIVE");
        log.info("Assigning doctor {} to patient {}", doctorId, patientId);
        return assignmentRepository.save(newAssignment);
    }

    public PatientDoctorAssignment changeAssignedDoctor(String patientId, String doctorId) {
        return assignDoctor(patientId, doctorId);
    }

    public List<Patient> getPatientsAssignedToDoctor(String doctorId) {
        // Query assignments for doctor
        List<PatientDoctorAssignment> assignments = assignmentRepository.findAllByDoctorIdAndStatus(doctorId, "ACTIVE");
        List<Patient> patients = new ArrayList<>();
        for (PatientDoctorAssignment assignment : assignments) {
            patientRepository.findByPatientId(assignment.getPatientId()).ifPresent(patients::add);
        }
        return patients;
    }

    public Optional<PatientDoctorAssignment> getDoctorAssignedToPatient(String patientId) {
        return assignmentRepository.findByPatientIdAndStatus(patientId, "ACTIVE");
    }

    public void removeAssignment(String patientId) {
        PatientDoctorAssignment assignment = assignmentRepository.findByPatientIdAndStatus(patientId, "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("No active doctor assignment found for patient " + patientId));
        assignment.setStatus("INACTIVE");
        assignmentRepository.save(assignment);
        log.info("Removed active doctor assignment for patient {}", patientId);
    }

    // ==========================================
    // Helper Methods
    // ==========================================

    private void verifyDoctorExists(String doctorId) {
        try {
            // Send GET request to doctor-service to fetch doctor profile by doctorId
            String url = "http://DOCTOR-SERVICE/doctors/" + doctorId;
            restTemplate.getForObject(url, Object.class);
            log.info("Successfully verified existence of doctorId: {}", doctorId);
        } catch (Exception e) {
            log.error("Failed to verify doctor existence in doctor-service for doctorId: {}, Error: {}", doctorId, e.getMessage());
            throw new IllegalArgumentException("Doctor with ID " + doctorId + " does not exist or doctor-service is unreachable.");
        }
    }

    private String generatePatientId() {
        Random rand = new Random();
        int num = 100000 + rand.nextInt(900000);
        return "PAT-" + num;
    }
}
