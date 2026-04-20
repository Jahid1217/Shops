package com.stockmaster.repository;

import com.stockmaster.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findByCustomerPhoneAndShopNameOrderByTimestampDesc(String customerPhone, String shopName);
    List<Sale> findTop5ByShopNameOrderByTimestampDesc(String shopName);
    List<Sale> findByTimestampAfterAndShopNameOrderByTimestampDesc(LocalDateTime after, String shopName);
    List<Sale> findByShopNameOrderByTimestampDesc(String shopName);
    List<Sale> findAllByShopName(String shopName);

    @Query("SELECT COALESCE(SUM(s.totalPrice), 0) FROM Sale s WHERE s.shopName = :shopName")
    Double getTotalSalesAmount(@Param("shopName") String shopName);

    @Query("SELECT s FROM Sale s WHERE s.shopName = :shopName AND s.timestamp >= :start AND s.timestamp < :end")
    List<Sale> findByTimestampBetweenAndShopName(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("shopName") String shopName);
}
