package com.stockmaster.service;

import com.stockmaster.model.AuditLog;
import com.stockmaster.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public List<AuditLog> getAllLogs(String shopName) {
        return auditLogRepository.findAllByShopNameOrderByTimestampDesc(normalizeShopName(shopName));
    }

    public void log(Long userId, String userName, String shopName, String action, String details) {
        AuditLog log = AuditLog.builder()
                .userId(userId)
                .userName(userName)
                .shopName(normalizeShopName(shopName))
                .action(action)
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }

    private String normalizeShopName(String shopName) {
        if (shopName == null || shopName.trim().isEmpty()) {
            throw new IllegalArgumentException("Shop information is missing for the current user.");
        }
        return shopName.trim();
    }
}
