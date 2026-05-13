package org.vet.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.vet.userservice.model.entity.Appointment;
import org.vet.userservice.model.entity.Clinic;
import org.vet.userservice.model.entity.Pet;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.model.enums.AppointmentStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {
    List<Appointment> findAppointmentsBySlotAndVet(LocalDateTime slot, User vet);
    List<Appointment> findAppointmentsBySlotAndVetAndStatus(LocalDateTime slot, User vet, AppointmentStatus status);
    List<Appointment> findAppointmentsByVet(User vet);
    List<Appointment> findAppointmentsByPetAndSlotAndStatus(Pet pet, LocalDateTime slot, AppointmentStatus status);
    List<Appointment> findAppointmentsByClinic(Clinic clinic);
    void deleteAllByPet(Pet pet);
}
