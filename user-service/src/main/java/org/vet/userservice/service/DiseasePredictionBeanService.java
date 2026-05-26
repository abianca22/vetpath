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

    public List<DiseasePredictionBean> findByKeyword(String keyword) {
        var results = diseasePredictionBeanRepository.findByKeyword(keyword);
        return results.stream().filter(bean -> {
           if (keyword.trim().equalsIgnoreCase("vomiting") && bean.getVomiting().equalsIgnoreCase("no")) {
               return false;
           } else if (keyword.trim().toLowerCase().contains("skin lesion") && bean.getSkinLesions().equalsIgnoreCase("no")) {
               return false;
           } else if (keyword.trim().toLowerCase().contains("nasal discharge") && bean.getNasalDischarge().equalsIgnoreCase("no")) {
                return false;
           } else if (keyword.trim().toLowerCase().contains("lameness") && bean.getLameness().equalsIgnoreCase("no")) {
               return false;
           } else if (keyword.trim().toLowerCase().contains("labored breathing") && bean.getLabored_breathing().equalsIgnoreCase("no")) {
               return false;
           } else if (keyword.trim().toLowerCase().contains("eye discharge") && bean.getEyeDischarge().equalsIgnoreCase("no")) {
               return false;
           } else if (keyword.trim().toLowerCase().contains("diarrhea") && bean.getDiarrhea().equalsIgnoreCase("no")) {
               return false;
           } else if (keyword.trim().toLowerCase().contains("cough") && bean.getCoughing().equalsIgnoreCase("no")) {
               return false;
           } else if ((keyword.trim().toLowerCase().contains("appetite loss") || keyword.trim().toLowerCase().contains("loss of appetite")) && bean.getAppetiteLoss().equalsIgnoreCase("no")) {
               return false;
           }
           return true;
        }).toList();
    }

    public DiseasePredictionBean update(DiseasePredictionBean diseasePredictionBean) {
        return diseasePredictionBeanRepository.save(diseasePredictionBean);
    }
}
