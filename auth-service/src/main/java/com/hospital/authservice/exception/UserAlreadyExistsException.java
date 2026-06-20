package com.hospital.authservice.exception;

/**
 * Custom runtime exception thrown when a user tries to register with an email
 * that is already in use.
 */
public class UserAlreadyExistsException extends RuntimeException {
    
    public UserAlreadyExistsException(String message) {
        super(message);
    }
}
