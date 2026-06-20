package com.hospital.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the API Gateway microservice.
 *
 * WHAT THIS SERVICE DOES:
 * ───────────────────────────────────────────────────────
 * The API Gateway is the SINGLE ENTRY POINT for all frontend requests.
 * Instead of the frontend calling each microservice directly:
 *
 *   BEFORE (without Gateway):
 *     Frontend → http://localhost:8081/auth/login     (auth-service)
 *     Frontend → http://localhost:8080/patients       (patient-service)
 *
 *   AFTER (with Gateway):
 *     Frontend → http://localhost:9090/auth/login     (Gateway forwards to auth-service)
 *     Frontend → http://localhost:9090/patients       (Gateway forwards to patient-service)
 *
 * The frontend only needs to know ONE URL: http://localhost:9090
 * ───────────────────────────────────────────────────────
 *
 * HOW IT WORKS:
 *   1. Frontend sends request to Gateway (port 9090)
 *   2. Gateway matches the URL path against configured route predicates
 *   3. Gateway asks Eureka Server: "Where is this service?"
 *   4. Eureka responds with the service's actual address
 *   5. Gateway forwards the request (including headers like JWT tokens)
 *   6. Gateway sends the response back to the frontend
 *
 * @SpringBootApplication combines:
 *   - @Configuration:         Marks this class as a source of bean definitions
 *   - @EnableAutoConfiguration: Auto-configures Gateway based on classpath dependencies
 *   - @ComponentScan:         Scans this package and sub-packages for Spring components
 */
@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
        System.out.println("========================================");
        System.out.println("  API-GATEWAY is running on port 9090");
        System.out.println("========================================");
    }
}
