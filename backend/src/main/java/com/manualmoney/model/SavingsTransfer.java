package com.manualmoney.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class SavingsTransfer {
    // type values: TRANSFER (regular to HYSA), OVERSPEND_OFFSET (unrecorded savings covers overspend),
    //              HYSA_WITHDRAWAL (pull back from HYSA — stored as negative amount)
    private UUID id;
    private BigDecimal amount;
    private LocalDate date;
    private String notes;
    private String type;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SavingsTransfer() {
        this.id = UUID.randomUUID();
        this.date = LocalDate.now();
        this.type = "TRANSFER";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public SavingsTransfer(BigDecimal amount, LocalDate date, String notes) {
        this();
        this.amount = amount;
        this.date = date != null ? date : LocalDate.now();
        this.notes = notes;
    }

    public SavingsTransfer(BigDecimal amount, LocalDate date, String notes, String type) {
        this(amount, date, notes);
        this.type = type;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
