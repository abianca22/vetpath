package org.vet.userservice.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

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
