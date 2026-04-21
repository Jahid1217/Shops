package com.stockmaster.service;

import com.stockmaster.exception.ResourceNotFoundException;
import com.stockmaster.model.Employee;
import com.stockmaster.repository.EmployeeRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final PermissionService permissionService;

    public EmployeeService(EmployeeRepository employeeRepository,
                           PasswordEncoder passwordEncoder,
                           PermissionService permissionService) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.permissionService = permissionService;
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
        if (employee.getPassword() == null || employee.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Employee password is required.");
        }
        String role = normalizeRole(employee.getRole());
        List<String> menus = permissionService.normalizeMenusForRole(role, employee.getMenuPermissions());
        List<String> features = permissionService.normalizeFeaturesForRole(role, employee.getFeaturePermissions());

        employee.setShopName(scopedShop);
        employee.setRole(role);
        employee.setMenuPermissions(permissionService.toCsv(menus));
        employee.setFeaturePermissions(permissionService.toCsv(features));
        employee.setPassword(passwordEncoder.encode(employee.getPassword()));
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
        if (employee.getPassword() != null && !employee.getPassword().trim().isEmpty()) {
            existing.setPassword(passwordEncoder.encode(employee.getPassword()));
        }
        existing.setSalary(employee.getSalary());
        existing.setGender(employee.getGender());
        existing.setAddress(employee.getAddress());
        existing.setPosition(employee.getPosition());
        String role = normalizeRole(employee.getRole());
        List<String> menus = permissionService.normalizeMenusForRole(role, employee.getMenuPermissions());
        List<String> features = permissionService.normalizeFeaturesForRole(role, employee.getFeaturePermissions());
        existing.setRole(role);
        existing.setMenuPermissions(permissionService.toCsv(menus));
        existing.setFeaturePermissions(permissionService.toCsv(features));
        return employeeRepository.save(existing);
    }

    public void delete(Long id, String shopName) {
        Employee employee = getById(id, shopName);
        employeeRepository.delete(employee);
    }

    public Employee getByEmail(String email) {
        return employeeRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with email: " + email));
    }

    public Employee updateOwnProfile(Long id, String shopName, String name, String phone) {
        Employee existing = getById(id, shopName);
        existing.setName(name);
        existing.setPhone(phone);
        return employeeRepository.save(existing);
    }

    public void updateOwnPassword(Long id, String shopName, String oldPassword, String newPassword) {
        Employee existing = getById(id, shopName);
        if (existing.getPassword() == null || existing.getPassword().isEmpty()) {
            throw new IllegalArgumentException("Current password is not configured.");
        }

        boolean matches = passwordEncoder.matches(oldPassword, existing.getPassword())
                || oldPassword.equals(existing.getPassword());
        if (!matches) {
            throw new IllegalArgumentException("Incorrect old password.");
        }
        existing.setPassword(passwordEncoder.encode(newPassword));
        employeeRepository.save(existing);
    }

    private String normalizeShopName(String shopName) {
        if (shopName == null || shopName.trim().isEmpty()) {
            throw new IllegalArgumentException("Shop information is missing for the current user.");
        }
        return shopName.trim();
    }

    private String normalizeRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            return "employee";
        }
        return role.trim().toLowerCase();
    }
}
