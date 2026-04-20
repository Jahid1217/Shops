package com.stockmaster.repository;

import com.stockmaster.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findAllByShopName(String shopName);
    Optional<Customer> findByIdAndShopName(Long id, String shopName);
    Optional<Customer> findByPhoneAndShopName(String phone, String shopName);
    boolean existsByPhoneAndShopName(String phone, String shopName);
    long countByShopName(String shopName);
}
