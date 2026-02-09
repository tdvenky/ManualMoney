package com.manualmoney.service;

import com.manualmoney.model.AppData;
import com.manualmoney.repository.JsonDataRepository;
import org.springframework.stereotype.Service;

@Service
public class DataService {

    private final JsonDataRepository repository;

    public DataService(JsonDataRepository repository) {
        this.repository = repository;
    }

    public AppData exportData() {
        return repository.exportData();
    }

    public void importData(AppData data) {
        repository.importData(data);
    }
}
