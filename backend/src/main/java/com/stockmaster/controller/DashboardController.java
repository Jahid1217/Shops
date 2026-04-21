package com.stockmaster.controller;

import com.stockmaster.dto.DashboardStats;
import com.stockmaster.model.Item;
import com.stockmaster.model.Sale;
import com.stockmaster.security.AuthenticatedUser;
import com.stockmaster.service.DashboardService;
import com.stockmaster.service.PermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final PermissionService permissionService;

    public DashboardController(DashboardService dashboardService, PermissionService permissionService) {
        this.dashboardService = dashboardService;
        this.permissionService = permissionService;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats(@AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "dashboard");
        return ResponseEntity.ok(dashboardService.getStats(user.getShopName()));
    }

    @GetMapping("/chart-data")
    public ResponseEntity<List<Map<String, Object>>> getChartData(@AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "dashboard");
        return ResponseEntity.ok(dashboardService.getChartData(user.getShopName()));
    }

    @GetMapping("/top-selling")
    public ResponseEntity<List<Map<String, Object>>> getTopSelling(@AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "dashboard");
        return ResponseEntity.ok(dashboardService.getTopSelling(user.getShopName()));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Item>> getLowStock(@AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "dashboard");
        return ResponseEntity.ok(dashboardService.getLowStockItems(user.getShopName()));
    }

    @GetMapping("/recent-sales")
    public ResponseEntity<List<Map<String, Object>>> getRecentSales(@AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "dashboard");
        List<Sale> sales = dashboardService.getRecentSales(user.getShopName());
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
