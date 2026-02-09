package com.manualmoney.repository;

import com.manualmoney.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JsonDataRepositoryTest {

    private JsonDataRepository repository;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        repository = new JsonDataRepository();
        String testDataPath = tempDir.resolve("test-data.json").toString();
        ReflectionTestUtils.setField(repository, "dataPath", testDataPath);
        repository.init();
    }

    @Test
    void saveBucket_shouldPersistBucket() {
        Bucket bucket = new Bucket("Groceries", BucketType.EXPENSE);

        Bucket saved = repository.saveBucket(bucket);

        assertNotNull(saved.getId());
        assertEquals("Groceries", saved.getName());
        assertEquals(1, repository.findAllBuckets().size());
    }

    @Test
    void findBucketById_shouldReturnBucket_whenExists() {
        Bucket bucket = new Bucket("Groceries", BucketType.EXPENSE);
        repository.saveBucket(bucket);

        Optional<Bucket> found = repository.findBucketById(bucket.getId());

        assertTrue(found.isPresent());
        assertEquals("Groceries", found.get().getName());
    }

    @Test
    void deleteBucket_shouldRemoveBucket() {
        Bucket bucket = new Bucket("Groceries", BucketType.EXPENSE);
        repository.saveBucket(bucket);

        repository.deleteBucket(bucket.getId());

        assertEquals(0, repository.findAllBuckets().size());
    }

    @Test
    void savePayPeriod_shouldPersistPayPeriod() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));

        PayPeriod saved = repository.savePayPeriod(payPeriod);

        assertNotNull(saved.getId());
        assertEquals(1, repository.findAllPayPeriods().size());
    }

    @Test
    void findAllocationById_shouldReturnAllocation_whenExists() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        payPeriod.getAllocations().add(allocation);
        repository.savePayPeriod(payPeriod);

        Optional<Allocation> found = repository.findAllocationById(allocation.getId());

        assertTrue(found.isPresent());
        assertEquals(new BigDecimal("500"), found.get().getAllocatedAmount());
    }

    @Test
    void findTransactionById_shouldReturnTransaction_whenExists() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        Transaction transaction = new Transaction("Coffee", new BigDecimal("5"),
                LocalDate.of(2024, 1, 3), new BigDecimal("500"), new BigDecimal("495"));
        allocation.getTransactions().add(transaction);
        payPeriod.getAllocations().add(allocation);
        repository.savePayPeriod(payPeriod);

        Optional<Transaction> found = repository.findTransactionById(transaction.getId());

        assertTrue(found.isPresent());
        assertEquals("Coffee", found.get().getDescription());
    }

    @Test
    void findPayPeriodByAllocationId_shouldReturnPayPeriod() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        payPeriod.getAllocations().add(allocation);
        repository.savePayPeriod(payPeriod);

        Optional<PayPeriod> found = repository.findPayPeriodByAllocationId(allocation.getId());

        assertTrue(found.isPresent());
        assertEquals(payPeriod.getId(), found.get().getId());
    }

    @Test
    void exportData_shouldReturnAllData() {
        Bucket bucket = new Bucket("Groceries", BucketType.EXPENSE);
        repository.saveBucket(bucket);
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        repository.savePayPeriod(payPeriod);

        AppData exported = repository.exportData();

        assertEquals(1, exported.getBuckets().size());
        assertEquals(1, exported.getPayPeriods().size());
    }

    @Test
    void importData_shouldReplaceAllData() {
        Bucket bucket = new Bucket("Old", BucketType.EXPENSE);
        repository.saveBucket(bucket);

        AppData newData = new AppData();
        newData.getBuckets().add(new Bucket("New1", BucketType.EXPENSE));
        newData.getBuckets().add(new Bucket("New2", BucketType.SAVINGS));

        repository.importData(newData);

        assertEquals(2, repository.findAllBuckets().size());
        assertEquals("New1", repository.findAllBuckets().get(0).getName());
    }
}
