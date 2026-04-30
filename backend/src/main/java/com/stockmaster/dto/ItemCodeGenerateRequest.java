package com.stockmaster.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ItemCodeGenerateRequest {
    private Boolean barcode;
    private Boolean qrCode;
    private Boolean overwrite;
}
