package org.vet.userservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.vet.userservice.model.entity.ChatEntry;
import org.vet.userservice.model.entity.MedicalRecord;
import org.vet.userservice.model.entity.Pet;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.repository.ChatEntryRepository;
import org.vet.userservice.repository.MedicalRecordRepository;

import java.util.List;

@Service
public class ChatEntryService {
    @Autowired
    private ChatEntryRepository chatEntryRepository;
    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    public List<ChatEntry> getChatEntriesByPet(Pet pet) {
        return chatEntryRepository.findByPet(pet);
    }

    public List<ChatEntry> getChatEntriesByApprovedBy(User vet) {
        return chatEntryRepository.findByApprovedBy(vet);
    }

    public ChatEntry saveChatEntry(ChatEntry chatEntry) {
        return chatEntryRepository.save(chatEntry);
    }

    public ChatEntry findById(Integer id) {
        return chatEntryRepository.findById(id).orElse(null);
    }

    public void clearRecord(Integer chatEntryId) {
        if (chatEntryId != null) {
            ChatEntry chatEntry = findById(chatEntryId);
            if (chatEntry != null) {
                chatEntry.setApprovedBy(null);
                chatEntry.setMedicalRecord(null);
                saveChatEntry(chatEntry);
            }
        }
    }

    public void deleteChatEntry(Integer id) {
        ChatEntry chatEntry = findById(id);
        if (chatEntry != null) {
            if (chatEntry.getMedicalRecord() != null) {
                medicalRecordRepository.deleteById(chatEntry.getMedicalRecord().getId());
            }
        }
        chatEntryRepository.deleteById(id);
    }

    public List<ChatEntry> findAllByOwner(User owner) {
        return chatEntryRepository.findByOwner(owner);
    }

    public void clearApprovedBy(Integer id) {
        ChatEntry chatEntry = findById(id);
        chatEntry.setApprovedBy(null);
        chatEntryRepository.save(chatEntry);
    }

    public ChatEntry getByRecord(MedicalRecord record) {
        return chatEntryRepository.findByMedicalRecord(record).orElse(null);
    }


}
