package org.vet.userservice.model.mapper;
import org.vet.userservice.model.dto.MedicalRecordDTO;

import org.mapstruct.Mapper;
import org.vet.userservice.model.entity.MedicalRecord;

@Mapper(componentModel = "spring", uses={UserMapper.class, ClinicMapper.class, PetMapper.class, AppointmentMapper.class})
public interface MedicalRecordMapper {
    MedicalRecordDTO toRecordDTO(MedicalRecord record);
    MedicalRecord toRecord(MedicalRecordDTO recordDTO);
}
