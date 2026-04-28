package org.vet.userservice.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.vet.userservice.model.enums.AppointmentStatus;

import java.time.LocalDateTime;


@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDTO {

    private Integer id;

    @NotNull(message = "Selectarea medicului veterinar este obligatorie")
    private UserDTO vet;

    @NotNull(message = "Selectarea clinicii este obligatorie")
    private ClinicDTO clinic;

    private PetDTO pet;

    @NotNull(message = "Data si ora programarii sunt obligatorii!")
    @JsonFormat(pattern = "dd.MM.yyyy HH:mm")
    private LocalDateTime slot;

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status;

    private UserDTO cancelledBy;

    private String cancelReason;

    private Boolean done;
}
