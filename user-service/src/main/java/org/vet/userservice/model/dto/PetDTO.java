package org.vet.userservice.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;


@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PetDTO {

    private Integer id;

    @NotBlank(message = "Camp obligatoriu")
    private String name;

    @NotNull(message = "Camp obligatoriu")
    private BreedDTO breed;

    @JsonFormat(pattern = "dd.MM.yyyy")
    @NotNull(message = "Camp obligatoriu. Daca nu cunoasteti data nasterii, puteti introduce una aproximativa")
    private LocalDate birthDate;

    private Double weight;

    private UserDTO owner;

    private String photoUrl;
}

