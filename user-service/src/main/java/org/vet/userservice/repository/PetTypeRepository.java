package org.vet.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.vet.userservice.model.entity.PetType;

import java.util.Optional;


public interface PetTypeRepository extends JpaRepository<PetType, Integer> {

    Optional<PetType> getPetTypeById(Integer id);

    Optional<PetType> getPetTypeByName(String name);
}
