package com.stockmaster.repository;

import com.stockmaster.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {
    Optional<Item> findByBarcode(String barcode);
    List<Item> findByNameContainingIgnoreCaseOrBarcodeContaining(String name, String barcode);
    List<Item> findByQuantityLessThanEqualOrderByQuantityAsc(int threshold);
}
