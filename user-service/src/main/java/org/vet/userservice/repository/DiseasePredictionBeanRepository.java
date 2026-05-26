package org.vet.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.vet.userservice.other.DiseasePredictionBean;

import java.util.List;

public interface DiseasePredictionBeanRepository extends JpaRepository<DiseasePredictionBean, Integer> {
    @Query("""
            SELECT d FROM DiseasePredictionBean d
            WHERE LOWER(d.diseasePrediction) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(d.symptom1) LIKE LOWER(CONCAT('%', :keyword, '%'))               OR LOWER(d.symptom1) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(d.symptom2) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(d.symptom3) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(d.symptom4) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """)
    List<DiseasePredictionBean> findByKeyword(String keyword);
}
