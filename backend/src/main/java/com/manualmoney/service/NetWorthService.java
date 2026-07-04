package com.manualmoney.service;

import com.manualmoney.model.CustomNetWorthCategory;
import com.manualmoney.model.NetWorthCategory;
import com.manualmoney.model.NetWorthCategoryType;
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

    public List<CustomNetWorthCategory> getCustomCategories() {
        return repository.findAllCustomNetWorthCategories();
    }

    public CustomNetWorthCategory createCustomCategory(String name, NetWorthCategoryType type) {
        CustomNetWorthCategory category = new CustomNetWorthCategory(name, type);
        return repository.saveCustomNetWorthCategory(category);
    }

    public boolean deleteCustomCategory(UUID id) {
        if (!repository.findCustomNetWorthCategoryById(id).isPresent()) {
            return false;
        }
        String key = id.toString();
        boolean inUse = repository.findAllNetWorthSnapshots().stream()
                .flatMap(s -> s.getEntries().stream())
                .anyMatch(e -> key.equals(e.getCategory()));
        if (inUse) {
            throw new IllegalStateException("Cannot delete a category that is used in an existing snapshot");
        }
        repository.deleteCustomNetWorthCategory(id);
        return true;
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
