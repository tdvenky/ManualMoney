package com.manualmoney.service;

import com.manualmoney.model.NetWorthCategory;
import com.manualmoney.model.NetWorthEntry;
import com.manualmoney.model.NetWorthSnapshot;
import com.manualmoney.repository.JsonDataRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class NetWorthService {

    private final JsonDataRepository repository;

    public NetWorthService(JsonDataRepository repository) {
        this.repository = repository;
    }

    public NetWorthCategory[] getCategories() {
        return NetWorthCategory.values();
    }

    public List<NetWorthSnapshot> getAllSnapshots() {
        return repository.findAllNetWorthSnapshots();
    }

    public Optional<NetWorthSnapshot> getSnapshotById(UUID id) {
        return repository.findNetWorthSnapshotById(id);
    }

    public NetWorthSnapshot createSnapshot(LocalDate date, List<NetWorthEntry> entries, String notes) {
        NetWorthSnapshot snapshot = new NetWorthSnapshot();
        snapshot.setDate(date);
        snapshot.setEntries(entries);
        snapshot.setNotes(notes);
        return repository.saveNetWorthSnapshot(snapshot);
    }

    public Optional<NetWorthSnapshot> updateSnapshot(UUID id, LocalDate date, List<NetWorthEntry> entries, String notes) {
        return repository.findNetWorthSnapshotById(id).map(snapshot -> {
            snapshot.setDate(date);
            snapshot.setEntries(entries);
            snapshot.setNotes(notes);
            return repository.saveNetWorthSnapshot(snapshot);
        });
    }

    public boolean deleteSnapshot(UUID id) {
        if (repository.findNetWorthSnapshotById(id).isPresent()) {
            repository.deleteNetWorthSnapshot(id);
            return true;
        }
        return false;
    }
}
