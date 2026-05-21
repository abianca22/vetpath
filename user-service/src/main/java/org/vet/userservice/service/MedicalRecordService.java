package org.vet.userservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.entity.Appointment;
import org.vet.userservice.model.entity.MedicalRecord;
import org.vet.userservice.model.entity.Pet;
import org.vet.userservice.model.entity.User;
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


    public MedicalRecord findById(Integer id) {
        return recordRepository.findById(id).orElseThrow(() -> new NoDataFoundException("Nu s-a gasit niciun raport medical cu id-ul: " + id));
    }

    public MedicalRecord addRecord(MedicalRecord record) {
        return recordRepository.save(record);
    }

    public void deleteRecord(Integer id) {
        appointmentService.clearRecord(findById(id).getAppointment().getId());
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

    public MedicalRecord updateRecord(MedicalRecord record) {
        MedicalRecord oldRecord = findById(record.getId());
        if (!record.getDiagnosis().trim().equals(oldRecord.getDiagnosis().trim())) {
            oldRecord.setDiagnosis(record.getDiagnosis().trim());
        }
        if (!record.getSymptoms().trim().equals(oldRecord.getSymptoms().trim())) {
            oldRecord.setSymptoms(record.getSymptoms().trim());
        }
        if (!record.getTreatment().trim().equals(oldRecord.getTreatment().trim())) {
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
