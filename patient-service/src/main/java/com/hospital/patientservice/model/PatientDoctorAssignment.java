package com.hospital.patientservice.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "patient_doctor_assignments")
public class PatientDoctorAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long assignmentId;

    @Column(nullable = false)
    private String patientId;

    @Column(nullable = false)
    private String doctorId;

    @Column(nullable = false)
    private LocalDate assignedDate;

    @Column(nullable = false)
    private String status; // ACTIVE, INACTIVE

    public PatientDoctorAssignment() {
    }

    public PatientDoctorAssignment(String patientId, String doctorId, LocalDate assignedDate, String status) {
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.assignedDate = assignedDate;
        this.status = status;
    }

    // Getters and Setters
    public Long getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(Long assignmentId) {
        this.assignmentId = assignmentId;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public LocalDate getAssignedDate() {
        return assignedDate;
    }

    public void setAssignedDate(LocalDate assignedDate) {
        this.assignedDate = assignedDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
