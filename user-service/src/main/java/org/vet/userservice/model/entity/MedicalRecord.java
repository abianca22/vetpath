package org.vet.userservice.model.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "medical_records")
@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "pet_id", nullable = false)
    @JsonManagedReference
    @NotNull(message = "Camp obligatoriu")
    private Pet pet;

    @ManyToOne
    @JoinColumn(name = "vet_id")
    private User vet;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    private String treatment;

    private String symptoms;

    @NotNull(message = "Data si ora la care a fost intocmita fisa sunt obligatorii!")
    private LocalDateTime recordDate;

    @OneToOne
    @JoinColumn(name = "appointment_id")
    @JsonManagedReference
    private Appointment appointment;

    @OneToOne(mappedBy = "medicalRecord")
    @JsonBackReference
    private ChatEntry chatEntry;
}
