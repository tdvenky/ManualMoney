package com.manualmoney.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.manualmoney.model.*;
import javax.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JsonDataRepository {

    @Value("${manualmoney.data.path:./data/manualmoney.json}")
    private String dataPath;

    private final ObjectMapper objectMapper;
    private AppData appData;

    public JsonDataRepository() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @PostConstruct
    public void init() {
        loadData();
    }

    private void loadData() {
        File file = new File(dataPath);
        if (file.exists()) {
            try {
                appData = objectMapper.readValue(file, AppData.class);
            } catch (IOException e) {
                appData = new AppData();
            }
        } else {
            appData = new AppData();
        }
    }

    private void saveData() {
        try {
            File file = new File(dataPath);
            file.getParentFile().mkdirs();
            objectMapper.writeValue(file, appData);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save data", e);
        }
    }

    // Category operations
    public List<Category> findAllCategories() {
        return appData.getCategories();
    }

    public Optional<Category> findCategoryById(UUID id) {
        return appData.getCategories().stream()
                .filter(c -> c.getId().equals(id))
                .findFirst();
    }

    public Category saveCategory(Category category) {
        Optional<Category> existing = findCategoryById(category.getId());
        if (existing.isPresent()) {
            Category c = existing.get();
            c.setName(category.getName());
            c.setType(category.getType());
            c.setUpdatedAt(LocalDateTime.now());
        } else {
            appData.getCategories().add(category);
        }
        saveData();
        return category;
    }

    public void deleteCategory(UUID id) {
        appData.getCategories().removeIf(c -> c.getId().equals(id));
        saveData();
    }

    // SubCategory operations
    public List<SubCategory> findAllSubCategories() {
        return appData.getSubCategories();
    }

    public Optional<SubCategory> findSubCategoryById(UUID id) {
        return appData.getSubCategories().stream()
                .filter(s -> s.getId().equals(id))
                .findFirst();
    }

    public SubCategory saveSubCategory(SubCategory subCategory) {
        Optional<SubCategory> existing = findSubCategoryById(subCategory.getId());
        if (existing.isPresent()) {
            SubCategory s = existing.get();
            s.setName(subCategory.getName());
            s.setCategoryId(subCategory.getCategoryId());
            s.setUpdatedAt(LocalDateTime.now());
        } else {
            appData.getSubCategories().add(subCategory);
        }
        saveData();
        return subCategory;
    }

    public void deleteSubCategory(UUID id) {
        appData.getSubCategories().removeIf(s -> s.getId().equals(id));
        saveData();
    }

    // PayPeriod operations
    public List<PayPeriod> findAllPayPeriods() {
        return appData.getPayPeriods();
    }

    public Optional<PayPeriod> findPayPeriodById(UUID id) {
        return appData.getPayPeriods().stream()
                .filter(p -> p.getId().equals(id))
                .findFirst();
    }

    public PayPeriod savePayPeriod(PayPeriod payPeriod) {
        Optional<PayPeriod> existing = findPayPeriodById(payPeriod.getId());
        if (existing.isPresent()) {
            PayPeriod p = existing.get();
            p.setPayDate(payPeriod.getPayDate());
            p.setEndDate(payPeriod.getEndDate());
            p.setAmount(payPeriod.getAmount());
            p.setAllocations(payPeriod.getAllocations());
            p.setStatus(payPeriod.getStatus());
            p.setUpdatedAt(LocalDateTime.now());
        } else {
            appData.getPayPeriods().add(payPeriod);
        }
        saveData();
        return payPeriod;
    }

    public void deletePayPeriod(UUID id) {
        appData.getPayPeriods().removeIf(p -> p.getId().equals(id));
        saveData();
    }

    // Allocation operations
    public Optional<Allocation> findAllocationById(UUID id) {
        return appData.getPayPeriods().stream()
                .flatMap(p -> p.getAllocations().stream())
                .filter(a -> a.getId().equals(id))
                .findFirst();
    }

    public Optional<PayPeriod> findPayPeriodByAllocationId(UUID allocationId) {
        return appData.getPayPeriods().stream()
                .filter(p -> p.getAllocations().stream()
                        .anyMatch(a -> a.getId().equals(allocationId)))
                .findFirst();
    }

    // Transaction operations
    public Optional<Transaction> findTransactionById(UUID id) {
        return appData.getPayPeriods().stream()
                .flatMap(p -> p.getAllocations().stream())
                .flatMap(a -> a.getTransactions().stream())
                .filter(t -> t.getId().equals(id))
                .findFirst();
    }

    public Optional<Allocation> findAllocationByTransactionId(UUID transactionId) {
        return appData.getPayPeriods().stream()
                .flatMap(p -> p.getAllocations().stream())
                .filter(a -> a.getTransactions().stream()
                        .anyMatch(t -> t.getId().equals(transactionId)))
                .findFirst();
    }

    // SavingsTransfer operations
    public Optional<SavingsTransfer> findSavingsTransferById(UUID id) {
        return appData.getPayPeriods().stream()
                .flatMap(p -> p.getAllocations().stream())
                .flatMap(a -> a.getSavingsTransfers().stream())
                .filter(s -> s.getId().equals(id))
                .findFirst();
    }

    public Optional<Allocation> findAllocationBySavingsTransferId(UUID savingsTransferId) {
        return appData.getPayPeriods().stream()
                .flatMap(p -> p.getAllocations().stream())
                .filter(a -> a.getSavingsTransfers().stream()
                        .anyMatch(s -> s.getId().equals(savingsTransferId)))
                .findFirst();
    }

    // Export/Import
    public AppData exportData() {
        return appData;
    }

    public void importData(AppData data) {
        this.appData = data;
        saveData();
    }

    public void save() {
        saveData();
    }
}
