package com.stockmaster.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ItemCodeRenderResponse {
    private Long itemId;
    private String itemName;
    private Double sellingPrice;
    private String barcode;
    private String qrCode;
    private String barcodeImage;
    private String qrCodeImage;
}
