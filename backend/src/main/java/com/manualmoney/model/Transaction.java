package com.manualmoney.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class Transaction {
    private UUID id;
    private String description;
    private BigDecimal amount;
    private LocalDate date;
    private BigDecimal previousBalance;
    private BigDecimal newBalance;
    private UUID subCategoryId;
    private Priority priority;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Transaction() {
        this.id = UUID.randomUUID();
        this.date = LocalDate.now();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Transaction(String description, BigDecimal amount, LocalDate date,
                       BigDecimal previousBalance, BigDecimal newBalance) {
        this(description, amount, date, previousBalance, newBalance, null, null, null);
    }

    public Transaction(String description, BigDecimal amount, LocalDate date,
                       BigDecimal previousBalance, BigDecimal newBalance,
                       UUID subCategoryId, Priority priority, String notes) {
        this();
        this.description = description;
        this.amount = amount;
        this.date = date != null ? date : LocalDate.now();
        this.previousBalance = previousBalance;
        this.newBalance = newBalance;
        this.subCategoryId = subCategoryId;
        this.priority = priority;
        this.notes = notes;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public BigDecimal getPreviousBalance() { return previousBalance; }
    public void setPreviousBalance(BigDecimal previousBalance) { this.previousBalance = previousBalance; }

    public BigDecimal getNewBalance() { return newBalance; }
    public void setNewBalance(BigDecimal newBalance) { this.newBalance = newBalance; }

    public UUID getSubCategoryId() { return subCategoryId; }
    public void setSubCategoryId(UUID subCategoryId) { this.subCategoryId = subCategoryId; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
