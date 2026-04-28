package org.vet.userservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.slf4j.spi.LocationAwareLogger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.vet.userservice.exception.AccessDeniedException;
import org.vet.userservice.exception.InvalidDataException;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.dto.*;
import org.vet.userservice.model.entity.Appointment;
import org.vet.userservice.model.entity.Clinic;
import org.vet.userservice.model.entity.Pet;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.model.enums.AppointmentStatus;
import org.vet.userservice.model.mapper.AppointmentMapper;
import org.vet.userservice.model.mapper.UserMapper;
import org.vet.userservice.other.UsefulFunctions;
import org.vet.userservice.service.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private AppointmentMapper appointmentMapper;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private UserService userService;
    @Autowired
    private UsefulFunctions usefulFunctions;
    @Autowired
    private PetService petService;
    @Autowired
    private RoleService roleService;
    @Autowired
    private ClinicService clinicService;

    @PreAuthorize("hasRole('VETERINARIAN')")
    @PostMapping
    public ResponseEntity<?> addSlot(@RequestBody @Valid SlotDTO slotDTO, @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        if (!currentUser.getId().equals(slotDTO.getAppointment().getVet().getId())) {
            throw new AccessDeniedException("Medicii pot adauga doar sloturi pentru propriul cont!");
        }
        AppointmentDTO appointmentDTO = slotDTO.getAppointment();
        Appointment appointment = appointmentMapper.toAppointment(appointmentDTO);
        Clinic clinic = clinicService.getClinicById(appointment.getClinic().getId());
        User vet = userService.getUserById(appointment.getVet().getId());
        Integer slotsCount = slotDTO.getSlotsCount();
        return ResponseEntity.ok(appointmentService.createSlot(appointment, vet, clinic, slotsCount).stream().map(appointmentMapper::toAppointmentDTO).toList());
    }

    @GetMapping("/{username}")
    public ResponseEntity<?> getSlotByVet(@PathVariable String username, @RequestParam(value="startDate", required = false) Optional<String> startDate, @RequestParam(value="endDate", required = false) Optional<String> endDate) {
        List<Appointment> appointments = appointmentService.getByVet(userService.getUserByUsername(username));
        if (startDate.isPresent()) {
            List<Integer> startDateComponents = new ArrayList<>(List.of(Arrays.stream(startDate.get().split(" ")[0].split("\\.")).map(Integer::parseInt).toArray(Integer[]::new)));
            startDateComponents.addAll(Arrays.stream(startDate.get().split(" ")[1].split(":")).map(Integer::parseInt).toList());
            appointments = appointments.stream().filter(appointment -> appointment.getSlot().isAfter(LocalDateTime.of(startDateComponents.get(2), startDateComponents.get(1), startDateComponents.get(0), startDateComponents.get(3), startDateComponents.get(4))) && !appointment.getStatus().equals(AppointmentStatus.BOOKED)).toList();
        }
        if (endDate.isPresent()) {
            List<Integer> endDateComponents = new ArrayList<>(List.of(Arrays.stream(endDate.get().split(" ")[0].split("\\.")).map(Integer::parseInt).toArray(Integer[]::new)));
            endDateComponents.addAll(Arrays.stream(endDate.get().split(" ")[1].split(":")).map(Integer::parseInt).toList());
            appointments = appointments.stream().filter(appointment -> appointment.getSlot().isBefore(LocalDateTime.of(endDateComponents.get(2), endDateComponents.get(1), endDateComponents.get(0), endDateComponents.get(3), endDateComponents.get(4))) && !appointment.getStatus().equals(AppointmentStatus.BOOKED)).toList();
        }
        return ResponseEntity.ok().body(appointments.stream().map(appointmentMapper::toAppointmentDTO).toList());
    }

    @PreAuthorize("hasAnyRole('VETERINARIAN', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSlot(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        var slot = appointmentService.getById(id);
        if (!usefulFunctions.isAdmin(currentUser) && !currentUser.getId().equals(slot.getVet().getId())) {
            throw new AccessDeniedException("Doar medicul care a creat slotul sau administratorii pot sterge acest slot.");
        }
        if (slot.getStatus().equals(AppointmentStatus.BOOKED) && slot.getPet() != null) {
            throw new AccessDeniedException("Slotul nu poate fi sters, deoarece este alocat unei programari valide.");
        }
        if (slot.getStatus().equals(AppointmentStatus.CANCELLED) && slot.getPet() != null) {
            throw new AccessDeniedException("Slotul nu poate fi sters, deoarece a fost asociat in trecut unei programari si face parte din istoricul programarilor.");
        }
        appointmentService.deleteSlot(id);
        return ResponseEntity.ok().build();
    }

//    @PreAuthorize("hasRole('PET_OWNER')")
    @PutMapping("/{id}")
    public ResponseEntity<?> addAppointment(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt, @RequestParam(value="pet") Integer petId) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        Appointment appointment = appointmentService.getById(id);
        Pet pet = petService.getPetById(petId);
        if (!currentUser.getId().equals(pet.getOwner().getId())) {
            throw new AccessDeniedException("Doar proprietarii animalelor pot programa un slot pentru propriile animale.");
        }
        if (appointment.getStatus() != org.vet.userservice.model.enums.AppointmentStatus.AVAILABLE) {
            throw new AccessDeniedException("Acest slot nu este disponibil pentru programare.");
        }
        if (appointment.getSlot().isBefore(LocalDateTime.now())) {
            throw new AccessDeniedException("Nu se pot programa sloturi care au expirat.");
        }
        appointmentService.addAppointment(appointment, pet);
        return ResponseEntity.ok().body(appointmentMapper.toAppointmentDTO(appointment));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt, @RequestBody @Valid CancelledAppointmentDTO cancelAppointmentDTO, @RequestParam(value="freeSlot", required = false) Boolean freeSlot) {
        var currentUser = usefulFunctions.decodeJWT(jwt);
        var appointment = appointmentService.getById(id);
        if(!usefulFunctions.isAdmin(currentUser) && !currentUser.getId().equals(appointment.getPet().getOwner().getId()) && !currentUser.getId().equals(appointment.getVet().getId())) {
            throw new AccessDeniedException("Doar proprietarul animalului, medicul care a creat slotul sau administratorii pot anula aceasta programare.");
        }
        if (appointment.getStatus() != AppointmentStatus.BOOKED) {
            throw new InvalidDataException("Doar programarile rezervate pot fi anulate.");
        }
        if (currentUser.getId().equals(appointment.getPet().getOwner().getId())) {
            freeSlot = true;
        }
        appointment.setCancelledBy(userMapper.toUser(currentUser));
        appointment.setCancelReason(cancelAppointmentDTO.getCancelReason());
        return ResponseEntity.ok().body(appointmentMapper.toAppointmentDTO(appointmentService.cancelAppointment(appointment, freeSlot != null && freeSlot)));
    }

    @GetMapping
    public ResponseEntity<?> getAppointments(@RequestParam(value="pet", required = false) Integer pet,
                                             @RequestParam(value="vet", required = false) String vet,
                                             @RequestParam(value="startDate", required = false) String startDate,
                                             @RequestParam(value="endDate", required = false) String endDate,
                                             @RequestParam(value="status", required = false) Boolean status,
                                             @RequestParam(value="cancelledBy", required = false) String cancelledBy,
                                             @RequestParam(value="owner", required = false) String owner,
                                             @RequestParam(value="clinic", required = false) Integer clinic,
                                             @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        if(usefulFunctions.isVet(currentUser) && vet != null && !currentUser.getUsername().equals(vet) && owner != null && !currentUser.getUsername().equals(owner)) {
            throw new AccessDeniedException("Medicii pot vizualiza doar propriile programari!");
        }
        if(usefulFunctions.isPetOwner(currentUser) && owner != null && !currentUser.getUsername().equals(owner)) {
            throw new AccessDeniedException("Proprietarii de animale pot vizualiza doar propriile programari!");
        }
        if(!usefulFunctions.isAdmin(currentUser)) {
            if(usefulFunctions.isVet(currentUser)) {
                vet = currentUser.getUsername();
            }
            else if (usefulFunctions.isPetOwner(currentUser)) {
                owner = currentUser.getUsername();
            }
        }
        Pet dbpet = pet != null ? petService.getPetById(pet) : null;
        User dbVet = vet != null ? userService.getUserByUsername(vet) : null;
        User dbCancelledBy = cancelledBy != null ? userService.getUserByUsername(cancelledBy) : null;
        User dbOwner = owner != null ? userService.getUserByUsername(owner) : null;
        Clinic dbClinic = clinic != null ? clinicService.getClinicById(clinic) : null;
        return ResponseEntity.ok().body(appointmentService.getAppointments(dbpet, dbVet, startDate, endDate, status, dbCancelledBy, dbOwner, dbClinic).stream().map(appointmentMapper::toAppointmentDTO).toList());
    }

}
