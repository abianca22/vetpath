package org.vet.userservice.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.vet.userservice.model.dto.appointments.AppointmentDTO;

import java.time.LocalDateTime;

@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordDTO {
    @Id
    private Integer id;

    @NotNull(message = "Camp obligatoriu")
    private PetDTO pet;

    private UserDTO vet;

    private String diagnosis;

    private String treatment;

    private String symptoms;

    @JsonFormat(pattern = "dd.MM.yyyy HH:mm")
    private LocalDateTime recordDate;

    @NotNull(message = "Asocierea cu o programare este obligatorie")
    private AppointmentDTO appointment;
}
