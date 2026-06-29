package org.vet.userservice.model.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.vet.userservice.model.entity.*;
import org.vet.userservice.service.*;

import java.time.LocalDate;

@Component
public class InitializeDB implements CommandLineRunner {

    private final UserService userService;
    private final PetTypeService petTypeService;
    private final BreedService breedService;
    private final PetService petService;
    @Autowired
    private RoleService roleService;
    @Autowired
    private KeycloakAdminService keycloakAdminService;

    public InitializeDB(UserService userService, PetTypeService petTypeService, BreedService breedService, PetService petService) {
        this.userService = userService;
        this.petTypeService = petTypeService;
        this.breedService = breedService;
        this.petService = petService;
    }

    @Override
    public void run(String... args) throws Exception {
        var keycloakRoles = keycloakAdminService.getAllRoles();
        keycloakRoles.forEach(role -> {
            var foundRole = roleService.findByName(role.getName());
            if (foundRole == null) {
                roleService.saveRole(role);
            }
        });

        PetType dog = PetType.builder().name("Câine").build();
        PetType cat = PetType.builder().name("Pisică").build();

        var checkDog = petTypeService.getPetTypeByName(dog.getName());
        if (checkDog == null) {
            petTypeService.savePetType(dog);
        }
        checkDog = petTypeService.getPetTypeByName(dog.getName());

        var checkCat = petTypeService.getPetTypeByName(cat.getName());
        if (checkCat == null) {
            petTypeService.savePetType(cat);
        }
        checkCat = petTypeService.getPetTypeByName(cat.getName());

        Breed maltese = Breed.builder().name("Maltez").petType(checkDog).build();
        Breed siamese = Breed.builder().name("Siameză").petType(checkCat).build();

        var checkMaltese = breedService.getFirstBreedByName(maltese.getName());
        if (checkMaltese == null) {
            breedService.saveBreed(maltese);
        }
        checkMaltese = breedService.getFirstBreedByName(maltese.getName());

        var checkSiamese = breedService.getFirstBreedByName(siamese.getName());
        if (checkSiamese == null) {
            breedService.saveBreed(siamese);
        }
        checkSiamese = breedService.getFirstBreedByName(siamese.getName());

        User admin = userService.getUserByUsername("admin");
        Pet dogIndividual = Pet.builder().name("Buddy").breed(checkMaltese).owner(admin).birthDate(LocalDate.of(2025, 3, 22)).build();
        try {
            var checkAdminDog = petService.findOwnerPet(dogIndividual.getName(), dogIndividual.getBreed(), dogIndividual.getOwner());
        } catch(Exception e) {
            petService.savePet(dogIndividual);
        }
    }
}
