package com.stockmaster.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CheckoutRequest {
    private List<CartItem> items;
    private Double totalPrice;
    private Double discount;
    private String paymentMethod;
    private Double cashReceived;
    private Double cashReturn;
    private String customerPhone;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CartItem {
        private Long id;
        private String name;
        private Integer qty;
        private Double price;
    }
}
