package org.vet.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.vet.userservice.model.entity.ChatEntry;
import org.vet.userservice.model.entity.MedicalRecord;
import org.vet.userservice.model.entity.Pet;
import org.vet.userservice.model.entity.User;

import java.util.List;
import java.util.Optional;

public interface ChatEntryRepository extends JpaRepository<ChatEntry, Integer> {
    List<ChatEntry> findByPet(Pet pet);
    List<ChatEntry> findByApprovedBy(User approvedBy);
    @Query("""
            SELECT chatEntry
            FROM ChatEntry chatEntry
            WHERE chatEntry.pet.owner=:owner
            """)
    List<ChatEntry> findByOwner(User owner);
    Optional<ChatEntry> findByMedicalRecord(MedicalRecord medicalRecord);
}
