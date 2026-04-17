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

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    public void log(Long userId, String userName, String action, String details) {
        AuditLog log = AuditLog.builder()
                .userId(userId)
                .userName(userName)
                .action(action)
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }
}
