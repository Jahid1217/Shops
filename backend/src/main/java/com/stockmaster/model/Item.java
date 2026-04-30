package com.stockmaster.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "items",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_items_shop_barcode", columnNames = {"shop_name", "barcode"}),
        @UniqueConstraint(name = "uk_items_shop_qrcode", columnNames = {"shop_name", "qr_code"})
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "barcode")
    private String barcode;

    @Column(name = "qr_code")
    private String qrCode;

    @Column(nullable = false)
    private String name;

    @Column(name = "shop_name")
    private String shopName;

    @Builder.Default
    private Integer quantity = 0;

    @Builder.Default
    private Double buyingPrice = 0.0;

    @Builder.Default
    private Double sellingPrice = 0.0;

    private String batchNumber;
    private String mfgDate;
    private String expDate;

    @Builder.Default
    private String discountType = "percent";

    @Builder.Default
    private Double discountValue = 0.0;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
