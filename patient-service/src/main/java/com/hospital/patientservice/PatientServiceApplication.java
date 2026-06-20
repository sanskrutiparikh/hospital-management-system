package com.hospital.patientservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

/**
 * Main entry point for the Patient Service microservice.
 *
 * KEY CHANGE: @LoadBalanced on RestTemplate
 * ─────────────────────────────────────────
 *
 * BEFORE (without Eureka):
 *   @Bean
 *   public RestTemplate restTemplate() { return new RestTemplate(); }
 *   → Could only call hardcoded URLs like http://localhost:8081/auth/validate
 *
 * AFTER (with Eureka):
 *   @Bean
 *   @LoadBalanced      ← THIS IS THE MAGIC!
 *   public RestTemplate restTemplate() { return new RestTemplate(); }
 *   → Can now use service names like http://AUTH-SERVICE/auth/validate
 *   → RestTemplate asks Eureka: "Where is AUTH-SERVICE?"
 *   → Eureka responds: "It's at localhost:8081"
 *   → RestTemplate calls localhost:8081 automatically!
 *
 * WHAT DOES @LoadBalanced DO?
 * ───────────────────────────
 * 1. Intercepts every RestTemplate call
 * 2. Extracts the service name from the URL (e.g., "AUTH-SERVICE")
 * 3. Asks Eureka Server: "Where is AUTH-SERVICE running?"
 * 4. Eureka responds with the actual address: "localhost:8081"
 * 5. Replaces the service name with the real address
 * 6. Makes the HTTP call to http://localhost:8081/auth/validate
 *
 * BONUS: If AUTH-SERVICE has multiple instances (e.g., on ports 8081, 8082),
 * @LoadBalanced will distribute requests between them (round-robin)!
 * That's why it's called "Load Balanced".
 */
@SpringBootApplication
public class PatientServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PatientServiceApplication.class, args);
        System.out.println("============================================");
        System.out.println("  PATIENT-SERVICE is running on port 8080");
        System.out.println("  Registered with Eureka Server");
        System.out.println("============================================");
    }

    /**
     * Creates a Load-Balanced RestTemplate bean.
     *
     * @LoadBalanced makes this RestTemplate "Eureka-aware":
     * → It can resolve service names (like AUTH-SERVICE) to actual addresses
     * → It supports client-side load balancing across multiple instances
     */
    @Bean
    @LoadBalanced   // ★ THIS annotation enables Eureka service discovery for RestTemplate!
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.getInterceptors().add((request, body, execution) -> {
            try {
                org.springframework.web.context.request.RequestAttributes attributes = 
                    org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
                if (attributes instanceof org.springframework.web.context.request.ServletRequestAttributes) {
                    jakarta.servlet.http.HttpServletRequest servletRequest = 
                        ((org.springframework.web.context.request.ServletRequestAttributes) attributes).getRequest();
                    String authHeader = servletRequest.getHeader("Authorization");
                    if (authHeader != null && !authHeader.isEmpty()) {
                        request.getHeaders().add("Authorization", authHeader);
                    }
                }
            } catch (Exception e) {
                // Fallback for background contexts
            }
            return execution.execute(request, body);
        });
        return restTemplate;
    }
}
