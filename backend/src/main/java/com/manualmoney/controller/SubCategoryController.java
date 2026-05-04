package com.manualmoney.controller;

import com.manualmoney.model.SubCategory;
import com.manualmoney.service.SubCategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subcategories")
public class SubCategoryController {

    private final SubCategoryService subCategoryService;

    public SubCategoryController(SubCategoryService subCategoryService) {
        this.subCategoryService = subCategoryService;
    }

    @GetMapping
    public List<SubCategory> getAllSubCategories() {
        return subCategoryService.getAllSubCategories();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubCategory> getSubCategoryById(@PathVariable UUID id) {
        return subCategoryService.getSubCategoryById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public SubCategory createSubCategory(@RequestBody SubCategoryRequest request) {
        return subCategoryService.createSubCategory(request.getName());
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubCategory> updateSubCategory(@PathVariable UUID id, @RequestBody SubCategoryRequest request) {
        return subCategoryService.updateSubCategory(id, request.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubCategory(@PathVariable UUID id) {
        if (subCategoryService.deleteSubCategory(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/reorder")
    public ResponseEntity<Void> reorderSubCategories(@RequestBody List<UUID> ids) {
        subCategoryService.reorderSubCategories(ids);
        return ResponseEntity.noContent().build();
    }

    public static class SubCategoryRequest {
        private String name;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }
}
