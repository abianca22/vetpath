package org.vet.userservice.other;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.vet.userservice.model.dto.UserDTO;
import org.vet.userservice.model.mapper.RoleMapper;
import org.vet.userservice.service.RoleService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class UsefulFunctions {

    @Autowired
    private RoleMapper roleMapper;

    @Autowired
    private RoleService roleService;

    public UserDTO decodeJWT(Jwt jwt) {
        List<String> rolesList = new ArrayList<>();

        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            Object vetpathObj = resourceAccess.get("vetpath");
            if (vetpathObj instanceof Map<?, ?> vetpathMap) {
                Object rolesObj = vetpathMap.get("roles");
                if (rolesObj instanceof List<?> list) {
                    rolesList = list.stream()
                            .filter(String.class::isInstance)
                            .map(String.class::cast)
                            .toList();
                }
            }
        }

        return UserDTO.builder()
                .id(jwt.getClaimAsString("sub"))
                .username(jwt.getClaimAsString("preferred_username"))
                .email(jwt.getClaimAsString("email"))
                .firstName(jwt.getClaimAsString("given_name"))
                .lastName(jwt.getClaimAsString("family_name"))
                .roles(rolesList.stream().map(roleName -> (roleMapper.toRoleDTO(roleService.findByName(roleName)))).collect(Collectors.toList()))
                .build();
    }

    public Boolean isAdmin(UserDTO userDTO) {
        return userDTO.getRoles().stream().anyMatch(role -> role.getName().equals("ADMIN"));
    }

    public Boolean isVet(UserDTO userDTO) {
        return userDTO.getRoles().stream().anyMatch(role -> role.getName().equals("VETERINARIAN"));
    }

    public Boolean isPetOwner(UserDTO userDTO) {
        return userDTO.getRoles().stream().anyMatch(role -> role.getName().equals("PET_OWNER"));
    }

    public DateTimeFormatter dateTimeFormatter() {
        return DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
    }

}
