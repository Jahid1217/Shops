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

    public List<Customer> getAll(String shopName) {
        return customerRepository.findAllByShopName(normalizeShopName(shopName));
    }

    public Customer getById(Long id, String shopName) {
        return customerRepository.findByIdAndShopName(id, normalizeShopName(shopName))
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
    }

    public Optional<Customer> getByPhone(String phone, String shopName) {
        return customerRepository.findByPhoneAndShopName(phone, normalizeShopName(shopName));
    }

    public Customer create(Customer customer, Long userId, String userName, String shopName) {
        String scopedShop = normalizeShopName(shopName);
        if (customerRepository.existsByPhoneAndShopName(customer.getPhone(), scopedShop)) {
            throw new IllegalArgumentException("Customer with this phone number already exists!");
        }
        customer.setCreatedBy(userName);
        customer.setShopName(scopedShop);
        Customer saved = customerRepository.save(customer);
        auditLogService.log(userId, userName, scopedShop, "Add Customer",
                "Added new customer: " + saved.getName() + " (" + saved.getPhone() + ")");
        return saved;
    }

    public Customer update(Long id, Customer customer, Long userId, String userName, String shopName) {
        String scopedShop = normalizeShopName(shopName);
        Customer existing = getById(id, scopedShop);
        if (!existing.getPhone().equals(customer.getPhone())
                && customerRepository.existsByPhoneAndShopName(customer.getPhone(), scopedShop)) {
            throw new IllegalArgumentException("Customer with this phone number already exists!");
        }
        existing.setName(customer.getName());
        existing.setPhone(customer.getPhone());
        existing.setAddress(customer.getAddress());
        Customer saved = customerRepository.save(existing);
        auditLogService.log(userId, userName, scopedShop, "Update Customer",
                "Updated customer: " + saved.getName() + " (" + saved.getPhone() + ")");
        return saved;
    }

    private String normalizeShopName(String shopName) {
        if (shopName == null || shopName.trim().isEmpty()) {
            throw new IllegalArgumentException("Shop information is missing for the current user.");
        }
        return shopName.trim();
    }
}
