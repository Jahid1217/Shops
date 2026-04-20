package com.stockmaster.service;

import com.stockmaster.exception.ResourceNotFoundException;
import com.stockmaster.model.Item;
import com.stockmaster.model.InventoryHistory;
import com.stockmaster.repository.ItemRepository;
import com.stockmaster.repository.InventoryHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ItemService {

    private final ItemRepository itemRepository;
    private final InventoryHistoryRepository historyRepository;
    private final AuditLogService auditLogService;

    public ItemService(ItemRepository itemRepository, InventoryHistoryRepository historyRepository, AuditLogService auditLogService) {
        this.itemRepository = itemRepository;
        this.historyRepository = historyRepository;
        this.auditLogService = auditLogService;
    }

    public List<Item> getAllItems(String shopName) {
        return itemRepository.findAllByShopName(normalizeShopName(shopName));
    }

    public Item getById(Long id, String shopName) {
        return itemRepository.findByIdAndShopName(id, normalizeShopName(shopName))
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
    }

    public Optional<Item> getByBarcode(String barcode, String shopName) {
        return itemRepository.findByBarcodeAndShopName(barcode, normalizeShopName(shopName));
    }

    @Transactional
    public Item createOrRestock(Item item, Long userId, String userName, String shopName) {
        String scopedShop = normalizeShopName(shopName);
        Optional<Item> existing = itemRepository.findByBarcodeAndShopName(item.getBarcode(), scopedShop);

        if (existing.isPresent()) {
            // Restock existing item
            Item existingItem = existing.get();
            existingItem.setQuantity(existingItem.getQuantity() + item.getQuantity());
            existingItem.setBuyingPrice(item.getBuyingPrice());
            existingItem.setSellingPrice(item.getSellingPrice());
            existingItem.setBatchNumber(item.getBatchNumber());
            existingItem.setMfgDate(item.getMfgDate());
            existingItem.setExpDate(item.getExpDate());
            Item saved = itemRepository.save(existingItem);

            // Record history
            historyRepository.save(InventoryHistory.builder()
                    .itemId(saved.getId())
                    .itemName(saved.getName())
                    .barcode(saved.getBarcode())
                    .shopName(scopedShop)
                    .type("restock")
                    .quantity(item.getQuantity())
                    .timestamp(LocalDateTime.now())
                    .performedBy(userName)
                    .build());

            auditLogService.log(userId, userName, scopedShop, "Restock Item",
                    "Restocked item: " + saved.getName() + " (+" + item.getQuantity() + ")");

            return saved;
        } else {
            // Create new item
            item.setShopName(scopedShop);
            Item saved = itemRepository.save(item);

            historyRepository.save(InventoryHistory.builder()
                    .itemId(saved.getId())
                    .itemName(saved.getName())
                    .barcode(saved.getBarcode())
                    .shopName(scopedShop)
                    .type("new_item")
                    .quantity(saved.getQuantity())
                    .timestamp(LocalDateTime.now())
                    .performedBy(userName)
                    .build());

            auditLogService.log(userId, userName, scopedShop, "Add New Item",
                    "Added new item: " + saved.getName() + " (" + saved.getBarcode() + ")");

            return saved;
        }
    }

    @Transactional
    public Item update(Long id, Item item, Long userId, String userName, String shopName) {
        String scopedShop = normalizeShopName(shopName);
        Item existing = getById(id, scopedShop);
        existing.setBarcode(item.getBarcode());
        existing.setName(item.getName());
        existing.setQuantity(item.getQuantity());
        existing.setBuyingPrice(item.getBuyingPrice());
        existing.setSellingPrice(item.getSellingPrice());
        existing.setBatchNumber(item.getBatchNumber());
        existing.setMfgDate(item.getMfgDate());
        existing.setExpDate(item.getExpDate());
        existing.setDiscountType(item.getDiscountType());
        existing.setDiscountValue(item.getDiscountValue());
        Item saved = itemRepository.save(existing);

        historyRepository.save(InventoryHistory.builder()
                .itemId(saved.getId())
                .itemName(saved.getName())
                .barcode(saved.getBarcode())
                .shopName(scopedShop)
                .type("update")
                .quantity(saved.getQuantity())
                .timestamp(LocalDateTime.now())
                .performedBy(userName)
                .build());

        auditLogService.log(userId, userName, scopedShop, "Update Item",
                "Updated item: " + saved.getName() + " (" + saved.getBarcode() + ")");

        return saved;
    }

    @Transactional
    public void delete(Long id, Long userId, String userName, String shopName) {
        String scopedShop = normalizeShopName(shopName);
        Item item = getById(id, scopedShop);
        itemRepository.delete(item);
        auditLogService.log(userId, userName, scopedShop, "Delete Item", "Deleted item: " + item.getName());
    }

    private String normalizeShopName(String shopName) {
        if (shopName == null || shopName.trim().isEmpty()) {
            throw new IllegalArgumentException("Shop information is missing for the current user.");
        }
        return shopName.trim();
    }
}
