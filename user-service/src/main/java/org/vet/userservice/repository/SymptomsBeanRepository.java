package org.vet.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.vet.userservice.other.SymptomsBean;

public interface SymptomsBeanRepository extends JpaRepository<SymptomsBean, Integer> {
}
