package com.stockmaster.service;

import com.stockmaster.dto.*;
import com.stockmaster.model.Employee;
import com.stockmaster.model.User;
import com.stockmaster.repository.EmployeeRepository;
import com.stockmaster.repository.UserRepository;
import com.stockmaster.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final PermissionService permissionService;

    public AuthService(UserRepository userRepository,
                       EmployeeRepository employeeRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       PermissionService permissionService) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.permissionService = permissionService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (request.getShopName() == null || request.getShopName().trim().isEmpty()) {
            throw new IllegalArgumentException("Shop name is required.");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists. Please use a different username.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists. Please use a different email.");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .shopName(request.getShopName().trim())
                .phoneNumber(request.getPhone())
                .role("admin")
                .build();

        user = userRepository.save(user);
        String role = normalizeRole(user.getRole(), "admin");
        String token = tokenProvider.generateToken(user.getId(), "user", user.getEmail(), role);
        java.util.List<String> menuPermissions = permissionService.normalizeMenusForRole(role, "");
        java.util.List<String> featurePermissions = permissionService.normalizeFeaturesForRole(role, "");

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .principalType("user")
                .username(user.getUsername())
                .email(user.getEmail())
                .shopName(user.getShopName())
                .phoneNumber(user.getPhoneNumber())
                .role(role)
                .menuPermissions(menuPermissions)
                .featurePermissions(featurePermissions)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (user != null) {
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Invalid email or password. Please try again.");
            }

            if (user.getShopName() == null || user.getShopName().trim().isEmpty()) {
                throw new IllegalArgumentException("This account is not linked to any shop.");
            }

            String role = normalizeRole(user.getRole(), "admin");
            String token = tokenProvider.generateToken(user.getId(), "user", user.getEmail(), role);
            java.util.List<String> menuPermissions = permissionService.normalizeMenusForRole(role, "");
            java.util.List<String> featurePermissions = permissionService.normalizeFeaturesForRole(role, "");

            return AuthResponse.builder()
                    .token(token)
                    .id(user.getId())
                    .principalType("user")
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .shopName(user.getShopName())
                    .phoneNumber(user.getPhoneNumber())
                    .role(role)
                    .menuPermissions(menuPermissions)
                    .featurePermissions(featurePermissions)
                    .build();
        }

        Employee employee = employeeRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password. Please try again."));

        if (!isPasswordValid(request.getPassword(), employee.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password. Please try again.");
        }

        if (employee.getShopName() == null || employee.getShopName().trim().isEmpty()) {
            throw new IllegalArgumentException("This employee account is not linked to any shop.");
        }

        String role = normalizeRole(employee.getRole(), "employee");
        java.util.List<String> menuPermissions = permissionService.normalizeMenusForRole(role, employee.getMenuPermissions());
        java.util.List<String> featurePermissions = permissionService.normalizeFeaturesForRole(role, employee.getFeaturePermissions());

        String token = tokenProvider.generateToken(employee.getId(), "employee", employee.getEmail(), role);
        return AuthResponse.builder()
                .token(token)
                .id(employee.getId())
                .principalType("employee")
                .username(employee.getName())
                .email(employee.getEmail())
                .shopName(employee.getShopName())
                .phoneNumber(employee.getPhone())
                .role(role)
                .menuPermissions(menuPermissions)
                .featurePermissions(featurePermissions)
                .build();
    }

    private boolean isPasswordValid(String rawPassword, String storedPassword) {
        if (storedPassword == null || storedPassword.isEmpty()) {
            return false;
        }
        if (passwordEncoder.matches(rawPassword, storedPassword)) {
            return true;
        }
        return rawPassword.equals(storedPassword);
    }

    private String normalizeRole(String role, String defaultRole) {
        if (role == null || role.trim().isEmpty()) {
            return defaultRole;
        }
        return role.trim().toLowerCase();
    }
}
