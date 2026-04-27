package com.manualmoney.controller;

import com.manualmoney.model.Allocation;
import com.manualmoney.model.PayPeriod;
import com.manualmoney.model.Priority;
import com.manualmoney.model.SavingsTransfer;
import com.manualmoney.model.Transaction;
import com.manualmoney.service.PayPeriodService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class PayPeriodController {

    private final PayPeriodService payPeriodService;

    public PayPeriodController(PayPeriodService payPeriodService) {
        this.payPeriodService = payPeriodService;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Collections.singletonMap("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(Collections.singletonMap("error", ex.getMessage()));
    }

    @GetMapping("/payperiods")
    public List<PayPeriod> getAllPayPeriods() {
        return payPeriodService.getAllPayPeriods();
    }

    @GetMapping("/payperiods/{id}")
    public ResponseEntity<PayPeriod> getPayPeriodById(@PathVariable UUID id) {
        return payPeriodService.getPayPeriodById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/payperiods")
    public PayPeriod createPayPeriod(@RequestBody CreatePayPeriodRequest request) {
        return payPeriodService.createPayPeriod(request.getPayDate(), request.getEndDate(), request.getAmount());
    }

    @PutMapping("/payperiods/{id}")
    public ResponseEntity<PayPeriod> updatePayPeriod(@PathVariable UUID id, @RequestBody UpdatePayPeriodRequest request) {
        return payPeriodService.updatePayPeriod(id, request.getPayDate(), request.getEndDate(), request.getAmount())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/payperiods/{id}")
    public ResponseEntity<Void> deletePayPeriod(@PathVariable UUID id) {
        if (payPeriodService.deletePayPeriod(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/payperiods/{id}/resolve-overspend")
    public ResponseEntity<PayPeriod> resolveOverspend(@PathVariable UUID id,
                                                       @RequestBody ClosePayPeriodRequest request) {
        return payPeriodService.resolveOverspend(id, request.getSavingsOffsets(), request.getHysaWithdrawals(), request.getCarryForwardAmount())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/payperiods/{id}/close")
    public ResponseEntity<PayPeriod> closePayPeriod(@PathVariable UUID id,
                                                     @RequestBody(required = false) ClosePayPeriodRequest request) {
        List<PayPeriodService.ResolutionItem> offsets = request != null ? request.getSavingsOffsets() : null;
        List<PayPeriodService.ResolutionItem> withdrawals = request != null ? request.getHysaWithdrawals() : null;
        BigDecimal carryForward = request != null ? request.getCarryForwardAmount() : null;
        return payPeriodService.closePayPeriod(id, offsets, withdrawals, carryForward)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/payperiods/{id}/reopen")
    public ResponseEntity<PayPeriod> reopenPayPeriod(@PathVariable UUID id) {
        return payPeriodService.reopenPayPeriod(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/payperiods/{id}/allocations")
    public ResponseEntity<Allocation> addAllocation(@PathVariable UUID id, @RequestBody CreateAllocationRequest request) {
        return payPeriodService.addAllocation(id, request.getCategoryId(), request.getAllocatedAmount())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/allocations/{id}")
    public ResponseEntity<Void> deleteAllocation(@PathVariable UUID id) {
        try {
            if (payPeriodService.deleteAllocation(id)) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/allocations/{id}")
    public ResponseEntity<Allocation> updateAllocation(@PathVariable UUID id, @RequestBody UpdateAllocationRequest request) {
        return payPeriodService.updateAllocation(id, request.getAllocatedAmount())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/allocations/{id}/transactions")
    public ResponseEntity<Transaction> addTransaction(@PathVariable UUID id, @RequestBody CreateTransactionRequest request) {
        return payPeriodService.addTransaction(id, request.getDescription(), request.getAmount(),
                        request.getDate(), request.getSubCategoryId(), request.getPriority(), request.getNotes())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/transactions/{id}")
    public ResponseEntity<Transaction> updateTransaction(@PathVariable UUID id, @RequestBody UpdateTransactionRequest request) {
        return payPeriodService.updateTransaction(id, request.getDescription(), request.getAmount(),
                        request.getDate(), request.getSubCategoryId(), request.getPriority(), request.getNotes())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable UUID id) {
        if (payPeriodService.deleteTransaction(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/allocations/{id}/savingstransfers")
    public ResponseEntity<SavingsTransfer> addSavingsTransfer(@PathVariable UUID id,
                                                               @RequestBody SavingsTransferRequest request) {
        return payPeriodService.addSavingsTransfer(id, request.getAmount(), request.getDate(), request.getNotes())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/savingstransfers/{id}")
    public ResponseEntity<SavingsTransfer> updateSavingsTransfer(@PathVariable UUID id,
                                                                  @RequestBody SavingsTransferRequest request) {
        return payPeriodService.updateSavingsTransfer(id, request.getAmount(), request.getDate(), request.getNotes())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/savingstransfers/{id}")
    public ResponseEntity<Void> deleteSavingsTransfer(@PathVariable UUID id) {
        if (payPeriodService.deleteSavingsTransfer(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    public static class CreatePayPeriodRequest {
        private LocalDate payDate;
        private LocalDate endDate;
        private BigDecimal amount;

        public LocalDate getPayDate() { return payDate; }
        public void setPayDate(LocalDate payDate) { this.payDate = payDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }

    public static class UpdatePayPeriodRequest {
        private LocalDate payDate;
        private LocalDate endDate;
        private BigDecimal amount;

        public LocalDate getPayDate() { return payDate; }
        public void setPayDate(LocalDate payDate) { this.payDate = payDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }

    public static class CreateAllocationRequest {
        private UUID categoryId;
        private BigDecimal allocatedAmount;

        public UUID getCategoryId() { return categoryId; }
        public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
        public BigDecimal getAllocatedAmount() { return allocatedAmount; }
        public void setAllocatedAmount(BigDecimal allocatedAmount) { this.allocatedAmount = allocatedAmount; }
    }

    public static class UpdateAllocationRequest {
        private BigDecimal allocatedAmount;

        public BigDecimal getAllocatedAmount() { return allocatedAmount; }
        public void setAllocatedAmount(BigDecimal allocatedAmount) { this.allocatedAmount = allocatedAmount; }
    }

    public static class CreateTransactionRequest {
        private String description;
        private BigDecimal amount;
        private LocalDate date;
        private UUID subCategoryId;
        private Priority priority;
        private String notes;

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public UUID getSubCategoryId() { return subCategoryId; }
        public void setSubCategoryId(UUID subCategoryId) { this.subCategoryId = subCategoryId; }
        public Priority getPriority() { return priority; }
        public void setPriority(Priority priority) { this.priority = priority; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class UpdateTransactionRequest {
        private String description;
        private BigDecimal amount;
        private LocalDate date;
        private UUID subCategoryId;
        private Priority priority;
        private String notes;

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public UUID getSubCategoryId() { return subCategoryId; }
        public void setSubCategoryId(UUID subCategoryId) { this.subCategoryId = subCategoryId; }
        public Priority getPriority() { return priority; }
        public void setPriority(Priority priority) { this.priority = priority; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class SavingsTransferRequest {
        private BigDecimal amount;
        private LocalDate date;
        private String notes;

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class ClosePayPeriodRequest {
        private List<PayPeriodService.ResolutionItem> savingsOffsets;
        private List<PayPeriodService.ResolutionItem> hysaWithdrawals;
        private BigDecimal carryForwardAmount;

        public List<PayPeriodService.ResolutionItem> getSavingsOffsets() { return savingsOffsets; }
        public void setSavingsOffsets(List<PayPeriodService.ResolutionItem> savingsOffsets) { this.savingsOffsets = savingsOffsets; }
        public List<PayPeriodService.ResolutionItem> getHysaWithdrawals() { return hysaWithdrawals; }
        public void setHysaWithdrawals(List<PayPeriodService.ResolutionItem> hysaWithdrawals) { this.hysaWithdrawals = hysaWithdrawals; }
        public BigDecimal getCarryForwardAmount() { return carryForwardAmount; }
        public void setCarryForwardAmount(BigDecimal carryForwardAmount) { this.carryForwardAmount = carryForwardAmount; }
    }
}
