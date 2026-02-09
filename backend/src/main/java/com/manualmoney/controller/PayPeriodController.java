package com.manualmoney.controller;

import com.manualmoney.model.Allocation;
import com.manualmoney.model.PayPeriod;
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

    @PutMapping("/payperiods/{id}/close")
    public ResponseEntity<PayPeriod> closePayPeriod(@PathVariable UUID id) {
        return payPeriodService.closePayPeriod(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/payperiods/{id}/allocations")
    public ResponseEntity<Allocation> addAllocation(@PathVariable UUID id, @RequestBody CreateAllocationRequest request) {
        return payPeriodService.addAllocation(id, request.getBucketId(), request.getAllocatedAmount())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/allocations/{id}")
    public ResponseEntity<Allocation> updateAllocation(@PathVariable UUID id, @RequestBody UpdateAllocationRequest request) {
        return payPeriodService.updateAllocation(id, request.getAllocatedAmount())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/allocations/{id}/transactions")
    public ResponseEntity<Transaction> addTransaction(@PathVariable UUID id, @RequestBody CreateTransactionRequest request) {
        return payPeriodService.addTransaction(id, request.getDescription(), request.getAmount(), request.getDate())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/transactions/{id}")
    public ResponseEntity<Transaction> updateTransaction(@PathVariable UUID id, @RequestBody UpdateTransactionRequest request) {
        return payPeriodService.updateTransaction(id, request.getDescription(), request.getAmount(), request.getDate())
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
        private UUID bucketId;
        private BigDecimal allocatedAmount;

        public UUID getBucketId() { return bucketId; }
        public void setBucketId(UUID bucketId) { this.bucketId = bucketId; }
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

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
    }

    public static class UpdateTransactionRequest {
        private String description;
        private BigDecimal amount;
        private LocalDate date;

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
    }
}
