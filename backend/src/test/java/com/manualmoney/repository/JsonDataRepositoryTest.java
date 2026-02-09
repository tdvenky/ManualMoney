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

    private String testDataPath;

    @BeforeEach
    void setUp() {
        repository = new JsonDataRepository();
        testDataPath = tempDir.resolve("test-data.json").toString();
        ReflectionTestUtils.setField(repository, "dataPath", testDataPath);
        repository.init();
    }

    // --- Bucket operations ---

    @Test
    void saveBucket_shouldPersistBucket() {
        Bucket bucket = new Bucket("Groceries", BucketType.EXPENSE);

        Bucket saved = repository.saveBucket(bucket);

        assertNotNull(saved.getId());
        assertEquals("Groceries", saved.getName());
        assertEquals(1, repository.findAllBuckets().size());
    }

    @Test
    void saveBucket_shouldUpdateExistingBucket() {
        Bucket bucket = new Bucket("Groceries", BucketType.EXPENSE);
        repository.saveBucket(bucket);

        // Modify and save the same bucket (same ID)
        bucket.setName("Food & Groceries");
        bucket.setType(BucketType.SAVINGS);
        repository.saveBucket(bucket);

        // Should still be only 1 bucket, not 2
        assertEquals(1, repository.findAllBuckets().size());
        assertEquals("Food & Groceries", repository.findAllBuckets().get(0).getName());
        assertEquals(BucketType.SAVINGS, repository.findAllBuckets().get(0).getType());
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
    void findBucketById_shouldReturnEmpty_whenNotExists() {
        UUID randomId = UUID.randomUUID();

        Optional<Bucket> found = repository.findBucketById(randomId);

        assertFalse(found.isPresent());
    }

    @Test
    void deleteBucket_shouldRemoveBucket() {
        Bucket bucket = new Bucket("Groceries", BucketType.EXPENSE);
        repository.saveBucket(bucket);

        repository.deleteBucket(bucket.getId());

        assertEquals(0, repository.findAllBuckets().size());
    }

    @Test
    void deleteBucket_shouldNotAffectOtherBuckets() {
        Bucket bucket1 = new Bucket("Groceries", BucketType.EXPENSE);
        Bucket bucket2 = new Bucket("Rent", BucketType.EXPENSE);
        repository.saveBucket(bucket1);
        repository.saveBucket(bucket2);

        repository.deleteBucket(bucket1.getId());

        assertEquals(1, repository.findAllBuckets().size());
        assertEquals("Rent", repository.findAllBuckets().get(0).getName());
    }

    @Test
    void findAllBuckets_shouldReturnEmptyList_whenNoBuckets() {
        assertEquals(0, repository.findAllBuckets().size());
    }

    // --- PayPeriod operations ---

    @Test
    void savePayPeriod_shouldPersistPayPeriod() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));

        PayPeriod saved = repository.savePayPeriod(payPeriod);

        assertNotNull(saved.getId());
        assertEquals(1, repository.findAllPayPeriods().size());
    }

    @Test
    void savePayPeriod_shouldUpdateExistingPayPeriod() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        repository.savePayPeriod(payPeriod);

        // Update it
        payPeriod.setAmount(new BigDecimal("3000"));
        payPeriod.setStatus(PayPeriodStatus.CLOSED);
        repository.savePayPeriod(payPeriod);

        // Should still be only 1 pay period, not 2
        assertEquals(1, repository.findAllPayPeriods().size());
        assertEquals(PayPeriodStatus.CLOSED, repository.findAllPayPeriods().get(0).getStatus());
    }

    @Test
    void findPayPeriodById_shouldReturnPayPeriod_whenExists() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        repository.savePayPeriod(payPeriod);

        Optional<PayPeriod> found = repository.findPayPeriodById(payPeriod.getId());

        assertTrue(found.isPresent());
        assertEquals(payPeriod.getId(), found.get().getId());
    }

    @Test
    void findPayPeriodById_shouldReturnEmpty_whenNotExists() {
        UUID randomId = UUID.randomUUID();

        Optional<PayPeriod> found = repository.findPayPeriodById(randomId);

        assertFalse(found.isPresent());
    }

    @Test
    void deletePayPeriod_shouldRemovePayPeriod() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        repository.savePayPeriod(payPeriod);

        repository.deletePayPeriod(payPeriod.getId());

        assertEquals(0, repository.findAllPayPeriods().size());
    }

    @Test
    void deletePayPeriod_shouldNotAffectOtherPayPeriods() {
        PayPeriod pp1 = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        PayPeriod pp2 = new PayPeriod(LocalDate.of(2024, 1, 16), LocalDate.of(2024, 1, 31), new BigDecimal("2500"));
        repository.savePayPeriod(pp1);
        repository.savePayPeriod(pp2);

        repository.deletePayPeriod(pp1.getId());

        assertEquals(1, repository.findAllPayPeriods().size());
        assertEquals(pp2.getId(), repository.findAllPayPeriods().get(0).getId());
    }

    @Test
    void findAllPayPeriods_shouldReturnEmptyList_whenNoPayPeriods() {
        assertEquals(0, repository.findAllPayPeriods().size());
    }

    // --- Allocation operations ---

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
    void findAllocationById_shouldReturnEmpty_whenNotExists() {
        UUID randomId = UUID.randomUUID();

        Optional<Allocation> found = repository.findAllocationById(randomId);

        assertFalse(found.isPresent());
    }

    @Test
    void findAllocationById_shouldSearchAcrossPayPeriods() {
        PayPeriod pp1 = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        PayPeriod pp2 = new PayPeriod(LocalDate.of(2024, 1, 16), LocalDate.of(2024, 1, 31), new BigDecimal("2500"));
        Allocation alloc1 = new Allocation(UUID.randomUUID(), new BigDecimal("300"));
        Allocation alloc2 = new Allocation(UUID.randomUUID(), new BigDecimal("700"));
        pp1.getAllocations().add(alloc1);
        pp2.getAllocations().add(alloc2);
        repository.savePayPeriod(pp1);
        repository.savePayPeriod(pp2);

        // Should find allocation in the second pay period
        Optional<Allocation> found = repository.findAllocationById(alloc2.getId());

        assertTrue(found.isPresent());
        assertEquals(new BigDecimal("700"), found.get().getAllocatedAmount());
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
    void findPayPeriodByAllocationId_shouldReturnEmpty_whenNotExists() {
        UUID randomId = UUID.randomUUID();

        Optional<PayPeriod> found = repository.findPayPeriodByAllocationId(randomId);

        assertFalse(found.isPresent());
    }

    // --- Transaction operations ---

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
    void findTransactionById_shouldReturnEmpty_whenNotExists() {
        UUID randomId = UUID.randomUUID();

        Optional<Transaction> found = repository.findTransactionById(randomId);

        assertFalse(found.isPresent());
    }

    @Test
    void findTransactionById_shouldSearchAcrossAllocationsAndPayPeriods() {
        PayPeriod pp1 = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation alloc1 = new Allocation(UUID.randomUUID(), new BigDecimal("300"));
        Allocation alloc2 = new Allocation(UUID.randomUUID(), new BigDecimal("700"));

        Transaction t1 = new Transaction("Coffee", new BigDecimal("5"),
                LocalDate.of(2024, 1, 3), new BigDecimal("300"), new BigDecimal("295"));
        Transaction t2 = new Transaction("Lunch", new BigDecimal("15"),
                LocalDate.of(2024, 1, 5), new BigDecimal("700"), new BigDecimal("685"));

        alloc1.getTransactions().add(t1);
        alloc2.getTransactions().add(t2);
        pp1.getAllocations().add(alloc1);
        pp1.getAllocations().add(alloc2);
        repository.savePayPeriod(pp1);

        // Should find transaction in the second allocation
        Optional<Transaction> found = repository.findTransactionById(t2.getId());

        assertTrue(found.isPresent());
        assertEquals("Lunch", found.get().getDescription());
    }

    @Test
    void findAllocationByTransactionId_shouldReturnAllocation() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        Transaction transaction = new Transaction("Coffee", new BigDecimal("5"),
                LocalDate.of(2024, 1, 3), new BigDecimal("500"), new BigDecimal("495"));
        allocation.getTransactions().add(transaction);
        payPeriod.getAllocations().add(allocation);
        repository.savePayPeriod(payPeriod);

        Optional<Allocation> found = repository.findAllocationByTransactionId(transaction.getId());

        assertTrue(found.isPresent());
        assertEquals(allocation.getId(), found.get().getId());
    }

    @Test
    void findAllocationByTransactionId_shouldReturnEmpty_whenNotExists() {
        UUID randomId = UUID.randomUUID();

        Optional<Allocation> found = repository.findAllocationByTransactionId(randomId);

        assertFalse(found.isPresent());
    }

    // --- Export/Import operations ---

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
    void exportData_shouldReturnEmptyDataInitially() {
        AppData exported = repository.exportData();

        assertNotNull(exported);
        assertTrue(exported.getBuckets().isEmpty());
        assertTrue(exported.getPayPeriods().isEmpty());
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

    @Test
    void importData_shouldPersistToFile() {
        AppData newData = new AppData();
        newData.getBuckets().add(new Bucket("Imported Bucket", BucketType.EXPENSE));
        newData.getPayPeriods().add(new PayPeriod(LocalDate.of(2024, 3, 1), LocalDate.of(2024, 3, 15), new BigDecimal("1500")));

        repository.importData(newData);

        // Create a new repository pointing to the same file to verify persistence
        JsonDataRepository freshRepo = new JsonDataRepository();
        ReflectionTestUtils.setField(freshRepo, "dataPath", testDataPath);
        freshRepo.init();

        assertEquals(1, freshRepo.findAllBuckets().size());
        assertEquals("Imported Bucket", freshRepo.findAllBuckets().get(0).getName());
        assertEquals(1, freshRepo.findAllPayPeriods().size());
    }

    // --- save() method ---

    @Test
    void save_shouldPersistCurrentState() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        payPeriod.getAllocations().add(allocation);
        repository.savePayPeriod(payPeriod);

        // Directly mutate allocation's balance (as the service does)
        allocation.setCurrentBalance(new BigDecimal("450"));
        repository.save();

        // Create a fresh repository to verify persistence
        JsonDataRepository freshRepo = new JsonDataRepository();
        ReflectionTestUtils.setField(freshRepo, "dataPath", testDataPath);
        freshRepo.init();

        Optional<Allocation> found = freshRepo.findAllocationById(allocation.getId());
        assertTrue(found.isPresent());
        assertEquals(new BigDecimal("450"), found.get().getCurrentBalance());
    }

    // --- Data persistence across restarts ---

    @Test
    void init_shouldLoadExistingDataFromFile() {
        // Save some data
        Bucket bucket = new Bucket("Groceries", BucketType.EXPENSE);
        repository.saveBucket(bucket);

        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        Transaction transaction = new Transaction("Coffee", new BigDecimal("5"),
                LocalDate.of(2024, 1, 3), new BigDecimal("500"), new BigDecimal("495"));
        allocation.getTransactions().add(transaction);
        payPeriod.getAllocations().add(allocation);
        repository.savePayPeriod(payPeriod);

        // Create a new repository pointing to the same file -- simulates restart
        JsonDataRepository freshRepo = new JsonDataRepository();
        ReflectionTestUtils.setField(freshRepo, "dataPath", testDataPath);
        freshRepo.init();

        // All data should be loaded
        assertEquals(1, freshRepo.findAllBuckets().size());
        assertEquals("Groceries", freshRepo.findAllBuckets().get(0).getName());
        assertEquals(1, freshRepo.findAllPayPeriods().size());
        assertTrue(freshRepo.findAllocationById(allocation.getId()).isPresent());
        assertTrue(freshRepo.findTransactionById(transaction.getId()).isPresent());
    }

    @Test
    void init_shouldCreateNewAppData_whenFileDoesNotExist() {
        // Create a repository pointing to a non-existent file
        JsonDataRepository freshRepo = new JsonDataRepository();
        ReflectionTestUtils.setField(freshRepo, "dataPath", tempDir.resolve("non-existent.json").toString());
        freshRepo.init();

        assertNotNull(freshRepo.findAllBuckets());
        assertTrue(freshRepo.findAllBuckets().isEmpty());
        assertNotNull(freshRepo.findAllPayPeriods());
        assertTrue(freshRepo.findAllPayPeriods().isEmpty());
    }

    @Test
    void init_shouldCreateNewAppData_whenFileContainsInvalidJson() throws Exception {
        // Write invalid JSON to the file
        Path invalidFile = tempDir.resolve("invalid.json");
        java.nio.file.Files.write(invalidFile, "not valid json{{{".getBytes());

        JsonDataRepository freshRepo = new JsonDataRepository();
        ReflectionTestUtils.setField(freshRepo, "dataPath", invalidFile.toString());
        freshRepo.init();

        // Should fall back to empty AppData
        assertNotNull(freshRepo.findAllBuckets());
        assertTrue(freshRepo.findAllBuckets().isEmpty());
    }

    // --- Multiple buckets and pay periods ---

    @Test
    void findAllBuckets_shouldReturnAllSavedBuckets() {
        repository.saveBucket(new Bucket("Groceries", BucketType.EXPENSE));
        repository.saveBucket(new Bucket("Rent", BucketType.EXPENSE));
        repository.saveBucket(new Bucket("Emergency Fund", BucketType.SAVINGS));

        assertEquals(3, repository.findAllBuckets().size());
    }

    @Test
    void findAllPayPeriods_shouldReturnAllSavedPayPeriods() {
        repository.savePayPeriod(new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000")));
        repository.savePayPeriod(new PayPeriod(LocalDate.of(2024, 1, 16), LocalDate.of(2024, 1, 31), new BigDecimal("2500")));

        assertEquals(2, repository.findAllPayPeriods().size());
    }

    // --- savePayPeriod update preserves allocations ---

    @Test
    void savePayPeriod_update_shouldPreserveAllocations() {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("500"));
        payPeriod.getAllocations().add(allocation);
        repository.savePayPeriod(payPeriod);

        // Update the pay period (same ID)
        payPeriod.setAmount(new BigDecimal("3000"));
        repository.savePayPeriod(payPeriod);

        // Should still have the allocation
        assertEquals(1, repository.findAllPayPeriods().size());
        assertEquals(1, repository.findAllPayPeriods().get(0).getAllocations().size());
    }
}
