package com.hospital.patientservice.controller;

import com.hospital.patientservice.model.Patient;
import com.hospital.patientservice.model.PatientDoctorAssignment;
import com.hospital.patientservice.service.PatientService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/patients")
@CrossOrigin("*")
public class PatientController {

    private static final Logger log = LoggerFactory.getLogger(PatientController.class);

    private final PatientService patientService;
    private final RestTemplate restTemplate;

    public PatientController(PatientService patientService, RestTemplate restTemplate) {
        this.patientService = patientService;
        this.restTemplate = restTemplate;
    }

    /**
     * Endpoint called from auth-service upon successful signup to create patient profile.
     */
    @PostMapping("/profile")
    public ResponseEntity<Patient> createProfile(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String fullName = request.get("fullName");
        
        Patient patient = new Patient();
        patient.setEmail(email);
        patient.setFullName(fullName);
        patient.setAge(0);
        patient.setGender("Other");
        patient.setBloodGroup("Unknown");
        patient.setAddress("Please update address");
        patient.setContactNumber("Please update contact");
        patient.setMedicalHistory("No history recorded");

        Patient savedPatient = patientService.createPatient(patient);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedPatient);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Patient> createPatient(@RequestBody Patient patient) {
        Patient savedPatient = patientService.createPatient(patient);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedPatient);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<Patient>> getAllPatients(Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (isAdmin) {
            return ResponseEntity.ok(patientService.getAllPatients());
        }

        // If DOCTOR, return only patients assigned to this doctor
        String username = authentication.getName();
        try {
            String doctorId = fetchDoctorIdByEmail(username);
            return ResponseEntity.ok(patientService.getPatientsAssignedToDoctor(doctorId));
        } catch (Exception e) {
            log.error("Failed to fetch assigned patients for doctor email: {}, Error: {}", username, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{patientId}")
    public ResponseEntity<Patient> getPatientById(@PathVariable String patientId, Authentication authentication) {
        Patient patient = patientService.getPatientByPatientId(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient with ID " + patientId + " not found."));

        String username = authentication.getName(); // email
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (isAdmin) {
            return ResponseEntity.ok(patient);
        }

        boolean isPatient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"));
        
        if (isPatient) {
            if (patient.getEmail().equalsIgnoreCase(username)) {
                return ResponseEntity.ok(patient);
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        boolean isDoctor = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR"));
        
        if (isDoctor) {
            try {
                String doctorId = fetchDoctorIdByEmail(username);
                boolean isAssigned = patientService.getDoctorAssignedToPatient(patientId)
                        .map(a -> a.getDoctorId().equalsIgnoreCase(doctorId))
                        .orElse(false);
                if (isAssigned) {
                    return ResponseEntity.ok(patient);
                }
            } catch (Exception e) {
                log.error("Failed to verify assignment for doctor email: {} and patientId: {}", username, patientId);
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<Patient> getPatientByEmail(@PathVariable String email) {
        return patientService.getPatientByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{patientId}")
    public ResponseEntity<Patient> updatePatient(@PathVariable String patientId, @RequestBody Patient patient, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (isAdmin) {
            return ResponseEntity.ok(patientService.updatePatient(patientId, patient));
        }

        boolean isPatient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"));
        
        if (isPatient) {
            Patient existing = patientService.getPatientByPatientId(patientId)
                    .orElseThrow(() -> new IllegalArgumentException("Patient with ID " + patientId + " not found."));
            if (existing.getEmail().equalsIgnoreCase(authentication.getName())) {
                return ResponseEntity.ok(patientService.updatePatient(patientId, patient));
            }
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @DeleteMapping("/{patientId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePatient(@PathVariable String patientId) {
        patientService.deletePatient(patientId);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // Patient-Doctor Assignment Endpoints
    // ==========================================

    @PostMapping("/assignments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PatientDoctorAssignment> assignDoctor(@RequestBody Map<String, String> request) {
        String patientId = request.get("patientId");
        String doctorId = request.get("doctorId");
        PatientDoctorAssignment assignment = patientService.assignDoctor(patientId, doctorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(assignment);
    }

    @PutMapping("/assignments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PatientDoctorAssignment> changeAssignment(@RequestBody Map<String, String> request) {
        String patientId = request.get("patientId");
        String doctorId = request.get("doctorId");
        PatientDoctorAssignment assignment = patientService.changeAssignedDoctor(patientId, doctorId);
        return ResponseEntity.ok(assignment);
    }

    @GetMapping("/assignments/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<Patient>> getPatientsByDoctor(@PathVariable String doctorId, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (isAdmin) {
            return ResponseEntity.ok(patientService.getPatientsAssignedToDoctor(doctorId));
        }

        // Check if doctor is querying their own assigned patients
        String username = authentication.getName();
        try {
            String actualDoctorId = fetchDoctorIdByEmail(username);
            if (actualDoctorId.equalsIgnoreCase(doctorId)) {
                return ResponseEntity.ok(patientService.getPatientsAssignedToDoctor(doctorId));
            }
        } catch (Exception e) {
            log.error("Failed to verify doctor ownership for email: {}", username);
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @GetMapping("/assignments/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PATIENT')")
    public ResponseEntity<PatientDoctorAssignment> getDoctorForPatient(@PathVariable String patientId, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (isAdmin) {
            return patientService.getDoctorAssignedToPatient(patientId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }

        // Check if patient is querying their own doctor details
        String username = authentication.getName();
        Patient patient = patientService.getPatientByPatientId(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found."));

        if (patient.getEmail().equalsIgnoreCase(username)) {
            return patientService.getDoctorAssignedToPatient(patientId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @DeleteMapping("/assignments/patient/{patientId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeAssignment(@PathVariable String patientId) {
        patientService.removeAssignment(patientId);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // Downstream Microservice Calls
    // ==========================================

    private String fetchDoctorIdByEmail(String email) {
        String url = "http://DOCTOR-SERVICE/doctors/email/" + email;
        try {
            Map<?, ?> doctor = restTemplate.getForObject(url, Map.class);
            if (doctor != null && doctor.containsKey("doctorId")) {
                return (String) doctor.get("doctorId");
            }
        } catch (Exception e) {
            log.error("Failed to fetch doctor by email: {}, Error: {}", email, e.getMessage());
        }
        throw new IllegalArgumentException("Doctor with email " + email + " not found or doctor-service is unreachable.");
    }
}
