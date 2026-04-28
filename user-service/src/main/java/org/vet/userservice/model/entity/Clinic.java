package org.vet.userservice.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "clinics")
@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Clinic {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    @NotBlank(message = "Camp obligatoriu")
    @NotNull(message = "Camp obligatoriu")
    private String name;

    @Column(nullable = false)
    @NotNull(message = "Camp obligatoriu")
    @NotBlank(message = "Camp obligatoriu")
    private String address;

    @Column(nullable = false)
    @NotBlank(message = "Camp obligatoriu")
    @Pattern(regexp = "^07[0-9]{8}$", message = "Numarul de telefon trebuie să înceapă cu '07' și să conțină 10 cifre în total.")
    private String phoneNumber;

    @ManyToMany
    private List<User> vets;

}
