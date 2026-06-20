package com.hospital.authservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration class holding non-HTTP security beans.
 * Reorganizing these beans here avoids circular dependency loops in SecurityConfig.
 */
@Configuration
public class ApplicationConfig {

    /**
     * Configures the DaoAuthenticationProvider bean, which performs authentication using
     * the CustomUserDetailsService and a BCrypt password encoder.
     */
    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    /**
     * Registers the BCryptPasswordEncoder bean for encrypting and comparing passwords.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Registers the standard AuthenticationManager bean from Security Configuration.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Creates a Load-Balanced RestTemplate bean for microservice communication.
     */
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
