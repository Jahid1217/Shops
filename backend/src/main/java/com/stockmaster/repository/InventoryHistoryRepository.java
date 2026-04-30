package com.stockmaster.repository;

import com.stockmaster.model.InventoryHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface InventoryHistoryRepository extends JpaRepository<InventoryHistory, Long> {
    List<InventoryHistory> findAllByShopNameOrderByTimestampDesc(String shopName);
    List<InventoryHistory> findByShopNameAndTimestampBetweenOrderByTimestampDesc(String shopName, LocalDateTime start, LocalDateTime end);
}
