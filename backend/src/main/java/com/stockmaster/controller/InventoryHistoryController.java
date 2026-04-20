package com.stockmaster.controller;

import com.stockmaster.model.InventoryHistory;
import com.stockmaster.model.User;
import com.stockmaster.service.InventoryHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory-history")
public class InventoryHistoryController {

    private final InventoryHistoryService service;

    public InventoryHistoryController(InventoryHistoryService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<InventoryHistory>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getAll(user.getShopName()));
    }
}
