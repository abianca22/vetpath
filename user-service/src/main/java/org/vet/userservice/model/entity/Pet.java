package org.vet.userservice.model.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "pets")
@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Pet {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    @NotBlank(message = "Camp obligatoriu")
    @NotNull(message = "Camp obligatoriu")
    private String name;

    @ManyToOne
    @JoinColumn(name = "breed_id")
    @NotNull(message = "Camp obligatoriu")
    private Breed breed;

    @NotNull(message = "Camp obligatoriu. Daca nu cunoasteti data exacta, introduceti una aproximativa")
    private LocalDate birthDate;

    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    private Double weight;

    private String photoUrl;

    @OneToMany(mappedBy = "pet", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonBackReference
    private List<MedicalRecord> medicalRecords;
}
