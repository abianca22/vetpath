package org.vet.userservice.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.vet.userservice.model.dto.PetDTO;

import java.util.List;

@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BreedDTO {

    private Integer id;

    @NotBlank(message = "Camp obligatoriu")
    private String name;

    @NotNull(message = "Camp obligatoriu")
    private PetTypeDTO petType;

}
