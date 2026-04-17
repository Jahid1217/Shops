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

    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    public Item getById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
    }

    public Optional<Item> getByBarcode(String barcode) {
        return itemRepository.findByBarcode(barcode);
    }

    @Transactional
    public Item createOrRestock(Item item, Long userId, String userName) {
        Optional<Item> existing = itemRepository.findByBarcode(item.getBarcode());

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
                    .type("restock")
                    .quantity(item.getQuantity())
                    .timestamp(LocalDateTime.now())
                    .performedBy(userName)
                    .build());

            auditLogService.log(userId, userName, "Restock Item",
                    "Restocked item: " + saved.getName() + " (+" + item.getQuantity() + ")");

            return saved;
        } else {
            // Create new item
            Item saved = itemRepository.save(item);

            historyRepository.save(InventoryHistory.builder()
                    .itemId(saved.getId())
                    .itemName(saved.getName())
                    .barcode(saved.getBarcode())
                    .type("new_item")
                    .quantity(saved.getQuantity())
                    .timestamp(LocalDateTime.now())
                    .performedBy(userName)
                    .build());

            auditLogService.log(userId, userName, "Add New Item",
                    "Added new item: " + saved.getName() + " (" + saved.getBarcode() + ")");

            return saved;
        }
    }

    @Transactional
    public Item update(Long id, Item item, Long userId, String userName) {
        Item existing = getById(id);
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
                .type("update")
                .quantity(saved.getQuantity())
                .timestamp(LocalDateTime.now())
                .performedBy(userName)
                .build());

        auditLogService.log(userId, userName, "Update Item",
                "Updated item: " + saved.getName() + " (" + saved.getBarcode() + ")");

        return saved;
    }

    @Transactional
    public void delete(Long id, Long userId, String userName) {
        Item item = getById(id);
        itemRepository.delete(item);
        auditLogService.log(userId, userName, "Delete Item", "Deleted item: " + item.getName());
    }
}
