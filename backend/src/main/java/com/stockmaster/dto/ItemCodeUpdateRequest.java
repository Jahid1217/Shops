package com.stockmaster.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ItemCodeUpdateRequest {
    private String barcode;
    private String qrCode;
}
