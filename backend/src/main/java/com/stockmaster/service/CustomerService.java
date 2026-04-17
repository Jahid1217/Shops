package com.stockmaster.service;

import com.stockmaster.exception.ResourceNotFoundException;
import com.stockmaster.model.Customer;
import com.stockmaster.repository.CustomerRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final AuditLogService auditLogService;

    public CustomerService(CustomerRepository customerRepository, AuditLogService auditLogService) {
        this.customerRepository = customerRepository;
        this.auditLogService = auditLogService;
    }

    public List<Customer> getAll() {
        return customerRepository.findAll();
    }

    public Customer getById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
    }

    public Optional<Customer> getByPhone(String phone) {
        return customerRepository.findByPhone(phone);
    }

    public Customer create(Customer customer, Long userId, String userName) {
        if (customerRepository.existsByPhone(customer.getPhone())) {
            throw new IllegalArgumentException("Customer with this phone number already exists!");
        }
        customer.setCreatedBy(userName);
        Customer saved = customerRepository.save(customer);
        auditLogService.log(userId, userName, "Add Customer",
                "Added new customer: " + saved.getName() + " (" + saved.getPhone() + ")");
        return saved;
    }

    public Customer update(Long id, Customer customer, Long userId, String userName) {
        Customer existing = getById(id);
        if (!existing.getPhone().equals(customer.getPhone()) && customerRepository.existsByPhone(customer.getPhone())) {
            throw new IllegalArgumentException("Customer with this phone number already exists!");
        }
        existing.setName(customer.getName());
        existing.setPhone(customer.getPhone());
        existing.setAddress(customer.getAddress());
        Customer saved = customerRepository.save(existing);
        auditLogService.log(userId, userName, "Update Customer",
                "Updated customer: " + saved.getName() + " (" + saved.getPhone() + ")");
        return saved;
    }
}
