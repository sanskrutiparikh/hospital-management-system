package com.hospital.doctorservice.service;

import com.hospital.doctorservice.model.Doctor;
import com.hospital.doctorservice.repository.DoctorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class DoctorService {

    private static final Logger log = LoggerFactory.getLogger(DoctorService.class);

    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    public Doctor createDoctor(Doctor doctor) {
        if (doctor.getDoctorId() == null || doctor.getDoctorId().trim().isEmpty()) {
            doctor.setDoctorId(generateDoctorId());
        }
        if (doctorRepository.existsByDoctorId(doctor.getDoctorId())) {
            throw new IllegalArgumentException("Doctor with ID " + doctor.getDoctorId() + " already exists!");
        }
        if (doctorRepository.existsByEmail(doctor.getEmail())) {
            throw new IllegalArgumentException("Doctor with email " + doctor.getEmail() + " already exists!");
        }
        log.info("Creating new doctor profile: Name = {}, Email = {}, DoctorId = {}", doctor.getFullName(), doctor.getEmail(), doctor.getDoctorId());
        return doctorRepository.save(doctor);
    }

    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    public Optional<Doctor> getDoctorByDoctorId(String doctorId) {
        return doctorRepository.findByDoctorId(doctorId);
    }

    public Optional<Doctor> getDoctorByEmail(String email) {
        return doctorRepository.findByEmail(email);
    }

    public Doctor updateDoctor(String doctorId, Doctor updatedDoctor) {
        Doctor existingDoctor = doctorRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor with ID " + doctorId + " not found."));

        existingDoctor.setFullName(updatedDoctor.getFullName());
        existingDoctor.setSpecialization(updatedDoctor.getSpecialization());
        existingDoctor.setPhone(updatedDoctor.getPhone());
        existingDoctor.setYearsOfExperience(updatedDoctor.getYearsOfExperience());
        existingDoctor.setAvailabilityStatus(updatedDoctor.getAvailabilityStatus());

        log.info("Updating doctor profile for DoctorId = {}", doctorId);
        return doctorRepository.save(existingDoctor);
    }

    public void deleteDoctor(String doctorId) {
        Doctor doctor = doctorRepository.findByDoctorId(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor with ID " + doctorId + " not found."));
        log.info("Deleting doctor profile for DoctorId = {}", doctorId);
        doctorRepository.delete(doctor);
    }

    private String generateDoctorId() {
        Random rand = new Random();
        int num = 200000 + rand.nextInt(800000);
        return "DOC-" + num;
    }
}
