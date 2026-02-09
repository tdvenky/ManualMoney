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

    @Test
    void createPayPeriod_shouldCreateAndReturnPayPeriod() {
        when(repository.savePayPeriod(any(PayPeriod.class))).thenAnswer(i -> i.getArgument(0));

        PayPeriod result = payPeriodService.createPayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2500"));

        assertNotNull(result);
        assertEquals(new BigDecimal("2500"), result.getAmount());
        assertEquals(PayPeriodStatus.ACTIVE, result.getStatus());
        verify(repository).savePayPeriod(any(PayPeriod.class));
    }

    @Test
    void closePayPeriod_shouldUpdateStatusToClosed() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        UUID id = payPeriod.getId();
        when(repository.findPayPeriodById(id)).thenReturn(Optional.of(payPeriod));
        when(repository.savePayPeriod(any(PayPeriod.class))).thenAnswer(i -> i.getArgument(0));

        Optional<PayPeriod> result = payPeriodService.closePayPeriod(id);

        assertTrue(result.isPresent());
        assertEquals(PayPeriodStatus.CLOSED, result.get().getStatus());
    }

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
        assertEquals(bucketId, result.get().getBucketId());
        assertEquals(1, payPeriod.getAllocations().size());
    }

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
    void addTransaction_shouldAddTransactionAndUpdateBalance() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        UUID allocationId = allocation.getId();
        payPeriod.getAllocations().add(allocation);
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));
        when(repository.findPayPeriodByAllocationId(allocationId)).thenReturn(Optional.of(payPeriod));

        Optional<Transaction> result = payPeriodService.addTransaction(allocationId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 1, 3));

        assertTrue(result.isPresent());
        assertEquals("Coffee", result.get().getDescription());
        assertEquals(new BigDecimal("5"), result.get().getAmount());
        assertEquals(new BigDecimal("500"), result.get().getPreviousBalance());
        assertEquals(new BigDecimal("495"), result.get().getNewBalance());
        assertEquals(new BigDecimal("495"), allocation.getCurrentBalance());
        assertEquals(1, allocation.getTransactions().size());
    }

    @Test
    void addMultipleTransactions_shouldTrackBalancesCorrectly() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        UUID allocationId = allocation.getId();
        payPeriod.getAllocations().add(allocation);
        when(repository.findAllocationById(allocationId)).thenReturn(Optional.of(allocation));
        when(repository.findPayPeriodByAllocationId(allocationId)).thenReturn(Optional.of(payPeriod));

        payPeriodService.addTransaction(allocationId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 1, 3));
        payPeriodService.addTransaction(allocationId, "Lunch", new BigDecimal("15"), LocalDate.of(2024, 1, 4));

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
                payPeriodService.addTransaction(allocationId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 2, 1)));
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
        payPeriodService.addTransaction(allocationId, "Lunch", new BigDecimal("15"), LocalDate.of(2024, 1, 5));
        payPeriodService.addTransaction(allocationId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 1, 2));

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
                payPeriodService.updateTransaction(transactionId, "Coffee", new BigDecimal("5"), LocalDate.of(2024, 2, 1)));
    }
}
