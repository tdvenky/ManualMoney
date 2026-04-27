package com.manualmoney.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class PayPeriod {
    private UUID id;
    private LocalDate payDate;
    private LocalDate endDate;
    private BigDecimal amount;
    private List<Allocation> allocations;
    private PayPeriodStatus status;
    private BigDecimal carryForwardAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PayPeriod() {
        this.id = UUID.randomUUID();
        this.allocations = new ArrayList<>();
        this.status = PayPeriodStatus.ACTIVE;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public PayPeriod(LocalDate payDate, LocalDate endDate, BigDecimal amount) {
        this();
        this.payDate = payDate;
        this.endDate = endDate;
        this.amount = amount;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public LocalDate getPayDate() {
        return payDate;
    }

    public void setPayDate(LocalDate payDate) {
        this.payDate = payDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public List<Allocation> getAllocations() {
        return allocations;
    }

    public void setAllocations(List<Allocation> allocations) {
        this.allocations = allocations;
    }

    public PayPeriodStatus getStatus() {
        return status;
    }

    public void setStatus(PayPeriodStatus status) {
        this.status = status;
    }

    public BigDecimal getCarryForwardAmount() {
        return carryForwardAmount;
    }

    public void setCarryForwardAmount(BigDecimal carryForwardAmount) {
        this.carryForwardAmount = carryForwardAmount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
