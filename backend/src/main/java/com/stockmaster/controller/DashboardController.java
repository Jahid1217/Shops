package com.stockmaster.controller;

import com.stockmaster.dto.DashboardStats;
import com.stockmaster.model.Item;
import com.stockmaster.model.Sale;
import com.stockmaster.model.SaleItem;
import com.stockmaster.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }

    @GetMapping("/chart-data")
    public ResponseEntity<List<Map<String, Object>>> getChartData() {
        return ResponseEntity.ok(dashboardService.getChartData());
    }

    @GetMapping("/top-selling")
    public ResponseEntity<List<Map<String, Object>>> getTopSelling() {
        return ResponseEntity.ok(dashboardService.getTopSelling());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Item>> getLowStock() {
        return ResponseEntity.ok(dashboardService.getLowStockItems());
    }

    @GetMapping("/recent-sales")
    public ResponseEntity<List<Map<String, Object>>> getRecentSales() {
        List<Sale> sales = dashboardService.getRecentSales();
        List<Map<String, Object>> result = sales.stream().map(s -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", s.getId());
            map.put("totalPrice", s.getTotalPrice());
            map.put("paymentMethod", s.getPaymentMethod());
            map.put("timestamp", s.getTimestamp().toString());
            map.put("employeeName", s.getEmployeeName());
            map.put("items", s.getItems().stream().map(si -> {
                Map<String, Object> item = new HashMap<>();
                item.put("name", si.getName());
                item.put("qty", si.getQty());
                return item;
            }).collect(Collectors.toList()));
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
