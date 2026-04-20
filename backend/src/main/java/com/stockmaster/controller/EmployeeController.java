package com.stockmaster.controller;

import com.stockmaster.model.Employee;
import com.stockmaster.model.User;
import com.stockmaster.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public ResponseEntity<List<Employee>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(employeeService.getAll(user.getShopName()));
    }

    @PostMapping
    public ResponseEntity<Employee> create(@RequestBody Employee employee, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(employeeService.create(employee, user.getShopName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Employee> update(@PathVariable Long id, @RequestBody Employee employee, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(employeeService.update(id, employee, user.getShopName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        employeeService.delete(id, user.getShopName());
        return ResponseEntity.ok(Map.of("message", "Employee deleted successfully"));
    }
}
