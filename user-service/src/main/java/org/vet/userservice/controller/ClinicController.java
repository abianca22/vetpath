package org.vet.userservice.controller;

import com.netflix.discovery.converters.Auto;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.vet.userservice.exception.AccessDeniedException;
import org.vet.userservice.model.dto.ClinicDTO;
import org.vet.userservice.model.dto.UserDTO;
import org.vet.userservice.model.entity.Clinic;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.model.mapper.*;
import org.vet.userservice.other.UsefulFunctions;
import org.vet.userservice.service.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clinics")
public class ClinicController {
    @Autowired
    private PetService petService;

    @Autowired
    private PetTypeService petTypeService;

    @Autowired
    private BreedService breedService;

    @Autowired
    private UserService userService;

    @Autowired
    private KeycloakAdminService keycloakAdminService;

    @Autowired
    private PetMapper petMapper;

    @Autowired
    private PetTypeMapper petTypeMapper;

    @Autowired
    private UsefulFunctions usefulFunctions;

    @Autowired
    private BreedMapper breedMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ClinicMapper clinicMapper;

    @Autowired
    private ClinicService clinicService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> addClinic(@RequestBody @Valid ClinicDTO clinicDTO) {
        Clinic clinic = clinicService.addClinic(clinicMapper.toClinic(clinicDTO));
        return ResponseEntity.ok().body(clinicMapper.toClinicDTO(clinic));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getClinic(@PathVariable Integer id) {
        return ResponseEntity.ok().body(clinicMapper.toClinicDTO(clinicService.getClinicById(id)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteClinic(@PathVariable Integer id) {
        clinicService.deleteClinic(clinicService.getClinicById(id));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIAN')")
    public ResponseEntity<?> addVet(@PathVariable Integer id, @RequestParam String username, @RequestParam(value = "add", required = false) Boolean add, @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        User user = userService.getUserByUsername(username);
        if (!usefulFunctions.isAdmin(currentUser)) {
            if (!currentUser.getId().equals(user.getId())) {
                throw new AccessDeniedException((add == null || add) ? "Rol neautorizat pentru asocierea acestui veterinar" : "Rol neautorizat pentru inlaturarea acestui veterinar");
            }
        }
        if (add == null || add) {
            Clinic clinic = clinicService.getClinicById(id);
            return ResponseEntity.ok().body(clinicMapper.toClinicDTO(clinicService.addVetToClinic(clinic, user)));
        }
        else {
            Clinic clinic = clinicService.getClinicById(id);
            return ResponseEntity.ok().body(clinicMapper.toClinicDTO(clinicService.removeVetFromClinic(clinic, user, "Parasire clinica")));
        }
    }

    @GetMapping("/veterinarian/{username}")
    public ResponseEntity<?> getClinicsByVetEmployee(@PathVariable String username) {
        return ResponseEntity.ok().body(clinicService.getClinicsByVetEmployee(userService.getUserByUsername(username)).stream().map(c -> clinicMapper.toClinicDTO(c)).toList());
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllClinics(@RequestParam(value = "name") Optional<String> name, @RequestParam(value = "employee") Optional<String> employee) {
        List<Clinic> clinics = clinicService.getAllClinics();
        if (name.isPresent()) {
            clinics = clinics.stream().filter(clinic -> clinic.getName().toLowerCase().contains(name.get())).collect(Collectors.toList());
        }
        if (employee.isPresent()) {
            clinics = clinics.stream().filter(clinic -> clinic.getVets().stream().anyMatch(vet -> vet.getUsername().toLowerCase().contains(employee.get().toLowerCase())
            || vet.getFirstName().toLowerCase().contains(employee.get().toLowerCase())
            || vet.getLastName().toLowerCase().contains(employee.get().toLowerCase()))).collect(Collectors.toList());
        }
        return ResponseEntity.ok().body(clinics.stream().map(clinic -> clinicMapper.toClinicDTO(clinic)).collect(Collectors.toList()));
    }

    @PutMapping("/update/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateClinic(@PathVariable Integer id, @RequestBody @Valid ClinicDTO clinicDTO) {
        System.out.println(clinicDTO);
        System.out.println(clinicMapper.toClinic(clinicDTO));
        return ResponseEntity.ok().body(clinicMapper.toClinicDTO(clinicService.updateClinic(clinicMapper.toClinic(clinicDTO))));
    }
}
