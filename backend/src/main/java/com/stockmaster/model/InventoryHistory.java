package com.stockmaster.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long itemId;
    private String itemName;
    private String barcode;

    @Column(nullable = false)
    private String type;

    @Builder.Default
    private Integer quantity = 0;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    private String performedBy;
}
