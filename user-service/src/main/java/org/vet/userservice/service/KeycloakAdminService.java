package org.vet.userservice.service;

import jakarta.ws.rs.NotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.vet.userservice.model.entity.Role;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.repository.RoleRepository;
import org.vet.userservice.repository.UserRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class KeycloakAdminService {

    @Value("${keycloak.url}")
    private String keycloakUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;  // admin-cli
    @Value("${keycloak.username}")
    private String username;
    @Value("${keycloak.password}")
    private String password;
    @Value("${keycloak.custom-client-name}")
    private String customClientName; // vetpath

    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    private UserRepository userRepository;
    private UserService userService;
    @Autowired
    private RoleRepository roleRepository;

    private String getAdminToken() {
        String url = keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "password");
        map.add("client_id", clientId);
        map.add("username", username);
        map.add("password", password);

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(map, headers);
        Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
        return (String) response.get("access_token");
    }

    private String getClientIdByClientName(String clientName, String token) {
        String url = keycloakUrl + "/admin/realms/" + realm + "/clients?clientId=" + clientName;
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
        List<Map<String, Object>> clients = response.getBody();

        if (clients == null || clients.isEmpty()) {
            throw new RuntimeException("Client not found: " + clientName);
        }
        return (String) clients.get(0).get("id"); // Keycloak internal client UUID
    }

    public String getGroupIdByGroupName(String groupName, String token) {
        String url = keycloakUrl + "/admin/realms/" + realm + "/groups?search=" + groupName;
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
        List<Map<String, Object>> groups = response.getBody();

        if (groups == null || groups.isEmpty()) {
            throw new RuntimeException("Group not found: " + groupName);
        }
        return (String) groups.get(0).get("id"); // Keycloak internal group UUID
    }


    public List<Role> getUserRoles(String groupName) {
        String token = getAdminToken();
        String groupId = getGroupIdByGroupName(groupName, token);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String url = keycloakUrl + "/admin/realms/" + realm + "/groups/" + groupId + "/role-mappings/clients/" + getClientIdByClientName(customClientName, token);
        ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
        List<Map<String, Object>> roles = response.getBody();

        if (roles == null || roles.isEmpty()) {
            return new ArrayList<>(); // nu are grupuri, deci nici roluri
        }

        return roles.stream()
                .map(group ->  roleRepository.findById(
                        (String) group.get("id")
                ).orElse(null
                ))
                .collect(Collectors.toCollection(ArrayList::new));
    }


    public void addGroupToUser(String userId, String groupName) {
        String token = getAdminToken();
        String groupId = getGroupIdByGroupName(groupName, token);
        String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId + "/groups/" + groupId;
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        restTemplate.put(url, entity);
    }

//    public void removeGroupFromUser(String userId, String groupName) {
//        String token = getAdminToken();
//
//        String groupId = getGroupIdByGroupName(groupName, token);
//
//        String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId + "/groups/" + groupId;
//        HttpHeaders headers = new HttpHeaders();
//        headers.setBearerAuth(token);
//        HttpEntity<Void> entity = new HttpEntity<>(headers);
//        restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);
//    }

    public void removeAllGroupsFromUserExcept(String userId, String groupToKeep) {
        String token = getAdminToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId + "/groups";
        ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
        List<Map<String, Object>> assignedGroups = response.getBody();

        if (assignedGroups == null || assignedGroups.isEmpty()) {
            return; // nu are grupuri
        }

        for (Map<String, Object> group : assignedGroups) {
            String groupName = (String) group.get("name");
            if (!groupName.equals(groupToKeep)) {
                String groupId = (String) group.get("id");
                String deleteUrl = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId + "/groups/" + groupId;
                restTemplate.exchange(deleteUrl, HttpMethod.DELETE, entity, Void.class);
            }
        }
    }

    public void deleteUser(String userId) {
        String token = getAdminToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId;
        restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);

    }

    public void updateUser(String userId, User user) {
        String token = getAdminToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId;
        Map<String, Object> updateData = new HashMap<>();
        updateData.put("email", user.getEmail());
        updateData.put("firstName", user.getFirstName());
        updateData.put("lastName", user.getLastName());
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(updateData, headers);
        restTemplate.exchange(url, HttpMethod.PUT, entity, Void.class);
    }

    public List<String> getRoleGroups(String role) {
        String token = getAdminToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        String clientUUID = getClientIdByClientName(customClientName, token);
        String url = keycloakUrl + "/admin/realms/" + realm + "/clients/" + clientUUID + "/roles/" + role + "/groups";
        ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), List.class);
        List<Map<String, Object>> groups = response.getBody();
        return groups.stream().map(group -> (String) group.get("name")).toList();
    }

    public User getCurrentUser(String userId) {
        String token = getAdminToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String url = keycloakUrl + "/admin/realms/" + realm + "/users/" + userId;
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
        Map<String, Object> userData = response.getBody();

        if (userData == null) {
            throw new NotFoundException("KC: Utilizatorul cu id-ul " + userId + " nu a fost gasit");
        }

        User user = new User();
        user.setId((String) userData.get("id"));
        user.setUsername((String) userData.get("username"));
        user.setEmail((String) userData.get("email"));
        user.setFirstName((String) userData.get("firstName"));
        user.setLastName((String) userData.get("lastName"));
        return user;
    }

    public List<Role> getAllRoles() {
        String token = getAdminToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String clientUUID = getClientIdByClientName(customClientName, token);
        String url = keycloakUrl + "/admin/realms/" + realm + "/clients/" + clientUUID + "/roles";
        ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
        List<Map<String, Object>> rolesData = response.getBody();

        if (rolesData == null) {
            return Collections.emptyList();
        }

        return rolesData.stream()
                .map(roleData -> {
                    Role role = new Role();
                    role.setId((String) roleData.get("id"));
                    role.setName((String) roleData.get("name"));
                    return role;
                })
                .toList();
    }
}

