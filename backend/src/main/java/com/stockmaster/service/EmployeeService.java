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

    public List<Employee> getAll() {
        return employeeRepository.findAll();
    }

    public Employee getById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    public Employee create(Employee employee) {
        if (employee.getEmail() != null && employeeRepository.existsByEmail(employee.getEmail())) {
            throw new IllegalArgumentException("Employee with this email already exists!");
        }
        return employeeRepository.save(employee);
    }

    public Employee update(Long id, Employee employee) {
        Employee existing = getById(id);
        if (employee.getEmail() != null
                && !employee.getEmail().equals(existing.getEmail())
                && employeeRepository.existsByEmail(employee.getEmail())) {
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

    public void delete(Long id) {
        Employee employee = getById(id);
        employeeRepository.delete(employee);
    }
}
