package com.manualmoney.service;

import com.manualmoney.model.*;
import com.manualmoney.repository.JsonDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayPeriodServiceTest {

    @Mock
    private JsonDataRepository repository;

    private PayPeriodService payPeriodService;

    @BeforeEach
    void setUp() {
        payPeriodService = new PayPeriodService(repository);
    }

    // --- getAllPayPeriods ---

    @Test
    void getAllPayPeriods_shouldReturnAllPayPeriods() {
        List<PayPeriod> expected = Arrays.asList(
                new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000")),
                new PayPeriod(LocalDate.of(2024, 1, 16), LocalDate.of(2024, 1, 31), new BigDecimal("2000"))
        );
        when(repository.findAllPayPeriods()).thenReturn(expected);

        List<PayPeriod> result = payPeriodService.getAllPayPeriods();

        assertEquals(2, result.size());
        verify(repository).findAllPayPeriods();
    }

    // --- getPayPeriodById ---

    @Test
    void getPayPeriodById_shouldReturnPayPeriod_whenExists() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        UUID id = payPeriod.getId();
        when(repository.findPayPeriodById(id)).thenReturn(Optional.of(payPeriod));

        Optional<PayPeriod> result = payPeriodService.getPayPeriodById(id);

        assertTrue(result.isPresent());
        assertEquals(id, result.get().getId());
        assertEquals(new BigDecimal("2000"), result.get().getAmount());
    }

    @Test
    void getPayPeriodById_shouldReturnEmpty_whenNotExists() {
        UUID id = UUID.randomUUID();
        when(repository.findPayPeriodById(id)).thenReturn(Optional.empty());

        Optional<PayPeriod> result = payPeriodService.getPayPeriodById(id);

        assertFalse(result.isPresent());
    }

    // --- createPayPeriod ---

    @Test
    void createPayPeriod_shouldCreateAndReturnPayPeriod() {
        when(repository.savePayPeriod(any(PayPeriod.class))).thenAnswer(i -> i.getArgument(0));

        PayPeriod result = payPeriodService.createPayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15));

        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result.getAmount());
        assertEquals(LocalDate.of(2024, 1, 1), result.getPayDate());
        assertEquals(LocalDate.of(2024, 1, 15), result.getEndDate());
        assertEquals(PayPeriodStatus.ACTIVE, result.getStatus());
        assertTrue(result.getAllocations().isEmpty());
        verify(repository).savePayPeriod(any(PayPeriod.class));
    }

    // --- updatePayPeriod ---

    @Test
    void updatePayPeriod_shouldUpdateAndReturnPayPeriod_whenExists() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        UUID id = payPeriod.getId();
        when(repository.findPayPeriodById(id)).thenReturn(Optional.of(payPeriod));
        when(repository.savePayPeriod(any(PayPeriod.class))).thenAnswer(i -> i.getArgument(0));

        Optional<PayPeriod> result = payPeriodService.updatePayPeriod(
                id, LocalDate.of(2024, 2, 1), LocalDate.of(2024, 2, 15));

        assertTrue(result.isPresent());
        assertEquals(LocalDate.of(2024, 2, 1), result.get().getPayDate());
        assertEquals(LocalDate.of(2024, 2, 15), result.get().getEndDate());
        verify(repository).savePayPeriod(any(PayPeriod.class));
    }

    @Test
    void updatePayPeriod_shouldReturnEmpty_whenNotExists() {
        UUID id = UUID.randomUUID();
        when(repository.findPayPeriodById(id)).thenReturn(Optional.empty());

        Optional<PayPeriod> result = payPeriodService.updatePayPeriod(
                id, LocalDate.of(2024, 2, 1), LocalDate.of(2024, 2, 15));

        assertFalse(result.isPresent());
        verify(repository, never()).savePayPeriod(any());
    }

    // --- closePayPeriod ---

    @Test
    void closePayPeriod_shouldUpdateStatusToClosed() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        UUID id = payPeriod.getId();
        when(repository.findPayPeriodById(id)).thenReturn(Optional.of(payPeriod));
        when(repository.savePayPeriod(any(PayPeriod.class))).thenAnswer(i -> i.getArgument(0));

        Optional<PayPeriod> result = payPeriodService.closePayPeriod(id, null, null, null);

        assertTrue(result.isPresent());
        assertEquals(PayPeriodStatus.CLOSED, result.get().getStatus());
    }

    @Test
    void closePayPeriod_shouldReturnEmpty_whenNotExists() {
        UUID id = UUID.randomUUID();
        when(repository.findPayPeriodById(id)).thenReturn(Optional.empty());

        Optional<PayPeriod> result = payPeriodService.closePayPeriod(id, null, null, null);

        assertFalse(result.isPresent());
        verify(repository, never()).savePayPeriod(any());
    }

    // --- addAllocation ---

    @Test
    void addAllocation_shouldAddAllocationToPayPeriod() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        UUID payPeriodId = payPeriod.getId();
        UUID bucketId = UUID.randomUUID();
        when(repository.findPayPeriodById(payPeriodId)).thenReturn(Optional.of(payPeriod));
        when(repository.savePayPeriod(any(PayPeriod.class))).thenAnswer(i -> i.getArgument(0));

        Optional<Allocation> result = payPeriodService.addAllocation(payPeriodId, bucketId, new BigDecimal("500"));

        assertTrue(result.isPresent());
        assertEquals(new BigDecimal("500"), result.get().getAllocatedAmount());
        assertEquals(new BigDecimal("500"), result.get().getCurrentBalance());
        assertEquals(bucketId, result.get().getCategoryId());
        assertEquals(1, payPeriod.getAllocations().size());
    }

    @Test
    void addAllocation_shouldThrow_whenAmountExceedsUnallocated() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("1000"));
        Allocation existing = new Allocation(UUID.randomUUID(), new BigDecimal("800"));
        payPeriod.getAllocations().add(existing);
        UUID payPeriodId = payPeriod.getId();
        when(repository.findPayPeriodById(payPeriodId)).thenReturn(Optional.of(payPeriod));

        // Only 200 unallocated, trying to allocate 500
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                payPeriodService.addAllocation(payPeriodId, UUID.randomUUID(), new BigDecimal("500")));

        assertTrue(ex.getMessage().contains("200"));
        verify(repository, never()).savePayPeriod(any());
    }

    @Test
    void addAllocation_shouldSucceed_whenAmountEqualsUnallocated() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("1000"));
        Allocation existing = new Allocation(UUID.randomUUID(), new BigDecimal("800"));
        payPeriod.getAllocations().add(existing);
        UUID payPeriodId = payPeriod.getId();
        when(repository.findPayPeriodById(payPeriodId)).thenReturn(Optional.of(payPeriod));
        when(repository.savePayPeriod(any())).thenAnswer(i -> i.getArgument(0));

        // Exactly 200 unallocated, allocating exactly 200 — should succeed
        Optional<Allocation> result = payPeriodService.addAllocation(payPeriodId, UUID.randomUUID(), new BigDecimal("200"));

        assertTrue(result.isPresent());
        assertEquals(new BigDecimal("200"), result.get().getAllocatedAmount());
    }

    @Test
    void addAllocation_shouldReturnEmpty_whenPayPeriodNotFound() {
        UUID payPeriodId = UUID.randomUUID();
        UUID bucketId = UUID.randomUUID();
        when(repository.findPayPeriodById(payPeriodId)).thenReturn(Optional.empty());

        Optional<Allocation> result = payPeriodService.addAllocation(payPeriodId, bucketId, new BigDecimal("500"));

        assertFalse(result.isPresent());
        verify(repository, never()).savePayPeriod(any());
    }

    // --- updateAllocation ---

    @Test
    void updateAllocation_shouldUpdateAllocationAmount() {
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        UUID allocationId = allocation.getId();
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));

        Optional<Allocation> result = payPeriodService.updateAllocation(allocationId, new BigDecimal("600"));

        assertTrue(result.isPresent());
        assertEquals(new BigDecimal("600"), result.get().getAllocatedAmount());
        assertEquals(new BigDecimal("600"), result.get().getCurrentBalance());
        verify(repository).save();
    }

    @Test
    void updateAllocation_shouldThrow_whenIncreaseExceedsUnallocated() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("1000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        payPeriod.getAllocations().add(allocation);
        // Another allocation uses 400, leaving only 100 unallocated
        Allocation other = new Allocation(UUID.randomUUID(), new BigDecimal("400"));
        payPeriod.getAllocations().add(other);
        UUID allocationId = allocation.getId();
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));
        when(repository.findPayPeriodByAllocationId(allocationId)).thenReturn(Optional.of(payPeriod));

        // Trying to increase from 500 to 700 (increase of 200, but only 100 unallocated)
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                payPeriodService.updateAllocation(allocationId, new BigDecimal("700")));

        assertTrue(ex.getMessage().contains("100"));
        verify(repository, never()).save();
    }

    @Test
    void updateAllocation_shouldSucceed_whenDecreasing() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("1000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        payPeriod.getAllocations().add(allocation);
        UUID allocationId = allocation.getId();
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));

        // Decreasing never needs to check unallocated
        Optional<Allocation> result = payPeriodService.updateAllocation(allocationId, new BigDecimal("300"));

        assertTrue(result.isPresent());
        assertEquals(new BigDecimal("300"), result.get().getAllocatedAmount());
        verify(repository).save();
    }

    @Test
    void updateAllocation_shouldReturnEmpty_whenAllocationNotFound() {
        UUID allocationId = UUID.randomUUID();
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.empty());

        Optional<Allocation> result = payPeriodService.updateAllocation(allocationId, new BigDecimal("600"));

        assertFalse(result.isPresent());
        verify(repository, never()).save();
    }

    @Test
    void updateAllocation_shouldCorrectlyCalculateBalanceDifference_whenDecreasing() {
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        // Simulate that some spending has occurred: currentBalance is 400 (100 spent)
        allocation.setCurrentBalance(new BigDecimal("400"));
        UUID allocationId = allocation.getId();
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));

        // Decrease allocation from 500 to 450 (difference is -50)
        Optional<Allocation> result = payPeriodService.updateAllocation(allocationId, new BigDecimal("450"));

        assertTrue(result.isPresent());
        assertEquals(new BigDecimal("450"), result.get().getAllocatedAmount());
        // currentBalance was 400, difference is 450-500 = -50, so new balance = 400 + (-50) = 350
        assertEquals(new BigDecimal("350"), result.get().getCurrentBalance());
    }

    @Test
    void updateAllocation_shouldCorrectlyCalculateBalanceDifference_whenIncreasing() {
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        // Simulate that some spending has occurred: currentBalance is 300 (200 spent)
        allocation.setCurrentBalance(new BigDecimal("300"));
        UUID allocationId = allocation.getId();
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));

        // Increase allocation from 500 to 700 (difference is +200)
        Optional<Allocation> result = payPeriodService.updateAllocation(allocationId, new BigDecimal("700"));

        assertTrue(result.isPresent());
        assertEquals(new BigDecimal("700"), result.get().getAllocatedAmount());
        // currentBalance was 300, difference is 700-500 = +200, so new balance = 300 + 200 = 500
        assertEquals(new BigDecimal("500"), result.get().getCurrentBalance());
    }

    // --- addTransaction ---

    @Test
    void addTransaction_shouldAddTransactionAndUpdateBalance() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        UUID allocationId = allocation.getId();
        payPeriod.getAllocations().add(allocation);
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));
        when(repository.findPayPeriodByAllocationId(allocationId)).thenReturn(Optional.of(payPeriod));

        Optional<Transaction> result = payPeriodService.addTransaction(allocationId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 1, 3), null, null, null);

        assertTrue(result.isPresent());
        assertEquals("Coffee", result.get().getDescription());
        assertEquals(new BigDecimal("5"), result.get().getAmount());
        assertEquals(new BigDecimal("500"), result.get().getPreviousBalance());
        assertEquals(new BigDecimal("495"), result.get().getNewBalance());
        assertEquals(new BigDecimal("495"), allocation.getCurrentBalance());
        assertEquals(1, allocation.getTransactions().size());
    }

    @Test
    void addTransaction_shouldReturnEmpty_whenAllocationNotFound() {
        UUID allocationId = UUID.randomUUID();
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.empty());

        Optional<Transaction> result = payPeriodService.addTransaction(allocationId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 1, 3), null, null, null);

        assertFalse(result.isPresent());
        verify(repository, never()).save();
    }

    @Test
    void addMultipleTransactions_shouldTrackBalancesCorrectly() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        UUID allocationId = allocation.getId();
        payPeriod.getAllocations().add(allocation);
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));
        when(repository.findPayPeriodByAllocationId(allocationId)).thenReturn(Optional.of(payPeriod));

        payPeriodService.addTransaction(allocationId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 1, 3), null, null, null);
        payPeriodService.addTransaction(allocationId, "Lunch", new BigDecimal("15"), LocalDate.of(2024, 1, 4), null, null, null);

        assertEquals(2, allocation.getTransactions().size());
        assertEquals(new BigDecimal("480"), allocation.getCurrentBalance());

        Transaction first = allocation.getTransactions().get(0);
        Transaction second = allocation.getTransactions().get(1);

        assertEquals(new BigDecimal("500"), first.getPreviousBalance());
        assertEquals(new BigDecimal("495"), first.getNewBalance());
        assertEquals(new BigDecimal("495"), second.getPreviousBalance());
        assertEquals(new BigDecimal("480"), second.getNewBalance());
    }

    @Test
    void addTransaction_shouldRejectDateOutsidePayPeriod() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        UUID allocationId = allocation.getId();
        payPeriod.getAllocations().add(allocation);
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));
        when(repository.findPayPeriodByAllocationId(allocationId)).thenReturn(Optional.of(payPeriod));

        assertThrows(IllegalArgumentException.class, () ->
                payPeriodService.addTransaction(allocationId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 2, 1), null, null, null));
    }

    @Test
    void addTransaction_shouldRejectDateBeforePayPeriodStart() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 5), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        UUID allocationId = allocation.getId();
        payPeriod.getAllocations().add(allocation);
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));
        when(repository.findPayPeriodByAllocationId(allocationId)).thenReturn(Optional.of(payPeriod));

        assertThrows(IllegalArgumentException.class, () ->
                payPeriodService.addTransaction(allocationId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 1, 1), null, null, null));
    }

    @Test
    void addTransaction_shouldAcceptDateOnPayPeriodBoundaries() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        UUID allocationId = allocation.getId();
        payPeriod.getAllocations().add(allocation);
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));
        when(repository.findPayPeriodByAllocationId(allocationId)).thenReturn(Optional.of(payPeriod));

        // Exact start date should be accepted
        Optional<Transaction> resultStart = payPeriodService.addTransaction(
                allocationId, "Day 1 expense", new BigDecimal("10"), LocalDate.of(2024, 1, 1), null, null, null);
        assertTrue(resultStart.isPresent());

        // Exact end date should be accepted
        Optional<Transaction> resultEnd = payPeriodService.addTransaction(
                allocationId, "Last day expense", new BigDecimal("20"), LocalDate.of(2024, 1, 15), null, null, null);
        assertTrue(resultEnd.isPresent());
    }

    @Test
    void addTransaction_shouldSortByDate() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        UUID allocationId = allocation.getId();
        payPeriod.getAllocations().add(allocation);
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));
        when(repository.findPayPeriodByAllocationId(allocationId)).thenReturn(Optional.of(payPeriod));

        // Add out of order: Jan 5 then Jan 2
        payPeriodService.addTransaction(allocationId, "Lunch", new BigDecimal("15"), LocalDate.of(2024, 1, 5), null, null, null);
        payPeriodService.addTransaction(allocationId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 1, 2), null, null, null);

        assertEquals(2, allocation.getTransactions().size());

        Transaction first = allocation.getTransactions().get(0);
        Transaction second = allocation.getTransactions().get(1);

        // Should be sorted: Jan 2 first, Jan 5 second
        assertEquals("Coffee", first.getDescription());
        assertEquals(LocalDate.of(2024, 1, 2), first.getDate());
        assertEquals("Lunch", second.getDescription());
        assertEquals(LocalDate.of(2024, 1, 5), second.getDate());

        // Balances should be recalculated in sorted order
        assertEquals(new BigDecimal("500"), first.getPreviousBalance());
        assertEquals(new BigDecimal("495"), first.getNewBalance());
        assertEquals(new BigDecimal("495"), second.getPreviousBalance());
        assertEquals(new BigDecimal("480"), second.getNewBalance());
        assertEquals(new BigDecimal("480"), allocation.getCurrentBalance());
    }

    // --- updateTransaction ---

    @Test
    void updateTransaction_shouldUpdateTransactionAndRecalculateBalances() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        payPeriod.getAllocations().add(allocation);

        // Set up two existing transactions
        Transaction t1 = new Transaction("Coffee", new BigDecimal("5"),
                LocalDate.of(2024, 1, 3), new BigDecimal("500"), new BigDecimal("495"));
        Transaction t2 = new Transaction("Lunch", new BigDecimal("15"),
                LocalDate.of(2024, 1, 5), new BigDecimal("495"), new BigDecimal("480"));
        allocation.getTransactions().add(t1);
        allocation.getTransactions().add(t2);
        allocation.setCurrentBalance(new BigDecimal("480"));

        UUID transactionId = t1.getId();
        when(repository.findTransactionById(transactionId)).thenReturn(Optional.of(t1));
        when(repository.findAllocationByTransactionId(transactionId)).thenReturn(Optional.of(allocation));
        when(repository.findPayPeriodByAllocationId(allocation.getId())).thenReturn(Optional.of(payPeriod));

        // Update Coffee from $5 to $10
        Optional<Transaction> result = payPeriodService.updateTransaction(
                transactionId, "Coffee (large)", new BigDecimal("10"), LocalDate.of(2024, 1, 3), null, null, null);

        assertTrue(result.isPresent());
        assertEquals("Coffee (large)", result.get().getDescription());
        assertEquals(new BigDecimal("10"), result.get().getAmount());

        // Verify balance recalculation for all transactions
        // t1: prev=500, amount=10, new=490
        assertEquals(new BigDecimal("500"), t1.getPreviousBalance());
        assertEquals(new BigDecimal("490"), t1.getNewBalance());
        // t2: prev=490, amount=15, new=475
        assertEquals(new BigDecimal("490"), t2.getPreviousBalance());
        assertEquals(new BigDecimal("475"), t2.getNewBalance());
        // Allocation balance updated
        assertEquals(new BigDecimal("475"), allocation.getCurrentBalance());
        verify(repository).save();
    }

    @Test
    void updateTransaction_shouldReturnEmpty_whenTransactionNotFound() {
        UUID transactionId = UUID.randomUUID();
        when(repository.findTransactionById(transactionId)).thenReturn(Optional.empty());

        Optional<Transaction> result = payPeriodService.updateTransaction(
                transactionId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 1, 3), null, null, null);

        assertFalse(result.isPresent());
        verify(repository, never()).save();
    }

    @Test
    void updateTransaction_shouldThrowException_whenAllocationNotFound() {
        Transaction transaction = new Transaction("Coffee", new BigDecimal("5"),
                LocalDate.of(2024, 1, 3), new BigDecimal("500"), new BigDecimal("495"));
        UUID transactionId = transaction.getId();

        when(repository.findTransactionById(transactionId)).thenReturn(Optional.of(transaction));
        when(repository.findAllocationByTransactionId(transactionId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () ->
                payPeriodService.updateTransaction(transactionId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 1, 3), null, null, null));
    }

    @Test
    void updateTransaction_shouldRejectDateOutsidePayPeriod() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        payPeriod.getAllocations().add(allocation);

        Transaction transaction = new Transaction("Coffee", new BigDecimal("5"),
                LocalDate.of(2024, 1, 3), new BigDecimal("500"), new BigDecimal("495"));
        allocation.getTransactions().add(transaction);
        allocation.setCurrentBalance(new BigDecimal("495"));
        UUID transactionId = transaction.getId();

        when(repository.findTransactionById(transactionId)).thenReturn(Optional.of(transaction));
        when(repository.findAllocationByTransactionId(transactionId)).thenReturn(Optional.of(allocation));
        when(repository.findPayPeriodByAllocationId(allocation.getId())).thenReturn(Optional.of(payPeriod));

        assertThrows(IllegalArgumentException.class, () ->
                payPeriodService.updateTransaction(transactionId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 2, 1), null, null, null));
    }

    @Test
    void updateTransaction_shouldResortByDate_whenDateChanges() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        payPeriod.getAllocations().add(allocation);

        Transaction t1 = new Transaction("Coffee", new BigDecimal("5"),
                LocalDate.of(2024, 1, 3), new BigDecimal("500"), new BigDecimal("495"));
        Transaction t2 = new Transaction("Lunch", new BigDecimal("15"),
                LocalDate.of(2024, 1, 5), new BigDecimal("495"), new BigDecimal("480"));
        allocation.getTransactions().add(t1);
        allocation.getTransactions().add(t2);
        allocation.setCurrentBalance(new BigDecimal("480"));

        UUID transactionId = t1.getId();
        when(repository.findTransactionById(transactionId)).thenReturn(Optional.of(t1));
        when(repository.findAllocationByTransactionId(transactionId)).thenReturn(Optional.of(allocation));
        when(repository.findPayPeriodByAllocationId(allocation.getId())).thenReturn(Optional.of(payPeriod));

        // Move Coffee from Jan 3 to Jan 10 (after Lunch on Jan 5) -- order should swap
        payPeriodService.updateTransaction(transactionId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 1, 10), null, null, null);

        // After sort: Lunch (Jan 5) should be first, Coffee (Jan 10) should be second
        assertEquals("Lunch", allocation.getTransactions().get(0).getDescription());
        assertEquals("Coffee", allocation.getTransactions().get(1).getDescription());

        // Recalculated balances: Lunch first: prev=500, amount=15, new=485
        assertEquals(new BigDecimal("500"), allocation.getTransactions().get(0).getPreviousBalance());
        assertEquals(new BigDecimal("485"), allocation.getTransactions().get(0).getNewBalance());
        // Coffee second: prev=485, amount=5, new=480
        assertEquals(new BigDecimal("485"), allocation.getTransactions().get(1).getPreviousBalance());
        assertEquals(new BigDecimal("480"), allocation.getTransactions().get(1).getNewBalance());
        assertEquals(new BigDecimal("480"), allocation.getCurrentBalance());
    }

    // --- deleteTransaction ---

    @Test
    void deleteTransaction_shouldRemoveTransactionAndRecalculateBalances() {
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));

        Transaction t1 = new Transaction("Coffee", new BigDecimal("5"),
                LocalDate.of(2024, 1, 3), new BigDecimal("500"), new BigDecimal("495"));
        Transaction t2 = new Transaction("Lunch", new BigDecimal("15"),
                LocalDate.of(2024, 1, 5), new BigDecimal("495"), new BigDecimal("480"));
        allocation.getTransactions().add(t1);
        allocation.getTransactions().add(t2);
        allocation.setCurrentBalance(new BigDecimal("480"));

        UUID transactionId = t1.getId();
        when(repository.findAllocationByTransactionId(transactionId)).thenReturn(Optional.of(allocation));

        boolean result = payPeriodService.deleteTransaction(transactionId);

        assertTrue(result);
        assertEquals(1, allocation.getTransactions().size());
        assertEquals("Lunch", allocation.getTransactions().get(0).getDescription());
        // After deleting Coffee ($5), only Lunch ($15) remains: prev=500, new=485
        assertEquals(new BigDecimal("500"), allocation.getTransactions().get(0).getPreviousBalance());
        assertEquals(new BigDecimal("485"), allocation.getTransactions().get(0).getNewBalance());
        assertEquals(new BigDecimal("485"), allocation.getCurrentBalance());
        verify(repository).save();
    }

    @Test
    void deleteTransaction_shouldReturnFalse_whenAllocationNotFound() {
        UUID transactionId = UUID.randomUUID();
        when(repository.findAllocationByTransactionId(transactionId)).thenReturn(Optional.empty());

        boolean result = payPeriodService.deleteTransaction(transactionId);

        assertFalse(result);
        verify(repository, never()).save();
    }

    @Test
    void deleteTransaction_shouldReturnFalse_whenTransactionNotInAllocation() {
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        // Allocation exists but has no transactions matching the given ID
        UUID transactionId = UUID.randomUUID();
        when(repository.findAllocationByTransactionId(transactionId)).thenReturn(Optional.of(allocation));

        boolean result = payPeriodService.deleteTransaction(transactionId);

        // removeIf returns false because no transaction matched
        assertFalse(result);
        verify(repository, never()).save();
    }

    @Test
    void deleteTransaction_shouldHandleLastTransaction() {
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        Transaction t1 = new Transaction("Coffee", new BigDecimal("5"),
                LocalDate.of(2024, 1, 3), new BigDecimal("500"), new BigDecimal("495"));
        allocation.getTransactions().add(t1);
        allocation.setCurrentBalance(new BigDecimal("495"));

        UUID transactionId = t1.getId();
        when(repository.findAllocationByTransactionId(transactionId)).thenReturn(Optional.of(allocation));

        boolean result = payPeriodService.deleteTransaction(transactionId);

        assertTrue(result);
        assertEquals(0, allocation.getTransactions().size());
        // Balance should return to the allocated amount since no transactions remain
        assertEquals(new BigDecimal("500"), allocation.getCurrentBalance());
        verify(repository).save();
    }

    @Test
    void deleteTransaction_shouldRecalculateMiddleTransaction() {
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("1000"));

        Transaction t1 = new Transaction("Coffee", new BigDecimal("10"),
                LocalDate.of(2024, 1, 2), new BigDecimal("1000"), new BigDecimal("990"));
        Transaction t2 = new Transaction("Lunch", new BigDecimal("20"),
                LocalDate.of(2024, 1, 5), new BigDecimal("990"), new BigDecimal("970"));
        Transaction t3 = new Transaction("Dinner", new BigDecimal("30"),
                LocalDate.of(2024, 1, 8), new BigDecimal("970"), new BigDecimal("940"));
        allocation.getTransactions().add(t1);
        allocation.getTransactions().add(t2);
        allocation.getTransactions().add(t3);
        allocation.setCurrentBalance(new BigDecimal("940"));

        UUID middleId = t2.getId();
        when(repository.findAllocationByTransactionId(middleId)).thenReturn(Optional.of(allocation));

        boolean result = payPeriodService.deleteTransaction(middleId);

        assertTrue(result);
        assertEquals(2, allocation.getTransactions().size());

        // After removing Lunch ($20):
        // t1 (Coffee): prev=1000, amount=10, new=990
        assertEquals(new BigDecimal("1000"), allocation.getTransactions().get(0).getPreviousBalance());
        assertEquals(new BigDecimal("990"), allocation.getTransactions().get(0).getNewBalance());
        // t3 (Dinner): prev=990, amount=30, new=960
        assertEquals(new BigDecimal("990"), allocation.getTransactions().get(1).getPreviousBalance());
        assertEquals(new BigDecimal("960"), allocation.getTransactions().get(1).getNewBalance());
        assertEquals(new BigDecimal("960"), allocation.getCurrentBalance());
    }

    // --- deletePayPeriod ---

    @Test
    void deletePayPeriod_shouldReturnTrue_whenExists() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        UUID id = payPeriod.getId();
        when(repository.findPayPeriodById(id)).thenReturn(Optional.of(payPeriod));

        boolean result = payPeriodService.deletePayPeriod(id);

        assertTrue(result);
        verify(repository).deletePayPeriod(id);
    }

    @Test
    void deletePayPeriod_shouldReturnFalse_whenNotExists() {
        UUID id = UUID.randomUUID();
        when(repository.findPayPeriodById(id)).thenReturn(Optional.empty());

        boolean result = payPeriodService.deletePayPeriod(id);

        assertFalse(result);
        verify(repository, never()).deletePayPeriod(any());
    }

    // --- validateTransactionDate edge cases ---

    @Test
    void addTransaction_shouldThrow_whenPayPeriodNotFoundForAllocation() {
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        UUID allocationId = allocation.getId();
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));
        when(repository.findPayPeriodByAllocationId(allocationId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () ->
                payPeriodService.addTransaction(allocationId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 1, 3), null, null, null));
    }

    @Test
    void addTransaction_shouldCallSaveOnRepository() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        UUID allocationId = allocation.getId();
        payPeriod.getAllocations().add(allocation);
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));
        when(repository.findPayPeriodByAllocationId(allocationId)).thenReturn(Optional.of(payPeriod));

        payPeriodService.addTransaction(allocationId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 1, 3), null, null, null);

        verify(repository).save();
    }
}
