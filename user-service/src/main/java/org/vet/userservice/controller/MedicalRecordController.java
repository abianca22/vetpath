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
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/records")
public class MedicalRecordController {
    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private AppointmentMapper appointmentMapper;

    @Autowired
    private MedicalRecordMapper recordMapper;

    @Autowired
    private MedicalRecordService recordService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserMapper userMapper;
    @Autowired
    private UsefulFunctions usefulFunctions;
    @Autowired
    private PetService petService;

    @GetMapping("/{id}")
    public ResponseEntity<?> getRecord(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        MedicalRecord medicalRecord = recordService.findById(id);
        if (!medicalRecord.getPet().getOwner().getId().equals(currentUserDTO.getId()) && !usefulFunctions.isVet(currentUserDTO) && !usefulFunctions.isAdmin(currentUserDTO)) {
            throw new AccessDeniedException("Doar clientul sau un medic veterinar poate vizualiza acest raport medical!");
        }
        return ResponseEntity.ok().body(recordMapper.toRecordDTO(medicalRecord));
    }

    @GetMapping("/appointment/{id}")
    public ResponseEntity<?> getRecordByAppointment(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        Appointment appointment = appointmentService.getById(id);
        MedicalRecord medicalRecord = recordService.findByAppointment(appointment);
        if (medicalRecord != null && !usefulFunctions.isAdmin(currentUserDTO) && !medicalRecord.getPet().getOwner().getId().equals(currentUserDTO.getId()) && !usefulFunctions.isVet(currentUserDTO)) {
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
        if (!record.getAppointment().getVet().getId().equals(currentUserDTO.getId()) && !usefulFunctions.isAdmin(currentUserDTO)) {
            throw new AccessDeniedException("Doar adminul sau medicul care a intocmit raportul poate sterge inregistrarea!");
        }
        if (!record.getAppointment().getClinic().getVets().contains(userService.getUserById(currentUserDTO.getId()))) {
            throw new AccessDeniedException("Veteerinarul nu mai apartine clinicii la care s-a efectuat consultatia!");
        }
        recordService.deleteRecord(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllRecords(@RequestParam(value = "owner", required = false) String owner) {
        List<MedicalRecord> allRecords = recordService.findAllRecords();
        if (owner != null && !owner.isEmpty()) {
            allRecords = allRecords.stream().filter(record -> record.getPet().getOwner().equals(userService.getUserByUsername(owner.trim()))).toList();
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
    public ResponseEntity<?> getAllRecordsByVet(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        User vet = userService.getUserById(id);
        if (!usefulFunctions.isAdmin(currentUserDTO) && !usefulFunctions.isVet(currentUserDTO)) {
            throw new AccessDeniedException("Doar adminul si medicii veterinari pot vizualiza rapoartele medicale intocmite de acest veterinar!");
        }
        return ResponseEntity.ok().body(recordService.findAllByVet(vet).stream().map(recordMapper::toRecordDTO).toList());
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
        if (!user.getClinics().contains(oldRecord.getAppointment().getClinic())) {
            throw new AccessDeniedException("Veterinarul asociat nu mai apartine clinicii la care a avut loc consultatia!");
        }
        return ResponseEntity.ok().body(recordMapper.toRecordDTO(recordService.updateRecord(record)));
    }
}