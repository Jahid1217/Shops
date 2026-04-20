package com.stockmaster.controller;

import com.stockmaster.dto.PasswordChangeRequest;
import com.stockmaster.dto.ProfileUpdateRequest;
import com.stockmaster.model.User;
import com.stockmaster.repository.UserRepository;
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
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of(
            "id", user.getId(),
            "username", user.getUsername(),
            "email", user.getEmail(),
            "shopName", user.getShopName() != null ? user.getShopName() : "",
            "phoneNumber", user.getPhoneNumber() != null ? user.getPhoneNumber() : "",
            "role", user.getRole(),
            "createdAt", user.getCreatedAt().toString()
        ));
    }

    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody ProfileUpdateRequest request) {
        String currentShop = user.getShopName() != null ? user.getShopName().trim() : "";
        String requestedShop = request.getShopName() != null ? request.getShopName().trim() : currentShop;
        if (!requestedShop.equals(currentShop)) {
            throw new IllegalArgumentException("Shop name cannot be changed from profile settings.");
        }
        user.setUsername(request.getUsername());
        user.setShopName(currentShop);
        user.setPhoneNumber(request.getPhoneNumber());
        userRepository.save(user);
        auditLogService.log(user.getId(), user.getUsername(), user.getShopName(), "Update Profile", "Updated profile information");
        return getProfile(user);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal User user,
            @RequestBody PasswordChangeRequest request) {
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Incorrect old password.");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditLogService.log(user.getId(), user.getUsername(), user.getShopName(), "Change Password", "Changed account password");
        return ResponseEntity.ok(Map.of("message", "Password changed successfully!"));
    }
}
