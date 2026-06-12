package org.vet.userservice.service;

import org.aspectj.weaver.ast.Not;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.vet.userservice.model.entity.Appointment;
import org.vet.userservice.model.entity.MedicalRecord;
import org.vet.userservice.model.entity.Notification;
import org.vet.userservice.model.entity.User;
import org.vet.userservice.other.UsefulFunctions;
import org.vet.userservice.repository.NotificationRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private JavaMailSender javaMailSender;

    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private UsefulFunctions usefulFunctions;

    public Notification createNotificationForCancelledAppointment (User receiver, Appointment appointment) {
        Notification notification = Notification.builder()
                .appointment(appointment)
                .receiver(receiver)
                .title("Programare anulata")
                .content("Programarea din data de " + appointment.getSlot().format(usefulFunctions.dateTimeFormatter()) + " a fost anulata de catre " + appointment.getCancelledBy().getUsername() + ".")
                .date(LocalDateTime.now())
                .seen(false)
                .build();
        return notificationRepository.save(notification);
    }

    public Notification createNotificationForAddedAppointment (Appointment appointment) {
        Notification notification = Notification.builder()
                .appointment(appointment)
                .receiver(appointment.getVet())
                .title("Programare adaugata")
                .content("A fost adaugata o noua programare in data de " + appointment.getSlot().format(usefulFunctions.dateTimeFormatter()) + ".")
                .date(LocalDateTime.now())
                .seen(false)
                .build();
        return notificationRepository.save(notification);
    }

    public Notification createNotificationForConfirmedAppointment (Appointment appointment) {
        Notification notification = Notification.builder()
                .appointment(appointment)
                .receiver(appointment.getPet().getOwner())
                .title("Programare efectuata")
                .content("Programarea din data de " + appointment.getSlot().format(usefulFunctions.dateTimeFormatter()) + " a fost marcata ca efectuata.")
                .date(LocalDateTime.now())
                .seen(false)
                .build();
        return notificationRepository.save(notification);
    }

    public Notification createNotificationForAddedRecord(MedicalRecord medicalRecord) {
        Notification notification = Notification.builder()
                .receiver(medicalRecord.getPet().getOwner())
                .title("Raport medical adaugat")
                .content(medicalRecord.getAppointment() != null ?
                        "Pentru programarea din data de " + medicalRecord.getAppointment().getSlot().format(usefulFunctions.dateTimeFormatter()) + " a fost adaugat un raport medical." :
                        "Un nou raport medical a fost adaugat de catre " + medicalRecord.getVet().getUsername())
                .date(LocalDateTime.now())
                .seen(false)
                .build();
        if (medicalRecord.getAppointment() != null) {
            notification.setAppointment(medicalRecord.getAppointment());
        }
        return notificationRepository.save(notification);
    }

    public Notification createNotificationForUpdatedAppointment(Appointment appointment) {
        Notification notification = Notification.builder()
                .appointment(appointment)
                .receiver(appointment.getPet().getOwner())
                .title("Programare actualizata")
                .content("Programarea din data de " + appointment.getSlot().format(usefulFunctions.dateTimeFormatter()) + " a fost modificata.")
                .date(LocalDateTime.now())
                .seen(false)
                .build();
        return notificationRepository.save(notification);
    }

    public Notification createNotificationForUpdatedRecord(MedicalRecord medicalRecord) {
        Notification notification = Notification.builder()
                .receiver(medicalRecord.getPet().getOwner())
                .title("Raport medical actualizat")
                .content(medicalRecord.getAppointment() != null ?
                        "Pentru programarea din data de " + medicalRecord.getAppointment().getSlot().format(usefulFunctions.dateTimeFormatter()) + ", raportul medical a fost actualizat." :
                        "Raportul medical adaugat in data de " + medicalRecord.getRecordDate().format(usefulFunctions.dateTimeFormatter()) + " a fost actualizat.")
                .date(LocalDateTime.now())
                .seen(false)
                .build();
        if (medicalRecord.getAppointment() != null) {
            notification.setAppointment(medicalRecord.getAppointment());
        }
        return notificationRepository.save(notification);
    }

    public Notification findById(Integer id) {
        return notificationRepository.findById(id).orElse(null);
    }

    public Notification findLastByAppointment(Appointment appointment) {
        return notificationRepository.findLastByAppointment(appointment);
    }

    public void sendEmail(Notification notification) {
        if (notification.getAppointment() != null && notification.getAppointment().getVet() != null && getValidEmails().contains(notification.getAppointment().getVet().getEmail())) {
            String body = notification.getContent().replace(notification.getContent().charAt(0), Character.toLowerCase(notification.getContent().charAt(0)));
            SimpleMailMessage email = new SimpleMailMessage();
            email.setTo(notification.getAppointment().getVet().getEmail());
            email.setSubject(notification.getTitle());
            email.setText("""
                    Buna ziua,

                    Va informam ca %s

                    Multumim!
                    """.formatted(body));
            javaMailSender.send(email);
        }
    }

    public List<Notification> findAllByAppointment(Appointment appointment) {
        return notificationRepository.findAllByAppointment(appointment);
    }

    public List<Notification> findAllByReceiver(User receiver) {
        return notificationRepository.findAllByReceiverOrderByDateDesc(receiver);
    }

    public void deleteById(Integer id) {
        notificationRepository.deleteById(id);
    }

    public Notification updateSeenField(Notification notification) {
        notification.setSeen(true);
        return notificationRepository.save(notification);
    }

    private List<String> getValidEmails() {
        List<String> validEmails = new ArrayList<>();
        validEmails.add("bianca.andrei.f22@gmail.com");
        validEmails.add("vetpathapp@gmail.com");
        validEmails.add("vixxeternity2002@gmail.com");
        return validEmails;
    }
}
