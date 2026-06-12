package org.vet.userservice.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import org.vet.userservice.model.dto.appointments.AppointmentDTO;

import java.time.LocalDateTime;

@Data
@Builder
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class NotificationDTO {
    private Integer id;
    private UserDTO receiver;
    private String title;
    private String content;
    private Boolean seen;
    @JsonFormat(pattern = "dd.MM.yyyy HH:mm")
    private LocalDateTime date;
    private AppointmentDTO appointment;
}
