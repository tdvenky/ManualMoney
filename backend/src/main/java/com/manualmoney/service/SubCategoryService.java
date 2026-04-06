package com.manualmoney.service;

import com.manualmoney.model.SubCategory;
import com.manualmoney.repository.JsonDataRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SubCategoryService {

    private final JsonDataRepository repository;

    public SubCategoryService(JsonDataRepository repository) {
        this.repository = repository;
    }

    public List<SubCategory> getAllSubCategories() {
        return repository.findAllSubCategories();
    }

    public Optional<SubCategory> getSubCategoryById(UUID id) {
        return repository.findSubCategoryById(id);
    }

    public SubCategory createSubCategory(String name) {
        SubCategory subCategory = new SubCategory(name);
        return repository.saveSubCategory(subCategory);
    }

    public Optional<SubCategory> updateSubCategory(UUID id, String name) {
        return repository.findSubCategoryById(id).map(subCategory -> {
            subCategory.setName(name);
            return repository.saveSubCategory(subCategory);
        });
    }

    public boolean deleteSubCategory(UUID id) {
        if (repository.findSubCategoryById(id).isPresent()) {
            repository.deleteSubCategory(id);
            return true;
        }
        return false;
    }
}
