package com.stockmaster.dto.report;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
public class ReportDataResponse {
    private String reportType;
    private String generatedAt;
    private Map<String, Object> summary;
    private List<Map<String, Object>> listData;
    private List<Map<String, Object>> groupedData;
    private List<Map<String, Object>> chartData;
}
