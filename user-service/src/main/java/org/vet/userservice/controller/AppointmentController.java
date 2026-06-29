package org.vet.userservice.controller;

import jakarta.validation.Valid;
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
import org.vet.userservice.model.dto.appointments.AppointmentDTO;
import org.vet.userservice.model.entity.*;
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
    private ClinicService clinicService;
    @Autowired
    private NotificationService notificationService;


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
    public ResponseEntity<?> getSlotByVet(@PathVariable String username, @RequestParam(value="allSlots", required=true) Boolean allSlots, @RequestParam(value="startDate", required = false) Optional<String> startDate, @RequestParam(value="endDate", required = false) Optional<String> endDate, @RequestParam(value="desc", required = false) Optional<Boolean> desc) {
        List<Appointment> appointments = (desc.isPresent() && !desc.get()) ? appointmentService.getByVet(userService.getUserByUsername(username)) : appointmentService.getByVetAsc(userService.getUserByUsername(username));
        if (!allSlots) {
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
        }
        else {
            if (startDate.isPresent()) {
                List<Integer> startDateComponents = new ArrayList<>(List.of(Arrays.stream(startDate.get().split(" ")[0].split("\\.")).map(Integer::parseInt).toArray(Integer[]::new)));
                startDateComponents.addAll(Arrays.stream(startDate.get().split(" ")[1].split(":")).map(Integer::parseInt).toList());
                appointments = appointments.stream().filter(appointment -> appointment.getSlot().isAfter(LocalDateTime.of(startDateComponents.get(2), startDateComponents.get(1), startDateComponents.get(0), startDateComponents.get(3), startDateComponents.get(4)))).toList();
            }
            if (endDate.isPresent()) {
                List<Integer> endDateComponents = new ArrayList<>(List.of(Arrays.stream(endDate.get().split(" ")[0].split("\\.")).map(Integer::parseInt).toArray(Integer[]::new)));
                endDateComponents.addAll(Arrays.stream(endDate.get().split(" ")[1].split(":")).map(Integer::parseInt).toList());
                appointments = appointments.stream().filter(appointment -> appointment.getSlot().isBefore(LocalDateTime.of(endDateComponents.get(2), endDateComponents.get(1), endDateComponents.get(0), endDateComponents.get(3), endDateComponents.get(4)))).toList();
            }
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
        appointment.setCurrentOwner(userService.getUserById(currentUser.getId()));
        appointmentService.addAppointment(appointment, pet);
        return ResponseEntity.ok().body(appointmentMapper.toAppointmentDTO(appointment));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt, @RequestBody @Valid CancelledAppointmentDTO cancelAppointmentDTO, @RequestParam(value="freeSlot", required = false) Boolean freeSlot) {
        var currentUser = usefulFunctions.decodeJWT(jwt);
        var appointment = appointmentService.getById(id);
        if(!usefulFunctions.isAdmin(currentUser) && appointment.getCurrentOwner() != null &&
                !currentUser.getId().equals(appointment.getCurrentOwner().getId()) &&
                appointment.getVet() != null &&
                !currentUser.getId().equals(appointment.getVet().getId())) {
            throw new AccessDeniedException("Doar proprietarul animalului, medicul care a creat slotul sau administratorii pot anula aceasta programare.");
        }
        if (appointment.getStatus() != AppointmentStatus.BOOKED) {
            throw new InvalidDataException("Doar programarile rezervate pot fi anulate.");
        }
        if (appointment.getCurrentOwner() != null && currentUser.getId().equals(appointment.getCurrentOwner().getId())) {
            freeSlot = true;
        }
        appointment.setCancelledBy(userMapper.toUser(currentUser));
        appointment.setCancelReason(cancelAppointmentDTO.getCancelReason());
        return ResponseEntity.ok().body(appointmentMapper.toAppointmentDTO(appointmentService.cancelAppointment(appointment, freeSlot != null && freeSlot)));
    }

    @GetMapping("/pet/{petId}")
    public ResponseEntity<?> getAppointmentsByPet(@PathVariable Integer petId, @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        Pet pet = petService.getPetById(petId);
        if(usefulFunctions.isPetOwner(currentUser) && !currentUser.getId().equals(pet.getOwner().getId())) {
            throw new AccessDeniedException("Proprietarii de animale pot vizualiza doar propriile programari!");
        }
        return ResponseEntity.ok().body(appointmentService.getAppointments(pet, null, null, null, null, null, null, null).stream().map(appointmentMapper::toAppointmentDTO).toList());
    }

    @GetMapping
    public ResponseEntity<?> getAppointments(@RequestParam(value="pet") Optional<String> pet,
                                             @RequestParam(value="vet") Optional<String> vet,
                                             @RequestParam(value="startDate") Optional<String> startDate,
                                             @RequestParam(value="endDate") Optional<String> endDate,
                                             @RequestParam(value="status") Optional<Boolean> status,
                                             @RequestParam(value="cancelledBy") Optional<String> cancelledBy,
                                             @RequestParam(value="owner") Optional<String> owner,
                                             @RequestParam(value="clinic") Optional<Integer> clinic,
                                             @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        List<Appointment> appointments = new ArrayList<>();
        if (!usefulFunctions.isAdmin(currentUser)) {
            if (usefulFunctions.isPetOwner(currentUser)) {
                appointments = appointmentService.getAppointments(null, null, null, null, null, null, userService.getUserById(currentUser.getId()), null);
            } else if (usefulFunctions.isVet(currentUser)) {
                appointments = appointmentService.getAppointments(null, userService.getUserById(currentUser.getId()), null, null, null, null, null, null);
            }
        }
        else {
            appointments = appointmentService.getAppointments(null, null, null, null, null, null, null, null);
        }
        if (vet.isPresent() && !vet.get().isEmpty()) {
            appointments = appointments.stream().filter(appointment -> appointment.getVet().getLastName().toLowerCase().contains(vet.get().toLowerCase())
            || appointment.getVet().getFirstName().toLowerCase().contains(vet.get().toLowerCase())
            || appointment.getVet().getUsername().toLowerCase().contains(vet.get().toLowerCase())).toList();
        }
        if (pet.isPresent() && !pet.get().isEmpty()) {
            appointments = appointments.stream().filter(appointment -> appointment.getPet() != null && appointment.getPet().getName().toLowerCase().contains(pet.get().toLowerCase())).toList();
        }
        if (owner.isPresent() && !owner.get().isEmpty()) {
            appointments = appointments.stream().filter(appointment -> appointment.getPet() != null && (appointment.getPet().getOwner().getLastName().toLowerCase().contains(owner.get().toLowerCase())
            || appointment.getPet().getOwner().getFirstName().toLowerCase().contains(owner.get().toLowerCase())
            || appointment.getPet().getOwner().getUsername().toLowerCase().contains(owner.get().toLowerCase()))).toList();
        }
        if (clinic.isPresent()) {
            appointments = appointments.stream().filter(appointment -> appointment.getClinic() != null && appointment.getClinic().getId().equals(clinic.get())).toList();
        }
        if (status.isPresent()) {
            if (status.get()) {
                appointments = appointments.stream().filter(appointment -> appointment.getStatus().equals(AppointmentStatus.BOOKED)).toList();
            } else {
                appointments = appointments.stream().filter(appointment -> appointment.getStatus().equals(AppointmentStatus.CANCELLED)).toList();
            }
        }
        if (startDate.isPresent()) {
            List<Integer> startDateComponents = new ArrayList<>(List.of(Arrays.stream(startDate.get().split("\\.")).map(Integer::parseInt).toArray(Integer[]::new)));
            appointments = appointments.stream().filter(appointment -> appointment.getSlot().isAfter(LocalDateTime.of(startDateComponents.get(2), startDateComponents.get(1), startDateComponents.get(0), 0, 0))).toList();
        }
        if (endDate.isPresent()) {
            List<Integer> endDateComponents = new ArrayList<>(List.of(Arrays.stream(endDate.get().split("\\.")).map(Integer::parseInt).toArray(Integer[]::new)));
            appointments = appointments.stream().filter(appointment -> appointment.getSlot().isBefore(LocalDateTime.of(endDateComponents.get(2), endDateComponents.get(1), endDateComponents.get(0), 23, 59))).toList();
        }
        if (cancelledBy.isPresent() && !cancelledBy.get().isEmpty()) {
            appointments = appointments.stream().filter(appointment -> appointment.getCancelledBy() != null  && (appointment.getCancelledBy().getLastName().toLowerCase().contains(cancelledBy.get().toLowerCase())
            || appointment.getCancelledBy().getFirstName().contains(cancelledBy.get().toLowerCase())
            || appointment.getCancelledBy().getUsername().contains(cancelledBy.get()))).toList();
        }
        return ResponseEntity.ok().body(appointments.stream().map(appointmentMapper::toAppointmentDTO).toList());
    }


    @GetMapping("/appointment/{id}")
    public ResponseEntity<?> getAppointment(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        Appointment appointment = appointmentService.getById(id);
        if (!usefulFunctions.isAdmin(currentUser) &&
                (
                        (appointment.getPet() != null && appointment.getPet().getOwner() != null && !appointment.getPet().getOwner().getId().equals(currentUser.getId()))
                                || (appointment.getCurrentOwner() != null && !appointment.getCurrentOwner().getId().equals(currentUser.getId()))
                )
                                && appointment.getVet() != null && !appointment.getVet().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Doar administratorii si utilizatorii asociati programarii o pot vizualiza.");
        }
        return ResponseEntity.ok().body(appointmentMapper.toAppointmentDTO(appointment));
    }

    @PutMapping("/{id}/edit")
    public ResponseEntity<?> changeAppointmentPet(@PathVariable Integer id, @RequestBody PetDTO petDTO, @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        Appointment appointment = appointmentService.getById(id);
        if (!usefulFunctions.isAdmin(currentUser) && !currentUser.getId().equals(appointment.getPet().getOwner().getId())) {
            throw new AccessDeniedException("Doar administratorii sau persoanele care au solicitat programarea pot modifica animalul de companie asociat.");
        }
        appointmentService.updateAppointmentPet(id, petDTO.getId());
        Appointment updatedAppointment = appointmentService.getById(id);
        return ResponseEntity.ok().body(appointmentMapper.toAppointmentDTO(updatedAppointment));
    }

    @PreAuthorize("hasRole('VETERINARIAN')")
    @PutMapping("/{id}/confirm")
    public ResponseEntity<?> confirmAppointment(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        Appointment appointment = appointmentService.getById(id);
        if (appointment.getVet() == null) {
            throw new NoDataFoundException("Veterinarul nu mai detine un cont pe platforma");
        }
        if (!currentUser.getId().equals(appointment.getVet().getId())) {
            throw new AccessDeniedException("Doar veterinarul poate confirma programarea");
        }
        if (!appointment.getVet().getClinics().contains(appointment.getClinic())) {
            throw new AccessDeniedException("Veterinarul nu mai apartine clinicii in care a fost inregistrata programarea");
        }
        return ResponseEntity.ok().body(appointmentMapper.toAppointmentDTO(appointmentService.updatePastAppointmentStatus(id, true)));
    }

    @GetMapping("/upcoming-owner/{k}")
    public ResponseEntity<?> getUpcomingAppointmentsByOwner(@PathVariable Integer k, @AuthenticationPrincipal Jwt jwt, @RequestParam(value="asc") Optional<Boolean> asc) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        return ResponseEntity.ok().body(appointmentService.getTopKByOwner(userService.getUserById(currentUser.getId()), k, LocalDateTime.now(), asc.orElse(true)).stream().map(appointmentMapper::toAppointmentDTO).toList());
    }

    @GetMapping("/upcoming-vet/{k}")
    public ResponseEntity<?> getUpcomingAppointmentsByVet(@PathVariable Integer k, @AuthenticationPrincipal Jwt jwt, @RequestParam(value="asc") Optional<Boolean> asc) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        return ResponseEntity.ok().body(appointmentService.getTopKByVet(userService.getUserById(currentUser.getId()), k, LocalDateTime.now(), asc.orElse(true)).stream().map(appointmentMapper::toAppointmentDTO).toList());
    }

    @GetMapping("/{id}/send-email")
    public ResponseEntity<?> sendEmail(@PathVariable Integer id) {
        Appointment appointment = appointmentService.getById(id);
        Notification notification = notificationService.findLastByAppointment(appointment);
        notificationService.sendEmail(notification);
        return ResponseEntity.ok().build();
    }
}
