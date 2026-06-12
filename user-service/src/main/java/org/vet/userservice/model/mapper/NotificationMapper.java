package org.vet.userservice.model.mapper;

import org.mapstruct.Mapper;
import org.vet.userservice.model.dto.NotificationDTO;
import org.vet.userservice.model.entity.Notification;

@Mapper(componentModel = "spring", uses={UserMapper.class, AppointmentMapper.class})
public interface NotificationMapper {
    NotificationDTO toNotificationDTO(Notification notification);
    Notification toNotification(NotificationDTO notificationDTO);
}
