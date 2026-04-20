package com.stockmaster.service;

import com.stockmaster.model.InventoryHistory;
import com.stockmaster.repository.InventoryHistoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InventoryHistoryService {

    private final InventoryHistoryRepository repository;

    public InventoryHistoryService(InventoryHistoryRepository repository) {
        this.repository = repository;
    }

    public List<InventoryHistory> getAll(String shopName) {
        return repository.findAllByShopNameOrderByTimestampDesc(normalizeShopName(shopName));
    }

    private String normalizeShopName(String shopName) {
        if (shopName == null || shopName.trim().isEmpty()) {
            throw new IllegalArgumentException("Shop information is missing for the current user.");
        }
        return shopName.trim();
    }
}
