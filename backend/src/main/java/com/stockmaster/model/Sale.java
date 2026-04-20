package com.stockmaster.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Sale {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default
    private Double totalPrice = 0.0;

    @Builder.Default
    private Double discount = 0.0;

    private String paymentMethod;

    @Builder.Default
    private Double cashReceived = 0.0;

    @Builder.Default
    private Double cashReturn = 0.0;

    private String customerPhone;
    private String shopName;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    private Long employeeId;
    private String employeeName;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SaleItem> items = new ArrayList<>();
}
