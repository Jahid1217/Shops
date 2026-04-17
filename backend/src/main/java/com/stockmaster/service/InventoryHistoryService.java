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

    public List<InventoryHistory> getAll() {
        return repository.findAllByOrderByTimestampDesc();
    }
}
