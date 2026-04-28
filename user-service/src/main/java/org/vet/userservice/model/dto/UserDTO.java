package org.vet.userservice.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;
import java.util.Set;

@Setter
@Getter
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {

    private String id;

    @NotBlank(message = "Camp obligatoriu")
    @Email(message = "Adresa de email trebuie să fie validă")
    private String email;

    @NotBlank(message = "Camp obligatoriu")
    @Size(min = 5, max = 20)
    private String username;

    @NotBlank(message = "Camp obligatoriu")
    private String firstName;

    @NotBlank(message = "Camp obligatoriu")
    private String lastName;

//    @NotBlank(message = "Camp obligatoriu")
//    @Pattern(regexp = "^07[0-9]{8}$", message = "Numarul de telefon trebuie să înceapă cu '07' și să conțină 10 cifre în total.")
    private String phoneNumber;

    private List<RoleDTO> roles;

    private String profileUrl;

    private Boolean pendingRequest;

    private Boolean active;
}
