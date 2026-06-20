package com.hospital.authservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the Auth Service microservice.
 *
 * @SpringBootApplication combines three annotations:
 *   - @Configuration:      Marks this class as a source of bean definitions
 *   - @EnableAutoConfiguration: Tells Spring Boot to auto-configure based on dependencies
 *   - @ComponentScan:      Scans this package and sub-packages for Spring components
 */
@SpringBootApplication
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
        System.out.println("========================================");
        System.out.println("  AUTH-SERVICE is running on port 8081");
        System.out.println("========================================");
    }
}
