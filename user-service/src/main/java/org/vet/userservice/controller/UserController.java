package org.vet.userservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.vet.userservice.exception.AccessDeniedException;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.dto.UserDTO;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.model.mapper.RoleMapper;
import org.vet.userservice.model.mapper.UserMapper;
import org.vet.userservice.service.KeycloakAdminService;
import org.vet.userservice.service.RoleService;
import org.vet.userservice.service.UserService;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final KeycloakAdminService keycloakAdminService;

    private final UserService userService;

    private final UserMapper userMapper;
    private final RoleService roleService;

    @Autowired
    private RoleMapper roleMapper;

    @GetMapping("/users/me")
    public UserDTO getUser(@AuthenticationPrincipal Jwt jwt) {
        UserDTO user = decodeJWT(jwt);
        User existingUser = null;
        try {
            existingUser = userService.getUserById(user.getId());
        }
        catch (NoDataFoundException e) {
            System.out.println("User not found in database, creating new user...");
            User newUser = User.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .roles(user.getRoles().stream().map(r -> roleService.findByName(r.getName())).collect(Collectors.toList()))
                    .phoneNumber(user.getPhoneNumber())
                    .pendingRequest(false)
                    .active(true)
                    .createdAt(new Date().toInstant())
                    .build();
            userService.saveUser(newUser);
        }
        User foundUser = userService.getUserByUsername(user.getUsername());
        var roles = foundUser.getRoles();
        if (roles == null || roles.isEmpty() || checkRoles(foundUser, user)) {
            roles = user.getRoles().stream().map(r -> roleService.findByName(r.getName())).collect(Collectors.toList());
            foundUser.setRoles(roles);
            System.out.println(foundUser);
            userService.saveUser(foundUser);
        }
        UserDTO existingUserDTO = userMapper.toUserDTO(foundUser);
        System.out.println(existingUserDTO);
        return existingUserDTO;
    }


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

    @PreAuthorize("hasRole('PET_OWNER')")
    @PutMapping("/{userId}/request-role-change")
    public ResponseEntity<UserDTO> changeUserRole(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        User user = userService.requestRoleChange(userService.getUserById(userId));
        UserDTO userDTO = userMapper.toUserDTO(user);
        userDTO.setRoles(user.getRoles().stream().map(r -> roleMapper.toRoleDTO(r)).collect(Collectors.toList()));
        userDTO.setPendingRequest(user.getPendingRequest());
        return ResponseEntity.ok().body(userDTO);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIAN')")
    @GetMapping("/{userId}")
    public ResponseEntity<UserDTO> getUser(@PathVariable String userId) {
        System.out.println("Received request to get user with ID: " + userId);
        User user = userService.getUserById(userId);
        System.out.println("User found: " + user);
        if (user == null) {
            throw new NoDataFoundException("Utilizatorul cu id-ul " + userId + " nu a fost gasit!");
        }
        UserDTO userDTO = userMapper.toUserDTO(user);
        userDTO.setRoles(user.getRoles().stream().map(r -> roleMapper.toRoleDTO(r)).collect(Collectors.toList()));
        return ResponseEntity.ok().body(userDTO);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIAN')")
    @GetMapping("/all")
    public ResponseEntity<List<UserDTO>> getUsers() {
        List<User> users = userService.getAllUsers();
        List<UserDTO> userDTOs = users.stream()
                .map(userMapper::toUserDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok().body(userDTOs);
    }

    @GetMapping("/veterinarian/{userId}")
    public ResponseEntity<UserDTO> getVeterinarian(@PathVariable String userId) {
        User user = userService.getUserById(userId);
        if (user == null) {
            throw new NoDataFoundException("Utilizatorul cu id-ul " + userId + " nu a fost gasit!");
        }
        if(!user.getRoles().contains(roleService.findByName("VETERINARIAN"))) {
            throw new AccessDeniedException("Utilizator invalid!");
        }
        UserDTO userDTO = userMapper.toUserDTO(user);
        userDTO.setRoles(user.getRoles().stream().map(r -> roleMapper.toRoleDTO(r)).collect(Collectors.toList()));
        return ResponseEntity.ok().body(userDTO);
    }

    @GetMapping("/admin-vet")
    public ResponseEntity<List<UserDTO>> getVeterinariansAndAdmins() {
        List<User> users = userService.getAllUsers();
        List<UserDTO> vets = users.stream()
                .filter(user -> (user.getRoles().contains(roleService.findByName("VETERINARIAN")) || user.getRoles().contains(roleService.findByName("ADMIN"))))
                .map(userMapper::toUserDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok().body(vets);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIAN', 'PET_OWNER')")
    @PutMapping("/update-personal-info")
    public ResponseEntity<UserDTO> updatePersonalInfo(@AuthenticationPrincipal Jwt jwt, @RequestBody @Valid UserDTO userDTO) {
        System.out.println("userDTO: " + userDTO);
        UserDTO currentUserDTO = decodeJWT(jwt);
        if (!currentUserDTO.getId().equals(userDTO.getId())) {
            throw new AccessDeniedException("Acces interzis: utilizatorul nu este proprietarul contului!");
        }
        User data = userMapper.toUser(userDTO);
        User currentUser = userService.getUserById(currentUserDTO.getId());
        User updatedUser = userService.updateUser(currentUser, data);
        UserDTO updatedUserDTO = userMapper.toUserDTO(updatedUser);
        updatedUserDTO.setRoles(updatedUser.getRoles().stream().map(r -> roleMapper.toRoleDTO(r)).collect(Collectors.toList()));
        return ResponseEntity.ok().body(updatedUserDTO);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIAN', 'PET_OWNER')")
    @GetMapping("/user/{username}")
    public ResponseEntity<UserDTO> getUserByUsername(@PathVariable String username, @AuthenticationPrincipal Jwt jwt) {
        User user = userService.getUserByUsername(username);
        User currentUser = userService.getUserById(decodeJWT(jwt).getId());
        if (currentUser.getRoles().contains(roleService.findByName("PET_OWNER"))) {
            if (!user.getRoles().contains(roleService.findByName("VETERINARIAN")) && !user.getRoles().contains(roleService.findByName("ADMIN")) && !user.getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Clientii pot vizualiza doar profilele membrilor personalului platformei!");
            }
        }
        if (user == null) {
            throw new NoDataFoundException("Utilizatorul cu username-ul " + username + " nu a fost gasit");
        }
        UserDTO userDTO = userMapper.toUserDTO(user);
        userDTO.setRoles(user.getRoles().stream().map(r -> roleMapper.toRoleDTO(r)).collect(Collectors.toList()));
        return ResponseEntity.ok().body(userDTO);
    }

    private Boolean checkRoles(User dbUser, UserDTO dtoUser) {
        var ok1 = false;
        var ok2 = false;
        for (var role: dtoUser.getRoles()) {
            for (var userRole: dbUser.getRoles()) {
                if (role.getName().equals(userRole.getName())) {
                    ok1 = true;
                }
            }
        }
        for (var userRole: dbUser.getRoles()) {
            for (var role: dtoUser.getRoles()) {
                if (role.getName().equals(userRole.getName())) {
                    ok2 = true;
                }
            }
        }
        return !ok1 || !ok2;
    }
//    @GetMapping("/roles/{groupName}")
//    public ResponseEntity<Set<String>> getGroupRoles(@PathVariable String groupName) {
//        Set<String> roles = keycloakAdminService.getUserRoles(groupName);
//        return ResponseEntity.ok(roles);
//    }

}
