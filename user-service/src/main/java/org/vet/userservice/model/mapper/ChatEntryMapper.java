package org.vet.userservice.model.mapper;

import org.mapstruct.Mapper;
import org.vet.userservice.model.dto.ChatEntryDTO;
import org.vet.userservice.model.entity.ChatEntry;

@Mapper(componentModel = "spring", uses={MedicalRecordMapper.class, UserMapper.class, PetMapper.class})
public interface ChatEntryMapper {
    ChatEntryDTO toChatEntryDTO(ChatEntry chatEntry);
    ChatEntry toChatEntry(ChatEntryDTO chatEntryDTO);
}
