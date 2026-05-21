package org.vet.userservice.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.vet.userservice.model.entity.MedicalRecord;
import org.vet.userservice.model.entity.Pet;
import org.vet.userservice.model.enums.PetGender;
import org.vet.userservice.other.UsefulFunctions;
import org.vet.userservice.service.MedicalRecordService;
import org.vet.userservice.service.PetService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/chat")
public class ChatController {
    @Autowired
    private ChatClient chatClient;

    @Autowired
    private PetService petService;

    @Autowired
    private MedicalRecordService medicalRecordService;
    @Autowired
    private UsefulFunctions usefulFunctions;

    @PostMapping("/ask/{id}")
    public String ask(@RequestBody String userMessage, @PathVariable Integer id) {
        Pet pet = petService.getPetById(id);
        List<MedicalRecord> records = medicalRecordService.findTopKMostRecentByPet(pet, 5);
        List<String> recordsHistory = records.stream().map(record -> """
                \tData consultatiei: %s,
                \tSimptomatologie: %s,
                \tDiagnostic: %s,
                \tTratament: %s
                
                """.formatted(
                        record.getAppointment().getSlot().format(usefulFunctions.dateTimeFormatter()),
                        record.getSymptoms() != null && !record.getSymptoms().isEmpty() ? record.getSymptoms() : "Nu se mentioneaza",
                        record.getDiagnosis() != null && !record.getDiagnosis().isEmpty() ? record.getDiagnosis() : "Nu se mentioneaza",
                        record.getTreatment() != null && !record.getTreatment().isEmpty() ? record.getTreatment() : "Nu se mentioneaza"
                )
        ).toList();
        String medicalHistory = recordsHistory.stream().reduce("", (prev, current) -> prev + '\n' + current);
        String history = """
                Numele animalului de companie: %s
                Data nasterii: %s
                Data curenta: %s
                Greutatea: %s
                Sexul: %s
                Rasa: %s
                Istoric medical:
                    %s
                """.formatted(
                        pet.getName(),
                        pet.getBirthDate().format(usefulFunctions.dateFormatter()),
                        LocalDateTime.now().format(usefulFunctions.dateTimeFormatter()),
                        pet.getWeight() != null ? pet.getWeight().toString() : "Nu se cunoaste",
                        (pet.getGender() != null && !pet.getGender().equals(PetGender.NONE)) ? pet.getGender().toString() : "Nu se cunoaste",
                        pet.getBreed() != null ? pet.getBreed().getName() : "Nu se cunoaste",
                        medicalHistory
                );
        System.out.println(history);
        String systemPrompt = "You are a vet assistant. Give a short, clear answer, with words easily understood by basic pet owners. Try to answer by suggesting possible, common causes. Mention if they should contact a vet as soon as possible or if it can wait a few days, while observing. Ask for more details if needed. Mention that the pet owners should not trust your diagnoses entirely. Make the answer as short as possible, so it could be recorded in a report file if a vet decides so. Restrain from giving any advice that could be considered harmful. If the question is not related to veterinary medicine, politely decline to answer and suggest asking a relevant question.";
        String userPrompt = "The question: \"" + userMessage + "\"\n" + history;
        return chatClient.prompt().system(systemPrompt).user(userPrompt).call().content();
//        return "Simptomele par a descrie o posibila rana sau lovitura. In astfel de situatii, ar trebui sa luati legatura cu un medic veterinar, pentru o verificare amanuntita.";
    }

    @PostMapping("/system-prompt")
    public String systemPrompt(@RequestBody String question) {
        return chatClient.prompt().system("You are a vet assistant. Answer questions clearly, with words easily understood by basic pet owners. Mention that the pet owners should not trust your diagnoses entirely.")
                .user(question)
                .call()
                .content();
    }
}
