package org.vet.userservice.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class GeminiChatService {
    @Autowired
    private ChatClient chatClient;

    public String askQuestion(String question) {
        return chatClient.prompt(question).call().content();
    }

    public String askWithPersona(String systemPrompt, String userQuestion) {
        return chatClient.prompt().system(systemPrompt).user(userQuestion).call().content();
    }

    public Flux streamAnswer(String question) {
        return chatClient.prompt(question).stream().content();
    }
}
