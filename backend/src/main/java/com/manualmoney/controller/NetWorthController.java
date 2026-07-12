package com.manualmoney.controller;

import com.manualmoney.model.CustomNetWorthCategory;
import com.manualmoney.model.NetWorthCategory;
import com.manualmoney.model.NetWorthCategoryType;
import com.manualmoney.model.NetWorthEntry;
import com.manualmoney.model.NetWorthSnapshot;
import com.manualmoney.model.NetWorthSubItem;
import com.manualmoney.service.NetWorthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/networth")
public class NetWorthController {

    private static final Logger logger = LoggerFactory.getLogger(NetWorthController.class);

    private final NetWorthService netWorthService;

    public NetWorthController(NetWorthService netWorthService) {
        this.netWorthService = netWorthService;
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        logger.warn("Unprocessable request: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(Collections.singletonMap("error", ex.getMessage()));
    }

    @GetMapping("/categories")
    public List<CategoryResponse> getCategories() {
        List<CategoryResponse> result = new ArrayList<>();
        for (NetWorthCategory category : netWorthService.getCategories()) {
            result.add(new CategoryResponse(category.name(), category.getLabel(), category.getType(), false));
        }
        for (CustomNetWorthCategory custom : netWorthService.getCustomCategories()) {
            result.add(new CategoryResponse(custom.getId().toString(), custom.getName(), custom.getType(), true));
        }
        return result;
    }

    @PostMapping("/categories")
    public CategoryResponse createCategory(@RequestBody CustomCategoryRequest request) {
        CustomNetWorthCategory created = netWorthService.createCustomCategory(request.getName(), request.getType());
        return new CategoryResponse(created.getId().toString(), created.getName(), created.getType(), true);
    }

    @DeleteMapping("/categories/{key}")
    public ResponseEntity<Void> deleteCategory(@PathVariable String key) {
        UUID id;
        try {
            id = UUID.fromString(key);
        } catch (IllegalArgumentException ex) {
            logger.warn("Bad request deleting net worth category: invalid key {}", key);
            return ResponseEntity.notFound().build();
        }
        if (netWorthService.deleteCustomCategory(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
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
        private final boolean custom;

        public CategoryResponse(String key, String label, NetWorthCategoryType type, boolean custom) {
            this.key = key;
            this.label = label;
            this.type = type;
            this.custom = custom;
        }

        public String getKey() { return key; }
        public String getLabel() { return label; }
        public NetWorthCategoryType getType() { return type; }
        public boolean isCustom() { return custom; }
    }

    public static class CustomCategoryRequest {
        private String name;
        private NetWorthCategoryType type;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public NetWorthCategoryType getType() { return type; }
        public void setType(NetWorthCategoryType type) { this.type = type; }
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
                result.add(new NetWorthEntry(e.getCategory(), e.toSubItems()));
            }
            return result;
        }
    }

    public static class EntryRequest {
        private String category;
        private List<SubItemRequest> subItems = new ArrayList<>();

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public List<SubItemRequest> getSubItems() { return subItems; }
        public void setSubItems(List<SubItemRequest> subItems) { this.subItems = subItems; }

        public List<NetWorthSubItem> toSubItems() {
            List<NetWorthSubItem> result = new ArrayList<>();
            for (SubItemRequest s : subItems) {
                result.add(new NetWorthSubItem(s.getName(), s.getAmount()));
            }
            return result;
        }
    }

    public static class SubItemRequest {
        private String name;
        private BigDecimal amount;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }
}
