package org.vet.userservice.model.mapper;

import org.mapstruct.Mapper;
import org.vet.userservice.model.dto.BreedDTO;
import org.vet.userservice.model.dto.ClinicDTO;
import org.vet.userservice.model.entity.Breed;
import org.vet.userservice.model.entity.Clinic;

@Mapper(componentModel = "spring", uses={UserMapper.class})
public interface ClinicMapper {
    ClinicDTO toClinicDTO(Clinic clinic);
    Clinic toClinic(ClinicDTO clinicDTO);
}
