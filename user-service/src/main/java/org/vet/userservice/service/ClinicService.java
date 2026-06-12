package org.vet.userservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.vet.userservice.exception.AccessDeniedException;
import org.vet.userservice.exception.InvalidDataException;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.entity.Appointment;
import org.vet.userservice.model.entity.Clinic;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.model.enums.AppointmentStatus;
import org.vet.userservice.repository.ClinicRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ClinicService {
    @Autowired
    private ClinicRepository clinicRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private RoleService roleService;

    @Autowired
    private AppointmentService appointmentService;
    @Autowired
    private PetService petService;

    public Clinic addClinic(Clinic clinic) {
        return clinicRepository.save(clinic);
    }

    public Clinic getClinicById(Integer id) {
        return clinicRepository.findById(id).orElseThrow(() -> new NoDataFoundException("Nu a fost gasita nicio clinica avand id=" + id.toString()));
    }

    public void deleteClinic(Clinic clinic) {
            var appointments = appointmentService.getByClinic(clinic);
            for (var j = 0; j < appointments.size(); j++) {
                if (appointments.get(j).getStatus().equals(AppointmentStatus.AVAILABLE)) {
                    System.out.println(appointments.get(j).getId());
                    appointmentService.deleteSlot(appointments.get(j).getId());
                }
                else if (appointments.get(j).getStatus().equals(AppointmentStatus.BOOKED)) {
                    System.out.println(appointments.get(j).getId());
                    if(appointments.get(j).getSlot().isAfter(LocalDateTime.now())) {
                        System.out.println(appointments.get(j).getId());
                        appointments.get(j).setCancelReason("Stergere clinica " + clinic.getName());
                        appointments.get(j).setCancelledBy(userService.getUserByUsername("admin"));
                        appointments.get(j).setClinic(null);
                        appointmentService.cancelAppointment(appointments.get(j), false);
                    }
                    else {
                        appointments.get(j).setClinic(null);
                        appointmentService.changeClinic(appointments.get(j));
                    }
                }
                else {
                    appointments.get(j).setClinic(null);
                    appointmentService.changeClinic(appointments.get(j));
                }
            }
        clinicRepository.delete(clinic);
    }

    public Clinic addVetToClinic(Clinic clinic, User vet) {
        Clinic dbClinic = getClinicById(clinic.getId());
        User dbUser = userService.getUserById(vet.getId());
        if (!dbUser.getRoles().contains(roleService.findByName("VETERINARIAN"))) {
            throw new AccessDeniedException("Utilizatorul nu este medic veterinar");
        }
        if (dbClinic.getVets().contains(dbUser)) {
            throw new InvalidDataException("Utilizatorul este deja asociat clinicii");
        }
        dbClinic.getVets().add(dbUser);
        return clinicRepository.save(dbClinic);
    }

    public Clinic removeVetFromClinic(Clinic clinic, User vet, String reason) {
        Clinic dbClinic = getClinicById(clinic.getId());
        User dbUser = userService.getUserById(vet.getId());
        if (!dbClinic.getVets().contains(dbUser)) {
            throw new NoDataFoundException("Utilizatorul nu apartine acestei clinici");
        }
        dbClinic.getVets().remove(dbUser);
        var appointments = appointmentService.getByVet(dbUser);
        for (var j = 0; j < appointments.size(); j++) {
            if (appointments.get(j).getStatus().equals(AppointmentStatus.AVAILABLE)) {
                appointmentService.deleteSlot(appointments.get(j).getId());
            }
            else if (appointments.get(j).getStatus().equals(AppointmentStatus.BOOKED) && appointments.get(j).getSlot().isAfter(LocalDateTime.now())){
                appointments.get(j).setCancelReason(reason);
                appointments.get(j).setCancelledBy(dbUser);
                appointmentService.cancelAppointment(appointments.get(j), false);
            }
        }
        return clinicRepository.save(dbClinic);
    }

    public List<Clinic> getClinicsByVetEmployee(User vet) {
        return clinicRepository.findAll().stream().filter(clinic -> clinic.getVets().contains(vet)).toList();
    }

    public List<Clinic> getAllClinics() {
        return clinicRepository.findAll();
    }

    public Clinic updateClinic(Clinic clinic) {
        var clinicDb = this.getClinicById(clinic.getId());
        if (clinicDb.getName() != null && clinic.getName() != null && !clinicDb.getName().isEmpty() && !clinic.getName().isEmpty() && !clinicDb.getName().equals(clinic.getName())) {
            clinicDb.setName(clinic.getName());
        }
        if (clinicDb.getAddress() != null && clinic.getAddress() != null && !clinicDb.getAddress().isEmpty() && !clinic.getAddress().isEmpty() && !clinicDb.getAddress().equals(clinic.getAddress())) {
            clinicDb.setAddress(clinic.getAddress());
        }
        if (clinicDb.getPhoneNumber() != null && clinic.getPhoneNumber() != null && !clinicDb.getPhoneNumber().isEmpty() && !clinic.getPhoneNumber().isEmpty() && !clinicDb.getPhoneNumber().equals(clinic.getPhoneNumber())) {
            clinicDb.setPhoneNumber(clinic.getPhoneNumber());
        }
        return clinicRepository.save(clinicDb);
    }
}
