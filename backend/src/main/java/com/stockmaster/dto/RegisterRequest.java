package com.stockmaster.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {
    private String username;
    private String email;
    private String password;
    private String shopName;
    private String phone;
}
