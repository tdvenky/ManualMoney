package com.manualmoney.service;

import com.manualmoney.model.Bucket;
import com.manualmoney.model.BucketType;
import com.manualmoney.repository.JsonDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BucketServiceTest {

    @Mock
    private JsonDataRepository repository;

    private BucketService bucketService;

    @BeforeEach
    void setUp() {
        bucketService = new BucketService(repository);
    }

    @Test
    void getAllBuckets_shouldReturnAllBuckets() {
        List<Bucket> expected = Arrays.asList(
                new Bucket("Groceries", BucketType.EXPENSE),
                new Bucket("Emergency Fund", BucketType.SAVINGS)
        );
        when(repository.findAllBuckets()).thenReturn(expected);

        List<Bucket> result = bucketService.getAllBuckets();

        assertEquals(2, result.size());
        verify(repository).findAllBuckets();
    }

    @Test
    void getBucketById_shouldReturnBucket_whenExists() {
        Bucket bucket = new Bucket("Groceries", BucketType.EXPENSE);
        UUID id = bucket.getId();
        when(repository.findBucketById(id)).thenReturn(Optional.of(bucket));

        Optional<Bucket> result = bucketService.getBucketById(id);

        assertTrue(result.isPresent());
        assertEquals("Groceries", result.get().getName());
    }

    @Test
    void getBucketById_shouldReturnEmpty_whenNotExists() {
        UUID id = UUID.randomUUID();
        when(repository.findBucketById(id)).thenReturn(Optional.empty());

        Optional<Bucket> result = bucketService.getBucketById(id);

        assertFalse(result.isPresent());
    }

    @Test
    void createBucket_shouldCreateAndReturnBucket() {
        when(repository.saveBucket(any(Bucket.class))).thenAnswer(i -> i.getArgument(0));

        Bucket result = bucketService.createBucket("Rent", BucketType.EXPENSE);

        assertNotNull(result);
        assertEquals("Rent", result.getName());
        assertEquals(BucketType.EXPENSE, result.getType());
        verify(repository).saveBucket(any(Bucket.class));
    }

    @Test
    void updateBucket_shouldUpdateAndReturnBucket_whenExists() {
        Bucket bucket = new Bucket("Groceries", BucketType.EXPENSE);
        UUID id = bucket.getId();
        when(repository.findBucketById(id)).thenReturn(Optional.of(bucket));
        when(repository.saveBucket(any(Bucket.class))).thenAnswer(i -> i.getArgument(0));

        Optional<Bucket> result = bucketService.updateBucket(id, "Food", BucketType.EXPENSE);

        assertTrue(result.isPresent());
        assertEquals("Food", result.get().getName());
    }

    @Test
    void updateBucket_shouldReturnEmpty_whenNotExists() {
        UUID id = UUID.randomUUID();
        when(repository.findBucketById(id)).thenReturn(Optional.empty());

        Optional<Bucket> result = bucketService.updateBucket(id, "Food", BucketType.EXPENSE);

        assertFalse(result.isPresent());
    }

    @Test
    void deleteBucket_shouldReturnTrue_whenExists() {
        UUID id = UUID.randomUUID();
        when(repository.findBucketById(id)).thenReturn(Optional.of(new Bucket()));

        boolean result = bucketService.deleteBucket(id);

        assertTrue(result);
        verify(repository).deleteBucket(id);
    }

    @Test
    void deleteBucket_shouldReturnFalse_whenNotExists() {
        UUID id = UUID.randomUUID();
        when(repository.findBucketById(id)).thenReturn(Optional.empty());

        boolean result = bucketService.deleteBucket(id);

        assertFalse(result);
        verify(repository, never()).deleteBucket(any());
    }
}
