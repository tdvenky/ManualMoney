package com.manualmoney.controller;

import com.manualmoney.model.Bucket;
import com.manualmoney.model.BucketType;
import com.manualmoney.service.BucketService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/buckets")
public class BucketController {

    private final BucketService bucketService;

    public BucketController(BucketService bucketService) {
        this.bucketService = bucketService;
    }

    @GetMapping
    public List<Bucket> getAllBuckets() {
        return bucketService.getAllBuckets();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bucket> getBucketById(@PathVariable UUID id) {
        return bucketService.getBucketById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Bucket createBucket(@RequestBody CreateBucketRequest request) {
        return bucketService.createBucket(request.getName(), request.getType());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Bucket> updateBucket(@PathVariable UUID id, @RequestBody UpdateBucketRequest request) {
        return bucketService.updateBucket(id, request.getName(), request.getType())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBucket(@PathVariable UUID id) {
        if (bucketService.deleteBucket(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    public static class CreateBucketRequest {
        private String name;
        private BucketType type;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public BucketType getType() { return type; }
        public void setType(BucketType type) { this.type = type; }
    }

    public static class UpdateBucketRequest {
        private String name;
        private BucketType type;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public BucketType getType() { return type; }
        public void setType(BucketType type) { this.type = type; }
    }
}
