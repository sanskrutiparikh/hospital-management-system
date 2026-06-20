package com.hospital.authservice.config;

import com.hospital.authservice.model.Role;
import com.hospital.authservice.model.User;
import com.hospital.authservice.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            log.info("Seeding auth database with default users...");

            String defaultPassword = passwordEncoder.encode("password");

            userRepository.save(new User("System Admin", "admin@medpulse.com", defaultPassword, Role.ADMIN));
            userRepository.save(new User("Dr. Sarah Jenkins", "sarah.jenkins@medpulse.com", defaultPassword, Role.DOCTOR));
            userRepository.save(new User("Dr. Robert Chen", "robert.chen@medpulse.com", defaultPassword, Role.DOCTOR));
            userRepository.save(new User("Dr. Lisa Wong", "lisa.wong@medpulse.com", defaultPassword, Role.DOCTOR));
            userRepository.save(new User("Dr. Alan Turing", "alan.turing@medpulse.com", defaultPassword, Role.DOCTOR));
            userRepository.save(new User("David Miller", "david.miller@gmail.com", defaultPassword, Role.PATIENT));
            userRepository.save(new User("Emma Watson", "emma.watson@yahoo.com", defaultPassword, Role.PATIENT));
            userRepository.save(new User("Robert Downey", "robert.downey@gmail.com", defaultPassword, Role.PATIENT));
            userRepository.save(new User("Sophia Loren", "sophia.loren@gmail.com", defaultPassword, Role.PATIENT));

            log.info("Default users seeded successfully!");
        } else {
            log.info("Auth database is already seeded.");
        }
    }
}
