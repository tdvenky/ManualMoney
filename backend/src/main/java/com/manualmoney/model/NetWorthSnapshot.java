package com.manualmoney.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class NetWorthSnapshot {

    private UUID id;
    private LocalDate date;
    private List<NetWorthEntry> entries;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public NetWorthSnapshot() {
        this.id = UUID.randomUUID();
        this.entries = new ArrayList<>();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public List<NetWorthEntry> getEntries() { return entries; }
    public void setEntries(List<NetWorthEntry> entries) { this.entries = entries; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
