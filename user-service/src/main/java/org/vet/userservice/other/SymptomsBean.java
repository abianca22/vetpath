package org.vet.userservice.other;

import com.opencsv.bean.CsvBindByPosition;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Builder
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "sample_data")
public class SymptomsBean {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Integer id;

    @CsvBindByPosition(position = 0)
    private String notes;

    @CsvBindByPosition(position = 1)
    private String condition;

    @CsvBindByPosition(position = 2)
    private String recordType;

    @Override
    public String toString() {
        return "SymptomsBean: " +
                "notes='" + notes + '\'' +
                ", condition='" + condition + '\'' +
                ", recordType='" + recordType + '\'' +
                '\n';
    }
}
