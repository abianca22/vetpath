package org.vet.userservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.entity.Breed;
import org.vet.userservice.repository.BreedRepository;

import java.util.List;

@Service
public class BreedService {
    @Autowired
    private BreedRepository breedRepository;

    public Breed getBreedById(Integer id) {
        return breedRepository.getBreedById(id).orElseThrow(() -> new NoDataFoundException("Rasa cu id-ul " + id + " nu a fost gasita"));
    }

    public Breed getFirstBreedByName(String name) {
        if (breedRepository.findAllByName(name).isEmpty()) {
            throw new NoDataFoundException("Rasa cu numele " + name + " nu a fost gasita");
        }
        return breedRepository.findAllByName(name).getFirst();
    }

    public Breed saveBreed(Breed breed) {
        return breedRepository.save(breed);
    }

    public List<Breed> getAllBreeds() {
        return breedRepository.findAll();
    }

    public void deleteBreed(Breed breed) {
        breedRepository.delete(breed);
    }
}
