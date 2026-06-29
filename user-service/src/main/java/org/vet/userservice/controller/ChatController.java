package org.vet.userservice.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.observation.ChatClientCompletionObservationHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.vet.userservice.exception.AccessDeniedException;
import org.vet.userservice.exception.NoDataFoundException;
import org.vet.userservice.model.dto.ChatEntryDTO;
import org.vet.userservice.model.dto.UserDTO;
import org.vet.userservice.model.entity.*;
import org.vet.userservice.model.enums.AppointmentStatus;
import org.vet.userservice.model.enums.PetGender;
import org.vet.userservice.model.mapper.ChatEntryMapper;
import org.vet.userservice.model.mapper.MedicalRecordMapper;
import org.vet.userservice.other.DiseasePredictionBean;
import org.vet.userservice.other.SymptomsBean;
import org.vet.userservice.other.UsefulFunctions;
import org.vet.userservice.service.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
    @Autowired
    private SymptomsBeanService symptomsBeanService;
    @Autowired
    private DiseasePredictionBeanService diseasePredictionBeanService;
    @Autowired
    private ChatEntryService chatEntryService;
    @Autowired
    private UserService userService;
    @Autowired
    private ChatEntryMapper chatEntryMapper;
    @Autowired
    private MedicalRecordMapper medicalRecordMapper;
    @Autowired
    private AppointmentService appointmentService;

    @PostMapping("/ask/{id}")
    public String ask(@RequestBody String userMessage, @PathVariable Integer id) {
        String extractedSymptomsResponse = chatClient.prompt("Extract the symptoms from the following message, translate them to english and list them in a comma separated format. If there are no symptoms mentioned, answer with \"none\". On the second row, list them using the same format, but in Romanian.\nMessage: \"" + userMessage + "\"").call().content();
        String[] extractedSymptoms = extractedSymptomsResponse != null ? extractedSymptomsResponse.split("\n")[0].split(",") : new String[0];
        List<SymptomsBean> symptomsList = new ArrayList<>();
        for (String symptom : extractedSymptoms) {
            symptomsList.addAll(symptomsBeanService.findByKeyword(symptom));
        }
        List<DiseasePredictionBean> diseasePredictionsList = new ArrayList<>();
        for (String symptom : extractedSymptoms) {
            diseasePredictionsList.addAll(diseasePredictionBeanService.findByKeyword(symptom));
        }
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
                Alte date observate la alte animale de companie cu simptome similare:
                    \t%s
                    \t%s
                """.formatted(
                pet.getName(),
                pet.getBirthDate().format(usefulFunctions.dateFormatter()),
                LocalDateTime.now().format(usefulFunctions.dateTimeFormatter()),
                pet.getWeight() != null ? pet.getWeight().toString() : "Nu se cunoaste",
                (pet.getGender() != null && !pet.getGender().equals(PetGender.NONE)) ? pet.getGender().toString() : "Nu se cunoaste",
                pet.getBreed() != null ? pet.getBreed().getName() : "Nu se cunoaste",
                medicalHistory,
                symptomsList.stream().map(SymptomsBean::toString).reduce("", (prev, current) -> prev + '\n' + current),
                diseasePredictionsList.stream().map(DiseasePredictionBean::toString).reduce("", (prev, current) -> prev + '\n' + current)
        );
        System.out.println(history);
        String systemPrompt = "You are a vet assistant. Give a short, clear answer, with words easily understood by basic pet owners. Try to answer by suggesting possible, common causes. Mention if they should contact a vet as soon as possible or if it can wait a few days, while observing. Ask for more details if needed. Mention that the pet owners should not trust your diagnoses entirely. Make the answer as short as possible, so it could be recorded in a report file if a vet decides so. Restrain from giving any advice that could be considered harmful. If the question is not related to veterinary medicine, politely decline to answer and suggest asking a relevant question.";
        String userPrompt = "The question: \"" + userMessage + "\"\n" + history;
        System.out.println("Mesajul utilizatorului: " + userMessage);
        String result = chatClient.prompt().system(systemPrompt).user(userPrompt).call().content();
        System.out.println("Raspunsul Gemini: " + result);
        ChatEntry chatEntry = ChatEntry.builder()
                .userMessage(userMessage)
                .botResponse(result)
                .symptoms(extractedSymptomsResponse != null ? extractedSymptomsResponse.split("\n")[1] : "")
                .timestamp(LocalDateTime.now())
                .pet(pet)
                .build();
        chatEntryService.saveChatEntry(chatEntry);
        return result;
//        return "Simptomele par a descrie o posibila rana sau lovitura. In astfel de situatii, ar trebui sa luati legatura cu un medic veterinar, pentru o verificare amanuntita.";
    }

    @PostMapping("/system-prompt")
    public String systemPrompt(@RequestBody String question) {
        return chatClient.prompt().system("You are a vet assistant. Answer questions clearly, with words easily understood by basic pet owners. Mention that the pet owners should not trust your diagnoses entirely.")
                .user(question)
                .call()
                .content();
    }

    @GetMapping("/history/{petId}")
    public ResponseEntity<?> getChatHistory(@PathVariable Integer petId, @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        Pet pet = petService.getPetById(petId);
        if (!currentUser.getId().equals(pet.getOwner().getId()) && !usefulFunctions.isAdmin(currentUser) && !usefulFunctions.isVet(currentUser)) {
            throw new AccessDeniedException("Doar proprietarii, administratorii si veterinarii pot vedea istoricul intrebarilor");
        }
        return ResponseEntity.ok().body(chatEntryService.getChatEntriesByPet(pet).stream().map(chatEntryMapper::toChatEntryDTO).toList());
    }

    @PutMapping("/approve/{chatEntryId}")
    public ResponseEntity<?> approveChatEntry(@PathVariable Integer chatEntryId, @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        User vet = userService.getUserById(currentUser.getId());
        ChatEntry chatEntry = chatEntryService.findById(chatEntryId);
        if (!usefulFunctions.isVet(currentUser) && !usefulFunctions.isAdmin(currentUser)) {
            throw new AccessDeniedException("Doar administratorii si veterinarii pot aproba raspunsurile oferite de bot");
        }
        if (chatEntry.getMedicalRecord() != null) {
            throw new AccessDeniedException("Raspunsul oferit de bot pentru aceasta intrebare a fost deja aprobat si inregistrat de un veterinar");
        }
        if (usefulFunctions.isVet(currentUser)) {
            List<MedicalRecord> medicalRecords = medicalRecordService.findAllByVetAndPet(vet, chatEntry.getPet());
            if (medicalRecords.isEmpty()) {
                throw new AccessDeniedException("Doar veterinarii care au consultat acest animal de companie pot aproba raspunsurile oferite de bot");
            }
            MedicalRecord medicalRecord = MedicalRecord.builder()
                    .pet(chatEntry.getPet())
                    .vet(vet)
                    .diagnosis("Recomandare bot: " + chatEntry.getBotResponse() + "\n\nAceasta recomandare a fost oferita de un asistent virtual, pe baza informatiilor disponibile. Nu se cunoaste cu exactitate acuratetea acestei recomandari, asa ca ar trebui sa nu va bazati complet pe ea. Daca starea animalului de companie se inrautateste sau daca aveti orice dubiu, ar trebui sa contactati un medic veterinar pentru o consultatie amanuntita.")
                    .symptoms(chatEntry.getSymptoms())
                    .recordDate(chatEntry.getTimestamp())
                    .build();
            chatEntry.setApprovedBy(vet);
            MedicalRecord newRecord = medicalRecordService.addRecord(medicalRecord);
            chatEntry.setMedicalRecord(newRecord);
            chatEntryService.saveChatEntry(chatEntry);
            return ResponseEntity.ok().body(medicalRecordMapper.toRecordDTO(newRecord));
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/approved-by/{vetId}")
    public ResponseEntity<?> getApprovedChatEntriesByVet(@PathVariable String vetId, @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        if (!currentUser.getId().equals(vetId) && !usefulFunctions.isAdmin(currentUser)) {
            throw new AccessDeniedException("Doar administratorii si veterinarul in cauza pot vedea raspunsurile oferite de bot pe care acesta le-a aprobat");
        }
        User vet = userService.getUserById(vetId);
        return ResponseEntity.ok().body(chatEntryService.getChatEntriesByApprovedBy(vet).stream().map(chatEntryMapper::toChatEntryDTO).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getChatEntryById(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        ChatEntry chatEntry = chatEntryService.findById(id);
        if (chatEntry == null) {
            throw new NoDataFoundException("Nu s-a gasit nicio intrare in chat cu id-ul: " + id);
        }
        if (!currentUser.getId().equals(chatEntry.getPet().getOwner().getId()) && !usefulFunctions.isAdmin(currentUser) && !usefulFunctions.isVet(currentUser)) {
                throw new AccessDeniedException("Doar proprietarii, administratorii si veterinarii pot vedea aceasta intrare in chat");
        }
        return ResponseEntity.ok().body(chatEntryMapper.toChatEntryDTO(chatEntry));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteChatEntry(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUser = usefulFunctions.decodeJWT(jwt);
        ChatEntry chatEntry = chatEntryService.findById(id);
        if (chatEntry == null) {
            throw new NoDataFoundException("Nu s-a gasit nicio intrare in chat cu id-ul: " + id);
        }
        if (!usefulFunctions.isAdmin(currentUser) && !currentUser.getId().equals(chatEntry.getPet().getOwner().getId())) {
            throw new AccessDeniedException("Doar administratorii si proprietarul animalului de companie pot sterge aceasta intrare in chat");
        }
        chatEntryService.deleteChatEntry(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/owner/{username}")
    public ResponseEntity<?> getAllEntriesByOwner(@PathVariable String username, @AuthenticationPrincipal Jwt jwt,
                                                  @RequestParam(value = "pet") Optional<Integer> pet,
                                                  @RequestParam(value = "keyword") Optional<String> keyword) {
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        User owner = userService.getUserByUsername(username);
        List<ChatEntry> chatEntries = chatEntryService.findAllByOwner(owner);
        if (!usefulFunctions.isAdmin(currentUserDTO) && !usefulFunctions.isVet(currentUserDTO) && !currentUserDTO.getId().equals(owner.getId())) {
            throw new AccessDeniedException("Doar proprietarii, administratorii si medicii au drept de vizualizare a istoricului");
        }
        if (pet.isPresent()) {
            chatEntries = chatEntries.stream().filter(chatEntry -> chatEntry.getPet() != null && chatEntry.getPet().getId().equals(pet.get())).collect(Collectors.toList());
        }
        if (keyword.isPresent()){
            chatEntries = chatEntries.stream().filter(chatEntry -> chatEntry.getUserMessage().toLowerCase().contains(keyword.get().toLowerCase())
            || chatEntry.getBotResponse().toLowerCase().contains(keyword.get())).toList();
        }
        return ResponseEntity.ok().body(chatEntries.stream().map(chatEntryMapper::toChatEntryDTO).toList());
    }

    @GetMapping("/record/{id}")
    public ResponseEntity<?> getEntryByRecord(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        UserDTO currentUserDTO = usefulFunctions.decodeJWT(jwt);
        MedicalRecord record = medicalRecordService.findById(id);
        ChatEntry chatEntry = chatEntryService.getByRecord(record);
        if (!usefulFunctions.isAdmin(currentUserDTO) && !usefulFunctions.isVet(currentUserDTO) && !chatEntry.getPet().getOwner().getId().equals(currentUserDTO.getId())) {
            throw new AccessDeniedException("Doar membrii personalului si utilizatorul care a trimis intrebarea pot vizualiza raportul.");
        }
        return ResponseEntity.ok().body(chatEntryMapper.toChatEntryDTO(chatEntry != null ? chatEntry : new ChatEntry()));
    }
}
