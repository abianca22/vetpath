package org.vet.userservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.entity.Role;
import org.vet.userservice.repository.RoleRepository;

@Service
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    public Role findById(String id) throws NoDataFoundException {
        return roleRepository.findById(id).orElseThrow(() -> new NoDataFoundException("Rolul cu id-ul " + id + " nu a fost gasit"));
    }

    public Role findByName(String name) throws NoDataFoundException {
        return roleRepository.findByName(name).orElseThrow(() -> new NoDataFoundException("Rolul cu numele " + name + " nu a fost gasit"));
    }

    public Role saveRole(Role role) {
        return roleRepository.save(role);
    }
}
