package com.stockmaster.repository;

import com.stockmaster.model.InventoryHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InventoryHistoryRepository extends JpaRepository<InventoryHistory, Long> {
    List<InventoryHistory> findAllByShopNameOrderByTimestampDesc(String shopName);
}
