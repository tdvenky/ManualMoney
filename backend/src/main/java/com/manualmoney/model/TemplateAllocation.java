package com.manualmoney.model;

import java.math.BigDecimal;
import java.util.UUID;

public class TemplateAllocation {

    private UUID categoryId;
    private BigDecimal allocatedAmount;

    public TemplateAllocation() {}

    public TemplateAllocation(UUID categoryId, BigDecimal allocatedAmount) {
        this.categoryId = categoryId;
        this.allocatedAmount = allocatedAmount;
    }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public BigDecimal getAllocatedAmount() { return allocatedAmount; }
    public void setAllocatedAmount(BigDecimal allocatedAmount) { this.allocatedAmount = allocatedAmount; }
}
