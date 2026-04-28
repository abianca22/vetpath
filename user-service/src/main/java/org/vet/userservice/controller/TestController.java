package org.vet.userservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.loadbalancer.config.LoadBalancerCacheAutoConfiguration;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.vet.userservice.model.dto.UserDTO;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.service.UserService;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class TestController {

    @Autowired
    public UserService userService;

//    @PostMapping("/userdata")
//    public ResponseEntity<?> receiveUserData(@RequestBody Map<String, Object> userinfo,
//                                             @AuthenticationPrincipal Jwt jwt) {
//        System.out.println("Token subject: " + jwt.getSubject());
//        System.out.println("Received userinfo: " + userinfo);
//        var user = userService.getUserByUsername((String) userinfo.get("preferred_username"));
//        if (user == null) {
//            User newUser = new User();
//            newUser.setUsername((String) userinfo.get("preferred_username"));
//            newUser.setEmail((String) userinfo.get("email"));
//            newUser.setKeycloakId(jwt.getSubject());
//            newUser.setRole(userService.getUserByUsername("owneruser").getRole());
//            userService.saveUser(newUser);
//        }
//        return ResponseEntity.ok().build();
//    }
//
//    @GetMapping("/userinfo")
//    public Map<String, Object> getUserInfo(@AuthenticationPrincipal Jwt jwt) {
//        Map<String, Object> result = new HashMap<>();
//        result.put(
//                "username", jwt.getClaimAsString("preferred_username"));
//        result.put(
//                "email", jwt.getClaimAsString("email"));
//        result.put(
//                "roles", jwt.getClaimAsStringList("roles")
//        );
//        System.out.println(result);
//        return result;
//    }

//    @GetMapping("/users/me")
//    public UserDTO getUser(@AuthenticationPrincipal Jwt jwt) {
//        return decodeJWT(jwt);
//    }
//
//    public UserDTO decodeJWT(Jwt jwt) {
//        Set<String> rolesSet = new HashSet<>();
//
//        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
//        if (resourceAccess != null) {
//            Object vetpathObj = resourceAccess.get("vetpath");
//            if (vetpathObj instanceof Map<?, ?> vetpathMap) {
//                Object rolesObj = vetpathMap.get("roles");
//                if (rolesObj instanceof List<?> list) {
//                    rolesSet = list.stream()
//                            .filter(String.class::isInstance)
//                            .map(String.class::cast)
//                            .collect(Collectors.toSet());
//                }
//            }
//        }
//
//        return UserDTO.builder()
//                .id(jwt.getClaimAsString("sub"))
//                .username(jwt.getClaimAsString("preferred_username"))
//                .email(jwt.getClaimAsString("email"))
//                .firstName(jwt.getClaimAsString("given_name"))
//                .lastName(jwt.getClaimAsString("family_name"))
//                .roles(rolesSet)
//                .build();
//    }
}
