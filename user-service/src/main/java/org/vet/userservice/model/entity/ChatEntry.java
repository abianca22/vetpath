package org.vet.userservice.model.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_responses")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatEntry {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Integer id;
    private String userMessage;
    @Column(columnDefinition = "TEXT")
    private String botResponse;
    private String symptoms;
    private LocalDateTime timestamp;

    @OneToOne
    @JsonManagedReference
    @JoinColumn(name = "medical_record_id")
    private MedicalRecord medicalRecord;

    @ManyToOne
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @ManyToOne
    @JoinColumn(name = "pet_id")
    private Pet pet;

}
