package org.vet.userservice.model.mapper;
import org.vet.userservice.model.dto.BreedDTO;
import org.vet.userservice.model.entity.Breed;

import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses={PetTypeMapper.class})
public interface BreedMapper {
    BreedDTO toBreedDTO(Breed breed);
    Breed toBreed(BreedDTO breedDTO);
}
