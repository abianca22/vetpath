package org.vet.userservice.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.vet.userservice.model.dto.appointments.AppointmentDTO;

@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotDTO {
    private AppointmentDTO appointment;
    @NotNull(message = "Numarul de sloturi este obligatoriu")
    private Integer slotsCount;
}
