package com.stockmaster.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {
    private String token;
    private Long id;
    private String principalType;
    private String username;
    private String email;
    private String shopName;
    private String phoneNumber;
    private String role;
    private java.util.List<String> menuPermissions;
    private java.util.List<String> featurePermissions;
}
