package com.stockmaster.service;

import com.stockmaster.dto.CheckoutRequest;
import com.stockmaster.model.Customer;
import com.stockmaster.model.InventoryHistory;
import com.stockmaster.model.Item;
import com.stockmaster.model.Sale;
import com.stockmaster.model.SaleItem;
import com.stockmaster.repository.CustomerRepository;
import com.stockmaster.repository.InventoryHistoryRepository;
import com.stockmaster.repository.ItemRepository;
import com.stockmaster.repository.SaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final ItemRepository itemRepository;
    private final CustomerRepository customerRepository;
    private final InventoryHistoryRepository inventoryHistoryRepository;
    private final AuditLogService auditLogService;

    public SaleService(SaleRepository saleRepository, ItemRepository itemRepository,
                       CustomerRepository customerRepository, InventoryHistoryRepository inventoryHistoryRepository,
                       AuditLogService auditLogService) {
        this.saleRepository = saleRepository;
        this.itemRepository = itemRepository;
        this.customerRepository = customerRepository;
        this.inventoryHistoryRepository = inventoryHistoryRepository;
        this.auditLogService = auditLogService;
    }

    public List<Sale> getAllSales() {
        return saleRepository.findAllByOrderByTimestampDesc();
    }

    public List<Sale> getRecentSales() {
        return saleRepository.findTop5ByOrderByTimestampDesc();
    }

    public List<Sale> getSalesByCustomerPhone(String phone) {
        return saleRepository.findByCustomerPhoneOrderByTimestampDesc(phone);
    }

    @Transactional
    public Sale checkout(CheckoutRequest request, Long userId, String userName) {
        validateCheckoutRequest(request);

        String customerPhone = normalizePhone(request.getCustomerPhone());
        double subtotal = 0.0;

        Sale sale = Sale.builder()
                .totalPrice(0.0)
                .discount(0.0)
                .paymentMethod(request.getPaymentMethod().trim())
                .cashReceived(0.0)
                .cashReturn(0.0)
                .customerPhone(customerPhone)
                .timestamp(LocalDateTime.now())
                .employeeId(userId)
                .employeeName(userName)
                .build();

        // Add sale items and update inventory in one transaction.
        for (CheckoutRequest.CartItem cartItem : request.getItems()) {
            if (cartItem.getId() == null) {
                throw new IllegalArgumentException("Each cart item must include a valid item id.");
            }
            if (cartItem.getQty() == null || cartItem.getQty() <= 0) {
                throw new IllegalArgumentException("Item quantity must be greater than zero.");
            }

            Item item = itemRepository.findById(cartItem.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Item not found with id: " + cartItem.getId()));

            if (item.getQuantity() < cartItem.getQty()) {
                throw new IllegalArgumentException("Insufficient stock for item: " + item.getName());
            }

            double unitPrice = cartItem.getPrice() != null ? cartItem.getPrice() : item.getSellingPrice();
            if (unitPrice < 0) {
                throw new IllegalArgumentException("Item price cannot be negative.");
            }

            SaleItem saleItem = SaleItem.builder()
                    .sale(sale)
                    .itemId(item.getId())
                    .name(item.getName())
                    .qty(cartItem.getQty())
                    .price(unitPrice)
                    .build();
            sale.getItems().add(saleItem);

            subtotal += unitPrice * cartItem.getQty();

            item.setQuantity(item.getQuantity() - cartItem.getQty());
            itemRepository.save(item);

            inventoryHistoryRepository.save(InventoryHistory.builder()
                    .itemId(item.getId())
                    .itemName(item.getName())
                    .barcode(item.getBarcode())
                    .type("sale")
                    .quantity(cartItem.getQty())
                    .timestamp(LocalDateTime.now())
                    .performedBy(userName)
                    .build());
        }

        double discount = valueOrZero(request.getDiscount());
        if (discount < 0) {
            throw new IllegalArgumentException("Discount cannot be negative.");
        }
        if (discount > subtotal) {
            throw new IllegalArgumentException("Discount cannot be greater than subtotal.");
        }

        double netTotal = subtotal - discount;
        double requestedTotal = valueOrZero(request.getTotalPrice());
        if (requestedTotal > 0 && Math.abs(requestedTotal - netTotal) > 0.01) {
            throw new IllegalArgumentException("Checkout total does not match item totals.");
        }

        sale.setDiscount(discount);
        sale.setTotalPrice(netTotal);

        if ("cash".equalsIgnoreCase(sale.getPaymentMethod())) {
            double cashReceived = valueOrZero(request.getCashReceived());
            if (cashReceived < netTotal) {
                throw new IllegalArgumentException("Cash received cannot be less than total payable.");
            }
            sale.setCashReceived(cashReceived);
            sale.setCashReturn(cashReceived - netTotal);
        }

        Sale saved = saleRepository.save(sale);

        // Update customer points if phone exists, otherwise create a walk-in customer record.
        if (customerPhone != null) {
            customerRepository.findByPhone(customerPhone).ifPresentOrElse(
                    customer -> {
                        customer.setPoints(customer.getPoints() + 1);
                        customerRepository.save(customer);
                    },
                    () -> {
                        Customer newCustomer = Customer.builder()
                                .phone(customerPhone)
                                .name("Walk-in Customer")
                                .points(1)
                                .createdBy(userName)
                                .build();
                        customerRepository.save(newCustomer);
                    }
            );
        }

        auditLogService.log(userId, userName, "Checkout",
                "Completed sale #" + saved.getId() + " for BDT " + String.format("%.2f", saved.getTotalPrice()));

        return saved;
    }

    private void validateCheckoutRequest(CheckoutRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Checkout request is required.");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart cannot be empty.");
        }
        if (request.getPaymentMethod() == null || request.getPaymentMethod().trim().isEmpty()) {
            throw new IllegalArgumentException("Payment method is required.");
        }
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }
        String trimmed = phone.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private double valueOrZero(Double value) {
        return value == null ? 0.0 : value;
    }
}
