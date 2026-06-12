package org.vet.userservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.entity.*;
import org.vet.userservice.repository.AppointmentRepository;
import org.vet.userservice.repository.PetRepository;

import java.util.List;

@Service
public class PetService {
    @Autowired
    private PetRepository petRepository;

    public Pet findOwnerPet(String name, Breed breed, User owner) {
        if (petRepository.findAllByNameAndAndBreedAndOwner(name, breed, owner).isEmpty()) {
            throw new NoDataFoundException("Nu a fost gasit niciun animal de companie cu numele " + name + ", rasa " + breed.getName() + " si proprietarul " + owner.getFirstName() + " " + owner.getLastName());
        }
        return petRepository.findAllByNameAndAndBreedAndOwner(name, breed, owner).getFirst();
    }

    public List<Pet> findPetByOwner(User owner) {
        return petRepository.findAllByOwner(owner);
    }

    public List<Pet> filterOwnerPetByName(User owner, String name) {
        return petRepository.findAllByOwnerAndName(owner, name);
    }

    public Pet savePet(Pet pet) {
        return petRepository.save(pet);
    }

    public void deletePet(Pet pet) {
        petRepository.delete(pet);
    }

    public Pet updatePet(Pet pet) {
        Pet oldPet = petRepository.findById(pet.getId()).orElseThrow(() -> new NoDataFoundException("Nu a fost gasit niciun animal de companie cu id-ul " + pet.getId()));
        if (pet.getName() != null && !pet.getName().isEmpty()) {
            oldPet.setName(pet.getName());
        }
        if (pet.getBreed() != null) {
            oldPet.setBreed(pet.getBreed());
        }
        if (pet.getOwner() != null) {
            oldPet.setOwner(pet.getOwner());
        }
        if (pet.getBirthDate() != null) {
            oldPet.setBirthDate(pet.getBirthDate());
        }
        if (pet.getWeight() != null) {
            oldPet.setWeight(pet.getWeight());
        }
        if (pet.getGender() != null) {
            oldPet.setGender(pet.getGender());
        }
        return petRepository.save(oldPet);
    }

    public Pet getPetById(Integer id) {
        return petRepository.findById(id).orElseThrow(() -> new NoDataFoundException("Nu a fost gasit niciun animal de companie cu id-ul " + id));
    }

    public List<Pet> getAllPets() {
        return petRepository.findAll();
    }

    public List<Pet> searchByString(String keyword) {
        return petRepository.findAllByNameContainingIgnoreCase(keyword);
    }
}
