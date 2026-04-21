package com.stockmaster.controller;

import com.stockmaster.model.Item;
import com.stockmaster.security.AuthenticatedUser;
import com.stockmaster.service.ItemService;
import com.stockmaster.service.PermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService itemService;
    private final PermissionService permissionService;

    public ItemController(ItemService itemService, PermissionService permissionService) {
        this.itemService = itemService;
        this.permissionService = permissionService;
    }

    @GetMapping
    public ResponseEntity<List<Item>> getAll(@AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "inventory");
        return ResponseEntity.ok(itemService.getAllItems(user.getShopName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> getById(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "inventory");
        return ResponseEntity.ok(itemService.getById(id, user.getShopName()));
    }

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<?> getByBarcode(@PathVariable String barcode, @AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "inventory");
        Optional<Item> item = itemService.getByBarcode(barcode, user.getShopName());
        if (item.isPresent()) {
            return ResponseEntity.ok(item.get());
        }
        return ResponseEntity.ok(Map.of("found", false));
    }

    @PostMapping
    public ResponseEntity<Item> create(@RequestBody Item item, @AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "inventory");
        return ResponseEntity.ok(itemService.createOrRestock(item, user.getId(), user.getUsername(), user.getShopName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Item> update(@PathVariable Long id, @RequestBody Item item, @AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "inventory");
        return ResponseEntity.ok(itemService.update(id, item, user.getId(), user.getUsername(), user.getShopName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "inventory");
        permissionService.requireFeature(user, "inventory.delete");
        itemService.delete(id, user.getId(), user.getUsername(), user.getShopName());
        return ResponseEntity.ok(Map.of("message", "Item deleted successfully"));
    }
}
