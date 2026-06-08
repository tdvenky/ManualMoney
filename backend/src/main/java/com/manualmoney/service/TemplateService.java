package com.manualmoney.service;

import com.manualmoney.model.Template;
import com.manualmoney.model.TemplateAllocation;
import com.manualmoney.repository.JsonDataRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TemplateService {

    private final JsonDataRepository repository;

    public TemplateService(JsonDataRepository repository) {
        this.repository = repository;
    }

    public List<Template> getAllTemplates() {
        return repository.findAllTemplates();
    }

    public Optional<Template> getTemplateById(UUID id) {
        return repository.findTemplateById(id);
    }

    public Template createTemplate(String name, BigDecimal income, List<TemplateAllocation> allocations) {
        Template template = new Template();
        template.setName(name);
        template.setIncome(income);
        template.setAllocations(allocations);
        return repository.saveTemplate(template);
    }

    public Optional<Template> updateTemplate(UUID id, String name, BigDecimal income, List<TemplateAllocation> allocations) {
        return repository.findTemplateById(id).map(template -> {
            template.setName(name);
            template.setIncome(income);
            template.setAllocations(allocations);
            return repository.saveTemplate(template);
        });
    }

    public boolean deleteTemplate(UUID id) {
        if (repository.findTemplateById(id).isPresent()) {
            repository.deleteTemplate(id);
            return true;
        }
        return false;
    }
}
