package org.vet.userservice.model.mapper;
import org.vet.userservice.model.dto.AppointmentDTO;
import org.vet.userservice.model.entity.Appointment;

import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses={UserMapper.class, ClinicMapper.class, PetMapper.class})
public interface AppointmentMapper {
    AppointmentDTO toAppointmentDTO(Appointment appointment);
    Appointment toAppointment(AppointmentDTO appointmentDTO);
}
