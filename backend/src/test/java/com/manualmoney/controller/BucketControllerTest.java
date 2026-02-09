package com.manualmoney.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manualmoney.model.Bucket;
import com.manualmoney.model.BucketType;
import com.manualmoney.service.BucketService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BucketController.class)
class BucketControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BucketService bucketService;

    @Test
    void getAllBuckets_shouldReturnBucketList() throws Exception {
        when(bucketService.getAllBuckets()).thenReturn(Arrays.asList(
                new Bucket("Groceries", BucketType.EXPENSE),
                new Bucket("Savings", BucketType.SAVINGS)
        ));

        mockMvc.perform(get("/api/buckets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Groceries"))
                .andExpect(jsonPath("$[1].name").value("Savings"));
    }

    @Test
    void getBucketById_shouldReturnBucket_whenExists() throws Exception {
        Bucket bucket = new Bucket("Groceries", BucketType.EXPENSE);
        UUID id = bucket.getId();
        when(bucketService.getBucketById(id)).thenReturn(Optional.of(bucket));

        mockMvc.perform(get("/api/buckets/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Groceries"));
    }

    @Test
    void getBucketById_shouldReturn404_whenNotExists() throws Exception {
        UUID id = UUID.randomUUID();
        when(bucketService.getBucketById(id)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/buckets/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    void createBucket_shouldReturnCreatedBucket() throws Exception {
        Bucket bucket = new Bucket("Rent", BucketType.EXPENSE);
        when(bucketService.createBucket(eq("Rent"), eq(BucketType.EXPENSE))).thenReturn(bucket);

        String requestBody = "{\"name\": \"Rent\", \"type\": \"EXPENSE\"}";

        mockMvc.perform(post("/api/buckets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Rent"))
                .andExpect(jsonPath("$.type").value("EXPENSE"));
    }

    @Test
    void updateBucket_shouldReturnUpdatedBucket_whenExists() throws Exception {
        Bucket bucket = new Bucket("Food", BucketType.EXPENSE);
        UUID id = bucket.getId();
        when(bucketService.updateBucket(eq(id), eq("Food"), eq(BucketType.EXPENSE)))
                .thenReturn(Optional.of(bucket));

        String requestBody = "{\"name\": \"Food\", \"type\": \"EXPENSE\"}";

        mockMvc.perform(put("/api/buckets/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Food"));
    }

    @Test
    void deleteBucket_shouldReturn204_whenExists() throws Exception {
        UUID id = UUID.randomUUID();
        when(bucketService.deleteBucket(id)).thenReturn(true);

        mockMvc.perform(delete("/api/buckets/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteBucket_shouldReturn404_whenNotExists() throws Exception {
        UUID id = UUID.randomUUID();
        when(bucketService.deleteBucket(id)).thenReturn(false);

        mockMvc.perform(delete("/api/buckets/" + id))
                .andExpect(status().isNotFound());
    }
}
