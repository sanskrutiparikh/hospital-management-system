package com.hospital.eureka_server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * Eureka Server — The Service Registry for our Microservices.
 *
 * WHAT IS EUREKA SERVER?
 * ──────────────────────
 * Think of Eureka Server as a "phone book" for microservices.
 * Just like a phone book stores everyone's name and phone number,
 * Eureka Server stores every microservice's name and address (host:port).
 *
 * WHY DO WE NEED IT?
 * ──────────────────
 * Without Eureka: patient-service must know auth-service's exact address
 *                 → http://localhost:8081/auth/validate  (hardcoded!)
 *
 * With Eureka:    patient-service just says "I need AUTH-SERVICE"
 *                 → Eureka tells it where auth-service is running
 *                 → Works even if auth-service moves to a different port/server!
 *
 * HOW IT WORKS:
 * ─────────────
 * 1. Eureka Server starts first (port 8761)
 * 2. auth-service starts → registers itself: "I'm AUTH-SERVICE at localhost:8081"
 * 3. patient-service starts → registers itself: "I'm PATIENT-SERVICE at localhost:8080"
 * 4. When patient-service needs auth-service:
 *    → It asks Eureka: "Where is AUTH-SERVICE?"
 *    → Eureka responds: "AUTH-SERVICE is at localhost:8081"
 *    → patient-service calls that address
 *
 * @EnableEurekaServer — This annotation turns this Spring Boot app
 *                       into a Eureka Server (service registry).
 */
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
        System.out.println("=============================================");
        System.out.println("  EUREKA SERVER is running on port 8761");
        System.out.println("  Dashboard: http://localhost:8761");
        System.out.println("=============================================");
    }
}