package com.manualmoney.controller;

import com.manualmoney.model.Template;
import com.manualmoney.model.TemplateAllocation;
import com.manualmoney.service.TemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public List<Template> getAllTemplates() {
        return templateService.getAllTemplates();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Template> getTemplateById(@PathVariable UUID id) {
        return templateService.getTemplateById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Template createTemplate(@RequestBody TemplateRequest request) {
        return templateService.createTemplate(request.getName(), request.getIncome(), request.toAllocations());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Template> updateTemplate(@PathVariable UUID id, @RequestBody TemplateRequest request) {
        return templateService.updateTemplate(id, request.getName(), request.getIncome(), request.toAllocations())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable UUID id) {
        if (templateService.deleteTemplate(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    public static class TemplateRequest {
        private String name;
        private BigDecimal income;
        private List<AllocationRequest> allocations = new ArrayList<>();

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public BigDecimal getIncome() { return income; }
        public void setIncome(BigDecimal income) { this.income = income; }

        public List<AllocationRequest> getAllocations() { return allocations; }
        public void setAllocations(List<AllocationRequest> allocations) { this.allocations = allocations; }

        public List<TemplateAllocation> toAllocations() {
            List<TemplateAllocation> result = new ArrayList<>();
            for (AllocationRequest a : allocations) {
                result.add(new TemplateAllocation(a.getCategoryId(), a.getAllocatedAmount()));
            }
            return result;
        }
    }

    public static class AllocationRequest {
        private UUID categoryId;
        private BigDecimal allocatedAmount;

        public UUID getCategoryId() { return categoryId; }
        public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

        public BigDecimal getAllocatedAmount() { return allocatedAmount; }
        public void setAllocatedAmount(BigDecimal allocatedAmount) { this.allocatedAmount = allocatedAmount; }
    }
}
