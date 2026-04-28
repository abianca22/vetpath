package org.vet.userservice.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicDTO {

    private Integer id;

    @NotBlank(message = "Camp obligatoriu")
    private String name;

    @NotNull(message = "Camp obligatoriu")
    @NotBlank(message = "Camp obligatoriu")
    private String address;

    @NotBlank(message = "Camp obligatoriu")
    @Pattern(regexp = "^07[0-9]{8}$", message = "Numarul de telefon trebuie să înceapă cu '07' și să conțină 10 cifre în total.")
    private String phoneNumber;

    private List<UserDTO> vets;
}
