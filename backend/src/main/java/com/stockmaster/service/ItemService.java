package com.stockmaster.service;

import com.stockmaster.dto.ItemCodeRenderResponse;
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
import java.util.concurrent.ThreadLocalRandom;

@Service
public class ItemService {

    private final ItemRepository itemRepository;
    private final InventoryHistoryRepository historyRepository;
    private final AuditLogService auditLogService;
    private final CodeImageService codeImageService;

    public ItemService(
            ItemRepository itemRepository,
            InventoryHistoryRepository historyRepository,
            AuditLogService auditLogService,
            CodeImageService codeImageService
    ) {
        this.itemRepository = itemRepository;
        this.historyRepository = historyRepository;
        this.auditLogService = auditLogService;
        this.codeImageService = codeImageService;
    }

    public List<Item> getAllItems(String shopName) {
        return itemRepository.findAllByShopName(normalizeShopName(shopName));
    }

    public Item getById(Long id, String shopName) {
        return itemRepository.findByIdAndShopName(id, normalizeShopName(shopName))
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
    }

    public Optional<Item> getByCode(String code, String shopName) {
        String normalizedCode = normalizeCode(code);
        if (normalizedCode == null) {
            return Optional.empty();
        }
        return itemRepository.findByBarcodeOrQrCodeAndShopName(normalizedCode, normalizeShopName(shopName));
    }

    @Transactional
    public Item createOrRestock(Item item, Long userId, String userName, String shopName) {
        String scopedShop = normalizeShopName(shopName);
        String normalizedBarcode = normalizeCode(item.getBarcode());
        String normalizedQrCode = normalizeCode(item.getQrCode());
        Optional<Item> existing = findExistingByCode(normalizedBarcode, normalizedQrCode, scopedShop);

        if (existing.isPresent()) {
            // Restock existing item. Keep original item name for existing barcode.
            Item existingItem = existing.get();
            existingItem.setQuantity(existingItem.getQuantity() + item.getQuantity());
            existingItem.setBuyingPrice(item.getBuyingPrice());
            existingItem.setSellingPrice(item.getSellingPrice());
            existingItem.setBatchNumber(item.getBatchNumber());
            existingItem.setMfgDate(item.getMfgDate());
            existingItem.setExpDate(item.getExpDate());
            existingItem.setDiscountType(item.getDiscountType());
            existingItem.setDiscountValue(item.getDiscountValue());
            if (normalizedQrCode != null) {
                validateUniqueQrCodeForItem(normalizedQrCode, scopedShop, existingItem.getId());
                existingItem.setQrCode(normalizedQrCode);
            }
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
            String barcode = normalizedBarcode != null ? normalizedBarcode : generateUniqueBarcode(scopedShop);
            validateUniqueBarcodeForItem(barcode, scopedShop, null);

            String qrCode = normalizedQrCode != null ? normalizedQrCode : barcode;
            validateUniqueQrCodeForItem(qrCode, scopedShop, null);

            item.setBarcode(barcode);
            item.setQrCode(qrCode);
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

        String normalizedBarcode = normalizeCode(item.getBarcode());
        String normalizedQrCode = item.getQrCode() == null ? existing.getQrCode() : normalizeCode(item.getQrCode());
        String finalBarcode = normalizedBarcode != null ? normalizedBarcode : existing.getBarcode();
        if (finalBarcode == null) {
            finalBarcode = generateUniqueBarcode(scopedShop);
        }

        validateUniqueBarcodeForItem(finalBarcode, scopedShop, existing.getId());
        if (normalizedQrCode != null) {
            validateUniqueQrCodeForItem(normalizedQrCode, scopedShop, existing.getId());
        }

        existing.setBarcode(finalBarcode);
        existing.setQrCode(normalizedQrCode);
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
    public Item upsertCodes(Long id, String barcode, String qrCode, Long userId, String userName, String shopName) {
        String scopedShop = normalizeShopName(shopName);
        Item item = getById(id, scopedShop);
        String normalizedBarcode = normalizeCode(barcode);
        String normalizedQrCode = normalizeCode(qrCode);

        if (normalizedBarcode != null) {
            validateUniqueBarcodeForItem(normalizedBarcode, scopedShop, id);
        }
        if (normalizedQrCode != null) {
            validateUniqueQrCodeForItem(normalizedQrCode, scopedShop, id);
        }

        item.setBarcode(normalizedBarcode);
        item.setQrCode(normalizedQrCode);

        Item saved = itemRepository.save(item);
        auditLogService.log(
                userId,
                userName,
                scopedShop,
                "Update Item Codes",
                "Updated barcode/QR code for item: " + saved.getName()
        );
        return saved;
    }

    @Transactional
    public Item generateCodes(
            Long id,
            boolean barcode,
            boolean qrCode,
            boolean overwrite,
            Long userId,
            String userName,
            String shopName
    ) {
        String scopedShop = normalizeShopName(shopName);
        Item item = getById(id, scopedShop);

        if (barcode && (overwrite || normalizeCode(item.getBarcode()) == null)) {
            item.setBarcode(generateUniqueBarcode(scopedShop));
        }

        if (qrCode && (overwrite || normalizeCode(item.getQrCode()) == null)) {
            String nextQr = normalizeCode(item.getBarcode());
            if (nextQr == null) {
                nextQr = generateUniqueQrCode(scopedShop);
            }
            validateUniqueQrCodeForItem(nextQr, scopedShop, item.getId());
            item.setQrCode(nextQr);
        }

        Item saved = itemRepository.save(item);
        auditLogService.log(
                userId,
                userName,
                scopedShop,
                "Generate Item Codes",
                "Generated barcode/QR code for item: " + saved.getName()
        );
        return saved;
    }

    @Transactional
    public Item deleteCodes(Long id, boolean deleteBarcode, boolean deleteQrCode, Long userId, String userName, String shopName) {
        String scopedShop = normalizeShopName(shopName);
        Item item = getById(id, scopedShop);

        if (deleteBarcode) {
            item.setBarcode(null);
        }
        if (deleteQrCode) {
            item.setQrCode(null);
        }

        Item saved = itemRepository.save(item);
        auditLogService.log(
                userId,
                userName,
                scopedShop,
                "Delete Item Codes",
                "Deleted barcode/QR code for item: " + saved.getName()
        );
        return saved;
    }

    public ItemCodeRenderResponse getCodeRenderData(Long id, String shopName) {
        Item item = getById(id, shopName);
        String barcode = normalizeCode(item.getBarcode());
        String qrCode = normalizeCode(item.getQrCode());

        return ItemCodeRenderResponse.builder()
                .itemId(item.getId())
                .itemName(item.getName())
                .sellingPrice(item.getSellingPrice())
                .barcode(barcode)
                .qrCode(qrCode)
                .barcodeImage(barcode == null ? null : codeImageService.barcodeDataUri(barcode))
                .qrCodeImage(qrCode == null ? null : codeImageService.qrDataUri(qrCode))
                .build();
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

    private Optional<Item> findExistingByCode(String barcode, String qrCode, String shopName) {
        if (barcode != null) {
            Optional<Item> existing = itemRepository.findByBarcodeAndShopName(barcode, shopName);
            if (existing.isPresent()) {
                return existing;
            }
        }

        if (qrCode != null) {
            return itemRepository.findByQrCodeAndShopName(qrCode, shopName);
        }
        return Optional.empty();
    }

    private String normalizeCode(String code) {
        if (code == null) {
            return null;
        }
        String normalized = code.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private void validateUniqueBarcodeForItem(String barcode, String shopName, Long itemId) {
        Optional<Item> duplicate = itemRepository.findByBarcodeAndShopName(barcode, shopName);
        if (duplicate.isPresent() && (itemId == null || !duplicate.get().getId().equals(itemId))) {
            throw new IllegalArgumentException("Barcode is already assigned to another product.");
        }
    }

    private void validateUniqueQrCodeForItem(String qrCode, String shopName, Long itemId) {
        Optional<Item> duplicate = itemRepository.findByQrCodeAndShopName(qrCode, shopName);
        if (duplicate.isPresent() && (itemId == null || !duplicate.get().getId().equals(itemId))) {
            throw new IllegalArgumentException("QR code is already assigned to another product.");
        }
    }

    private String generateUniqueBarcode(String shopName) {
        for (int i = 0; i < 100; i++) {
            long randomValue = ThreadLocalRandom.current().nextLong(100000000000L, 1000000000000L);
            String candidate = String.valueOf(randomValue);
            if (!itemRepository.existsByBarcodeAndShopName(candidate, shopName)) {
                return candidate;
            }
        }
        throw new IllegalArgumentException("Unable to generate a unique barcode. Please try again.");
    }

    private String generateUniqueQrCode(String shopName) {
        for (int i = 0; i < 100; i++) {
            long randomValue = ThreadLocalRandom.current().nextLong(100000000000L, 1000000000000L);
            String candidate = "QR-" + randomValue;
            if (!itemRepository.existsByQrCodeAndShopName(candidate, shopName)) {
                return candidate;
            }
        }
        throw new IllegalArgumentException("Unable to generate a unique QR code. Please try again.");
    }
}
