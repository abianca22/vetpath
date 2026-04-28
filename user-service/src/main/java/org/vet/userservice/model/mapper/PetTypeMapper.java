package org.vet.userservice.model.mapper;

import org.mapstruct.Mapper;
import org.vet.userservice.model.dto.PetTypeDTO;
import org.vet.userservice.model.entity.PetType;

@Mapper(componentModel = "spring")
public interface PetTypeMapper {
    PetTypeDTO toPetTypeDTO(PetType petType);
    PetType toPetType(PetTypeDTO petTypeDTO);
}
