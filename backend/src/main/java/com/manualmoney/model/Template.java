package com.manualmoney.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Template {

    private UUID id;
    private String name;
    private BigDecimal income;
    private List<TemplateAllocation> allocations;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Template() {
        this.id = UUID.randomUUID();
        this.allocations = new ArrayList<>();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getIncome() { return income; }
    public void setIncome(BigDecimal income) { this.income = income; }

    public List<TemplateAllocation> getAllocations() { return allocations; }
    public void setAllocations(List<TemplateAllocation> allocations) { this.allocations = allocations; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
