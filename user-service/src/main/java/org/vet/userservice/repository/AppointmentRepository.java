package org.vet.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.vet.userservice.model.entity.Appointment;
import org.vet.userservice.model.entity.Clinic;
import org.vet.userservice.model.entity.Pet;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.model.enums.AppointmentStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {
    List<Appointment> findAppointmentsBySlotAndVetOrderBySlotDesc(LocalDateTime slot, User vet);
    List<Appointment> findAppointmentsBySlotAndVetAndStatusOrderBySlotDesc(LocalDateTime slot, User vet, AppointmentStatus status);
    List<Appointment> findAppointmentsByVetOrderBySlotDesc(User vet);
    List<Appointment> findAppointmentsByPetAndSlotAndStatusOrderBySlotDesc(Pet pet, LocalDateTime slot, AppointmentStatus status);
    List<Appointment> findAppointmentsByClinicOrderBySlotDesc(Clinic clinic);
    @Query("""
        SELECT appointment
        FROM Appointment appointment
        WHERE (appointment.pet is not null AND appointment.pet.owner = :owner AND appointment.status = 'BOOKED' AND appointment.slot >= :currentDate)
        ORDER BY appointment.slot DESC
        LIMIT :k
        """)
    List<Appointment> findTopKByOwnerOrderBySlotDesc(User owner, Integer k, LocalDateTime currentDate);
    @Query("""
        SELECT appointment
        FROM Appointment appointment
        WHERE (appointment.vet is not null AND appointment.vet = :vet AND appointment.status = 'BOOKED' AND appointment.slot >= :currentDate)
        ORDER BY appointment.slot DESC
        LIMIT :k
        """)
    List<Appointment> findTopKByVetOrderBySlotDesc(User vet, Integer k, LocalDateTime currentDate);
    void deleteAllByPet(Pet pet);
}
