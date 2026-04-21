package com.stockmaster.controller;

import com.stockmaster.model.AuditLog;
import com.stockmaster.security.AuthenticatedUser;
import com.stockmaster.service.AuditLogService;
import com.stockmaster.service.PermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;
    private final PermissionService permissionService;

    public AuditLogController(AuditLogService auditLogService, PermissionService permissionService) {
        this.auditLogService = auditLogService;
        this.permissionService = permissionService;
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAll(@AuthenticationPrincipal AuthenticatedUser user) {
        permissionService.requireMenu(user, "audit-logs");
        permissionService.requireFeature(user, "audit.view");
        return ResponseEntity.ok(auditLogService.getAllLogs(user.getShopName()));
    }
}
