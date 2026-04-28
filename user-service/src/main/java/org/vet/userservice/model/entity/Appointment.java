package org.vet.userservice.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.mapstruct.EnumMapping;
import org.vet.userservice.model.enums.AppointmentStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "vetId")
    private User vet;

    @ManyToOne
    @JoinColumn(name = "clinicId")
    private Clinic clinic;

    @ManyToOne
    @JoinColumn(name = "petId")
    private Pet pet;

    @NotNull(message = "Data si ora programarii sunt obligatorii!")
    private LocalDateTime slot;

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status;

    @ManyToOne
    @JoinColumn(name = "cancelledBy")
    private User cancelledBy;

    private String cancelReason;

    private Boolean done = false;
}
