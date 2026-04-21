package com.stockmaster.repository;

import com.stockmaster.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findAllByShopName(String shopName);
    Optional<Employee> findByIdAndShopName(Long id, String shopName);
    Optional<Employee> findByEmail(String email);
    Optional<Employee> findByEmailAndShopName(String email, String shopName);
    boolean existsByEmailAndShopName(String email, String shopName);
}
