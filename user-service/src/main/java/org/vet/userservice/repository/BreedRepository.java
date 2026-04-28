package org.vet.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.vet.userservice.model.entity.Breed;

import java.util.List;
import java.util.Optional;

public interface BreedRepository extends JpaRepository<Breed, Integer> {
    Optional<Breed> getBreedById(Integer id);

    List<Breed> findAllByName(String name);
}
