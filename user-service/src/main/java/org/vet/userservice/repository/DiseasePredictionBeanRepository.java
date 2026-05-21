package org.vet.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.vet.userservice.other.DiseasePredictionBean;

public interface DiseasePredictionBeanRepository extends JpaRepository<DiseasePredictionBean, Integer> {
}
