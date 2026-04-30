package org.vet.userservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.vet.userservice.exception.AccessDeniedException;
import org.vet.userservice.exception.InvalidDataException;
import org.vet.userservice.model.dto.UserDTO;
import org.vet.userservice.model.entity.Appointment;
import org.vet.userservice.model.entity.Clinic;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.model.enums.AppointmentStatus;
import org.vet.userservice.model.mapper.RoleMapper;
import org.vet.userservice.model.mapper.UserMapper;
import org.vet.userservice.service.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserAdminController {

    private final KeycloakAdminService keycloakAdminService;
    private final UserService userService;
    private final UserMapper userMapper;
    private final RoleService roleService;
    @Autowired
    private RoleMapper roleMapper;
    @Autowired
    private AppointmentService appointmentService;
    @Autowired
    private ClinicService clinicService;

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

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{userId}/check")
    public ResponseEntity<String> checkUserRoles() {
        return ResponseEntity.ok("User endpoint is accessible");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{userId}/change-role")
    public ResponseEntity<UserDTO> changeUserRole(@PathVariable String userId,
                                                  @RequestParam Boolean approved) {
        User user = userService.changeRequestStatus(userService.getUserById(userId), approved);
        UserDTO userDTO = userMapper.toUserDTO(user);
        userDTO.setRoles(user.getRoles().stream().map(r -> roleMapper.toRoleDTO(r)).collect(Collectors.toList()));
        userDTO.setPendingRequest(user.getPendingRequest());
        return ResponseEntity.ok().body(userDTO);
    }


    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{userId}/change-roles")
    public ResponseEntity<Void> changeRole(@PathVariable String userId,
                                                  @RequestParam String group) {
        keycloakAdminService.removeAllGroupsFromUserExcept(userId, group);
        keycloakAdminService.addGroupToUser(userId, group);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{userId}/change-user-role")
    public ResponseEntity<UserDTO> changeUserRole(@PathVariable String userId,
                                           @RequestParam String role) {
        String group = keycloakAdminService.getRoleGroups(role).get(0);
        keycloakAdminService.removeAllGroupsFromUserExcept(userId, group);
        keycloakAdminService.addGroupToUser(userId, group);
        var userRole = roleService.findByName(role);
        var oldUser = userService.getUserById(userId);
        if (userRole.equals(roleService.findByName("PET_OWNER"))) {
            List<Appointment> appointments = appointmentService.getByVet(oldUser);
            for (Appointment appointment : appointments) {
                if (appointment.getStatus().equals(AppointmentStatus.BOOKED)) {
                    throw new InvalidDataException("Nu se poate schimba rolul utilizatorului deoarece are programari rezervate!");
                }
                appointmentService.deleteSlot(appointment.getId());
            }
            List<Clinic> clinics = clinicService.getClinicsByVetEmployee(oldUser);
            for (Clinic clinic : clinics) {
                clinicService.removeVetFromClinic(clinic, oldUser);
            }
        }
        var user = userService.updateUserRole(userService.getUserById(userId), userRole);
        var userDTO = userMapper.toUserDTO(user);
        userDTO.setRoles(user.getRoles().stream().map(r -> roleMapper.toRoleDTO(r)).collect(Collectors.toList()));
        return ResponseEntity.ok().body(userDTO);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/requests")
    public ResponseEntity<List<UserDTO>> getRequests() {
        List<UserDTO> users = userService.getPendingRequests().stream().map(userMapper::toUserDTO).collect(Collectors.toList());
        return ResponseEntity.ok().body(users);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@AuthenticationPrincipal Jwt jwt,  @PathVariable String userId) {
        UserDTO currentUserDTO = decodeJWT(jwt);
        if (currentUserDTO.getRoles().contains("ADMIN") || currentUserDTO.getId().equals(userId)) {
            userService.deleteUser(userId);
            return ResponseEntity.ok().build();
        }
        throw new AccessDeniedException("Nu aveti permisiunea de a sterge acest utilizator!");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/revoke-access/{userId}")
    public ResponseEntity<UserDTO> revokeAccess(@PathVariable String userId) {
        User updatedUser = userService.updateAccessStatus(userService.getUserById(userId), false);
        UserDTO userDTO = userMapper.toUserDTO(updatedUser);
        userDTO.setRoles(updatedUser.getRoles().stream().map(r -> roleMapper.toRoleDTO(r)).collect(Collectors.toList()));
        return ResponseEntity.ok().body(userDTO);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/give-access/{userId}")
    public ResponseEntity<UserDTO> reactivateUser(@PathVariable String userId) {
        User updatedUser = userService.updateAccessStatus(userService.getUserById(userId), true);
        UserDTO userDTO = userMapper.toUserDTO(updatedUser);
        userDTO.setRoles(updatedUser.getRoles().stream().map(r -> roleMapper.toRoleDTO(r)).collect(Collectors.toList()));
        return ResponseEntity.ok().body(userDTO);
    }
}
