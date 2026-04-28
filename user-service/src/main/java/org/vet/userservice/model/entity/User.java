package org.vet.userservice.model.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.vet.userservice.model.dto.RoleDTO;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String username;

    private String firstName;

    private String lastName;

    private String phoneNumber;

    private Instant createdAt = Instant.now();

    @ManyToMany(fetch = FetchType.EAGER)
    private List<Role> roles;

    private Boolean pendingRequest = false;

    private Boolean active = true;

    private String profileUrl;

    @ManyToMany(mappedBy = "vets")
    private List<Clinic> clinics;
}
