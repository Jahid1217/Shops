package com.stockmaster.controller;

import com.stockmaster.dto.ItemCodeGenerateRequest;
import com.stockmaster.dto.ItemCodeRenderResponse;
import com.stockmaster.dto.ItemCodeUpdateRequest;
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
        Optional<Item> item = itemService.getByCode(barcode, user.getShopName());
        if (item.isPresent()) {
            return ResponseEntity.ok(item.get());
        }
        return ResponseEntity.ok(Map.of("found", false));
    }

    @GetMapping("/{id}/codes")
    public ResponseEntity<ItemCodeRenderResponse> getCodePreview(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "inventory");
        return ResponseEntity.ok(itemService.getCodeRenderData(id, user.getShopName()));
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

    @PostMapping("/{id}/codes/generate")
    public ResponseEntity<Item> generateCodes(
            @PathVariable Long id,
            @RequestBody(required = false) ItemCodeGenerateRequest request,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        permissionService.requireMenu(user, "inventory");
        boolean generateBarcode = request == null || request.getBarcode() == null || request.getBarcode();
        boolean generateQrCode = request == null || request.getQrCode() == null || request.getQrCode();
        boolean overwrite = request != null && Boolean.TRUE.equals(request.getOverwrite());
        return ResponseEntity.ok(
                itemService.generateCodes(id, generateBarcode, generateQrCode, overwrite, user.getId(), user.getUsername(), user.getShopName())
        );
    }

    @PutMapping("/{id}/codes")
    public ResponseEntity<Item> upsertCodes(
            @PathVariable Long id,
            @RequestBody ItemCodeUpdateRequest request,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        permissionService.requireMenu(user, "inventory");
        return ResponseEntity.ok(
                itemService.upsertCodes(id, request.getBarcode(), request.getQrCode(), user.getId(), user.getUsername(), user.getShopName())
        );
    }

    @DeleteMapping("/{id}/codes")
    public ResponseEntity<Item> deleteCodes(
            @PathVariable Long id,
            @RequestParam(name = "type", defaultValue = "both") String type,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        permissionService.requireMenu(user, "inventory");

        String normalizedType = type.trim().toLowerCase();
        boolean deleteBarcode = "barcode".equals(normalizedType) || "both".equals(normalizedType);
        boolean deleteQrCode = "qrcode".equals(normalizedType) || "qr".equals(normalizedType) || "both".equals(normalizedType);

        if (!deleteBarcode && !deleteQrCode) {
            throw new IllegalArgumentException("Unsupported code delete type. Use barcode, qrcode, or both.");
        }

        return ResponseEntity.ok(
                itemService.deleteCodes(id, deleteBarcode, deleteQrCode, user.getId(), user.getUsername(), user.getShopName())
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "inventory");
        permissionService.requireFeature(user, "inventory.delete");
        itemService.delete(id, user.getId(), user.getUsername(), user.getShopName());
        return ResponseEntity.ok(Map.of("message", "Item deleted successfully"));
    }
}
