package org.vet.userservice.model.mapper;

import org.mapstruct.Mapper;
import org.vet.userservice.model.dto.RoleDTO;
import org.vet.userservice.model.entity.Role;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    RoleDTO toRoleDTO(Role role);
    Role toRole(RoleDTO roleDTO);
}
