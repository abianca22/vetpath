package org.vet.userservice.service;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cglib.core.Local;
import org.springframework.stereotype.Service;
import org.vet.userservice.exception.AccessDeniedException;
import org.vet.userservice.exception.InvalidDataException;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.entity.*;
import org.vet.userservice.model.enums.AppointmentStatus;
import org.vet.userservice.other.UsefulFunctions;
import org.vet.userservice.repository.AppointmentRepository;
import org.vet.userservice.repository.ClinicRepository;
import org.vet.userservice.repository.MedicalRecordRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private UsefulFunctions usefulFunctions;

    @Autowired
    private PetService petService;
    @Autowired
    private MedicalRecordRepository medicalRecordRepository;
    @Autowired
    private NotificationService notificationService;

    public List<Appointment> getByDateAndVetAndSlot(Appointment appointment) {
        return appointmentRepository.findAppointmentsBySlotAndVetOrderBySlotDesc(appointment.getSlot(), appointment.getVet());
    }

    public List<Appointment> getByVet(User vet) {
        return appointmentRepository.findAppointmentsByVetOrderBySlotDesc(vet);
    }

    public List<Appointment> getByVetAsc(User vet) {
        return appointmentRepository.findAppointmentsByVetOrderBySlotAsc(vet);
    }

    private boolean validDateChecker(LocalDateTime date) {
        return date.isAfter(LocalDateTime.now());
    }

    public Appointment changeClinic(Appointment appointment) {
        var appointmentDb = getById(appointment.getId());
        appointmentDb.setClinic(appointment.getClinic());
        System.out.println(appointmentDb.getClinic() != null ? appointmentDb.getClinic().getId() : null);
        return appointmentRepository.save(appointmentDb);
    }

    public List<Appointment> getByClinic(Clinic clinic) {
        return appointmentRepository.findAppointmentsByClinicOrderBySlotDesc(clinic);
    }

    public List<Appointment> createSlot(Appointment appointment, User vet, Clinic clinic, Integer slotsCount) {
        List<Appointment> addedSlots = new ArrayList<>();
        Appointment newAppointment = Appointment.builder()
                .vet(vet)
                .clinic(clinic)
                .slot(appointment.getSlot())
                .status(AppointmentStatus.AVAILABLE)
                .done(false)
                .build();
        if (!validDateChecker(appointment.getSlot())) {
            throw new InvalidDataException("Nu se pot selecta date din trecut!");
        }
        if (!clinic.getVets().contains(vet)) {
            throw new InvalidDataException("Medicul veterinar nu apartine clinicii selectate!");
        }
        if (!checkIfSlotOverlaps(newAppointment)) {
            addedSlots.add(appointmentRepository.save(newAppointment));
        }
        else {
            throw new InvalidDataException("Adaugarea incepand cu slot-ul " + newAppointment.getSlot().format(usefulFunctions.dateTimeFormatter()) + " nu a mai putut continua, deoarece acest slot exista deja. Incercati sa ajustati numarul de sloturi astfel incat sa nu existe suprapuneri.");
        }
        for (int i = 1; i < slotsCount; i++) {
            newAppointment = Appointment.builder()
                    .vet(vet)
                    .clinic(clinic)
                    .slot(appointment.getSlot().plusMinutes(30L * i))
                    .status(AppointmentStatus.AVAILABLE)
                    .done(false)
                    .build();
            if (getByVetAndSlotAndStatus(newAppointment.getVet(), newAppointment.getSlot(), AppointmentStatus.AVAILABLE).isEmpty()) {
                addedSlots.add(appointmentRepository.save(newAppointment));
            }
            else {
                throw new InvalidDataException("Adaugarea incepand cu slot-ul " + newAppointment.getSlot().format(usefulFunctions.dateTimeFormatter()) + " nu a mai putut continua, deoarece acest slot exista deja. Incercati sa ajustati numarul de sloturi astfel incat sa nu existe suprapuneri.");
            }
        }
        return addedSlots;
    }

    public void deleteSlot(Integer id) {
        appointmentRepository.deleteById(id);
    }

    public Appointment getById(Integer id) {
        return appointmentRepository.findById(id).orElseThrow(() -> new NoDataFoundException("Slotul cu id = " +  id + " nu a fost gasit!"));
    }

    public List<Appointment> getByPetAndSlotAndStatus(Pet pet, LocalDateTime slot, AppointmentStatus status) {
        return appointmentRepository.findAppointmentsByPetAndSlotAndStatusOrderBySlotDesc(pet, slot, status);
    }

    public List<Appointment> getByVetAndSlotAndStatus(User vet, LocalDateTime slot, AppointmentStatus status) {
        return appointmentRepository.findAppointmentsBySlotAndVetAndStatusOrderBySlotDesc(slot, vet, status);
    }

    public boolean checkIfSlotOverlaps(Appointment appointment) {
        List<Appointment> appointments = getByVet(appointment.getVet()).stream().filter(app ->
                ((app.getSlot().isBefore(appointment.getSlot())
                        && app.getSlot().plusMinutes(30).isAfter(appointment.getSlot()))
                || (app.getSlot().isAfter(appointment.getSlot()) && app.getSlot().minusMinutes(30).isBefore(appointment.getSlot())))
                && !app.getStatus().equals(AppointmentStatus.CANCELLED))
                .toList();
        System.out.println(appointments.stream().map(app -> app.getSlot().format(usefulFunctions.dateTimeFormatter())).toList());
        return !appointments.isEmpty();
    }

    public Appointment addAppointment(Appointment appointment, Pet pet) {
        List<Appointment> existingAppointments = getByPetAndSlotAndStatus(pet, appointment.getSlot(), AppointmentStatus.BOOKED);
        if (!existingAppointments.isEmpty()) {
            throw new InvalidDataException("Exista deja o programare pentru acest animal de companie in acest interval!");
        }
        appointment.setPet(petService.getPetById(pet.getId()));
        appointment.setStatus(AppointmentStatus.BOOKED);
        Appointment newAppointment = appointmentRepository.save(appointment);
        notificationService.createNotificationForAddedAppointment(newAppointment);
        return newAppointment;
    }

    public Appointment cancelAppointment(Appointment appointment, Boolean recreateSlot) {
        if (appointment.getStatus() != AppointmentStatus.BOOKED) {
            throw new InvalidDataException("Doar programarile rezervate pot fi anulate.");
        }
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledBy(appointment.getCancelledBy() != null ? userService.getUserById(appointment.getCancelledBy().getId()): null);
        appointment.setCancelReason(appointment.getCancelReason());
        if (recreateSlot) {
            createSlot(appointment, appointment.getVet(), appointment.getClinic(), 1);
        }
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        User receiver = null;
        if (appointment.getCancelledBy() != null) {
            if (appointment.getVet() != null && appointment.getVet().getId().equals(appointment.getCancelledBy().getId())) {
                receiver = appointment.getCurrentOwner();
            }
            else if (appointment.getCurrentOwner() != null && appointment.getCurrentOwner().getId().equals(appointment.getCancelledBy().getId())) {
                receiver = appointment.getVet();
            }
        }
        notificationService.createNotificationForCancelledAppointment(receiver, updatedAppointment);
        return updatedAppointment;
    }

    public List<Appointment> getAppointments(Pet pet, User vet, String startDate, String endDate, Boolean status, User cancelledBy, User owner, Clinic clinic) {
        List<Appointment> appointments = appointmentRepository.findAll().stream().filter(appointment -> appointment.getStatus() != AppointmentStatus.AVAILABLE).toList();
        if (owner != null) {
            appointments = appointments.stream().filter(appointment -> (appointment.getPet() != null && appointment.getPet().getOwner().equals(owner)) || (appointment.getCurrentOwner() != null && appointment.getCurrentOwner().equals(owner))).toList();
        }
        if (pet != null) {
            appointments = appointments.stream().filter(appointment -> appointment.getPet() != null && appointment.getPet().equals(pet)).toList();
        }
        if (vet != null) {
            appointments = appointments.stream().filter(appointment -> appointment.getVet() != null && appointment.getVet().equals(vet)).toList();
        }
        if (startDate != null) {
            List<Integer> startDateArr = Arrays.stream(startDate.split("\\.")).map(Integer::parseInt).toList();
            appointments = appointments.stream().filter(appointment -> appointment.getSlot() != null && !appointment.getSlot().isBefore(LocalDateTime.of(startDateArr.get(2), startDateArr.get(1), startDateArr.get(0), 0, 0))).toList();
        }
        if (endDate != null) {
            List<Integer> endDateArr = Arrays.stream(endDate.split("\\.")).map(Integer::parseInt).toList();
            appointments = appointments.stream().filter(appointment -> appointment.getSlot() != null && !appointment.getSlot().isAfter(LocalDateTime.of(endDateArr.get(2), endDateArr.get(1), endDateArr.get(0), 23, 59))).toList();
        }
        if (status != null) {
            if (status) {
                appointments = appointments.stream().filter(appointment -> appointment.getStatus() == AppointmentStatus.BOOKED).toList();
            } else {
                appointments = appointments.stream().filter(appointment -> appointment.getStatus() == AppointmentStatus.CANCELLED).toList();
            }
        }
        if (cancelledBy != null) {
            appointments = appointments.stream().filter(appointment -> appointment.getCancelledBy() != null && appointment.getCancelledBy().equals(cancelledBy)).toList();
        }
        if (clinic != null) {
            appointments = appointments.stream().filter(appointment -> appointment.getClinic() != null && appointment.getClinic().equals(clinic)).toList();
        }
        return appointments;
    }

    public Appointment updateAppointmentPet(Integer id, Integer petId) {
        Pet pet = petService.getPetById(petId);
        Appointment appointment = this.getById(id);
        appointment.setPet(pet);
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        notificationService.createNotificationForUpdatedAppointment(updatedAppointment);
        return updatedAppointment;
    }

    public Appointment clearAppointmentPet(Integer id) {
        Appointment appointment = this.getById(id);
        appointment.setPet(null);
        return appointmentRepository.save(appointment);
    }

    public Appointment updatePastAppointmentStatus(Integer id, boolean done) {
        Appointment appointment = this.getById(id);
        if (appointment.getDone().equals(done)) {
            throw new AccessDeniedException("Programarea a fost deja confirmata");
        }
        appointment.setDone(done);
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        notificationService.createNotificationForConfirmedAppointment(updatedAppointment);
        return updatedAppointment;
    }

    public void clearRecord(Integer id) {
        Appointment appointment = this.getById(id);

        MedicalRecord record = appointment.getMedicalRecord();
        if (record != null) {
            record.setAppointment(null);
            appointment.setMedicalRecord(null);
        }
    }

    public void deleteAllByPet(Pet pet) {
        appointmentRepository.deleteAllByPet(pet);
    }

    public List<Appointment> getTopKByOwner(User owner, Integer k, LocalDateTime currentDate, Boolean asc) {
        if (!asc) {
            return appointmentRepository.findTopKByOwnerOrderBySlotDesc(owner, k, currentDate
            );
        }
        else {
            return appointmentRepository.findTopKByOwnerOrderBySlotAsc(owner, k, currentDate);
        }
    }

    public List<Appointment> getTopKByVet(User vet, Integer k, LocalDateTime currentDate, Boolean asc) {
        if (!asc) {
            return appointmentRepository.findTopKByVetOrderBySlotDesc(vet, k, currentDate);
        }
        else {
            return appointmentRepository.findTopKByVetOrderBySlotAsc(vet, k, currentDate);
        }
    }

    public Appointment updateAppointmentNotes(Integer id, String notes) {
        var appointment = this.getById(id);
        System.out.println(appointment.getId());
        var oldNotes = appointment.getNotes();
        System.out.println(appointment.getNotes());
        var newNotes = (oldNotes == null || oldNotes.isBlank()) ? notes : oldNotes + '\n' + notes;
        appointment.setNotes(newNotes);
        return appointmentRepository.save(appointment);
    }

    public Appointment updateAppointmentVet(Integer id, User vet) {
        Appointment appointment = getById(id);
        appointment.setVet(vet);
        return appointmentRepository.save(appointment);
    }

    public Appointment updateAppointmentCurrentOwner(Integer id, User client) {
        Appointment appointment = getById(id);
        appointment.setCurrentOwner(client);
        return appointmentRepository.save(appointment);
    }

    public Appointment updateAppointmentCancelledBy(Integer id, User user) {
        Appointment appointment = getById(id);
        if (!appointment.getStatus().equals(AppointmentStatus.CANCELLED)) {
            throw new AccessDeniedException("Programarea nu este anulata!");
        }
        appointment.setCancelledBy(user);
        return appointmentRepository.save(appointment);
    }
}
