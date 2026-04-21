package com.stockmaster.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthenticatedUser {
    private Long id;
    private String principalType;
    private String username;
    private String email;
    private String shopName;
    private String role;
    private List<String> menuPermissions;
    private List<String> featurePermissions;

    public boolean isAdmin() {
        return "admin".equalsIgnoreCase(role);
    }
}
