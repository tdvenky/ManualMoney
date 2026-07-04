package com.manualmoney.controller;

import com.manualmoney.model.NetWorthCategory;
import com.manualmoney.model.NetWorthCategoryType;
import com.manualmoney.model.NetWorthEntry;
import com.manualmoney.model.NetWorthSnapshot;
import com.manualmoney.service.NetWorthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/networth")
public class NetWorthController {

    private final NetWorthService netWorthService;

    public NetWorthController(NetWorthService netWorthService) {
        this.netWorthService = netWorthService;
    }

    @GetMapping("/categories")
    public List<CategoryResponse> getCategories() {
        List<CategoryResponse> result = new ArrayList<>();
        for (NetWorthCategory category : netWorthService.getCategories()) {
            result.add(new CategoryResponse(category.name(), category.getLabel(), category.getType()));
        }
        return result;
    }

    @GetMapping("/snapshots")
    public List<NetWorthSnapshot> getAllSnapshots() {
        return netWorthService.getAllSnapshots();
    }

    @GetMapping("/snapshots/{id}")
    public ResponseEntity<NetWorthSnapshot> getSnapshotById(@PathVariable UUID id) {
        return netWorthService.getSnapshotById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/snapshots")
    public NetWorthSnapshot createSnapshot(@RequestBody SnapshotRequest request) {
        return netWorthService.createSnapshot(request.getDate(), request.toEntries(), request.getNotes());
    }

    @PutMapping("/snapshots/{id}")
    public ResponseEntity<NetWorthSnapshot> updateSnapshot(@PathVariable UUID id, @RequestBody SnapshotRequest request) {
        return netWorthService.updateSnapshot(id, request.getDate(), request.toEntries(), request.getNotes())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/snapshots/{id}")
    public ResponseEntity<Void> deleteSnapshot(@PathVariable UUID id) {
        if (netWorthService.deleteSnapshot(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    public static class CategoryResponse {
        private final String key;
        private final String label;
        private final NetWorthCategoryType type;

        public CategoryResponse(String key, String label, NetWorthCategoryType type) {
            this.key = key;
            this.label = label;
            this.type = type;
        }

        public String getKey() { return key; }
        public String getLabel() { return label; }
        public NetWorthCategoryType getType() { return type; }
    }

    public static class SnapshotRequest {
        private LocalDate date;
        private List<EntryRequest> entries = new ArrayList<>();
        private String notes;

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public List<EntryRequest> getEntries() { return entries; }
        public void setEntries(List<EntryRequest> entries) { this.entries = entries; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }

        public List<NetWorthEntry> toEntries() {
            List<NetWorthEntry> result = new ArrayList<>();
            for (EntryRequest e : entries) {
                result.add(new NetWorthEntry(e.getCategory(), e.getAmount()));
            }
            return result;
        }
    }

    public static class EntryRequest {
        private NetWorthCategory category;
        private BigDecimal amount;

        public NetWorthCategory getCategory() { return category; }
        public void setCategory(NetWorthCategory category) { this.category = category; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }
}
