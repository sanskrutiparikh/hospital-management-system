package com.hospital.patientservice.repository;

import com.hospital.patientservice.model.PatientDoctorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentRepository extends JpaRepository<PatientDoctorAssignment, Long> {
    Optional<PatientDoctorAssignment> findByPatientIdAndStatus(String patientId, String status);
    List<PatientDoctorAssignment> findAllByDoctorIdAndStatus(String doctorId, String status);
    Optional<PatientDoctorAssignment> findByPatientIdAndDoctorId(String patientId, String doctorId);
}
