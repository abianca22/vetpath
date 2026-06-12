package org.vet.userservice.service;

import jakarta.transaction.Transactional;
import org.aspectj.weaver.ast.Not;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.metrics.DefaultRepositoryTagsProvider;
import org.springframework.stereotype.Service;
import org.vet.userservice.exception.AccessDeniedException;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.entity.*;
import org.vet.userservice.model.enums.AppointmentStatus;
import org.vet.userservice.model.mapper.AppointmentMapper;
import org.vet.userservice.repository.AppointmentRepository;
import org.vet.userservice.repository.MedicalRecordRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    @Autowired
    private UserService userService;
    @Autowired
    private ClinicService clinicService;

    @Autowired
    private AppointmentMapper appointmentMapper;
    @Autowired
    private MedicalRecordRepository medicalRecordRepository;
    @Autowired
    private NotificationService notificationService;


    public MedicalRecord findById(Integer id) {
        return recordRepository.findById(id).orElseThrow(() -> new NoDataFoundException("Nu s-a gasit niciun raport medical cu id-ul: " + id));
    }

    public MedicalRecord addRecord(MedicalRecord record) {
        MedicalRecord newRecord =  recordRepository.save(record);
        notificationService.createNotificationForAddedRecord(newRecord);
        return newRecord;
    }

    public void deleteRecord(Integer id) {
        MedicalRecord record = findById(id);

        Appointment appointment = record.getAppointment();
        if (appointment != null) {
            appointment.setMedicalRecord(null);
            record.setAppointment(null);
        }
        chatEntryService.clearRecord(findById(id).getChatEntry() != null ? findById(id).getChatEntry().getId() : null);
        recordRepository.delete(record);
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
        MedicalRecord updatedRecord = recordRepository.save(oldRecord);
        notificationService.createNotificationForUpdatedRecord(updatedRecord);
        return updatedRecord;
    }

    public void deletePet(Pet pet, User requester) {
        List<Appointment> appointments = appointmentService.getAppointments(pet, null, null, null, null, null, null, null);
        findAllByPet(pet).forEach(record -> {
            record.setPet(null);
            record.setDiagnosis(record.getDiagnosis() != null && !record.getDiagnosis().isEmpty() ? record.getDiagnosis() + "\nAnimal de companie: " + pet.getName() + " (" + pet.getBreed().getName() + " - " + pet.getBirthDate() + ")" : "Animal de companie: " + pet.getName() + " (" + pet.getBreed().getName() + " - " + pet.getBirthDate() + ")");
            recordRepository.save(record);
        });

        for (var i = 0; i < appointments.size(); i++) {
            Appointment appointment = appointmentService.clearAppointmentPet(appointments.get(i).getId());
            String notes = "Animal de companie: " + pet.getName() + " (" + pet.getBreed().getName() + " - " + pet.getBirthDate() + ")";
            appointment = appointmentService.updateAppointmentNotes(appointment.getId(), notes);
                if (appointment.getStatus().equals(AppointmentStatus.BOOKED) && appointment.getSlot().isAfter(LocalDateTime.now())) {
                    appointment.setCancelReason("Animalul de companie a fost sters de pe platforma");
                    appointment.setCancelledBy(requester);
                    appointment = appointmentService.cancelAppointment(appointment, false);
                }
                if (appointment.getPet() == null && appointment.getVet() == null && appointment.getCurrentOwner() == null) {
                    MedicalRecord medicalRecord = findByAppointment(appointment);
                    if (medicalRecord != null) {
                        deleteRecord(medicalRecord.getId());
                    }
                    List<Notification> notifications = notificationService.findAllByAppointment(appointment);
                    notifications.forEach(notification -> notificationService.deleteById(notification.getId()));
                    appointmentService.deleteSlot(appointment.getId());
                }
        }
        List<ChatEntry> petQuestions = chatEntryService.getChatEntriesByPet(pet);
        petQuestions.forEach(question -> chatEntryService.deleteChatEntry(question.getId()));
        petService.deletePet(pet);
    }

    public void deleteClient(String userId) {
        User client = userService.getUserById(userId);
        if (!petService.findPetByOwner(client).isEmpty()) {
            throw new AccessDeniedException("Acest utilizator nu poate fi sters, deoarece are animale asociate. Daca doriti stergerea contului, stergeti animalele asociate sau atribuiti-le un alt stapan.");
        }
        List<Appointment> appointments = appointmentService.getAppointments(null, null, null, null, null, null, client, null);
        String notes = "Stapan: " + (client.getFirstName() != null && client.getLastName() != null ? client.getFirstName() + " " + client.getLastName() : client.getUsername()) + '\n';
        for (var i = 0; i < appointments.size(); i++) {
            var appointment = appointmentService.updateAppointmentCurrentOwner(appointments.get(i).getId(), null);
            if (appointment.getPet() == null && appointment.getVet() == null && appointment.getCurrentOwner() == null) {
                MedicalRecord medicalRecord = findByAppointment(appointment);
                if (medicalRecord != null) {
                    deleteRecord(medicalRecord.getId());
                }
                List<Notification> notifications = notificationService.findAllByAppointment(appointment);
                notifications.forEach(notification -> notificationService.deleteById(notification.getId()));
                appointmentService.deleteSlot(appointment.getId());
            }
            else {
                appointment = appointmentService.updateAppointmentNotes(appointment.getId(), notes);
                if (appointment.getStatus().equals(AppointmentStatus.BOOKED) && appointment.getSlot().isAfter(LocalDateTime.now())){
                    appointment.setCancelReason("Utilizatorul " + client.getUsername() + " nu mai detine cont pe platforma");
                    appointmentService.cancelAppointment(appointment, false);
                }
            }
        }
        List<Appointment> cancelledAppointments = appointmentService.getAppointments(null, null, null, null, false, client, null, null);
        String notesCancelledBy = "Solicitant anulare: " + (client.getFirstName() != null && client.getLastName() != null ? client.getFirstName() + " " + client.getLastName() : client.getUsername()) + '\n';
        for (var i = 0; i < cancelledAppointments.size(); i++) {
            var cancelledAppointment = appointmentService.updateAppointmentCancelledBy(cancelledAppointments.get(i).getId(), null);
            appointmentService.updateAppointmentNotes(cancelledAppointment.getId(), notesCancelledBy);
        }
        List<ChatEntry> questions = chatEntryService.findAllByOwner(client);
        questions.forEach(question -> {
            chatEntryService.deleteChatEntry(question.getId());
        });
        List<ChatEntry> approvedQuestions = chatEntryService.getChatEntriesByApprovedBy(client);
        approvedQuestions.forEach(question -> chatEntryService.clearApprovedBy(question.getId()));
        List<Notification> userNotification = notificationService.findAllByReceiver(userService.getUserById(userId));
        userNotification.forEach(notification -> {
            notificationService.deleteById(notification.getId());
        });
        userService.deleteUser(userId);
    }

    public void deleteVet(String userId) {
        User vet = userService.getUserById(userId);
        String notes = "Medic veterinar: " + (vet.getFirstName() != null && vet.getLastName() != null ? vet.getFirstName() + " " + vet.getLastName() : vet.getUsername()) + (vet.getPhoneNumber() != null ? " - " + vet.getPhoneNumber() : "") + "\n";
        for (var i = 0; i < vet.getClinics().size(); i++) {
            clinicService.removeVetFromClinic(vet.getClinics().get(i), vet, "Acest medic veterinar nu mai detine cont in cadrul platformei");
        }
        List<Appointment> appointments = appointmentService.getByVet(vet);
        for (var i = 0; i < appointments.size(); i++) {
            appointmentService.updateAppointmentVet(appointments.get(i).getId(), null);
            appointmentService.updateAppointmentNotes(appointments.get(i).getId(), notes);
        }
        List<MedicalRecord> medicalRecords = findAllByVet(vet);
        for (var i = 0; i < medicalRecords.size(); i++) {
            MedicalRecord medicalRecord = medicalRecords.get(i);
            medicalRecord.setVet(null);
            String diagnosis = medicalRecord.getDiagnosis() != null && !medicalRecords.isEmpty() ? medicalRecord.getDiagnosis() + "\nRaport intocmit de " + notes : "Raport intocmit de " + notes;
            medicalRecord.setDiagnosis(diagnosis);
            updateRecord(medicalRecord);
        }
        deleteClient(userId);
    }
}
