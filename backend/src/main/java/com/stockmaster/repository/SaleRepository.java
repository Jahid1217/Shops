package com.stockmaster.repository;

import com.stockmaster.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findByCustomerPhoneOrderByTimestampDesc(String customerPhone);
    List<Sale> findTop5ByOrderByTimestampDesc();
    List<Sale> findByTimestampAfterOrderByTimestampDesc(LocalDateTime after);
    List<Sale> findAllByOrderByTimestampDesc();

    @Query("SELECT COALESCE(SUM(s.totalPrice), 0) FROM Sale s")
    Double getTotalSalesAmount();

    @Query("SELECT s FROM Sale s WHERE s.timestamp >= :start AND s.timestamp < :end")
    List<Sale> findByTimestampBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
