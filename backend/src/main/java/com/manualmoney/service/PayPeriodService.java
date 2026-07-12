package com.manualmoney.service;

import com.manualmoney.model.*;
import com.manualmoney.repository.JsonDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(PayPeriodService.class);

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

    public PayPeriod createPayPeriod(LocalDate payDate, LocalDate endDate) {
        PayPeriod payPeriod = new PayPeriod(payDate, endDate);
        PayPeriod saved = repository.savePayPeriod(payPeriod);
        logger.info("Created pay period {} ({} to {})", saved.getId(), payDate, endDate);
        return saved;
    }

    public Optional<PayPeriod> updatePayPeriod(UUID id, LocalDate payDate, LocalDate endDate) {
        return repository.findPayPeriodById(id).map(payPeriod -> {
            payPeriod.setPayDate(payDate);
            payPeriod.setEndDate(endDate);
            PayPeriod saved = repository.savePayPeriod(payPeriod);
            logger.info("Updated pay period {}", id);
            return saved;
        });
    }

    public Optional<Income> addIncome(UUID payPeriodId, String description, BigDecimal amount, LocalDate date) {
        return repository.findPayPeriodById(payPeriodId).map(payPeriod -> {
            Income income = new Income(description, amount, date);
            payPeriod.getIncomes().add(income);
            repository.savePayPeriod(payPeriod);
            logger.info("Added income {} to pay period {}", income.getId(), payPeriodId);
            return income;
        });
    }

    public Optional<Income> updateIncome(UUID incomeId, String description, BigDecimal amount, LocalDate date) {
        return repository.findIncomeById(incomeId).map(income -> {
            PayPeriod payPeriod = repository.findPayPeriodByIncomeId(incomeId)
                    .orElseThrow(() -> new RuntimeException("Pay period not found for income"));
            BigDecimal totalAllocated = payPeriod.getAllocations().stream()
                    .map(Allocation::getAllocatedAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal newTotal = payPeriod.getIncomes().stream()
                    .map(i -> i.getId().equals(incomeId) ? amount : i.getAmount())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (newTotal.compareTo(totalAllocated) < 0) {
                throw new IllegalArgumentException(
                        "Cannot reduce income below total allocated amount of " + totalAllocated);
            }
            income.setDescription(description);
            income.setAmount(amount);
            income.setDate(date);
            income.setUpdatedAt(LocalDateTime.now());
            repository.save();
            logger.info("Updated income {}", incomeId);
            return income;
        });
    }

    public boolean deleteIncome(UUID incomeId) {
        Optional<PayPeriod> payPeriodOpt = repository.findPayPeriodByIncomeId(incomeId);
        if (!payPeriodOpt.isPresent()) return false;
        PayPeriod payPeriod = payPeriodOpt.get();
        BigDecimal totalAllocated = payPeriod.getAllocations().stream()
                .map(Allocation::getAllocatedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal newTotal = payPeriod.getIncomes().stream()
                .filter(i -> !i.getId().equals(incomeId))
                .map(Income::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (newTotal.compareTo(totalAllocated) < 0) {
            throw new IllegalArgumentException(
                    "Cannot delete income: remaining total would be less than allocated amount of " + totalAllocated);
        }
        boolean removed = payPeriod.getIncomes().removeIf(i -> i.getId().equals(incomeId));
        if (removed) {
            repository.savePayPeriod(payPeriod);
            logger.info("Deleted income {}", incomeId);
        } else {
            logger.warn("Attempted to delete income {} but it was not found", incomeId);
        }
        return removed;
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
            PayPeriod saved = repository.savePayPeriod(payPeriod);
            logger.info("Resolved overspend for pay period {}", id);
            return saved;
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
            PayPeriod saved = repository.savePayPeriod(payPeriod);
            logger.info("Closed pay period {}", id);
            return saved;
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
            PayPeriod saved = repository.savePayPeriod(payPeriod);
            logger.info("Reopened pay period {}", id);
            return saved;
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
            repository.findCategoryById(categoryId).ifPresent(c -> {
                allocation.setCategoryName(c.getName());
                allocation.setCategoryType(c.getType());
            });
            payPeriod.getAllocations().add(allocation);
            repository.savePayPeriod(payPeriod);
            logger.info("Added allocation {} to pay period {}", allocation.getId(), payPeriodId);
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
            logger.info("Updated allocation {}", allocationId);
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
            logger.info("Added transaction {} to allocation {}", transaction.getId(), allocationId);
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
            logger.info("Updated transaction {}", transactionId);
            return transaction;
        });
    }

    public boolean deleteTransaction(UUID transactionId) {
        Optional<Allocation> allocationOpt = repository.findAllocationByTransactionId(transactionId);
        if (!allocationOpt.isPresent()) {
            logger.warn("Attempted to delete transaction {} but it was not found", transactionId);
            return false;
        }

        Allocation allocation = allocationOpt.get();
        boolean removed = allocation.getTransactions().removeIf(t -> t.getId().equals(transactionId));

        if (removed) {
            recalculateBalance(allocation);
            repository.save();
            logger.info("Deleted transaction {}", transactionId);
        }

        return removed;
    }

    public Optional<SavingsTransfer> addSavingsTransfer(UUID allocationId, BigDecimal amount,
                                                         LocalDate date, String notes, boolean excludeFromSavings) {
        return repository.findAllocationById(allocationId).map(allocation -> {
            validateSavingsTransferDate(allocationId, date);

            SavingsTransfer transfer = new SavingsTransfer(amount, date, notes);
            transfer.setExcludeFromSavings(excludeFromSavings);
            allocation.getSavingsTransfers().add(transfer);

            recalculateBalance(allocation);
            repository.save();
            logger.info("Added savings transfer {} to allocation {}", transfer.getId(), allocationId);
            return transfer;
        });
    }

    public Optional<SavingsTransfer> updateSavingsTransfer(UUID transferId, BigDecimal amount,
                                                            LocalDate date, String notes, boolean excludeFromSavings) {
        return repository.findSavingsTransferById(transferId).map(transfer -> {
            Allocation allocation = repository.findAllocationBySavingsTransferId(transferId)
                    .orElseThrow(() -> new RuntimeException("Allocation not found"));

            validateSavingsTransferDate(allocation.getId(), date);

            transfer.setAmount(amount);
            transfer.setDate(date);
            transfer.setNotes(notes);
            transfer.setExcludeFromSavings(excludeFromSavings);
            transfer.setUpdatedAt(LocalDateTime.now());

            recalculateBalance(allocation);
            repository.save();
            logger.info("Updated savings transfer {}", transferId);
            return transfer;
        });
    }

    public boolean deleteSavingsTransfer(UUID transferId) {
        Optional<Allocation> allocationOpt = repository.findAllocationBySavingsTransferId(transferId);
        if (!allocationOpt.isPresent()) {
            logger.warn("Attempted to delete savings transfer {} but it was not found", transferId);
            return false;
        }

        Allocation allocation = allocationOpt.get();
        boolean removed = allocation.getSavingsTransfers().removeIf(s -> s.getId().equals(transferId));

        if (removed) {
            recalculateBalance(allocation);
            repository.save();
            logger.info("Deleted savings transfer {}", transferId);
        }

        return removed;
    }

    public boolean deleteAllocation(UUID allocationId) {
        Optional<PayPeriod> payPeriodOpt = repository.findPayPeriodByAllocationId(allocationId);
        if (!payPeriodOpt.isPresent()) {
            logger.warn("Attempted to delete allocation {} but it was not found", allocationId);
            return false;
        }
        PayPeriod payPeriod = payPeriodOpt.get();
        Allocation allocation = payPeriod.getAllocations().stream()
                .filter(a -> a.getId().equals(allocationId))
                .findFirst().orElse(null);
        if (allocation == null) {
            logger.warn("Attempted to delete allocation {} but it was not found", allocationId);
            return false;
        }
        if (!allocation.getTransactions().isEmpty()) {
            throw new IllegalArgumentException("Cannot delete an allocation that has transactions");
        }
        if (!allocation.getSavingsTransfers().isEmpty()) {
            throw new IllegalArgumentException("Cannot delete an allocation that has savings recorded");
        }
        payPeriod.getAllocations().removeIf(a -> a.getId().equals(allocationId));
        repository.savePayPeriod(payPeriod);
        logger.info("Deleted allocation {}", allocationId);
        return true;
    }

    public boolean deletePayPeriod(UUID id) {
        if (repository.findPayPeriodById(id).isPresent()) {
            repository.deletePayPeriod(id);
            logger.info("Deleted pay period {}", id);
            return true;
        }
        logger.warn("Attempted to delete pay period {} but it was not found", id);
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
