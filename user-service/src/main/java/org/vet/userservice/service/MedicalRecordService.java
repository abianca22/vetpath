package org.vet.userservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.metrics.DefaultRepositoryTagsProvider;
import org.springframework.stereotype.Service;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.entity.*;
import org.vet.userservice.repository.AppointmentRepository;
import org.vet.userservice.repository.MedicalRecordRepository;

import java.util.List;

@Service
public class MedicalRecordService {
    @Autowired
    private MedicalRecordRepository recordRepository;
    @Autowired
    private AppointmentService appointmentService;
    @Autowired
    private PetService petService;
    @Autowired
    private ChatEntryService chatEntryService;
    private DefaultRepositoryTagsProvider repositoryTagsProvider;


    public MedicalRecord findById(Integer id) {
        return recordRepository.findById(id).orElseThrow(() -> new NoDataFoundException("Nu s-a gasit niciun raport medical cu id-ul: " + id));
    }

    public MedicalRecord addRecord(MedicalRecord record) {
        return recordRepository.save(record);
    }

    public void deleteRecord(Integer id) {
        MedicalRecord record = findById(id);
        if (record.getAppointment() != null) {
            appointmentService.clearRecord(record.getAppointment().getId());
        }
        chatEntryService.clearRecord(findById(id).getChatEntry() != null ? findById(id).getChatEntry().getId() : null);
        recordRepository.deleteById(id);
    }

    public MedicalRecord findByAppointment(Appointment appointment) {
        return recordRepository.findByAppointment(appointment).orElse(null);
    }

    public List<MedicalRecord> findAllRecords() {
        return recordRepository.findAll();
    }

    public List<MedicalRecord> findAllByPet(Pet pet) {
        return recordRepository.findAllByPet(pet);
    }

    public List<MedicalRecord> findTopKMostRecentByPet(Pet pet, Integer k) {
        return recordRepository.findTopKMostRecentByPet(pet, k);
    }

    public List<MedicalRecord> findAllByVet(User vet) {
        return recordRepository.findAllByVet(vet);
    }

    public List<MedicalRecord> findAllByVetAndPet(User vet, Pet pet) {
        return recordRepository.findAllByVetAndPet(vet, pet);
    }

    public MedicalRecord updateRecord(MedicalRecord record) {
        MedicalRecord oldRecord = findById(record.getId());
        if (record.getDiagnosis() != null && !record.getDiagnosis().equals(oldRecord.getDiagnosis())) {
            oldRecord.setDiagnosis(record.getDiagnosis().trim());
        }
        if (record.getSymptoms() != null && !record.getSymptoms().equals(oldRecord.getSymptoms())) {
            oldRecord.setSymptoms(record.getSymptoms().trim());
        }
        if (record.getTreatment() != null && !record.getTreatment().equals(oldRecord.getTreatment())) {
            oldRecord.setTreatment(record.getTreatment().trim());
        }
        return recordRepository.save(oldRecord);
    }

    public void deletePet(Pet pet) {
        List<MedicalRecord> records = findAllByPet(pet);
        records.forEach(record -> appointmentService.clearRecord(record.getId()));
        recordRepository.deleteAll(records);
        appointmentService.deleteAllByPet(pet);
        petService.deletePet(pet);
    }
}
