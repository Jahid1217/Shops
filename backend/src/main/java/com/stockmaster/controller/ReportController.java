package com.stockmaster.controller;

import com.stockmaster.dto.report.ReportDataResponse;
import com.stockmaster.dto.report.ReportFilterRequest;
import com.stockmaster.security.AuthenticatedUser;
import com.stockmaster.service.PermissionService;
import com.stockmaster.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final PermissionService permissionService;

    public ReportController(ReportService reportService, PermissionService permissionService) {
        this.reportService = reportService;
        this.permissionService = permissionService;
    }

    @GetMapping("/sales")
    public ResponseEntity<ReportDataResponse> salesReport(
            @ModelAttribute ReportFilterRequest filter,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        permissionService.requireMenu(user, "dashboard");
        return ResponseEntity.ok(reportService.getSalesReport(filter, user.getShopName()));
    }

    @GetMapping("/stock")
    public ResponseEntity<ReportDataResponse> stockReport(
            @ModelAttribute ReportFilterRequest filter,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        permissionService.requireMenu(user, "dashboard");
        return ResponseEntity.ok(reportService.getStockReport(filter, user.getShopName()));
    }

    @GetMapping("/purchase")
    public ResponseEntity<ReportDataResponse> purchaseReport(
            @ModelAttribute ReportFilterRequest filter,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        permissionService.requireMenu(user, "dashboard");
        return ResponseEntity.ok(reportService.getPurchaseReport(filter, user.getShopName()));
    }

    @GetMapping("/financial")
    public ResponseEntity<ReportDataResponse> financialReport(
            @ModelAttribute ReportFilterRequest filter,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        permissionService.requireMenu(user, "dashboard");
        return ResponseEntity.ok(reportService.getFinancialReport(filter, user.getShopName()));
    }

    @GetMapping("/customer")
    public ResponseEntity<ReportDataResponse> customerReport(
            @ModelAttribute ReportFilterRequest filter,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        permissionService.requireMenu(user, "dashboard");
        return ResponseEntity.ok(reportService.getCustomerReport(filter, user.getShopName()));
    }

    @GetMapping("/returns")
    public ResponseEntity<ReportDataResponse> returnsReport(
            @ModelAttribute ReportFilterRequest filter,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        permissionService.requireMenu(user, "dashboard");
        return ResponseEntity.ok(reportService.getReturnDamageReport(filter, user.getShopName()));
    }
}
