package com.stockmaster.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProfileUpdateRequest {
    private String username;
    private String shopName;
    private String phoneNumber;
}
