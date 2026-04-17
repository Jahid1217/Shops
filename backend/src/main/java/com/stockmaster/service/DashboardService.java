package com.stockmaster.service;

import com.stockmaster.dto.DashboardStats;
import com.stockmaster.model.Item;
import com.stockmaster.model.Sale;
import com.stockmaster.model.SaleItem;
import com.stockmaster.repository.CustomerRepository;
import com.stockmaster.repository.ItemRepository;
import com.stockmaster.repository.SaleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ItemRepository itemRepository;
    private final CustomerRepository customerRepository;
    private final SaleRepository saleRepository;

    public DashboardService(ItemRepository itemRepository, CustomerRepository customerRepository, SaleRepository saleRepository) {
        this.itemRepository = itemRepository;
        this.customerRepository = customerRepository;
        this.saleRepository = saleRepository;
    }

    public DashboardStats getStats() {
        List<Item> items = itemRepository.findAll();
        long totalItems = items.size();
        long lowStock = items.stream().filter(i -> i.getQuantity() > 0 && i.getQuantity() <= 5).count();
        long outOfStock = items.stream().filter(i -> i.getQuantity() <= 0).count();
        long totalCustomers = customerRepository.count();
        Double totalSales = saleRepository.getTotalSalesAmount();

        return DashboardStats.builder()
                .totalItems(totalItems)
                .lowStock(lowStock)
                .outOfStock(outOfStock)
                .totalCustomers(totalCustomers)
                .totalSales(totalSales != null ? totalSales : 0.0)
                .build();
    }

    public List<Map<String, Object>> getChartData() {
        List<Map<String, Object>> chartData = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(LocalTime.MAX);

            List<Sale> daySales = saleRepository.findByTimestampBetween(start, end);
            double total = daySales.stream().mapToDouble(Sale::getTotalPrice).sum();

            Map<String, Object> entry = new HashMap<>();
            entry.put("name", date.getDayOfWeek().toString().substring(0, 3));
            entry.put("sales", total);
            chartData.add(entry);
        }

        return chartData;
    }

    public List<Map<String, Object>> getTopSelling() {
        List<Sale> allSales = saleRepository.findAll();
        Map<Long, Map<String, Object>> itemCounts = new HashMap<>();

        for (Sale sale : allSales) {
            for (SaleItem si : sale.getItems()) {
                itemCounts.computeIfAbsent(si.getItemId(), k -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", si.getItemId());
                    m.put("name", si.getName());
                    m.put("count", 0);
                    return m;
                });
                Map<String, Object> m = itemCounts.get(si.getItemId());
                m.put("count", (int) m.get("count") + si.getQty());
            }
        }

        return itemCounts.values().stream()
                .sorted((a, b) -> (int) b.get("count") - (int) a.get("count"))
                .limit(5)
                .collect(Collectors.toList());
    }

    public List<Item> getLowStockItems() {
        return itemRepository.findByQuantityLessThanEqualOrderByQuantityAsc(5);
    }

    public List<Sale> getRecentSales() {
        return saleRepository.findTop5ByOrderByTimestampDesc();
    }
}
