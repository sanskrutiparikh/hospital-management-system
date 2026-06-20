package com.hospital.billingservice.config;

import com.hospital.billingservice.model.Bill;
import com.hospital.billingservice.repository.BillRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final BillRepository billRepository;

    public DatabaseSeeder(BillRepository billRepository) {
        this.billRepository = billRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (billRepository.count() == 0) {
            log.info("Seeding database with default billing invoices...");

            Bill b1 = new Bill("PAT-100001", "General ICU Care", 4800.0, "UNPAID", LocalDate.now());
            Bill b2 = new Bill("PAT-100002", "Endocrine Screening", 650.0, "PAID", LocalDate.now());
            Bill b3 = new Bill("PAT-100003", "Pulmonary Therapy", 1200.0, "PAID", LocalDate.now());
            Bill b4 = new Bill("PAT-100004", "Migraine Therapeutics", 350.0, "UNPAID", LocalDate.now());

            billRepository.save(b1);
            billRepository.save(b2);
            billRepository.save(b3);
            billRepository.save(b4);

            log.info("Default billing invoices seeded successfully!");
        } else {
            log.info("Billing database is already seeded.");
        }
    }
}
