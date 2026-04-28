package org.vet.userservice.model.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.vet.userservice.model.dto.UserDTO;
import org.vet.userservice.model.entity.User;

@Mapper(componentModel = "spring", uses = {RoleMapper.class})
public interface UserMapper {
    User toUser(UserDTO userDTO);
    UserDTO toUserDTO(User user);
}
