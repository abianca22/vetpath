package org.vet.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import org.vet.userservice.model.entity.Clinic;


public interface ClinicRepository extends JpaRepository<Clinic, Integer> {
}
