package com.stockmaster.controller;

import com.stockmaster.model.InventoryHistory;
import com.stockmaster.security.AuthenticatedUser;
import com.stockmaster.service.InventoryHistoryService;
import com.stockmaster.service.PermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory-history")
public class InventoryHistoryController {

    private final InventoryHistoryService service;
    private final PermissionService permissionService;

    public InventoryHistoryController(InventoryHistoryService service, PermissionService permissionService) {
        this.service = service;
        this.permissionService = permissionService;
    }

    @GetMapping
    public ResponseEntity<List<InventoryHistory>> getAll(@AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "history");
        return ResponseEntity.ok(service.getAll(user.getShopName()));
    }
}
