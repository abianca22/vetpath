package org.vet.userservice.repository;

import org.aspectj.weaver.ast.Not;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.vet.userservice.model.entity.Appointment;
import org.vet.userservice.model.entity.Notification;
import org.vet.userservice.model.entity.User;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    @Query("""
            SELECT notification FROM Notification notification WHERE notification.appointment = :appointment ORDER BY notification.date DESC LIMIT 1
""")
    Notification findLastByAppointment(Appointment appointment);

    List<Notification> findAllByAppointment(Appointment appointment);

    List<Notification> findAllByReceiverOrderByDateDesc(User receiver);

}
