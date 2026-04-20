package com.stockmaster.controller;

import com.stockmaster.model.AuditLog;
import com.stockmaster.model.User;
import com.stockmaster.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(auditLogService.getAllLogs(user.getShopName()));
    }
}
