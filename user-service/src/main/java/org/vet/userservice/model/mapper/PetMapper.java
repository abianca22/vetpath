package org.vet.userservice.model.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.vet.userservice.model.dto.UserDTO;
import org.vet.userservice.model.entity.Pet;
import org.vet.userservice.model.dto.PetDTO;
import org.vet.userservice.model.entity.User;

@Mapper(componentModel = "spring", uses = {BreedMapper.class, UserMapper.class})
public interface PetMapper {

    Pet toPet(PetDTO petDTO);
    PetDTO toPetDTO(Pet pet);
}
