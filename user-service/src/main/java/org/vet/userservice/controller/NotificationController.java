package org.vet.userservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.vet.userservice.exception.AccessDeniedException;
import org.vet.userservice.model.dto.UserDTO;
import org.vet.userservice.model.entity.Notification;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.model.mapper.NotificationMapper;
import org.vet.userservice.other.UsefulFunctions;
import org.vet.userservice.service.NotificationService;
import org.vet.userservice.service.UserService;

import java.util.List;

@RequestMapping("/api/notifications")
@RestController
public class NotificationController {
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private UsefulFunctions usefulFunctions;
    @Autowired
    private NotificationMapper notificationMapper;
    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<?> getAllNotifications(@AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        List<Notification> notifications = notificationService.findAllByReceiver(userService.getUserById(currentUserDTO.getId()));
        return ResponseEntity.ok().body(notifications.stream().map(notification -> notificationMapper.toNotificationDTO(notification)).toList());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNotification(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        Notification notification = notificationService.findById(id);
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        if (!notification.getReceiver().getId().equals(currentUserDTO.getId())) {
            throw new AccessDeniedException("Utilizatorii pot vizualiza doar propriile notificari.");
        }
        Notification updatedNotification = notificationService.updateSeenField(notification);
        return ResponseEntity.ok().body(notificationMapper.toNotificationDTO(updatedNotification));
    }

    @PutMapping("/all-new")
    public ResponseEntity<?> updateNotifications(@AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        User currentUser = userService.getUserById(currentUserDTO.getId());
        List<Notification> notifications = notificationService.findAllByReceiver(currentUser);
        notifications.forEach(notification -> {
            notificationService.updateSeenField(notification);
        });
        return ResponseEntity.ok().body(notificationService.findAllByReceiver(currentUser).stream().map(notification -> notificationMapper.toNotificationDTO(notification)).toList());
    }
}
