package com.manualmoney.service;

import com.manualmoney.model.*;
import com.manualmoney.repository.JsonDataRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PayPeriodService {

    private final JsonDataRepository repository;

    public PayPeriodService(JsonDataRepository repository) {
        this.repository = repository;
    }

    public List<PayPeriod> getAllPayPeriods() {
        return repository.findAllPayPeriods();
    }

    public Optional<PayPeriod> getPayPeriodById(UUID id) {
        return repository.findPayPeriodById(id);
    }

    public PayPeriod createPayPeriod(LocalDate payDate, LocalDate endDate, BigDecimal amount) {
        PayPeriod payPeriod = new PayPeriod(payDate, endDate, amount);
        return repository.savePayPeriod(payPeriod);
    }

    public Optional<PayPeriod> updatePayPeriod(UUID id, LocalDate payDate, LocalDate endDate, BigDecimal amount) {
        return repository.findPayPeriodById(id).map(payPeriod -> {
            payPeriod.setPayDate(payDate);
            payPeriod.setEndDate(endDate);
            payPeriod.setAmount(amount);
            return repository.savePayPeriod(payPeriod);
        });
    }

    public Optional<PayPeriod> closePayPeriod(UUID id) {
        return repository.findPayPeriodById(id).map(payPeriod -> {
            payPeriod.setStatus(PayPeriodStatus.CLOSED);
            return repository.savePayPeriod(payPeriod);
        });
    }

    public Optional<PayPeriod> reopenPayPeriod(UUID id) {
        return repository.findPayPeriodById(id).map(payPeriod -> {
            payPeriod.setStatus(PayPeriodStatus.ACTIVE);
            return repository.savePayPeriod(payPeriod);
        });
    }

    public Optional<Allocation> addAllocation(UUID payPeriodId, UUID categoryId, BigDecimal allocatedAmount) {
        return repository.findPayPeriodById(payPeriodId).map(payPeriod -> {
            BigDecimal totalAllocated = payPeriod.getAllocations().stream()
                    .map(Allocation::getAllocatedAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal unallocated = payPeriod.getAmount().subtract(totalAllocated);
            if (allocatedAmount.compareTo(unallocated) > 0) {
                throw new IllegalArgumentException(
                        "Cannot allocate " + allocatedAmount + ". Only " + unallocated + " is unallocated.");
            }
            Allocation allocation = new Allocation(categoryId, allocatedAmount);
            payPeriod.getAllocations().add(allocation);
            repository.savePayPeriod(payPeriod);
            return allocation;
        });
    }

    public Optional<Allocation> updateAllocation(UUID allocationId, BigDecimal allocatedAmount) {
        return repository.findAllocationById(allocationId).map(allocation -> {
            BigDecimal difference = allocatedAmount.subtract(allocation.getAllocatedAmount());
            if (difference.compareTo(BigDecimal.ZERO) > 0) {
                PayPeriod payPeriod = repository.findPayPeriodByAllocationId(allocationId)
                        .orElseThrow(() -> new RuntimeException("Pay period not found for allocation"));
                BigDecimal totalAllocated = payPeriod.getAllocations().stream()
                        .map(Allocation::getAllocatedAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal unallocated = payPeriod.getAmount().subtract(totalAllocated);
                if (difference.compareTo(unallocated) > 0) {
                    throw new IllegalArgumentException(
                            "Cannot increase allocation by " + difference + ". Only " + unallocated + " is unallocated.");
                }
            }
            allocation.setAllocatedAmount(allocatedAmount);
            allocation.setCurrentBalance(allocation.getCurrentBalance().add(difference));
            allocation.setUpdatedAt(LocalDateTime.now());
            repository.save();
            return allocation;
        });
    }

    public Optional<Transaction> addTransaction(UUID allocationId, String description, BigDecimal amount,
                                                LocalDate date, UUID subCategoryId, Priority priority, String notes) {
        return repository.findAllocationById(allocationId).map(allocation -> {
            validateTransactionDate(allocationId, date);

            Transaction transaction = new Transaction(description, amount, date, BigDecimal.ZERO, BigDecimal.ZERO,
                    subCategoryId, priority, notes);
            allocation.getTransactions().add(transaction);

            allocation.getTransactions().sort(Comparator.comparing(Transaction::getDate));
            BigDecimal runningBalance = allocation.getAllocatedAmount();
            for (Transaction t : allocation.getTransactions()) {
                t.setPreviousBalance(runningBalance);
                runningBalance = runningBalance.subtract(t.getAmount());
                t.setNewBalance(runningBalance);
            }

            allocation.setCurrentBalance(runningBalance);
            allocation.setUpdatedAt(LocalDateTime.now());
            repository.save();
            return transaction;
        });
    }

    public Optional<Transaction> updateTransaction(UUID transactionId, String description, BigDecimal amount,
                                                   LocalDate date, UUID subCategoryId, Priority priority, String notes) {
        return repository.findTransactionById(transactionId).map(transaction -> {
            Allocation allocation = repository.findAllocationByTransactionId(transactionId)
                    .orElseThrow(() -> new RuntimeException("Allocation not found"));

            validateTransactionDate(allocation.getId(), date);

            transaction.setDescription(description);
            transaction.setAmount(amount);
            transaction.setDate(date);
            transaction.setSubCategoryId(subCategoryId);
            transaction.setPriority(priority);
            transaction.setNotes(notes);
            transaction.setUpdatedAt(LocalDateTime.now());

            allocation.getTransactions().sort(Comparator.comparing(Transaction::getDate));
            BigDecimal runningBalance = allocation.getAllocatedAmount();
            for (Transaction t : allocation.getTransactions()) {
                t.setPreviousBalance(runningBalance);
                runningBalance = runningBalance.subtract(t.getAmount());
                t.setNewBalance(runningBalance);
            }

            allocation.setCurrentBalance(runningBalance);
            allocation.setUpdatedAt(LocalDateTime.now());
            repository.save();
            return transaction;
        });
    }

    public boolean deleteTransaction(UUID transactionId) {
        Optional<Allocation> allocationOpt = repository.findAllocationByTransactionId(transactionId);
        if (!allocationOpt.isPresent()) {
            return false;
        }

        Allocation allocation = allocationOpt.get();
        boolean removed = allocation.getTransactions().removeIf(t -> t.getId().equals(transactionId));

        if (removed) {
            BigDecimal runningBalance = allocation.getAllocatedAmount();
            for (Transaction t : allocation.getTransactions()) {
                t.setPreviousBalance(runningBalance);
                runningBalance = runningBalance.subtract(t.getAmount());
                t.setNewBalance(runningBalance);
            }
            allocation.setCurrentBalance(runningBalance);
            allocation.setUpdatedAt(LocalDateTime.now());
            repository.save();
        }

        return removed;
    }

    public boolean deleteAllocation(UUID allocationId) {
        Optional<PayPeriod> payPeriodOpt = repository.findPayPeriodByAllocationId(allocationId);
        if (!payPeriodOpt.isPresent()) return false;
        PayPeriod payPeriod = payPeriodOpt.get();
        Allocation allocation = payPeriod.getAllocations().stream()
                .filter(a -> a.getId().equals(allocationId))
                .findFirst().orElse(null);
        if (allocation == null) return false;
        if (!allocation.getTransactions().isEmpty()) {
            throw new IllegalArgumentException("Cannot delete an allocation that has transactions");
        }
        payPeriod.getAllocations().removeIf(a -> a.getId().equals(allocationId));
        repository.savePayPeriod(payPeriod);
        return true;
    }

    public boolean deletePayPeriod(UUID id) {
        if (repository.findPayPeriodById(id).isPresent()) {
            repository.deletePayPeriod(id);
            return true;
        }
        return false;
    }

    private void validateTransactionDate(UUID allocationId, LocalDate date) {
        PayPeriod payPeriod = repository.findPayPeriodByAllocationId(allocationId)
                .orElseThrow(() -> new RuntimeException("Pay period not found for allocation"));
        if (date.isBefore(payPeriod.getPayDate()) || date.isAfter(payPeriod.getEndDate())) {
            throw new IllegalArgumentException(
                    "Transaction date must be between " + payPeriod.getPayDate() + " and " + payPeriod.getEndDate());
        }
    }
}
