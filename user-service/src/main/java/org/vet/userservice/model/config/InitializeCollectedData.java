
package org.vet.userservice.model.config;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.vet.userservice.model.entity.*;
import org.vet.userservice.other.SymptomsBean;
import org.vet.userservice.service.*;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class InitializeCollectedData implements CommandLineRunner {

    private final String symptomsDataPath = "src/main/resources/pet-health-symptoms-dataset.csv";
    private final String diseasePredictionDataPath = "src/main/resources/cleaned_animal_disease_prediction.csv";

    @Autowired
    private SymptomsBeanService symptomsBeanService;

    @Autowired
    private DiseasePredictionBeanService diseasePredictionBeanService;

    @Override
    public void run(String... args) throws Exception {
        // Initialize symptoms data
        var symptomsBeans = symptomsBeanService.beanBuilder(symptomsDataPath);
        if (symptomsBeanService.getAllSymptomsBeans().isEmpty()) {
            symptomsBeanService.saveAllSymptomsBeans(symptomsBeans);
        }

        var diseasePredictionBeans = diseasePredictionBeanService.beanBuilder(diseasePredictionDataPath);
        if (diseasePredictionBeanService.getAllDiseasePredictionBeans().isEmpty()) {
            diseasePredictionBeanService.saveAllDiseasePredictionBeans(diseasePredictionBeans);
        }
    }
}
