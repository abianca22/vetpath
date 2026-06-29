package org.vet.userservice.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cglib.core.Local;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.vet.userservice.exception.AccessDeniedException;
import org.vet.userservice.exception.InvalidDataException;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.dto.BreedDTO;
import org.vet.userservice.model.dto.PetDTO;
import org.vet.userservice.model.dto.PetTypeDTO;
import org.vet.userservice.model.entity.Breed;
import org.vet.userservice.model.entity.Pet;
import org.vet.userservice.model.entity.PetType;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.model.enums.PetGender;
import org.vet.userservice.model.mapper.BreedMapper;
import org.vet.userservice.model.mapper.PetMapper;
import org.vet.userservice.model.mapper.PetTypeMapper;
import org.vet.userservice.other.UsefulFunctions;
import org.vet.userservice.repository.BreedRepository;
import org.vet.userservice.service.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pets")
public class PetController {

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
    private MedicalRecordService medicalRecordService;
    private BreedRepository breedRepository;

    @GetMapping("/user/{username}/{petId}")
    public ResponseEntity<?> getUsersPet(@PathVariable String username, @PathVariable Integer petId) {
            var user = userService.getUserByUsername(username);
            if (user == null) {
                throw new NoDataFoundException("Utilizatorul cu username-ul " + username + " nu a fost gasit");
            }
            var pets = petService.findPetByOwner(user);
            Pet pet = null;
            if (pets != null) {
                pet = pets.stream().filter(p -> p.getId().equals(petId)).findFirst().orElse(null);
            }
            if (pet == null) {
                throw new NoDataFoundException("Nu a fost gasit niciun animal de companie cu id-ul " + petId + " pentru utilizatorul " + user.getFirstName() + " " + user.getLastName());
            }
            PetDTO petDTO = petMapper.toPetDTO(pet);
            return ResponseEntity.ok().body(petDTO);
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<PetDTO>> getUsersPets(@PathVariable String username,
                                                     @RequestParam Optional<String> search) {
        var petSearchString = search.orElse("");
        var user = userService.getUserByUsername(username);
        if (user == null) {
            throw new NoDataFoundException("Utilizatorul cu username-ul " + username + " nu a fost gasit");
        }
        List<Pet> pets = petService.filterOwnerPetByName(user, petSearchString);
        List<PetDTO> petDTOs = pets.stream().map(pet -> petMapper.toPetDTO(pet)).toList();
        return ResponseEntity.ok().body(petDTOs);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'VETERINARIAN')")
    @GetMapping
    public ResponseEntity<?> getPets(@RequestParam(value = "owner") Optional<String> owner,
                                     @RequestParam(value = "name") Optional<String> name,
                                     @RequestParam(value = "breed") Optional<Integer> breedId,
                                     @RequestParam(value = "type") Optional<Integer> typeId) {
        List<Pet> pets = petService.getAllPets();
        if (name.isPresent()) {
            pets = petService.searchByString(name.get());
        }
        if (owner.isPresent()) {
            List<User> owners = userService.searchByString(owner.get());
            pets = pets.stream().filter(pet -> owners.contains(pet.getOwner())).toList();
        }
        if (breedId.isPresent()) {
            pets = pets.stream().filter(pet -> pet.getBreed().getId().equals(breedId.get())).toList();
        }
        if (typeId.isPresent()) {
            pets = pets.stream().filter(pet -> pet.getBreed().getPetType().getId().equals(typeId.get())).toList();
        }
        return ResponseEntity.ok().body(pets.stream().map(pet -> petMapper.toPetDTO(pet)).toList());
    }

    @PostMapping("/add-pet")
    public ResponseEntity<?> addPet(@RequestBody @Valid PetDTO petDTO, @AuthenticationPrincipal Jwt jwt) {
        var userDTO = usefulFunctions.decodeJWT(jwt);
        var user = userService.getUserByUsername(userDTO.getUsername());
        System.out.println(petDTO);
        if (user == null) {
            throw new NoDataFoundException("Utilizatorul cu username-ul " + userDTO.getUsername() + " nu a fost gasit");
        }
        var breed = breedService.getBreedById(petDTO.getBreed().getId());
        if (breed == null) {
            throw new InvalidDataException("Campul \"Rasa\" este obligatoriu");
        }
        var dateOfBirth = petDTO.getBirthDate();
        if (dateOfBirth == null) {
            throw new InvalidDataException("Campul \"Data nasterii\" este obligatoriu");
        }
        if (dateOfBirth.isAfter(LocalDate.now())) {
            throw new InvalidDataException("Data nasterii nu poate fi in viitor!");
        }
        var existingPet = petService.filterOwnerPetByName(user, petDTO.getName()).stream().findFirst();
        if (existingPet.isPresent() && existingPet.get().getName().equals(petDTO.getName()) && existingPet.get().getBreed().getId().equals(breed.getId()) && existingPet.get().getBirthDate().equals(petDTO.getBirthDate())) {
            throw new InvalidDataException("Nu puteti avea doua animale de aceeasi rasa, cu acelasi nume si aceeasi data a nasterii!");
        }
        if (petDTO.getGender() == null) {
            petDTO.setGender(PetGender.NONE);
        }
        Pet pet = Pet.builder()
                .name(petDTO.getName())
                .birthDate(petDTO.getBirthDate())
                .breed(breed)
                .owner(user)
                .weight(petDTO.getWeight())
                .gender(petDTO.getGender())
                .build();
        Pet savedPet = petService.savePet(pet);
        return ResponseEntity.ok().body(petMapper.toPetDTO(savedPet));
    }

    @GetMapping("/types")
    public ResponseEntity<List<PetTypeDTO>> getPetTypes() {
        List<PetType> petTypes = petTypeService.getAllPetTypes();
        List<PetTypeDTO> petTypeDTOs = petTypes.stream().map(pt -> petTypeMapper.toPetTypeDTO(pt)).toList();
        return ResponseEntity.ok().body(petTypeDTOs);
    }

    @GetMapping("/breeds")
    public ResponseEntity<List<BreedDTO>> getBreeds() {
        List<Breed> breeds = breedService.getAllBreeds();
        List<BreedDTO> breedDTOs = breeds.stream().map(b -> breedMapper.toBreedDTO(b)).toList();
        return ResponseEntity.ok().body(breedDTOs);
    }

    @GetMapping("/types/{petTypeId}/breeds")
    public ResponseEntity<List<BreedDTO>> getBreedsByPetType(@PathVariable Integer petTypeId) {
        var petType = petTypeService.getPetTypeById(petTypeId);
        if (petType == null) {
           throw new NoDataFoundException("Nu a fost gasit niciun tip cu id-ul " + petTypeId);
        }
        List<Breed> breeds = petType.getBreeds();
        List<BreedDTO> breedDTOs = breeds.stream().map(b -> breedMapper.toBreedDTO(b)).toList();
        return ResponseEntity.ok().body(breedDTOs);
    }

    @PutMapping("/{petId}")
    public ResponseEntity<?> updatePet(@PathVariable Integer petId, @RequestBody @Valid PetDTO petDTO, @AuthenticationPrincipal Jwt jwt) {
        var userDTO = usefulFunctions.decodeJWT(jwt);
        var user = userService.getUserByUsername(userDTO.getUsername());
        if (user == null) {
            throw new NoDataFoundException("Utilizatorul cu username-ul " + userDTO.getUsername() + " nu a fost gasit");
        }
        var pets = petService.findPetByOwner(user);
        Pet pet = petService.getPetById(petId);
        if (!pet.getOwner().getId().equals(user.getId()) && !usefulFunctions.isAdmin(userDTO)) {
            throw new AccessDeniedException("Nu aveti permisiunea de a edita acest animal de companie!");
        }
        var dateOfBirth = petDTO.getBirthDate();
        if (dateOfBirth == null || dateOfBirth.isAfter(LocalDate.now())) {
            throw new InvalidDataException("Campul \"Data nasterii\" este invalid");
        }
        Pet updatedPet = petService.updatePet(petMapper.toPet(petDTO));
        return ResponseEntity.ok().body(petMapper.toPetDTO(updatedPet));
    }

    @DeleteMapping("/{petId}")
    public ResponseEntity<Void> deletePet(@PathVariable Integer petId, @AuthenticationPrincipal Jwt jwt) {
        var userDTO = usefulFunctions.decodeJWT(jwt);
        var user = userService.getUserByUsername(userDTO.getUsername());
        if (user == null) {
            throw new NoDataFoundException("Utilizatorul cu username-ul " + userDTO.getUsername() + " nu a fost gasit");
        }
        var pets = petService.findPetByOwner(user);
        Pet pet = null;
        if (pets != null) {
            pet = pets.stream().filter(p -> p.getId().equals(petId)).findFirst().orElse(null);
        }
        if (pet == null) {
            throw new NoDataFoundException("Nu a fost gasit niciun animal de companie cu id-ul " + petId + " pentru utilizatorul " + user.getFirstName() + " " + user.getLastName());
        }
        if (!pet.getOwner().getId().equals(user.getId()) && !usefulFunctions.isAdmin(userDTO)) {
            throw new AccessDeniedException("Nu aveti permisiunea de a sterge acest animal de companie!");
        }

        medicalRecordService.deletePet(pet, userService.getUserById(userDTO.getId()));
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/add-pet-type")
    public ResponseEntity<PetTypeDTO> addPetType(@RequestBody @Valid PetTypeDTO petTypeDTO) {
        List<PetType> petTypes = petTypeService.getAllPetTypes();
        if (petTypes.stream().anyMatch(pt -> pt.getName().equalsIgnoreCase(petTypeDTO.getName()))) {
            throw new InvalidDataException("Exista deja un tip de animal cu acest nume!");
        }
        PetType petType = PetType.builder()
                .name(petTypeDTO.getName())
                .build();
        PetType savedPetType = petTypeService.savePetType(petType);
        return ResponseEntity.ok().body(petTypeMapper.toPetTypeDTO(savedPetType));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/types/{petTypeId}")
    public ResponseEntity<?> deletePetType(@PathVariable Integer petTypeId) {
        var petType = petTypeService.getPetTypeById(petTypeId);
        if (petType == null) {
            throw new NoDataFoundException("Nu a fost gasit niciun tip de animal cu id-ul " + petTypeId);
        }
        if (!petType.getBreeds().isEmpty() && petType.getBreeds().stream().anyMatch(breed -> !breed.getPets().isEmpty())) {
            throw new InvalidDataException("Aceasta specie nu se poate sterge, deoarece rasele subordonate au animale asociate");
        }
        petTypeService.deletePetType(petType);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/types/{petTypeId}")
    public ResponseEntity<?> updatePetType(@PathVariable Integer petTypeId, @RequestBody @Valid PetTypeDTO petTypeDTO) {
        var petType = petTypeService.getPetTypeById(petTypeId);
        if (petType == null) {
            throw new NoDataFoundException("Nu a fost gasit niciun tip de animal cu id-ul " + petTypeId);
        }
        petType.setName(petTypeDTO.getName());
        PetType updatedPetType = petTypeService.savePetType(petType);
        return ResponseEntity.ok().body(petTypeMapper.toPetTypeDTO(updatedPetType));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/add-breed")
    public ResponseEntity<?> addBreed(@RequestBody @Valid BreedDTO breedDTO) {
        var breeds = breedService.getAllBreeds();
        if (breeds.stream().anyMatch(b -> b.getName().equalsIgnoreCase(breedDTO.getName()))) {
            throw new InvalidDataException("Exista deja o rasa cu acest nume!");
        }
        Breed newBreed = breedMapper.toBreed(breedDTO);
        breedService.saveBreed(newBreed);
        Breed savedBreed = breedService.getFirstBreedByName(newBreed.getName());
        return ResponseEntity.ok().body(breedMapper.toBreedDTO(savedBreed));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/breeds/{breedId}")
    public ResponseEntity<?> deleteBreed(@PathVariable Integer breedId) {
        var breed = breedService.getBreedById(breedId);
        if (breed == null) {
            throw new NoDataFoundException("Nu a fost gasita nicio rasa cu id-ul " + breedId);
        }
        if (!breed.getPets().isEmpty()) {
            throw new InvalidDataException("Aceasta rasa nu poate fi stearsa, deoarece are animale asociate");
        }
        breedService.deleteBreed(breed);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/breeds/{breedId}")
    public ResponseEntity<?> updateBreed(@PathVariable Integer breedId, @RequestBody @Valid BreedDTO breedDTO) {
        var breed = breedService.getBreedById(breedId);
        if (breed == null) {
            throw new NoDataFoundException("Nu a fost gasita nicio rasa cu id-ul " + breedId);
        }
        breed.setName(breedDTO.getName());
        breed.setPetType(petTypeService.getPetTypeById(breedDTO.getPetType().getId()));
        Breed updatedBreed = breedService.saveBreed(breed);
        return ResponseEntity.ok().body(breedMapper.toBreedDTO(updatedBreed));
    }
}
