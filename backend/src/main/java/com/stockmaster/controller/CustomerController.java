package com.stockmaster.controller;

import com.stockmaster.model.Customer;
import com.stockmaster.model.Sale;
import com.stockmaster.model.User;
import com.stockmaster.service.CustomerService;
import com.stockmaster.service.SaleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final SaleService saleService;

    public CustomerController(CustomerService customerService, SaleService saleService) {
        this.customerService = customerService;
        this.saleService = saleService;
    }

    @GetMapping
    public ResponseEntity<List<Customer>> getAll() {
        return ResponseEntity.ok(customerService.getAll());
    }

    @GetMapping("/phone/{phone}")
    public ResponseEntity<?> getByPhone(@PathVariable String phone) {
        Optional<Customer> customer = customerService.getByPhone(phone);
        if (customer.isPresent()) {
            return ResponseEntity.ok(customer.get());
        }
        return ResponseEntity.ok(Map.of("found", false));
    }

    @PostMapping
    public ResponseEntity<Customer> create(@RequestBody Customer customer, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(customerService.create(customer, user.getId(), user.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> update(@PathVariable Long id, @RequestBody Customer customer, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(customerService.update(id, customer, user.getId(), user.getUsername()));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(@PathVariable Long id) {
        Customer customer = customerService.getById(id);
        List<Sale> sales = saleService.getSalesByCustomerPhone(customer.getPhone());
        List<Map<String, Object>> result = sales.stream().map(s -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", s.getId());
            map.put("totalPrice", s.getTotalPrice());
            map.put("paymentMethod", s.getPaymentMethod());
            map.put("timestamp", s.getTimestamp().toString());
            map.put("items", s.getItems().stream().map(si -> {
                Map<String, Object> item = new HashMap<>();
                item.put("name", si.getName());
                item.put("qty", si.getQty());
                item.put("price", si.getPrice());
                return item;
            }).collect(Collectors.toList()));
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
