package org.vet.userservice.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatEntryDTO {
    private Integer id;
    private String userMessage;
    private String botResponse;
    private String symptoms;
    private UserDTO approvedBy;
    private PetDTO pet;
    @JsonFormat(pattern = "dd.MM.yyyy HH:mm")
    private LocalDateTime timestamp;
}
