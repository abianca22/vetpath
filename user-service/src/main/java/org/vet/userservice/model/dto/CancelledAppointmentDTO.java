package org.vet.userservice.model.dto;

import lombok.*;


@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelledAppointmentDTO {

        private UserDTO cancelledBy;

        private String cancelReason;

}
