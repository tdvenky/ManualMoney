package com.manualmoney.service;

import com.manualmoney.model.AppData;
import com.manualmoney.repository.JsonDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class DataService {

    private static final Logger logger = LoggerFactory.getLogger(DataService.class);

    private final JsonDataRepository repository;

    public DataService(JsonDataRepository repository) {
        this.repository = repository;
    }

    public AppData exportData() {
        logger.info("Exported all data");
        return repository.exportData();
    }

    public void importData(AppData data) {
        logger.warn("Importing data - this will replace all existing data");
        repository.importData(data);
        logger.info("Imported data successfully");
    }
}
