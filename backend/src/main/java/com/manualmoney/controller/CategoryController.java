package com.manualmoney.controller;

import com.manualmoney.model.Category;
import com.manualmoney.model.CategoryType;
import com.manualmoney.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<Category> getAllCategories() {
        return categoryService.getAllCategories();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable UUID id) {
        return categoryService.getCategoryById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Category createCategory(@RequestBody CategoryRequest request) {
        return categoryService.createCategory(request.getName(), request.getType());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable UUID id, @RequestBody CategoryRequest request) {
        return categoryService.updateCategory(id, request.getName(), request.getType())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        if (categoryService.deleteCategory(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/reorder")
    public ResponseEntity<Void> reorderCategories(@RequestBody List<UUID> ids) {
        categoryService.reorderCategories(ids);
        return ResponseEntity.noContent().build();
    }

    public static class CategoryRequest {
        private String name;
        private CategoryType type;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public CategoryType getType() { return type; }
        public void setType(CategoryType type) { this.type = type; }
    }
}
