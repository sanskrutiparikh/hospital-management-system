package com.hospital.appointmentservice.controller;

import com.hospital.appointmentservice.model.Appointment;
import com.hospital.appointmentservice.repository.AppointmentRepository;
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
@RequestMapping("/appointments")
@CrossOrigin("*")
public class AppointmentController {

    private static final Logger log = LoggerFactory.getLogger(AppointmentController.class);

    private final AppointmentRepository appointmentRepository;
    private final RestTemplate restTemplate;

    public AppointmentController(AppointmentRepository appointmentRepository, RestTemplate restTemplate) {
        this.appointmentRepository = appointmentRepository;
        this.restTemplate = restTemplate;
    }

    @PostMapping
    public ResponseEntity<Appointment> bookAppointment(@RequestBody Appointment appointment, Authentication authentication) {
        // 1. Verify patient exists and get details
        Map<?, ?> patient;
        try {
            patient = fetchPatientById(appointment.getPatientId());
        } catch (Exception e) {
            log.error("Validation failed: Patient {} does not exist. Error: {}", appointment.getPatientId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        // 2. Verify doctor exists
        try {
            fetchDoctorById(appointment.getDoctorId());
        } catch (Exception e) {
            log.error("Validation failed: Doctor {} does not exist. Error: {}", appointment.getDoctorId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        // 3. Security check: ADMIN can do anything, PATIENT can only book for themselves
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            String patientEmail = (String) patient.get("email");
            if (patientEmail == null || !patientEmail.equalsIgnoreCase(authentication.getName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        appointment.setAppointmentStatus("PENDING");
        Appointment saved = appointmentRepository.save(appointment);
        log.info("Booked new appointment: ID = {}, Patient = {}, Doctor = {}", saved.getAppointmentId(), saved.getPatientId(), saved.getDoctorId());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        return ResponseEntity.ok(appointmentRepository.findAll());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Appointment>> getAppointmentsForPatient(@PathVariable String patientId, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            return ResponseEntity.ok(appointmentRepository.findAllByPatientId(patientId));
        }

        // Check if patient email matches token
        try {
            Map<?, ?> patient = fetchPatientById(patientId);
            String email = (String) patient.get("email");
            if (email != null && email.equalsIgnoreCase(authentication.getName())) {
                return ResponseEntity.ok(appointmentRepository.findAllByPatientId(patientId));
            }
        } catch (Exception e) {
            log.error("Error fetching patient details for ID: {}", patientId);
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Appointment>> getAppointmentsForDoctor(@PathVariable String doctorId, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            return ResponseEntity.ok(appointmentRepository.findAllByDoctorId(doctorId));
        }

        // Check if doctor email matches token
        try {
            Map<?, ?> doctor = fetchDoctorById(doctorId);
            String email = (String) doctor.get("email");
            if (email != null && email.equalsIgnoreCase(authentication.getName())) {
                return ResponseEntity.ok(appointmentRepository.findAllByDoctorId(doctorId));
            }
        } catch (Exception e) {
            log.error("Error fetching doctor details for ID: {}", doctorId);
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @PutMapping("/{appointmentId}/status")
    public ResponseEntity<Appointment> updateAppointmentStatus(
            @PathVariable Long appointmentId,
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found."));

        String newStatus = request.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().build();
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            appointment.setAppointmentStatus(newStatus.toUpperCase());
            return ResponseEntity.ok(appointmentRepository.save(appointment));
        }

        // Doctor assigned to appointment can update it
        try {
            Map<?, ?> doctor = fetchDoctorById(appointment.getDoctorId());
            String email = (String) doctor.get("email");
            if (email != null && email.equalsIgnoreCase(authentication.getName())) {
                appointment.setAppointmentStatus(newStatus.toUpperCase());
                return ResponseEntity.ok(appointmentRepository.save(appointment));
            }
        } catch (Exception e) {
            log.error("Error verifying doctor ownership for appointment: {}", appointmentId);
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @PutMapping("/{appointmentId}/reschedule")
    public ResponseEntity<Appointment> rescheduleAppointment(
            @PathVariable Long appointmentId,
            @RequestBody Appointment rescheduled,
            Authentication authentication
    ) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found."));

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        boolean isAuthorized = false;

        if (isAdmin) {
            isAuthorized = true;
        } else {
            // Check if patient owns it
            try {
                Map<?, ?> patient = fetchPatientById(appointment.getPatientId());
                String pEmail = (String) patient.get("email");
                if (pEmail != null && pEmail.equalsIgnoreCase(authentication.getName())) {
                    isAuthorized = true;
                }
            } catch (Exception e) {
                // Ignore
            }

            // Check if doctor owns it
            if (!isAuthorized) {
                try {
                    Map<?, ?> doctor = fetchDoctorById(appointment.getDoctorId());
                    String dEmail = (String) doctor.get("email");
                    if (dEmail != null && dEmail.equalsIgnoreCase(authentication.getName())) {
                        isAuthorized = true;
                    }
                } catch (Exception e) {
                    // Ignore
                }
            }
        }

        if (!isAuthorized) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        appointment.setAppointmentDate(rescheduled.getAppointmentDate());
        appointment.setAppointmentTime(rescheduled.getAppointmentTime());
        if (rescheduled.getAppointmentStatus() != null) {
            appointment.setAppointmentStatus(rescheduled.getAppointmentStatus().toUpperCase());
        }

        log.info("Rescheduled appointment: ID = {}", appointmentId);
        return ResponseEntity.ok(appointmentRepository.save(appointment));
    }

    @DeleteMapping("/{appointmentId}")
    public ResponseEntity<Void> cancelAppointment(@PathVariable Long appointmentId, Authentication authentication) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found."));

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        boolean isAuthorized = false;

        if (isAdmin) {
            isAuthorized = true;
        } else {
            // Patient owns it
            try {
                Map<?, ?> patient = fetchPatientById(appointment.getPatientId());
                String pEmail = (String) patient.get("email");
                if (pEmail != null && pEmail.equalsIgnoreCase(authentication.getName())) {
                    isAuthorized = true;
                }
            } catch (Exception e) {
                // Ignore
            }
        }

        if (!isAuthorized) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        appointment.setAppointmentStatus("CANCELLED");
        appointmentRepository.save(appointment);
        log.info("Cancelled appointment: ID = {}", appointmentId);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // Downstream Microservice Helper Methods
    // ==========================================

    private Map<?, ?> fetchPatientById(String patientId) {
        String url = "http://PATIENT-SERVICE/patients/" + patientId;
        return restTemplate.getForObject(url, Map.class);
    }

    private Map<?, ?> fetchDoctorById(String doctorId) {
        String url = "http://DOCTOR-SERVICE/doctors/" + doctorId;
        return restTemplate.getForObject(url, Map.class);
    }
}
