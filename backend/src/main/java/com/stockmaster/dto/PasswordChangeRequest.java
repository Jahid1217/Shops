package com.stockmaster.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PasswordChangeRequest {
    private String oldPassword;
    private String newPassword;
}
