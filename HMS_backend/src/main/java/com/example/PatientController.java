package com.example;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin("*")
public class PatientController {

    @Autowired
    PatientRepository repo;

    @PostMapping("/patients")
    public Patient addPatient(
            @RequestBody Patient patient
    ) {

        return repo.save(patient);
    }

    @GetMapping("/patients")
    public List<Patient> getPatients() {

        return repo.findAll();
    }

    @DeleteMapping("/patients/{id}")
    public String deletePatient(
            @PathVariable int id
    ) {

        repo.deleteById(id);

        return "Patient Deleted";
    }
}