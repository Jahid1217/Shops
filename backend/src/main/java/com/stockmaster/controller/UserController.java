package com.stockmaster.controller;

import com.stockmaster.dto.PasswordChangeRequest;
import com.stockmaster.dto.ProfileUpdateRequest;
import com.stockmaster.model.Employee;
import com.stockmaster.model.User;
import com.stockmaster.repository.EmployeeRepository;
import com.stockmaster.repository.UserRepository;
import com.stockmaster.security.AuthenticatedUser;
import com.stockmaster.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserController(UserRepository userRepository,
                          EmployeeRepository employeeRepository,
                          PasswordEncoder passwordEncoder,
                          AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getProfile(@AuthenticationPrincipal AuthenticatedUser user) {
        if (isEmployee(user)) {
            Employee employee = employeeRepository.findById(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Employee account not found."));
            return ResponseEntity.ok(Map.of(
                    "id", employee.getId(),
                    "principalType", "employee",
                    "username", employee.getName(),
                    "email", employee.getEmail() != null ? employee.getEmail() : "",
                    "shopName", employee.getShopName() != null ? employee.getShopName() : "",
                    "phoneNumber", employee.getPhone() != null ? employee.getPhone() : "",
                    "role", normalizeRole(employee.getRole(), "employee"),
                    "menuPermissions", user.getMenuPermissions(),
                    "featurePermissions", user.getFeaturePermissions(),
                    "createdAt", employee.getCreatedAt().toString()
            ));
        }

        User adminUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User account not found."));

        return ResponseEntity.ok(Map.of(
                "id", adminUser.getId(),
                "principalType", "user",
                "username", adminUser.getUsername(),
                "email", adminUser.getEmail(),
                "shopName", adminUser.getShopName() != null ? adminUser.getShopName() : "",
                "phoneNumber", adminUser.getPhoneNumber() != null ? adminUser.getPhoneNumber() : "",
                "role", normalizeRole(adminUser.getRole(), "admin"),
                "menuPermissions", user.getMenuPermissions(),
                "featurePermissions", user.getFeaturePermissions(),
                "createdAt", adminUser.getCreatedAt().toString()
        ));
    }

    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestBody ProfileUpdateRequest request) {
        if (isEmployee(user)) {
            Employee employee = employeeRepository.findById(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Employee account not found."));
            employee.setName(request.getUsername());
            employee.setPhone(request.getPhoneNumber());
            employeeRepository.save(employee);
            auditLogService.log(employee.getId(), employee.getName(), employee.getShopName(), "Update Profile", "Updated profile information");
            return getProfile(user);
        }

        User adminUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User account not found."));
        String currentShop = adminUser.getShopName() != null ? adminUser.getShopName().trim() : "";
        String requestedShop = request.getShopName() != null ? request.getShopName().trim() : currentShop;
        if (!requestedShop.equals(currentShop)) {
            throw new IllegalArgumentException("Shop name cannot be changed from profile settings.");
        }
        adminUser.setUsername(request.getUsername());
        adminUser.setShopName(currentShop);
        adminUser.setPhoneNumber(request.getPhoneNumber());
        userRepository.save(adminUser);
        auditLogService.log(adminUser.getId(), adminUser.getUsername(), adminUser.getShopName(), "Update Profile", "Updated profile information");
        return getProfile(user);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestBody PasswordChangeRequest request) {
        if (isEmployee(user)) {
            Employee employee = employeeRepository.findById(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Employee account not found."));
            boolean matches = employee.getPassword() != null
                    && (passwordEncoder.matches(request.getOldPassword(), employee.getPassword())
                    || request.getOldPassword().equals(employee.getPassword()));
            if (!matches) {
                throw new IllegalArgumentException("Incorrect old password.");
            }
            employee.setPassword(passwordEncoder.encode(request.getNewPassword()));
            employeeRepository.save(employee);
            auditLogService.log(employee.getId(), employee.getName(), employee.getShopName(), "Change Password", "Changed account password");
            return ResponseEntity.ok(Map.of("message", "Password changed successfully!"));
        }

        User adminUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User account not found."));
        if (!passwordEncoder.matches(request.getOldPassword(), adminUser.getPassword())) {
            throw new IllegalArgumentException("Incorrect old password.");
        }
        adminUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(adminUser);
        auditLogService.log(adminUser.getId(), adminUser.getUsername(), adminUser.getShopName(), "Change Password", "Changed account password");
        return ResponseEntity.ok(Map.of("message", "Password changed successfully!"));
    }

    private boolean isEmployee(AuthenticatedUser user) {
        return user != null && "employee".equalsIgnoreCase(user.getPrincipalType());
    }

    private String normalizeRole(String role, String fallback) {
        if (role == null || role.trim().isEmpty()) {
            return fallback;
        }
        return role.trim().toLowerCase();
    }
}
