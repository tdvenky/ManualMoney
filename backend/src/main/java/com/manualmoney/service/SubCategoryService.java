package com.manualmoney.service;

import com.manualmoney.model.SubCategory;
import com.manualmoney.repository.JsonDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SubCategoryService {

    private static final Logger logger = LoggerFactory.getLogger(SubCategoryService.class);

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
        SubCategory saved = repository.saveSubCategory(subCategory);
        logger.info("Created subcategory {} ({})", saved.getId(), name);
        return saved;
    }

    public Optional<SubCategory> updateSubCategory(UUID id, String name) {
        return repository.findSubCategoryById(id).map(subCategory -> {
            subCategory.setName(name);
            SubCategory saved = repository.saveSubCategory(subCategory);
            logger.info("Updated subcategory {}", id);
            return saved;
        });
    }

    public boolean deleteSubCategory(UUID id) {
        if (repository.findSubCategoryById(id).isPresent()) {
            repository.deleteSubCategory(id);
            logger.info("Deleted subcategory {}", id);
            return true;
        }
        logger.warn("Attempted to delete subcategory {} but it was not found", id);
        return false;
    }

    public void reorderSubCategories(List<UUID> ids) {
        repository.reorderSubCategories(ids);
    }
}
