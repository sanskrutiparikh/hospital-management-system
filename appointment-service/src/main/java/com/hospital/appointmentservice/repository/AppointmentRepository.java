package com.hospital.appointmentservice.repository;

import com.hospital.appointmentservice.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findAllByPatientId(String patientId);
    List<Appointment> findAllByDoctorId(String doctorId);
}
