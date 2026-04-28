package org.vet.userservice.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;


@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PetTypeDTO {

    private Integer id;

    @NotBlank(message = "Camp obligatoriu")
    @NotNull(message = "Camp obligatoriu")
    private String name;

}
