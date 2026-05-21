package org.vet.userservice.service;

import com.opencsv.bean.CsvToBeanBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.vet.userservice.other.SymptomsBean;
import org.vet.userservice.repository.SymptomsBeanRepository;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.nio.file.Path;
import java.util.List;

@Service
public class SymptomsBeanService {

    @Autowired
    private SymptomsBeanRepository symptomsBeanRepository;


    public List<SymptomsBean> beanBuilder(String path) throws FileNotFoundException {
        return new CsvToBeanBuilder<SymptomsBean>(new FileReader(path))
                .withType(SymptomsBean.class)
                .withIgnoreLeadingWhiteSpace(true)
                .build()
                .parse();
    }

    public List<SymptomsBean> getAllSymptomsBeans() {
        return symptomsBeanRepository.findAll();
    }

    public List<SymptomsBean> saveAllSymptomsBeans(List<SymptomsBean> symptomsBeans) {
        return symptomsBeanRepository.saveAll(symptomsBeans);
    }

    public SymptomsBean update(SymptomsBean symptomsBean) {
        return symptomsBeanRepository.save(symptomsBean);
    }
}
