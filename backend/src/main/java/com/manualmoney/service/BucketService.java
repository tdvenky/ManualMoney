package com.manualmoney.service;

import com.manualmoney.model.Bucket;
import com.manualmoney.model.BucketType;
import com.manualmoney.repository.JsonDataRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BucketService {

    private final JsonDataRepository repository;

    public BucketService(JsonDataRepository repository) {
        this.repository = repository;
    }

    public List<Bucket> getAllBuckets() {
        return repository.findAllBuckets();
    }

    public Optional<Bucket> getBucketById(UUID id) {
        return repository.findBucketById(id);
    }

    public Bucket createBucket(String name, BucketType type) {
        Bucket bucket = new Bucket(name, type);
        return repository.saveBucket(bucket);
    }

    public Optional<Bucket> updateBucket(UUID id, String name, BucketType type) {
        return repository.findBucketById(id).map(bucket -> {
            bucket.setName(name);
            bucket.setType(type);
            return repository.saveBucket(bucket);
        });
    }

    public boolean deleteBucket(UUID id) {
        if (repository.findBucketById(id).isPresent()) {
            repository.deleteBucket(id);
            return true;
        }
        return false;
    }
}
