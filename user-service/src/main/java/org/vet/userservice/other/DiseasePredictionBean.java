package org.vet.userservice.other;

import com.opencsv.bean.CsvBindByPosition;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import org.hibernate.annotations.NativeGenerator;

@Builder
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "disease_prediction_data")
public class DiseasePredictionBean {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Integer id;

    @CsvBindByPosition(position = 0)
    private String animalType;

    @CsvBindByPosition(position = 1)
    private String breed;

    @CsvBindByPosition(position = 2)
    private String age;

    @CsvBindByPosition(position = 3)
    private String gender;

    @CsvBindByPosition(position = 4)
    private String weight;

    @CsvBindByPosition(position = 5)
    private String symptom1;

    @CsvBindByPosition(position = 6)
    private String symptom2;

    @CsvBindByPosition(position = 7)
    private String symptom3;

    @CsvBindByPosition(position = 8)
    private String symptom4;

    @CsvBindByPosition(position = 9)
    private String duration;

    @CsvBindByPosition(position = 10)
    private String appetiteLoss;

    @CsvBindByPosition(position = 11)
    private String vomiting;

    @CsvBindByPosition(position = 12)
    private String diarrhea;

    @CsvBindByPosition(position = 13)
    private String coughing;

    @CsvBindByPosition(position = 14)
    private String labored_breathing;

    @CsvBindByPosition(position = 15)
    private String lameness;

    @CsvBindByPosition(position = 16)
    private String skinLesions;

    @CsvBindByPosition(position = 17)
    private String nasalDischarge;

    @CsvBindByPosition(position = 18)
    private String eyeDischarge;

    @CsvBindByPosition(position = 19)
    private String bodyTemperature;

    @CsvBindByPosition(position = 20)
    private String heartRate;

    @CsvBindByPosition(position = 21)
    private String diseasePrediction;

    @Override
    public String toString() {
        return "DiseasePrediction: " +
                "animalType='" + animalType + '\'' +
                ", breed='" + breed + '\'' +
                ", age='" + age + '\'' +
                ", gender='" + gender + '\'' +
                ", weight='" + weight + '\'' +
                ", symptom1='" + symptom1 + '\'' +
                ", symptom2='" + symptom2 + '\'' +
                ", symptom3='" + symptom3 + '\'' +
                ", symptom4='" + symptom4 + '\'' +
                ", duration='" + duration + '\'' +
                ", appetiteLoss='" + appetiteLoss + '\'' +
                ", vomiting='" + vomiting + '\'' +
                ", diarrhea='" + diarrhea + '\'' +
                ", coughing='" + coughing + '\'' +
                ", labored_breathing='" + labored_breathing + '\'' +
                ", lameness='" + lameness + '\'' +
                ", skinLesions='" + skinLesions + '\'' +
                ", nasalDischarge='" + nasalDischarge + '\'' +
                ", eyeDischarge='" + eyeDischarge + '\'' +
                ", bodyTemperature='" + bodyTemperature + '\'' +
                ", heartRate='" + heartRate + '\'' +
                ", diseasePrediction='" + diseasePrediction + '\'' +
                '\n';
    }
}
