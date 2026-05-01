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

    public Optional<PayPeriod> resolveOverspend(UUID id,
                                                  List<ResolutionItem> savingsOffsets,
                                                  List<ResolutionItem> hysaWithdrawals,
                                                  BigDecimal carryForwardAmount) {
        return repository.findPayPeriodById(id).map(payPeriod -> {
            BigDecimal overspend = calculateOverspend(payPeriod);
            if (overspend.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal existingCoverage = calculateExistingCoverage(payPeriod);
                BigDecimal remaining = overspend.subtract(existingCoverage);
                applyAndValidateResolution(payPeriod, savingsOffsets, hysaWithdrawals, carryForwardAmount, remaining);
            }
            return repository.savePayPeriod(payPeriod);
        });
    }

    public Optional<PayPeriod> closePayPeriod(UUID id,
                                               List<ResolutionItem> savingsOffsets,
                                               List<ResolutionItem> hysaWithdrawals,
                                               BigDecimal carryForwardAmount) {
        return repository.findPayPeriodById(id).map(payPeriod -> {
            BigDecimal overspend = calculateOverspend(payPeriod);
            if (overspend.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal existingCoverage = calculateExistingCoverage(payPeriod);
                BigDecimal remaining = overspend.subtract(existingCoverage);
                if (remaining.compareTo(BigDecimal.ZERO) > 0) {
                    applyAndValidateResolution(payPeriod, savingsOffsets, hysaWithdrawals, carryForwardAmount, remaining);
                }
            }
            payPeriod.setStatus(PayPeriodStatus.CLOSED);
            return repository.savePayPeriod(payPeriod);
        });
    }

    private BigDecimal calculateOverspend(PayPeriod payPeriod) {
        // Measure overspend purely from transactions exceeding each allocation's budgeted amount.
        // This ignores savings transfers (OVERSPEND_OFFSET, HYSA_WITHDRAWAL) so that applying a
        // resolution doesn't inflate the overspend figure by making savings balances go negative.
        return payPeriod.getAllocations().stream()
                .map(a -> {
                    BigDecimal spent = a.getTransactions().stream()
                            .map(Transaction::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal over = spent.subtract(a.getAllocatedAmount());
                    return over.compareTo(BigDecimal.ZERO) > 0 ? over : BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateExistingCoverage(PayPeriod payPeriod) {
        BigDecimal offsets = payPeriod.getAllocations().stream()
                .flatMap(a -> a.getSavingsTransfers().stream())
                .filter(t -> "OVERSPEND_OFFSET".equals(t.getType()))
                .map(SavingsTransfer::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal withdrawals = payPeriod.getAllocations().stream()
                .flatMap(a -> a.getSavingsTransfers().stream())
                .filter(t -> "HYSA_WITHDRAWAL".equals(t.getType()))
                .map(t -> t.getAmount().negate())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cf = payPeriod.getCarryForwardAmount() != null ? payPeriod.getCarryForwardAmount() : BigDecimal.ZERO;
        return offsets.add(withdrawals).add(cf);
    }

    private void applyAndValidateResolution(PayPeriod payPeriod,
                                             List<ResolutionItem> savingsOffsets,
                                             List<ResolutionItem> hysaWithdrawals,
                                             BigDecimal carryForwardAmount,
                                             BigDecimal remainingToResolve) {
        BigDecimal offsetTotal = savingsOffsets == null ? BigDecimal.ZERO :
                savingsOffsets.stream().map(ResolutionItem::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal withdrawalTotal = hysaWithdrawals == null ? BigDecimal.ZERO :
                hysaWithdrawals.stream().map(ResolutionItem::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cfAmount = carryForwardAmount != null ? carryForwardAmount : BigDecimal.ZERO;
        BigDecimal covered = offsetTotal.add(withdrawalTotal).add(cfAmount);

        if (covered.compareTo(remainingToResolve) < 0) {
            throw new IllegalStateException(
                    "Overspend of " + remainingToResolve + " is not fully resolved. Only " + covered + " is covered.");
        }

        if (savingsOffsets != null) {
            for (ResolutionItem item : savingsOffsets) {
                if (item.getAmount().compareTo(BigDecimal.ZERO) <= 0) continue;
                Allocation alloc = payPeriod.getAllocations().stream()
                        .filter(a -> a.getId().equals(item.getAllocationId()))
                        .findFirst().orElseThrow(() -> new IllegalArgumentException("Allocation not found: " + item.getAllocationId()));
                alloc.getSavingsTransfers().add(new SavingsTransfer(item.getAmount(), LocalDate.now(), "Overspend offset", "OVERSPEND_OFFSET"));
                recalculateBalance(alloc);
            }
        }

        if (hysaWithdrawals != null) {
            for (ResolutionItem item : hysaWithdrawals) {
                if (item.getAmount().compareTo(BigDecimal.ZERO) <= 0) continue;
                Allocation alloc = payPeriod.getAllocations().stream()
                        .filter(a -> a.getId().equals(item.getAllocationId()))
                        .findFirst().orElseThrow(() -> new IllegalArgumentException("Allocation not found: " + item.getAllocationId()));
                alloc.getSavingsTransfers().add(new SavingsTransfer(item.getAmount().negate(), LocalDate.now(), "HYSA withdrawal", "HYSA_WITHDRAWAL"));
                recalculateBalance(alloc);
            }
        }

        if (cfAmount.compareTo(BigDecimal.ZERO) > 0) {
            payPeriod.setCarryForwardAmount(
                    (payPeriod.getCarryForwardAmount() != null ? payPeriod.getCarryForwardAmount() : BigDecimal.ZERO).add(cfAmount));
        }
    }

    public static class ResolutionItem {
        private UUID allocationId;
        private BigDecimal amount;

        public UUID getAllocationId() { return allocationId; }
        public void setAllocationId(UUID allocationId) { this.allocationId = allocationId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
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
            repository.findCategoryById(categoryId).ifPresent(c -> allocation.setCategoryName(c.getName()));
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
            recalculateBalance(allocation);
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

            recalculateBalance(allocation);
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

            recalculateBalance(allocation);
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
            recalculateBalance(allocation);
            repository.save();
        }

        return removed;
    }

    public Optional<SavingsTransfer> addSavingsTransfer(UUID allocationId, BigDecimal amount,
                                                         LocalDate date, String notes) {
        return repository.findAllocationById(allocationId).map(allocation -> {
            validateSavingsTransferDate(allocationId, date);

            SavingsTransfer transfer = new SavingsTransfer(amount, date, notes);
            allocation.getSavingsTransfers().add(transfer);

            recalculateBalance(allocation);
            repository.save();
            return transfer;
        });
    }

    public Optional<SavingsTransfer> updateSavingsTransfer(UUID transferId, BigDecimal amount,
                                                            LocalDate date, String notes) {
        return repository.findSavingsTransferById(transferId).map(transfer -> {
            Allocation allocation = repository.findAllocationBySavingsTransferId(transferId)
                    .orElseThrow(() -> new RuntimeException("Allocation not found"));

            validateSavingsTransferDate(allocation.getId(), date);

            transfer.setAmount(amount);
            transfer.setDate(date);
            transfer.setNotes(notes);
            transfer.setUpdatedAt(LocalDateTime.now());

            recalculateBalance(allocation);
            repository.save();
            return transfer;
        });
    }

    public boolean deleteSavingsTransfer(UUID transferId) {
        Optional<Allocation> allocationOpt = repository.findAllocationBySavingsTransferId(transferId);
        if (!allocationOpt.isPresent()) {
            return false;
        }

        Allocation allocation = allocationOpt.get();
        boolean removed = allocation.getSavingsTransfers().removeIf(s -> s.getId().equals(transferId));

        if (removed) {
            recalculateBalance(allocation);
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
        if (!allocation.getSavingsTransfers().isEmpty()) {
            throw new IllegalArgumentException("Cannot delete an allocation that has savings recorded");
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

    private void recalculateBalance(Allocation allocation) {
        allocation.getTransactions().sort(Comparator.comparing(Transaction::getDate));
        BigDecimal runningBalance = allocation.getAllocatedAmount();
        for (Transaction t : allocation.getTransactions()) {
            t.setPreviousBalance(runningBalance);
            runningBalance = runningBalance.subtract(t.getAmount());
            t.setNewBalance(runningBalance);
        }
        BigDecimal savingsTransferred = allocation.getSavingsTransfers().stream()
                .map(SavingsTransfer::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        allocation.setCurrentBalance(runningBalance.subtract(savingsTransferred));
        allocation.setUpdatedAt(LocalDateTime.now());
    }

    private void validateTransactionDate(UUID allocationId, LocalDate date) {
        PayPeriod payPeriod = repository.findPayPeriodByAllocationId(allocationId)
                .orElseThrow(() -> new RuntimeException("Pay period not found for allocation"));
        if (date.isBefore(payPeriod.getPayDate()) || date.isAfter(payPeriod.getEndDate())) {
            throw new IllegalArgumentException(
                    "Transaction date must be between " + payPeriod.getPayDate() + " and " + payPeriod.getEndDate());
        }
    }

    private void validateSavingsTransferDate(UUID allocationId, LocalDate date) {
        PayPeriod payPeriod = repository.findPayPeriodByAllocationId(allocationId)
                .orElseThrow(() -> new RuntimeException("Pay period not found for allocation"));
        if (date.isBefore(payPeriod.getPayDate()) || date.isAfter(payPeriod.getEndDate())) {
            throw new IllegalArgumentException(
                    "Transfer date must be between " + payPeriod.getPayDate() + " and " + payPeriod.getEndDate());
        }
    }
}
