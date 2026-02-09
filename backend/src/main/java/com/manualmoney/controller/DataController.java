package com.manualmoney.controller;

import com.manualmoney.model.AppData;
import com.manualmoney.service.DataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class DataController {

    private final DataService dataService;

    public DataController(DataService dataService) {
        this.dataService = dataService;
    }

    @GetMapping("/export")
    public AppData exportData() {
        return dataService.exportData();
    }

    @PostMapping("/import")
    public ResponseEntity<Void> importData(@RequestBody AppData data) {
        dataService.importData(data);
        return ResponseEntity.ok().build();
    }
}
