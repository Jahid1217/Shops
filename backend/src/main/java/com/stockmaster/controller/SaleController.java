package com.stockmaster.controller;

import com.stockmaster.dto.CheckoutRequest;
import com.stockmaster.model.Sale;
import com.stockmaster.model.SaleItem;
import com.stockmaster.model.User;
import com.stockmaster.service.SaleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        List<Sale> sales = saleService.getAllSales();
        return ResponseEntity.ok(sales.stream().map(this::toMap).collect(Collectors.toList()));
    }

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, Object>> checkout(
            @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal User user) {
        Sale sale = saleService.checkout(request, user.getId(), user.getUsername());
        return ResponseEntity.ok(toMap(sale));
    }

    private Map<String, Object> toMap(Sale sale) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", sale.getId());
        map.put("totalPrice", sale.getTotalPrice());
        map.put("discount", sale.getDiscount());
        map.put("paymentMethod", sale.getPaymentMethod());
        map.put("cashReceived", sale.getCashReceived());
        map.put("cashReturn", sale.getCashReturn());
        map.put("customerPhone", sale.getCustomerPhone());
        map.put("timestamp", sale.getTimestamp().toString());
        map.put("employeeId", sale.getEmployeeId());
        map.put("employeeName", sale.getEmployeeName());
        map.put("items", sale.getItems().stream().map(si -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", si.getItemId());
            item.put("name", si.getName());
            item.put("qty", si.getQty());
            item.put("price", si.getPrice());
            return item;
        }).collect(Collectors.toList()));
        return map;
    }
}
