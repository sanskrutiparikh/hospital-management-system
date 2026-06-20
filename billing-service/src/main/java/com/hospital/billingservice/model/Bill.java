package com.hospital.billingservice.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "bills")
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long billId;

    @Column(nullable = false)
    private String patientId;

    @Column(nullable = false)
    private String serviceRendered;

    @Column(nullable = false)
    private double amount;

    @Column(nullable = false)
    private String paymentStatus; // PAID, UNPAID

    @Column(nullable = false)
    private LocalDate generatedDate;

    public Bill() {
    }

    public Bill(String patientId, String serviceRendered, double amount, String paymentStatus, LocalDate generatedDate) {
        this.patientId = patientId;
        this.serviceRendered = serviceRendered;
        this.amount = amount;
        this.paymentStatus = paymentStatus;
        this.generatedDate = generatedDate;
    }

    // Getters and Setters
    public Long getBillId() {
        return billId;
    }

    public void setBillId(Long billId) {
        this.billId = billId;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getServiceRendered() {
        return serviceRendered;
    }

    public void setServiceRendered(String serviceRendered) {
        this.serviceRendered = serviceRendered;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public LocalDate getGeneratedDate() {
        return generatedDate;
    }

    public void setGeneratedDate(LocalDate generatedDate) {
        this.generatedDate = generatedDate;
    }
}
