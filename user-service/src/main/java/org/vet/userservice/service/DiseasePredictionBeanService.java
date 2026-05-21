package org.vet.userservice.service;

import com.opencsv.bean.CsvToBeanBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.vet.userservice.other.DiseasePredictionBean;
import org.vet.userservice.other.SymptomsBean;
import org.vet.userservice.repository.DiseasePredictionBeanRepository;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.util.List;

@Service
public class DiseasePredictionBeanService {

    @Autowired
    private DiseasePredictionBeanRepository diseasePredictionBeanRepository;

    public List<DiseasePredictionBean> beanBuilder(String path) throws FileNotFoundException {
        return new CsvToBeanBuilder<DiseasePredictionBean>(new FileReader(path))
                .withType(DiseasePredictionBean.class)
                .withIgnoreLeadingWhiteSpace(true)
                .build()
                .parse();
    }

    public List<DiseasePredictionBean> getAllDiseasePredictionBeans() {
        return diseasePredictionBeanRepository.findAll();
    }

    public List<DiseasePredictionBean> saveAllDiseasePredictionBeans(List<DiseasePredictionBean> diseasePredictionBeans) {
        return diseasePredictionBeanRepository.saveAll(diseasePredictionBeans);
    }
}
