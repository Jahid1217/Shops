package com.stockmaster.service;

import com.stockmaster.security.AuthenticatedUser;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PermissionService {

    public static final List<String> ALL_MENUS = List.of(
            "dashboard",
            "inventory",
            "pos",
            "customers",
            "employees",
            "audit-logs",
            "history",
            "profile"
    );

    public static final List<String> ALL_FEATURES = List.of(
            "inventory.delete",
            "customers.manage",
            "pos.checkout",
            "employees.manage",
            "audit.view"
    );

    public static final List<String> DEFAULT_EMPLOYEE_MENUS = List.of(
            "dashboard",
            "inventory",
            "pos",
            "customers",
            "history",
            "profile"
    );

    public static final List<String> DEFAULT_EMPLOYEE_FEATURES = List.of(
            "pos.checkout",
            "customers.manage"
    );

    public List<String> parseCsvPermissions(String csv) {
        if (csv == null || csv.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }

    public String toCsv(List<String> permissions) {
        if (permissions == null || permissions.isEmpty()) {
            return "";
        }
        Set<String> unique = new LinkedHashSet<>();
        for (String permission : permissions) {
            if (permission != null) {
                String normalized = permission.trim();
                if (!normalized.isEmpty()) {
                    unique.add(normalized);
                }
            }
        }
        return String.join(",", unique);
    }

    public List<String> normalizeMenusForRole(String role, String csvMenus) {
        if ("admin".equalsIgnoreCase(role)) {
            return new ArrayList<>(ALL_MENUS);
        }

        List<String> parsed = parseCsvPermissions(csvMenus);
        if (parsed.isEmpty()) {
            return new ArrayList<>(DEFAULT_EMPLOYEE_MENUS);
        }

        return parsed.stream()
                .filter(ALL_MENUS::contains)
                .distinct()
                .collect(Collectors.toList());
    }

    public List<String> normalizeFeaturesForRole(String role, String csvFeatures) {
        if ("admin".equalsIgnoreCase(role)) {
            return new ArrayList<>(ALL_FEATURES);
        }

        List<String> parsed = parseCsvPermissions(csvFeatures);
        if (parsed.isEmpty()) {
            return new ArrayList<>(DEFAULT_EMPLOYEE_FEATURES);
        }

        return parsed.stream()
                .filter(ALL_FEATURES::contains)
                .distinct()
                .collect(Collectors.toList());
    }

    public void requireAdmin(AuthenticatedUser user) {
        if (user == null || !user.isAdmin()) {
            throw new AccessDeniedException("Only admin users can perform this action.");
        }
    }

    public void requireMenu(AuthenticatedUser user, String menuKey) {
        if (user == null) {
            throw new AccessDeniedException("Authentication required.");
        }
        if (user.isAdmin()) {
            return;
        }
        if (user.getMenuPermissions() == null || !user.getMenuPermissions().contains(menuKey)) {
            throw new AccessDeniedException("You do not have access to this menu.");
        }
    }

    public void requireFeature(AuthenticatedUser user, String featureKey) {
        if (user == null) {
            throw new AccessDeniedException("Authentication required.");
        }
        if (user.isAdmin()) {
            return;
        }
        if (user.getFeaturePermissions() == null || !user.getFeaturePermissions().contains(featureKey)) {
            throw new AccessDeniedException("You do not have permission for this feature.");
        }
    }
}
