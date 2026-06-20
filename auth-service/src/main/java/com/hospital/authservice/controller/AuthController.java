package com.hospital.authservice.controller;

import com.hospital.authservice.dto.LoginRequest;
import com.hospital.authservice.dto.LoginResponse;
import com.hospital.authservice.dto.SignupRequest;
import com.hospital.authservice.model.User;
import com.hospital.authservice.repository.UserRepository;
import com.hospital.authservice.service.JwtService;
import com.hospital.authservice.exception.UserAlreadyExistsException;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

/**
 * REST Controller for User Authentication & Registration.
 */
@RestController
@RequestMapping("/auth")
@CrossOrigin("*")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RestTemplate restTemplate;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            RestTemplate restTemplate
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.restTemplate = restTemplate;
    }

    /**
     * POST /auth/signup
     * Creates a new user in the system. Enforces hashed passwords via BCrypt.
     */
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@Valid @RequestBody SignupRequest signupRequest) {
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new UserAlreadyExistsException("Error: Email is already registered!");
        }

        // Create new User entity, encrypting the raw password using BCrypt
        User newUser = new User(
                signupRequest.getName(),
                signupRequest.getEmail(),
                passwordEncoder.encode(signupRequest.getPassword()),
                signupRequest.getRole()
        );

        userRepository.save(newUser);

        // Notify downstream services to create default profiles if role is PATIENT or DOCTOR
        try {
            if (newUser.getRole() == com.hospital.authservice.model.Role.PATIENT) {
                java.util.Map<String, String> profileRequest = new java.util.HashMap<>();
                profileRequest.put("email", newUser.getEmail());
                profileRequest.put("fullName", newUser.getName());
                restTemplate.postForObject("http://PATIENT-SERVICE/patients/profile", profileRequest, String.class);
            } else if (newUser.getRole() == com.hospital.authservice.model.Role.DOCTOR) {
                java.util.Map<String, String> profileRequest = new java.util.HashMap<>();
                profileRequest.put("email", newUser.getEmail());
                profileRequest.put("fullName", newUser.getName());
                restTemplate.postForObject("http://DOCTOR-SERVICE/doctors/profile", profileRequest, String.class);
            }
        } catch (Exception e) {
            log.error("Failed to propagate profile creation downstream for user: {}, Error: {}", newUser.getEmail(), e.getMessage());
        }

        return ResponseEntity.ok("User registered successfully!");
    }

    /**
     * POST /auth/login
     * Authenticates the user credentials and returns a signed JWT token on success.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Received login request for email: {}", loginRequest.getEmail());
        try {
            // Authenticate credentials using Spring Security's AuthenticationManager
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );
            log.info("Authentication successful for email: {}", loginRequest.getEmail());
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            log.error("Authentication failed for email: {} - Wrong Credentials (BadCredentialsException)", loginRequest.getEmail());
            throw e;
        } catch (Exception e) {
            log.error("Authentication failed for email: {} - Error: {}", loginRequest.getEmail(), e.getMessage());
            throw e;
        }

        // Fetch User details from database to append custom metadata (like role) into JWT claims
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> {
                    log.error("Authenticated user not found in database for email: {}", loginRequest.getEmail());
                    return new RuntimeException("Authenticated user not found in database.");
                });

        // Generate the token
        String jwtToken = jwtService.generateToken(user);
        log.info("JWT token successfully generated for email: {}", loginRequest.getEmail());

        return ResponseEntity.ok(new LoginResponse(jwtToken));
    }

    /**
     * GET /auth/validate
     * Legacy verification endpoint. Included for simple verification purposes.
     */
    @GetMapping("/validate")
    public ResponseEntity<String> validateUser() {
        return ResponseEntity.ok("User Validated Successfully");
    }
}
