package com.hospital.billingservice.controller;

import com.hospital.billingservice.model.Bill;
import com.hospital.billingservice.repository.BillRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bills")
@CrossOrigin("*")
public class BillController {

    private static final Logger log = LoggerFactory.getLogger(BillController.class);

    private final BillRepository billRepository;
    private final RestTemplate restTemplate;

    public BillController(BillRepository billRepository, RestTemplate restTemplate) {
        this.billRepository = billRepository;
        this.restTemplate = restTemplate;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Bill> generateInvoice(@RequestBody Bill bill) {
        // Verify patient exists
        try {
            fetchPatientById(bill.getPatientId());
        } catch (Exception e) {
            log.error("Validation failed: Patient {} does not exist. Error: {}", bill.getPatientId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        bill.setPaymentStatus("UNPAID");
        bill.setGeneratedDate(LocalDate.now());
        Bill saved = billRepository.save(bill);
        log.info("Generated new invoice: ID = {}, Patient = {}, Amount = {}", saved.getBillId(), saved.getPatientId(), saved.getAmount());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Bill>> getAllBills() {
        return ResponseEntity.ok(billRepository.findAll());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Bill>> getBillsForPatient(@PathVariable String patientId, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            return ResponseEntity.ok(billRepository.findAllByPatientId(patientId));
        }

        // Patient can view own bills
        try {
            Map<?, ?> patient = fetchPatientById(patientId);
            String email = (String) patient.get("email");
            if (email != null && email.equalsIgnoreCase(authentication.getName())) {
                return ResponseEntity.ok(billRepository.findAllByPatientId(patientId));
            }
        } catch (Exception e) {
            log.error("Error fetching patient details for ID: {}", patientId);
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @PutMapping("/{billId}/status")
    public ResponseEntity<Bill> updateBillStatus(
            @PathVariable Long billId,
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found."));

        String newStatus = request.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().build();
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            bill.setPaymentStatus(newStatus.toUpperCase());
            return ResponseEntity.ok(billRepository.save(bill));
        }

        // Patient paying own bill
        try {
            Map<?, ?> patient = fetchPatientById(bill.getPatientId());
            String email = (String) patient.get("email");
            if (email != null && email.equalsIgnoreCase(authentication.getName())) {
                if (newStatus.equalsIgnoreCase("PAID")) {
                    bill.setPaymentStatus("PAID");
                    log.info("Bill ID = {} paid by patient {}", billId, bill.getPatientId());
                    return ResponseEntity.ok(billRepository.save(bill));
                }
            }
        } catch (Exception e) {
            log.error("Error verifying patient ownership for bill: {}", billId);
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    // ==========================================
    // Downstream Microservice Helper Methods
    // ==========================================

    private Map<?, ?> fetchPatientById(String patientId) {
        String url = "http://PATIENT-SERVICE/patients/" + patientId;
        return restTemplate.getForObject(url, Map.class);
    }
}
