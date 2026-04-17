package com.stockmaster.controller;

import com.stockmaster.model.Item;
import com.stockmaster.model.User;
import com.stockmaster.service.ItemService;
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

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @GetMapping
    public ResponseEntity<List<Item>> getAll() {
        return ResponseEntity.ok(itemService.getAllItems());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> getById(@PathVariable Long id) {
        return ResponseEntity.ok(itemService.getById(id));
    }

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<?> getByBarcode(@PathVariable String barcode) {
        Optional<Item> item = itemService.getByBarcode(barcode);
        if (item.isPresent()) {
            return ResponseEntity.ok(item.get());
        }
        return ResponseEntity.ok(Map.of("found", false));
    }

    @PostMapping
    public ResponseEntity<Item> create(@RequestBody Item item, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(itemService.createOrRestock(item, user.getId(), user.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Item> update(@PathVariable Long id, @RequestBody Item item, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(itemService.update(id, item, user.getId(), user.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        itemService.delete(id, user.getId(), user.getUsername());
        return ResponseEntity.ok(Map.of("message", "Item deleted successfully"));
    }
}
