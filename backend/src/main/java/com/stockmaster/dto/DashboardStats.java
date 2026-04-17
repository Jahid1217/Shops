package com.stockmaster.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardStats {
    private long totalItems;
    private long lowStock;
    private long outOfStock;
    private long totalCustomers;
    private double totalSales;
}
