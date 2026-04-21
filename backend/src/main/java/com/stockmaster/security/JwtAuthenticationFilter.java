package com.stockmaster.security;

import com.stockmaster.model.Employee;
import com.stockmaster.model.User;
import com.stockmaster.repository.EmployeeRepository;
import com.stockmaster.repository.UserRepository;
import com.stockmaster.service.PermissionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PermissionService permissionService;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider,
                                   UserRepository userRepository,
                                   EmployeeRepository employeeRepository,
                                   PermissionService permissionService) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.permissionService = permissionService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = getTokenFromRequest(request);

        if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
            Long userId = tokenProvider.getUserIdFromToken(token);
            String role = tokenProvider.getRoleFromToken(token);
            String principalType = tokenProvider.getPrincipalTypeFromToken(token);

            AuthenticatedUser principal = resolvePrincipal(userId, role, principalType);
            if (principal != null) {
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_" + principal.getRole().toUpperCase()));
                for (String menu : principal.getMenuPermissions()) {
                    authorities.add(new SimpleGrantedAuthority("MENU_" + menu.toUpperCase()));
                }
                for (String feature : principal.getFeaturePermissions()) {
                    authorities.add(new SimpleGrantedAuthority("FEATURE_" + feature.toUpperCase().replace(".", "_")));
                }

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private AuthenticatedUser resolvePrincipal(Long userId, String role, String principalType) {
        if ("employee".equalsIgnoreCase(principalType)) {
            Optional<Employee> employeeOpt = employeeRepository.findById(userId);
            if (employeeOpt.isEmpty()) {
                return null;
            }

            Employee employee = employeeOpt.get();
            String resolvedRole = normalizeRole(employee.getRole(), role);
            List<String> menus = permissionService.normalizeMenusForRole(resolvedRole, employee.getMenuPermissions());
            List<String> features = permissionService.normalizeFeaturesForRole(resolvedRole, employee.getFeaturePermissions());

            return AuthenticatedUser.builder()
                    .id(employee.getId())
                    .principalType("employee")
                    .username(employee.getName())
                    .email(employee.getEmail())
                    .shopName(employee.getShopName())
                    .role(resolvedRole)
                    .menuPermissions(menus)
                    .featurePermissions(features)
                    .build();
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }

        String resolvedRole = normalizeRole(user.getRole(), role);
        List<String> menus = permissionService.normalizeMenusForRole(resolvedRole, "");
        List<String> features = permissionService.normalizeFeaturesForRole(resolvedRole, "");

        return AuthenticatedUser.builder()
                .id(user.getId())
                .principalType("user")
                .username(user.getUsername())
                .email(user.getEmail())
                .shopName(user.getShopName())
                .role(resolvedRole)
                .menuPermissions(menus)
                .featurePermissions(features)
                .build();
    }

    private String normalizeRole(String preferredRole, String tokenRole) {
        if (preferredRole != null && !preferredRole.trim().isEmpty()) {
            return preferredRole.trim().toLowerCase();
        }
        if (tokenRole != null && !tokenRole.trim().isEmpty()) {
            return tokenRole.trim().toLowerCase();
        }
        return "employee";
    }
}
