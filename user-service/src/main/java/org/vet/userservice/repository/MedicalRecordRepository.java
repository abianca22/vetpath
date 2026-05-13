package org.vet.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.vet.userservice.model.entity.Appointment;
import org.vet.userservice.model.entity.MedicalRecord;
import org.vet.userservice.model.entity.Pet;
import org.vet.userservice.model.entity.User;

import java.util.List;
import java.util.Optional;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Integer> {
    Optional<MedicalRecord> findByAppointment(Appointment appointment);
    List<MedicalRecord> findAllByPet(Pet pet);
    List<MedicalRecord> findAllByVet(User vet);
}
