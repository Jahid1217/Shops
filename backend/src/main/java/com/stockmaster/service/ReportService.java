package com.stockmaster.service;

import com.stockmaster.dto.report.ReportDataResponse;
import com.stockmaster.dto.report.ReportFilterRequest;
import com.stockmaster.model.Customer;
import com.stockmaster.model.Item;
import com.stockmaster.model.Sale;
import com.stockmaster.model.SaleItem;
import com.stockmaster.repository.CustomerRepository;
import com.stockmaster.repository.InventoryHistoryRepository;
import com.stockmaster.repository.ItemRepository;
import com.stockmaster.repository.SaleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private static final DateTimeFormatter DAY_KEY = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final SaleRepository saleRepository;
    private final ItemRepository itemRepository;
    private final CustomerRepository customerRepository;
    private final InventoryHistoryRepository inventoryHistoryRepository;

    public ReportService(
            SaleRepository saleRepository,
            ItemRepository itemRepository,
            CustomerRepository customerRepository,
            InventoryHistoryRepository inventoryHistoryRepository
    ) {
        this.saleRepository = saleRepository;
        this.itemRepository = itemRepository;
        this.customerRepository = customerRepository;
        this.inventoryHistoryRepository = inventoryHistoryRepository;
    }

    public ReportDataResponse getSalesReport(ReportFilterRequest filter, String shopName) {
        String scopedShop = normalizeShopName(shopName);
        DateRange range = resolveRange(filter);
        String paymentFilter = normalize(filter.getPaymentMethod());
        String productFilter = normalize(filter.getProduct());
        String search = normalize(filter.getSearch());

        List<Sale> sales = saleRepository.findByShopNameAndTimestampBetweenOrderByTimestampDesc(scopedShop, range.start(), range.end());
        List<Sale> filtered = sales.stream()
                .filter(sale -> matchesPaymentMethod(sale, paymentFilter))
                .filter(sale -> matchesProduct(sale, productFilter))
                .filter(sale -> matchesSaleSearch(sale, search))
                .collect(Collectors.toList());

        List<Map<String, Object>> listData = filtered.stream()
                .map(this::toSaleListRow)
                .collect(Collectors.toList());

        List<Map<String, Object>> groupedData = buildSalesGroupedData(filtered, normalize(filter.getGroupBy()));
        List<Map<String, Object>> chartData = buildSalesChartData(filtered);

        int totalItems = filtered.stream()
                .flatMap(sale -> sale.getItems().stream())
                .mapToInt(item -> safeInt(item.getQty()))
                .sum();

        double totalDiscount = filtered.stream().mapToDouble(sale -> safeDouble(sale.getDiscount())).sum();
        double totalSales = filtered.stream().mapToDouble(sale -> safeDouble(sale.getTotalPrice())).sum();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("transactions", filtered.size());
        summary.put("itemsSold", totalItems);
        summary.put("totalSales", round2(totalSales));
        summary.put("totalDiscount", round2(totalDiscount));
        summary.put("averageSaleValue", filtered.isEmpty() ? 0.0 : round2(totalSales / filtered.size()));

        return buildResponse("sales", summary, listData, groupedData, chartData);
    }

    public ReportDataResponse getStockReport(ReportFilterRequest filter, String shopName) {
        String scopedShop = normalizeShopName(shopName);
        String productFilter = normalize(filter.getProduct());
        String statusFilter = normalize(filter.getStatus());
        String search = normalize(filter.getSearch());

        List<Item> items = itemRepository.findAllByShopName(scopedShop).stream()
                .filter(item -> productFilter == null || containsIgnoreCase(item.getName(), productFilter))
                .filter(item -> statusFilter == null || itemStatus(item).equalsIgnoreCase(statusFilter))
                .filter(item -> search == null || containsIgnoreCase(item.getName(), search) || containsIgnoreCase(item.getBarcode(), search))
                .collect(Collectors.toList());

        List<Map<String, Object>> listData = items.stream()
                .map(this::toStockListRow)
                .collect(Collectors.toList());

        Map<String, List<Item>> grouped = items.stream().collect(Collectors.groupingBy(this::itemStatus));
        List<Map<String, Object>> groupedData = grouped.entrySet().stream()
                .map(entry -> {
                    int quantity = entry.getValue().stream().mapToInt(i -> safeInt(i.getQuantity())).sum();
                    double value = entry.getValue().stream().mapToDouble(i -> safeInt(i.getQuantity()) * safeDouble(i.getSellingPrice())).sum();
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("group", entry.getKey());
                    row.put("products", entry.getValue().size());
                    row.put("quantity", quantity);
                    row.put("stockValue", round2(value));
                    return row;
                })
                .sorted(Comparator.comparing(m -> String.valueOf(m.get("group"))))
                .collect(Collectors.toList());

        List<Map<String, Object>> chartData = items.stream()
                .sorted(Comparator.comparingInt((Item i) -> safeInt(i.getQuantity())).reversed())
                .limit(10)
                .map(item -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("name", item.getName());
                    row.put("quantity", safeInt(item.getQuantity()));
                    row.put("value", round2(safeInt(item.getQuantity()) * safeDouble(item.getSellingPrice())));
                    return row;
                })
                .collect(Collectors.toList());

        int totalQuantity = items.stream().mapToInt(i -> safeInt(i.getQuantity())).sum();
        double totalStockValue = items.stream().mapToDouble(i -> safeInt(i.getQuantity()) * safeDouble(i.getSellingPrice())).sum();
        double totalCostValue = items.stream().mapToDouble(i -> safeInt(i.getQuantity()) * safeDouble(i.getBuyingPrice())).sum();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("products", items.size());
        summary.put("totalQuantity", totalQuantity);
        summary.put("stockValue", round2(totalStockValue));
        summary.put("costValue", round2(totalCostValue));
        summary.put("estimatedMargin", round2(totalStockValue - totalCostValue));

        return buildResponse("stock", summary, listData, groupedData, chartData);
    }

    public ReportDataResponse getCustomerReport(ReportFilterRequest filter, String shopName) {
        String scopedShop = normalizeShopName(shopName);
        DateRange range = resolveRange(filter);
        String search = normalize(filter.getSearch());

        Map<String, Customer> customersByPhone = customerRepository.findAllByShopName(scopedShop).stream()
                .filter(c -> c.getPhone() != null)
                .collect(Collectors.toMap(Customer::getPhone, c -> c, (a, b) -> a));

        Map<String, Map<String, Object>> customerStats = new LinkedHashMap<>();
        List<Sale> sales = saleRepository.findByShopNameAndTimestampBetweenOrderByTimestampDesc(scopedShop, range.start(), range.end());
        for (Sale sale : sales) {
            String phone = normalize(sale.getCustomerPhone());
            if (phone == null) {
                continue;
            }

            Map<String, Object> row = customerStats.computeIfAbsent(phone, key -> {
                Map<String, Object> value = new LinkedHashMap<>();
                value.put("customerPhone", key);
                value.put("customerName", customersByPhone.containsKey(key) ? customersByPhone.get(key).getName() : "Walk-in");
                value.put("orders", 0);
                value.put("items", 0);
                value.put("spent", 0.0);
                value.put("lastPurchase", sale.getTimestamp().toString());
                value.put("points", customersByPhone.containsKey(key) ? safeInt(customersByPhone.get(key).getPoints()) : 0);
                return value;
            });

            row.put("orders", safeInt(row.get("orders")) + 1);
            int saleItems = sale.getItems().stream().mapToInt(si -> safeInt(si.getQty())).sum();
            row.put("items", safeInt(row.get("items")) + saleItems);
            row.put("spent", round2(safeDouble(row.get("spent")) + safeDouble(sale.getTotalPrice())));
            row.put("lastPurchase", maxTimestamp(String.valueOf(row.get("lastPurchase")), sale.getTimestamp().toString()));
        }

        List<Map<String, Object>> listData = customerStats.values().stream()
                .filter(row -> search == null
                        || containsIgnoreCase(String.valueOf(row.get("customerName")), search)
                        || containsIgnoreCase(String.valueOf(row.get("customerPhone")), search))
                .sorted((a, b) -> Double.compare(safeDouble(b.get("spent")), safeDouble(a.get("spent"))))
                .collect(Collectors.toList());

        List<Map<String, Object>> groupedData = buildCustomerGroupedData(listData);
        List<Map<String, Object>> chartData = listData.stream()
                .limit(8)
                .map(row -> {
                    Map<String, Object> chartRow = new LinkedHashMap<>();
                    chartRow.put("name", row.get("customerName"));
                    chartRow.put("spent", row.get("spent"));
                    chartRow.put("orders", row.get("orders"));
                    return chartRow;
                })
                .collect(Collectors.toList());

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("activeCustomers", listData.size());
        summary.put("totalRevenueFromCustomers", round2(listData.stream().mapToDouble(row -> safeDouble(row.get("spent"))).sum()));
        summary.put("totalOrders", listData.stream().mapToInt(row -> safeInt(row.get("orders"))).sum());
        summary.put("averageOrderPerCustomer", listData.isEmpty() ? 0.0 : round2(listData.stream().mapToInt(row -> safeInt(row.get("orders"))).sum() / (double) listData.size()));

        return buildResponse("customer", summary, listData, groupedData, chartData);
    }

    public ReportDataResponse getPurchaseReport(ReportFilterRequest filter, String shopName) {
        DateRange range = resolveRange(filter);
        String search = normalize(filter.getSearch());
        String status = normalize(filter.getStatus());

        List<Map<String, Object>> mockRows = buildMockPurchaseRows(shopName, range);
        List<Map<String, Object>> listData = mockRows.stream()
                .filter(row -> status == null || status.equalsIgnoreCase(String.valueOf(row.get("status"))))
                .filter(row -> search == null
                        || containsIgnoreCase(String.valueOf(row.get("supplier")), search)
                        || containsIgnoreCase(String.valueOf(row.get("reference")), search))
                .collect(Collectors.toList());

        Map<String, List<Map<String, Object>>> bySupplier = listData.stream()
                .collect(Collectors.groupingBy(row -> String.valueOf(row.get("supplier"))));
        List<Map<String, Object>> groupedData = bySupplier.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("group", entry.getKey());
                    row.put("orders", entry.getValue().size());
                    row.put("totalPurchase", round2(entry.getValue().stream().mapToDouble(v -> safeDouble(v.get("amount"))).sum()));
                    row.put("pendingAmount", round2(entry.getValue().stream().mapToDouble(v -> safeDouble(v.get("pendingAmount"))).sum()));
                    return row;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> chartData = buildDateAmountChart(listData, "amount");
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("purchaseOrders", listData.size());
        summary.put("totalPurchaseAmount", round2(listData.stream().mapToDouble(row -> safeDouble(row.get("amount"))).sum()));
        summary.put("pendingOrders", listData.stream().filter(row -> "pending".equalsIgnoreCase(String.valueOf(row.get("status")))).count());
        summary.put("pendingAmount", round2(listData.stream().mapToDouble(row -> safeDouble(row.get("pendingAmount"))).sum()));
        summary.put("dataSource", "mock");

        return buildResponse("purchase", summary, listData, groupedData, chartData);
    }

    public ReportDataResponse getFinancialReport(ReportFilterRequest filter, String shopName) {
        String scopedShop = normalizeShopName(shopName);
        DateRange range = resolveRange(filter);
        List<Sale> sales = saleRepository.findByShopNameAndTimestampBetweenOrderByTimestampDesc(scopedShop, range.start(), range.end());
        List<Map<String, Object>> expenses = buildMockExpenseRows(shopName, range);

        List<Map<String, Object>> entries = new ArrayList<>();
        for (Sale sale : sales) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", sale.getTimestamp().toLocalDate().toString());
            row.put("entryType", "income");
            row.put("reference", "SALE-" + sale.getId());
            row.put("amount", round2(safeDouble(sale.getTotalPrice())));
            row.put("paymentMethod", sale.getPaymentMethod());
            entries.add(row);
        }
        entries.addAll(expenses);
        entries.sort((a, b) -> String.valueOf(b.get("date")).compareTo(String.valueOf(a.get("date"))));

        double totalSales = sales.stream().mapToDouble(s -> safeDouble(s.getTotalPrice())).sum();
        double totalExpenses = expenses.stream().mapToDouble(row -> safeDouble(row.get("amount"))).sum();

        List<Map<String, Object>> groupedData = buildFinancialGroupedData(entries);
        List<Map<String, Object>> chartData = groupedData;

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalSales", round2(totalSales));
        summary.put("totalExpenses", round2(totalExpenses));
        summary.put("netCashFlow", round2(totalSales - totalExpenses));
        summary.put("incomeEntries", sales.size());
        summary.put("expenseEntries", expenses.size());
        summary.put("dataSource", "mixed_real_and_mock");

        return buildResponse("financial", summary, entries, groupedData, chartData);
    }

    public ReportDataResponse getReturnDamageReport(ReportFilterRequest filter, String shopName) {
        DateRange range = resolveRange(filter);
        String search = normalize(filter.getSearch());
        String status = normalize(filter.getStatus());
        List<Map<String, Object>> rows = buildMockReturnRows(shopName, range).stream()
                .filter(row -> status == null || status.equalsIgnoreCase(String.valueOf(row.get("status"))))
                .filter(row -> search == null
                        || containsIgnoreCase(String.valueOf(row.get("itemName")), search)
                        || containsIgnoreCase(String.valueOf(row.get("reason")), search))
                .collect(Collectors.toList());

        Map<String, List<Map<String, Object>>> byReason = rows.stream()
                .collect(Collectors.groupingBy(row -> String.valueOf(row.get("reason"))));
        List<Map<String, Object>> groupedData = byReason.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("group", entry.getKey());
                    row.put("cases", entry.getValue().size());
                    row.put("quantity", entry.getValue().stream().mapToInt(r -> safeInt(r.get("quantity"))).sum());
                    row.put("value", round2(entry.getValue().stream().mapToDouble(r -> safeDouble(r.get("estimatedLoss"))).sum()));
                    return row;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> chartData = buildDateAmountChart(rows, "estimatedLoss");
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("cases", rows.size());
        summary.put("damagedQty", rows.stream().mapToInt(r -> safeInt(r.get("quantity"))).sum());
        summary.put("estimatedLoss", round2(rows.stream().mapToDouble(r -> safeDouble(r.get("estimatedLoss"))).sum()));
        summary.put("dataSource", "mock");

        return buildResponse("returns", summary, rows, groupedData, chartData);
    }

    private ReportDataResponse buildResponse(
            String reportType,
            Map<String, Object> summary,
            List<Map<String, Object>> listData,
            List<Map<String, Object>> groupedData,
            List<Map<String, Object>> chartData
    ) {
        return ReportDataResponse.builder()
                .reportType(reportType)
                .generatedAt(LocalDateTime.now().toString())
                .summary(summary)
                .listData(listData)
                .groupedData(groupedData)
                .chartData(chartData)
                .build();
    }

    private List<Map<String, Object>> buildSalesGroupedData(List<Sale> sales, String groupBy) {
        String normalizedGroup = groupBy == null ? "date" : groupBy.toLowerCase(Locale.ROOT);
        Map<String, Map<String, Object>> groups = new LinkedHashMap<>();

        for (Sale sale : sales) {
            if ("product".equals(normalizedGroup)) {
                for (SaleItem item : sale.getItems()) {
                    String key = normalize(item.getName());
                    if (key == null) {
                        key = "Unknown";
                    }
                    Map<String, Object> row = groups.computeIfAbsent(key, k -> newGroupRow(k));
                    row.put("transactions", safeInt(row.get("transactions")) + 1);
                    row.put("quantity", safeInt(row.get("quantity")) + safeInt(item.getQty()));
                    row.put("amount", round2(safeDouble(row.get("amount")) + safeDouble(item.getPrice()) * safeInt(item.getQty())));
                }
            } else {
                String key;
                if ("payment".equals(normalizedGroup) || "paymentmethod".equals(normalizedGroup)) {
                    key = normalize(sale.getPaymentMethod());
                } else if ("cashier".equals(normalizedGroup)) {
                    key = normalize(sale.getEmployeeName());
                } else {
                    key = sale.getTimestamp().toLocalDate().format(DAY_KEY);
                }
                if (key == null) {
                    key = "Unknown";
                }
                Map<String, Object> row = groups.computeIfAbsent(key, k -> newGroupRow(k));
                row.put("transactions", safeInt(row.get("transactions")) + 1);
                row.put("quantity", safeInt(row.get("quantity")) + sale.getItems().stream().mapToInt(si -> safeInt(si.getQty())).sum());
                row.put("amount", round2(safeDouble(row.get("amount")) + safeDouble(sale.getTotalPrice())));
            }
        }
        return new ArrayList<>(groups.values());
    }

    private List<Map<String, Object>> buildSalesChartData(List<Sale> sales) {
        Map<String, Double> dateSales = new LinkedHashMap<>();
        Map<String, Integer> dateTransactions = new LinkedHashMap<>();

        for (Sale sale : sales) {
            String key = sale.getTimestamp().toLocalDate().format(DAY_KEY);
            dateSales.put(key, round2(dateSales.getOrDefault(key, 0.0) + safeDouble(sale.getTotalPrice())));
            dateTransactions.put(key, dateTransactions.getOrDefault(key, 0) + 1);
        }

        List<String> orderedKeys = new ArrayList<>(dateSales.keySet());
        orderedKeys.sort(String::compareTo);

        List<Map<String, Object>> chartRows = new ArrayList<>();
        for (String key : orderedKeys) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", key);
            row.put("sales", round2(dateSales.get(key)));
            row.put("transactions", dateTransactions.getOrDefault(key, 0));
            chartRows.add(row);
        }
        return chartRows;
    }

    private Map<String, Object> toSaleListRow(Sale sale) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("saleId", sale.getId());
        row.put("date", sale.getTimestamp().toLocalDate().toString());
        row.put("time", sale.getTimestamp().toLocalTime().withNano(0).toString());
        row.put("cashier", sale.getEmployeeName());
        row.put("paymentMethod", sale.getPaymentMethod());
        row.put("customerPhone", sale.getCustomerPhone());
        row.put("itemsCount", sale.getItems().stream().mapToInt(si -> safeInt(si.getQty())).sum());
        row.put("discount", round2(safeDouble(sale.getDiscount())));
        row.put("total", round2(safeDouble(sale.getTotalPrice())));
        row.put("items", sale.getItems().stream().map(item -> {
            Map<String, Object> itemRow = new LinkedHashMap<>();
            itemRow.put("name", item.getName());
            itemRow.put("qty", item.getQty());
            itemRow.put("price", item.getPrice());
            return itemRow;
        }).collect(Collectors.toList()));
        return row;
    }

    private Map<String, Object> toStockListRow(Item item) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("itemId", item.getId());
        row.put("itemName", item.getName());
        row.put("barcode", item.getBarcode());
        row.put("quantity", safeInt(item.getQuantity()));
        row.put("buyingPrice", round2(safeDouble(item.getBuyingPrice())));
        row.put("sellingPrice", round2(safeDouble(item.getSellingPrice())));
        row.put("stockValue", round2(safeInt(item.getQuantity()) * safeDouble(item.getSellingPrice())));
        row.put("status", itemStatus(item));
        return row;
    }

    private List<Map<String, Object>> buildCustomerGroupedData(List<Map<String, Object>> rows) {
        Map<String, Map<String, Object>> grouped = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            double spent = safeDouble(row.get("spent"));
            String tier = spent >= 10000 ? "Gold" : spent >= 5000 ? "Silver" : "Bronze";
            Map<String, Object> groupedRow = grouped.computeIfAbsent(tier, this::newGroupRow);
            groupedRow.put("transactions", safeInt(groupedRow.get("transactions")) + safeInt(row.get("orders")));
            groupedRow.put("quantity", safeInt(groupedRow.get("quantity")) + safeInt(row.get("items")));
            groupedRow.put("amount", round2(safeDouble(groupedRow.get("amount")) + spent));
        }
        return new ArrayList<>(grouped.values());
    }

    private List<Map<String, Object>> buildFinancialGroupedData(List<Map<String, Object>> entries) {
        Map<String, Map<String, Object>> grouped = new LinkedHashMap<>();
        for (Map<String, Object> entry : entries) {
            String dateKey = String.valueOf(entry.get("date"));
            String type = String.valueOf(entry.get("entryType"));
            double amount = safeDouble(entry.get("amount"));
            Map<String, Object> row = grouped.computeIfAbsent(dateKey, key -> {
                Map<String, Object> value = new LinkedHashMap<>();
                value.put("group", key);
                value.put("income", 0.0);
                value.put("expense", 0.0);
                value.put("net", 0.0);
                return value;
            });
            if ("expense".equalsIgnoreCase(type)) {
                row.put("expense", round2(safeDouble(row.get("expense")) + amount));
            } else {
                row.put("income", round2(safeDouble(row.get("income")) + amount));
            }
            row.put("net", round2(safeDouble(row.get("income")) - safeDouble(row.get("expense"))));
        }
        return grouped.values().stream()
                .sorted(Comparator.comparing(m -> String.valueOf(m.get("group"))))
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildDateAmountChart(List<Map<String, Object>> rows, String amountKey) {
        Map<String, Double> daily = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            String date = String.valueOf(row.get("date"));
            daily.put(date, round2(daily.getOrDefault(date, 0.0) + safeDouble(row.get(amountKey))));
        }
        return daily.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    Map<String, Object> chartRow = new LinkedHashMap<>();
                    chartRow.put("name", entry.getKey());
                    chartRow.put("value", round2(entry.getValue()));
                    return chartRow;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildMockPurchaseRows(String shopName, DateRange range) {
        Random random = new Random(Objects.hash(shopName, range.start().toString(), range.end().toString(), "purchase"));
        String[] suppliers = {"Noble Traders", "Prime Source Ltd", "Delta Wholesale", "Urban Supply Hub"};
        String[] statuses = {"completed", "pending"};

        List<Map<String, Object>> rows = new ArrayList<>();
        int days = (int) Math.max(1, java.time.Duration.between(range.start(), range.end()).toDays());
        int count = Math.min(18, Math.max(8, days / 2));
        for (int i = 0; i < count; i++) {
            LocalDate date = range.start().toLocalDate().plusDays(random.nextInt(Math.max(1, days)));
            double amount = 2000 + random.nextInt(25000);
            boolean pending = "pending".equals(statuses[random.nextInt(statuses.length)]);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("reference", "PO-" + (1000 + i));
            row.put("date", date.toString());
            row.put("supplier", suppliers[random.nextInt(suppliers.length)]);
            row.put("amount", round2(amount));
            row.put("status", pending ? "pending" : "completed");
            row.put("itemsCount", 3 + random.nextInt(12));
            row.put("pendingAmount", pending ? round2(amount * (0.25 + random.nextDouble() * 0.5)) : 0.0);
            rows.add(row);
        }
        rows.sort((a, b) -> String.valueOf(b.get("date")).compareTo(String.valueOf(a.get("date"))));
        return rows;
    }

    private List<Map<String, Object>> buildMockExpenseRows(String shopName, DateRange range) {
        Random random = new Random(Objects.hash(shopName, range.start().toString(), range.end().toString(), "expense"));
        String[] categories = {"Rent", "Utilities", "Logistics", "Maintenance", "Marketing", "Salary"};

        List<Map<String, Object>> rows = new ArrayList<>();
        int days = (int) Math.max(1, java.time.Duration.between(range.start(), range.end()).toDays());
        int count = Math.min(20, Math.max(10, days / 2));
        for (int i = 0; i < count; i++) {
            LocalDate date = range.start().toLocalDate().plusDays(random.nextInt(Math.max(1, days)));
            String category = categories[random.nextInt(categories.length)];
            double amount = 400 + random.nextInt(9000);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", date.toString());
            row.put("entryType", "expense");
            row.put("reference", "EXP-" + (800 + i));
            row.put("category", category);
            row.put("amount", round2(amount));
            row.put("paymentMethod", "cash");
            rows.add(row);
        }
        return rows;
    }

    private List<Map<String, Object>> buildMockReturnRows(String shopName, DateRange range) {
        Random random = new Random(Objects.hash(shopName, range.start().toString(), range.end().toString(), "return"));
        String[] reasons = {"Damaged", "Expired", "Customer Return", "Wrong Item"};
        String[] statuses = {"processed", "pending", "approved"};
        List<Item> catalog = itemRepository.findAllByShopName(normalizeShopName(shopName));

        List<Map<String, Object>> rows = new ArrayList<>();
        int days = (int) Math.max(1, java.time.Duration.between(range.start(), range.end()).toDays());
        int count = Math.min(16, Math.max(6, days / 3));
        for (int i = 0; i < count; i++) {
            LocalDate date = range.start().toLocalDate().plusDays(random.nextInt(Math.max(1, days)));
            Item item = catalog.isEmpty() ? null : catalog.get(random.nextInt(catalog.size()));
            int quantity = 1 + random.nextInt(6);
            double unitPrice = item == null ? 120 + random.nextInt(500) : safeDouble(item.getSellingPrice());

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("reference", "RET-" + (500 + i));
            row.put("date", date.toString());
            row.put("itemName", item == null ? ("Item-" + (i + 1)) : item.getName());
            row.put("reason", reasons[random.nextInt(reasons.length)]);
            row.put("status", statuses[random.nextInt(statuses.length)]);
            row.put("quantity", quantity);
            row.put("estimatedLoss", round2(unitPrice * quantity));
            rows.add(row);
        }
        rows.sort((a, b) -> String.valueOf(b.get("date")).compareTo(String.valueOf(a.get("date"))));
        return rows;
    }

    private boolean matchesPaymentMethod(Sale sale, String paymentFilter) {
        if (paymentFilter == null) {
            return true;
        }
        return containsIgnoreCase(sale.getPaymentMethod(), paymentFilter);
    }

    private boolean matchesProduct(Sale sale, String productFilter) {
        if (productFilter == null) {
            return true;
        }
        return sale.getItems().stream().anyMatch(item -> containsIgnoreCase(item.getName(), productFilter));
    }

    private boolean matchesSaleSearch(Sale sale, String search) {
        if (search == null) {
            return true;
        }
        if (String.valueOf(sale.getId()).contains(search)) {
            return true;
        }
        if (containsIgnoreCase(sale.getEmployeeName(), search) || containsIgnoreCase(sale.getCustomerPhone(), search)) {
            return true;
        }
        return sale.getItems().stream().anyMatch(item -> containsIgnoreCase(item.getName(), search));
    }

    private String itemStatus(Item item) {
        int quantity = safeInt(item.getQuantity());
        if (quantity <= 0) {
            return "out_of_stock";
        }
        if (quantity <= 5) {
            return "low_stock";
        }
        return "in_stock";
    }

    private DateRange resolveRange(ReportFilterRequest filter) {
        LocalDate endDate = filter.getEndDate() == null ? LocalDate.now() : filter.getEndDate();
        LocalDate startDate = filter.getStartDate() == null ? endDate.minusDays(30) : filter.getStartDate();
        if (startDate.isAfter(endDate)) {
            LocalDate tmp = startDate;
            startDate = endDate;
            endDate = tmp;
        }
        return new DateRange(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX));
    }

    private String normalizeShopName(String shopName) {
        if (shopName == null || shopName.trim().isEmpty()) {
            throw new IllegalArgumentException("Shop information is missing for the current user.");
        }
        return shopName.trim();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private boolean containsIgnoreCase(String value, String search) {
        if (value == null || search == null) {
            return false;
        }
        return value.toLowerCase(Locale.ROOT).contains(search.toLowerCase(Locale.ROOT));
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private int safeInt(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private double safeDouble(Object value) {
        if (value == null) {
            return 0.0;
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0.0;
        }
    }

    private Map<String, Object> newGroupRow(String group) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("group", group);
        row.put("transactions", 0);
        row.put("quantity", 0);
        row.put("amount", 0.0);
        return row;
    }

    private String maxTimestamp(String first, String second) {
        return first.compareTo(second) >= 0 ? first : second;
    }

    private record DateRange(LocalDateTime start, LocalDateTime end) {}
}
