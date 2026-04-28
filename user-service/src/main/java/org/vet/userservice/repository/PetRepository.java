package org.vet.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.vet.userservice.model.entity.Breed;
import org.vet.userservice.model.entity.Pet;
import org.vet.userservice.model.entity.User;

import java.util.List;

public interface PetRepository extends JpaRepository<Pet, Integer> {

    List<Pet> findAllByNameAndAndBreedAndOwner(String name, Breed breed, User owner);

    List<Pet> findAllByOwner(User owner);

    @Query("SELECT pet FROM Pet pet WHERE pet.owner = :owner AND (:name LIKE '' or LOWER(pet.name) LIKE LOWER(CONCAT('%', :name, '%')))")
    List<Pet> findAllByOwnerAndName(@Param("owner") User owner, @Param("name") String name);

}
