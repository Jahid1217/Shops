package com.stockmaster.service;

import com.stockmaster.exception.ResourceNotFoundException;
import com.stockmaster.model.Employee;
import com.stockmaster.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    public List<Employee> getAll(String shopName) {
        return employeeRepository.findAllByShopName(normalizeShopName(shopName));
    }

    public Employee getById(Long id, String shopName) {
        return employeeRepository.findByIdAndShopName(id, normalizeShopName(shopName))
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    public Employee create(Employee employee, String shopName) {
        String scopedShop = normalizeShopName(shopName);
        if (employee.getEmail() != null && employeeRepository.existsByEmailAndShopName(employee.getEmail(), scopedShop)) {
            throw new IllegalArgumentException("Employee with this email already exists!");
        }
        employee.setShopName(scopedShop);
        return employeeRepository.save(employee);
    }

    public Employee update(Long id, Employee employee, String shopName) {
        String scopedShop = normalizeShopName(shopName);
        Employee existing = getById(id, scopedShop);
        if (employee.getEmail() != null
                && !employee.getEmail().equals(existing.getEmail())
                && employeeRepository.existsByEmailAndShopName(employee.getEmail(), scopedShop)) {
            throw new IllegalArgumentException("Employee with this email already exists!");
        }
        existing.setName(employee.getName());
        existing.setPhone(employee.getPhone());
        existing.setEmail(employee.getEmail());
        existing.setPassword(employee.getPassword());
        existing.setSalary(employee.getSalary());
        existing.setGender(employee.getGender());
        existing.setAddress(employee.getAddress());
        existing.setPosition(employee.getPosition());
        return employeeRepository.save(existing);
    }

    public void delete(Long id, String shopName) {
        Employee employee = getById(id, shopName);
        employeeRepository.delete(employee);
    }

    private String normalizeShopName(String shopName) {
        if (shopName == null || shopName.trim().isEmpty()) {
            throw new IllegalArgumentException("Shop information is missing for the current user.");
        }
        return shopName.trim();
    }
}
