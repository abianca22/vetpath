package org.vet.userservice.controller;


import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.vet.userservice.exception.AccessDeniedException;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.dto.MedicalRecordDTO;
import org.vet.userservice.model.dto.UserDTO;
import org.vet.userservice.model.entity.Appointment;
import org.vet.userservice.model.entity.MedicalRecord;
import org.vet.userservice.model.entity.Pet;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.model.mapper.AppointmentMapper;
import org.vet.userservice.model.mapper.MedicalRecordMapper;
import org.vet.userservice.model.mapper.UserMapper;
import org.vet.userservice.other.UsefulFunctions;
import org.vet.userservice.service.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/records")
public class MedicalRecordController {
    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private MedicalRecordMapper recordMapper;

    @Autowired
    private MedicalRecordService recordService;

    @Autowired
    private UserService userService;

    @Autowired
    private UsefulFunctions usefulFunctions;

    @Autowired
    private PetService petService;

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/{id}")
    public ResponseEntity<?> getRecord(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        MedicalRecord medicalRecord = recordService.findById(id);
        if (
                (
                        (medicalRecord.getPet() != null && medicalRecord.getPet().getOwner() != null && !medicalRecord.getPet().getOwner().getId().equals(currentUserDTO.getId()))
                || (medicalRecord.getAppointment() != null && medicalRecord.getAppointment().getCurrentOwner() != null && !medicalRecord.getAppointment().getCurrentOwner().getId().equals(currentUserDTO.getId()))
                )
                        && !usefulFunctions.isVet(currentUserDTO) && !usefulFunctions.isAdmin(currentUserDTO)) {
            throw new AccessDeniedException("Doar clientul sau un medic veterinar poate vizualiza acest raport medical!");
        }
        return ResponseEntity.ok().body(recordMapper.toRecordDTO(medicalRecord));
    }

    @GetMapping("/appointment/{id}")
    public ResponseEntity<?> getRecordByAppointment(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        Appointment appointment = appointmentService.getById(id);
        MedicalRecord medicalRecord = recordService.findByAppointment(appointment);
        if (medicalRecord != null && !usefulFunctions.isAdmin(currentUserDTO) && ((medicalRecord.getPet() != null && medicalRecord.getPet().getOwner() != null && !medicalRecord.getPet().getOwner().getId().equals(currentUserDTO.getId())) || (medicalRecord.getAppointment() != null && medicalRecord.getAppointment().getCurrentOwner() != null && !medicalRecord.getAppointment()
                .getCurrentOwner().getId().equals(currentUserDTO.getId()))) && !usefulFunctions.isVet(currentUserDTO)) {
            throw new AccessDeniedException("Doar clientul sau un medic veterinar poate vizualiza acest raport medical!");
        }
        else if (medicalRecord == null) return ResponseEntity.ok().body(recordMapper.toRecordDTO(MedicalRecord.builder().id(0).build()));
        return ResponseEntity.ok().body(recordMapper.toRecordDTO(medicalRecord));
    }

    @PreAuthorize("hasRole('VETERINARIAN')")
    @PostMapping
    public ResponseEntity<?> addRecord(@AuthenticationPrincipal Jwt jwt, @RequestBody @Valid MedicalRecordDTO recordDTO) {
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        MedicalRecord record = recordMapper.toRecord(recordDTO);
        Appointment appointment = appointmentService.getById(record.getAppointment().getId());
        if (appointment.getVet() == null) {
            throw new NoDataFoundException("Veterinarul nu mai detine un cont pe platforma");
        }
        if (!currentUserDTO.getId().equals(appointment.getVet().getId())) {
            throw new AccessDeniedException("Doar veterinarul care a efectuat consultatia poate confirma programarea");
        }
        if (!appointment.getVet().getClinics().contains(appointment.getClinic())) {
            throw new AccessDeniedException("Veterinarul nu mai apartine clinicii in care a fost inregistrata programarea");
        }
        record.setRecordDate(LocalDateTime.now());
        Appointment updatedAppointment = appointment;
        if (!appointment.getDone()) {
             updatedAppointment = appointmentService.updatePastAppointmentStatus(appointment.getId(), true);
        }
        record.setRecordDate(LocalDateTime.now());
        record.setAppointment(updatedAppointment);
        MedicalRecord medicalRecord = recordService.addRecord(record);
        return ResponseEntity.ok().body(recordMapper.toRecordDTO(medicalRecord));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRecord(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        MedicalRecord record = recordService.findById(id);
        if (record.getAppointment() != null && record.getAppointment().getVet() != null && !record.getAppointment().getVet().getId().equals(currentUserDTO.getId()) && !usefulFunctions.isAdmin(currentUserDTO)) {
            throw new AccessDeniedException("Doar adminul sau medicul care a intocmit raportul poate sterge inregistrarea!");
        }
        else if (record.getAppointment() == null && record.getVet() != null && !record.getVet().getId().equals(currentUserDTO.getId()) && !usefulFunctions.isAdmin(currentUserDTO)) {
            throw new AccessDeniedException("Doar adminul sau medicul care a intocmit raportul poate sterge inregistrarea!");
        }
        if (record.getAppointment() != null && record.getAppointment().getClinic() != null && !record.getAppointment().getClinic().getVets().contains(userService.getUserById(currentUserDTO.getId()))) {
            throw new AccessDeniedException("Veterinarul nu mai apartine clinicii la care s-a efectuat consultatia!");
        }
        recordService.deleteRecord(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllRecords(@RequestParam(value = "vet") Optional<String> vet,
                                           @RequestParam(value = "owner") Optional<String> owner,
                                           @RequestParam(value = "pet") Optional<String> pet,
                                           @RequestParam(value="startDate") Optional<String> startDate,
                                           @RequestParam(value = "endDate") Optional<String> endDate,
                                           @RequestParam(value = "generated") Optional<Boolean> generated
    ) {
        List<MedicalRecord> allRecords = recordService.findAllRecords();
        if (pet.isPresent()) {
            allRecords = allRecords.stream().filter(record -> record.getPet() != null && record.getPet().getName().toLowerCase().contains(pet.get().toLowerCase())).toList();
        }
        if (owner.isPresent() && !owner.get().isEmpty()) {
            allRecords = allRecords.stream().filter(record -> (
                    record.getPet() != null && record.getPet().getOwner() != null && (
                    record.getPet().getOwner().getUsername().toLowerCase().contains(owner.get().toLowerCase())
                    || record.getPet().getOwner().getFirstName().toLowerCase().contains(owner.get().toLowerCase())
                    || record.getPet().getOwner().getLastName().toLowerCase().contains(owner.get().toLowerCase()))
            ) || (
                    record.getAppointment() != null && record.getAppointment().getCurrentOwner() != null && (
                            record.getAppointment().getCurrentOwner().getUsername().toLowerCase().contains(owner.get().toLowerCase())
                                    || record.getAppointment().getCurrentOwner().getFirstName().toLowerCase().contains(owner.get().toLowerCase())
                                    || record.getAppointment().getCurrentOwner().getLastName().toLowerCase().contains(owner.get().toLowerCase()))
            )).toList();
        }
        if (vet.isPresent() && !vet.get().isEmpty()) {
            allRecords = allRecords.stream().filter(record -> (record.getVet() != null && (
                    record.getVet().getUsername().toLowerCase().contains(vet.get().toLowerCase())
                            || record.getVet().getFirstName().toLowerCase().contains(vet.get().toLowerCase())
                            || record.getVet().getLastName().toLowerCase().contains(vet.get().toLowerCase()))
            )).toList();
        }
        if (startDate.isPresent()) {
            List<Integer> startDateComponents = new ArrayList<>(List.of(Arrays.stream(startDate.get().split("\\.")).map(Integer::parseInt).toArray(Integer[]::new)));
            allRecords = allRecords.stream().filter(record -> record.getRecordDate().isAfter(LocalDateTime.of(startDateComponents.get(2), startDateComponents.get(1), startDateComponents.get(0), 0, 0))).toList();
        }
        if (endDate.isPresent()) {
            List<Integer> endDateComponents = new ArrayList<>(List.of(Arrays.stream(endDate.get().split("\\.")).map(Integer::parseInt).toArray(Integer[]::new)));
            allRecords = allRecords.stream().filter(record -> record.getRecordDate().isBefore(LocalDateTime.of(endDateComponents.get(2), endDateComponents.get(1), endDateComponents.get(0), 23, 59))).toList();
        }
        if (generated.isPresent()) {
            if (generated.get()) {
                allRecords = allRecords.stream().filter(record -> record.getAppointment() == null).toList();
            }
        }
        return ResponseEntity.ok().body(allRecords.stream().map(record -> recordMapper.toRecordDTO(record)).toList());
    }

    @GetMapping("/pet/{id}")
    public ResponseEntity<?> getAllRecordsByPet(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        Pet pet = petService.getPetById(id);
        if (!usefulFunctions.isAdmin(currentUserDTO) && !usefulFunctions.isVet(currentUserDTO) && !currentUserDTO.getId().equals(pet.getOwner().getId())) {
            throw new AccessDeniedException("Doar adminul, medicul veterinar sau proprietarul animalului poate vizualiza rapoartele medicale ale acestuia!");
        }
        return ResponseEntity.ok().body(recordService.findAllByPet(pet).stream().map(recordMapper::toRecordDTO).toList());
    }

    @GetMapping("/vet/{id}")
    public ResponseEntity<?> getAllRecordsByVet(@AuthenticationPrincipal Jwt jwt, @PathVariable String id, @RequestParam(value="pet") Optional<String> pet, @RequestParam(value="owner") Optional<String> owner, @RequestParam(value="startDate") Optional<String> startDate, @RequestParam(value = "endDate") Optional<String> endDate, @RequestParam(value = "generated") Optional<Boolean> generated) {
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        User vet = userService.getUserById(id);
        List<MedicalRecord> records = recordService.findAllByVet(vet);
        if (!usefulFunctions.isAdmin(currentUserDTO) && !usefulFunctions.isVet(currentUserDTO)) {
            throw new AccessDeniedException("Doar adminul si medicii veterinari pot vizualiza rapoartele medicale intocmite de acest veterinar!");
        }
        if (pet.isPresent()) {
            records = records.stream().filter(record -> record.getPet().getName().toLowerCase().contains(pet.get().toLowerCase())).toList();
        }
        if (owner.isPresent()) {
            records = records.stream().filter(record -> (
                    record.getPet().getOwner().getUsername().toLowerCase().contains(owner.get().toLowerCase())
                        || record.getPet().getOwner().getLastName().toLowerCase().contains(owner.get().toLowerCase())
                        || record.getPet().getOwner().getFirstName().toLowerCase().contains(owner.get().toLowerCase()))
            ).toList();
        }
        if (startDate.isPresent()) {
            List<Integer> startDateComponents = new ArrayList<>(List.of(Arrays.stream(startDate.get().split("\\.")).map(Integer::parseInt).toArray(Integer[]::new)));
            records = records.stream().filter(record -> record.getRecordDate().isAfter(LocalDateTime.of(startDateComponents.get(2), startDateComponents.get(1), startDateComponents.get(0), 0, 0))).toList();
        }
        if (endDate.isPresent()) {
            List<Integer> endDateComponents = new ArrayList<>(List.of(Arrays.stream(endDate.get().split("\\.")).map(Integer::parseInt).toArray(Integer[]::new)));
            records = records.stream().filter(record -> record.getRecordDate().isBefore(LocalDateTime.of(endDateComponents.get(2), endDateComponents.get(1), endDateComponents.get(0), 23, 59))).toList();
        }
        if (generated.isPresent()) {
            if (generated.get()) {
               records = records.stream().filter(record -> record.getAppointment() == null).toList();
            }
        }
        return ResponseEntity.ok().body(records.stream().map(record -> recordMapper.toRecordDTO(record)).toList());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRecord(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id, @RequestBody @Valid MedicalRecordDTO recordDTO) {
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        MedicalRecord oldRecord = recordService.findById(id);
        MedicalRecord record = recordMapper.toRecord(recordDTO);
        record.setId(id);
        if (!usefulFunctions.isAdmin(currentUserDTO) && oldRecord.getVet() != null && !currentUserDTO.getId().equals(oldRecord.getVet().getId())) {
            throw new AccessDeniedException("Doar adminul sau veterinarul care a intocmit raportul il poate edita!");
        }
        User user = userService.getUserById(currentUserDTO.getId());
        if (oldRecord.getAppointment() != null && oldRecord.getAppointment().getClinic() != null && !user.getClinics().contains(oldRecord.getAppointment().getClinic())) {
            throw new AccessDeniedException("Veterinarul asociat nu mai apartine clinicii la care a avut loc consultatia!");
        }
        return ResponseEntity.ok().body(recordMapper.toRecordDTO(recordService.updateRecord(record)));
    }
}