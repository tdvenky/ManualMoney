package com.manualmoney.model;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Allocation {
    private UUID id;

    @JsonAlias("bucketId")
    private UUID categoryId;
    private String categoryName;

    private BigDecimal allocatedAmount;
    private BigDecimal currentBalance;
    private List<Transaction> transactions;
    private List<SavingsTransfer> savingsTransfers;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Allocation() {
        this.id = UUID.randomUUID();
        this.transactions = new ArrayList<>();
        this.savingsTransfers = new ArrayList<>();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Allocation(UUID categoryId, BigDecimal allocatedAmount) {
        this();
        this.categoryId = categoryId;
        this.allocatedAmount = allocatedAmount;
        this.currentBalance = allocatedAmount;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public BigDecimal getAllocatedAmount() { return allocatedAmount; }
    public void setAllocatedAmount(BigDecimal allocatedAmount) { this.allocatedAmount = allocatedAmount; }

    public BigDecimal getCurrentBalance() { return currentBalance; }
    public void setCurrentBalance(BigDecimal currentBalance) { this.currentBalance = currentBalance; }

    public List<Transaction> getTransactions() { return transactions; }
    public void setTransactions(List<Transaction> transactions) { this.transactions = transactions; }

    public List<SavingsTransfer> getSavingsTransfers() { return savingsTransfers; }
    public void setSavingsTransfers(List<SavingsTransfer> savingsTransfers) { this.savingsTransfers = savingsTransfers; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
