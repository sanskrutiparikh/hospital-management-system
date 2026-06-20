package com.hospital.appointmentservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class AppointmentServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AppointmentServiceApplication.class, args);
        System.out.println("============================================");
        System.out.println("  APPOINTMENT-SERVICE is running on port 8083");
        System.out.println("  Registered with Eureka Server");
        System.out.println("============================================");
    }

    @Bean
    @LoadBalanced
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
