package org.vet.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.vet.userservice.other.SymptomsBean;

import java.util.List;

public interface SymptomsBeanRepository extends JpaRepository<SymptomsBean, Integer> {
    @Query("""
            SELECT s FROM SymptomsBean s
            WHERE LOWER(s.notes) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """)
    List<SymptomsBean> findByKeyword(String keyword);
}
