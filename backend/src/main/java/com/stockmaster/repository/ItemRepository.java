package com.stockmaster.repository;

import com.stockmaster.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findAllByShopName(String shopName);
    Optional<Item> findByIdAndShopName(Long id, String shopName);
    Optional<Item> findByBarcodeAndShopName(String barcode, String shopName);
    List<Item> findByNameContainingIgnoreCaseOrBarcodeContaining(String name, String barcode);
    List<Item> findByQuantityLessThanEqualAndShopNameOrderByQuantityAsc(int threshold, String shopName);
}
