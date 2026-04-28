package org.vet.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.vet.userservice.model.entity.User;

import java.util.List;

public interface UserRepository extends JpaRepository<User, String> {
    public List<User> getUsersByPendingRequest(boolean pendingRequest);
}
