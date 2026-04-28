package org.vet.userservice.service;

import org.springframework.stereotype.Service;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.entity.Role;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.repository.UserRepository;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class UserService {
    private UserRepository userRepository;
    private KeycloakAdminService keycloakAdminService;

    public UserService(UserRepository userRepository, KeycloakAdminService keycloakAdminService) {
        this.userRepository = userRepository;
        this.keycloakAdminService = keycloakAdminService;
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public User getUserById(String id) throws NoDataFoundException {
        return userRepository.findById(id).orElseThrow(() -> new NoDataFoundException("Utilizatorul cu id-ul " + id + " nu a fost gasit"));
    }

    public User getUserByUsername(String username) throws NoDataFoundException {
        return userRepository.findAll()
                .stream()
                .filter(user -> user.getUsername().equals(username))
                .findFirst()
                .orElseThrow(() -> new NoDataFoundException("Utilizatorul cu username-ul " + username + " nu a fost gasit"));
    }

    public User changeRequestStatus(User user, Boolean approved) {
        if (approved) {
            keycloakAdminService.removeAllGroupsFromUserExcept(user.getId(), "vets");
            keycloakAdminService.addGroupToUser(user.getId(), "vets");
            user.setRoles(keycloakAdminService.getUserRoles("vets"));
            user.setPendingRequest(false);
        } else {
            user.setPendingRequest(false);
        }
        return userRepository.save(user);
    }

    public User requestRoleChange(User user) {
        user.setPendingRequest(true);
        return userRepository.save(user);
    }

    public List<User> getPendingRequests() {
        return userRepository.getUsersByPendingRequest(true);
    }

    public User updateAccessStatus(User user, boolean active) {
        user.setActive(active);
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void deleteUser(String userId) {
        userRepository.deleteById(userId);
        keycloakAdminService.deleteUser(userId);
    }

    public User updateUser(User currentUser, User user) {
        if (user.getUsername() != null && !user.getUsername().isEmpty() && (currentUser.getUsername() == null || !currentUser.getUsername().equals(user.getUsername()))) {
            currentUser.setUsername(user.getUsername());
        }
        if (user.getEmail() != null && !user.getEmail().isEmpty() && (currentUser.getEmail() == null || !currentUser.getEmail().equals(user.getEmail()))) {
            currentUser.setEmail(user.getEmail());
        }
        if (user.getPhoneNumber() != null && !user.getPhoneNumber().isEmpty() && (currentUser.getPhoneNumber() == null || !currentUser.getPhoneNumber().equals(user.getPhoneNumber()))) {
            currentUser.setPhoneNumber(user.getPhoneNumber());
        }
        if (user.getFirstName() != null && !user.getFirstName().isEmpty() && (currentUser.getFirstName() == null || !currentUser.getFirstName().equals(user.getFirstName()))) {
            currentUser.setFirstName(user.getFirstName());
        }
        if (user.getLastName() != null && !user.getLastName().isEmpty() && (currentUser.getLastName() == null || !currentUser.getLastName().equals(user.getLastName()))) {
            currentUser.setLastName(user.getLastName());
        }
        keycloakAdminService.updateUser(currentUser.getId(), currentUser);
        return userRepository.save(currentUser);
    }

    public User updateUserRole(User user, Role newRole) {
        List<Role> roles = new ArrayList<>();
        roles.add(newRole);
        user.setRoles(roles);
        user.setPendingRequest(false);
        return userRepository.save(user);
    }
}
