package com.stockmaster.repository;

import com.stockmaster.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findAllByShopName(String shopName);
    Optional<Item> findByIdAndShopName(Long id, String shopName);
    Optional<Item> findByBarcodeAndShopName(String barcode, String shopName);
    Optional<Item> findByQrCodeAndShopName(String qrCode, String shopName);
    boolean existsByBarcodeAndShopName(String barcode, String shopName);
    boolean existsByQrCodeAndShopName(String qrCode, String shopName);
    List<Item> findByNameContainingIgnoreCaseOrBarcodeContaining(String name, String barcode);
    List<Item> findByQuantityLessThanEqualAndShopNameOrderByQuantityAsc(int threshold, String shopName);

    @Query("SELECT i FROM Item i WHERE i.shopName = :shopName AND (i.barcode = :code OR i.qrCode = :code)")
    Optional<Item> findByBarcodeOrQrCodeAndShopName(@Param("code") String code, @Param("shopName") String shopName);
}
