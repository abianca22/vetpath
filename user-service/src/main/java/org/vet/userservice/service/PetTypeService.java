package org.vet.userservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.entity.PetType;
import org.vet.userservice.repository.PetTypeRepository;

import java.util.List;

@Service
public class PetTypeService {

    @Autowired
    private PetTypeRepository petTypeRepository;

    public PetType getPetTypeById(Integer id) {
        return petTypeRepository.getPetTypeById(id).orElseThrow(() -> new NoDataFoundException("Tipul de animal cu id-ul " + id + " nu a fost gasit"));
    }

    public PetType getPetTypeByName(String name) {
        return petTypeRepository.getPetTypeByName(name).orElseThrow(() -> new NoDataFoundException("Tipul de animal cu numele " + name + " nu a fost gasit"));
    }

    public PetType savePetType(PetType petType) {
        return petTypeRepository.save(petType);
    }

    public List<PetType> getAllPetTypes() {
        return petTypeRepository.findAll();
    }

    public void deletePetType(PetType petType) {
        petTypeRepository.delete(petType);
    }
}
