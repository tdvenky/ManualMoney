package com.manualmoney.service;

import com.manualmoney.model.Allocation;
import com.manualmoney.model.Category;
import com.manualmoney.model.CategoryType;
import com.manualmoney.model.PayPeriod;
import com.manualmoney.model.PayPeriodStatus;
import com.manualmoney.repository.JsonDataRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CategoryService {

    private final JsonDataRepository repository;

    public CategoryService(JsonDataRepository repository) {
        this.repository = repository;
    }

    public List<Category> getAllCategories() {
        return repository.findAllCategories();
    }

    public Optional<Category> getCategoryById(UUID id) {
        return repository.findCategoryById(id);
    }

    public Category createCategory(String name, CategoryType type) {
        Category category = new Category(name, type);
        return repository.saveCategory(category);
    }

    public Optional<Category> updateCategory(UUID id, String name, CategoryType type) {
        return repository.findCategoryById(id).map(category -> {
            boolean nameChanged = !name.equals(category.getName());
            category.setName(name);
            category.setType(type);
            if (nameChanged) {
                for (PayPeriod payPeriod : repository.findAllPayPeriods()) {
                    if (payPeriod.getStatus() == PayPeriodStatus.ACTIVE) {
                        for (Allocation allocation : payPeriod.getAllocations()) {
                            if (id.equals(allocation.getCategoryId())) {
                                allocation.setCategoryName(name);
                            }
                        }
                    }
                }
            }
            return repository.saveCategory(category);
        });
    }

    public boolean deleteCategory(UUID id) {
        if (repository.findCategoryById(id).isPresent()) {
            repository.deleteCategory(id);
            return true;
        }
        return false;
    }
}
