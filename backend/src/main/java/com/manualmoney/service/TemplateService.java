package com.manualmoney.service;

import com.manualmoney.model.Template;
import com.manualmoney.model.TemplateAllocation;
import com.manualmoney.repository.JsonDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TemplateService {

    private static final Logger logger = LoggerFactory.getLogger(TemplateService.class);

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
        Template saved = repository.saveTemplate(template);
        logger.info("Created template {} ({})", saved.getId(), name);
        return saved;
    }

    public Optional<Template> updateTemplate(UUID id, String name, BigDecimal income, List<TemplateAllocation> allocations) {
        return repository.findTemplateById(id).map(template -> {
            template.setName(name);
            template.setIncome(income);
            template.setAllocations(allocations);
            Template saved = repository.saveTemplate(template);
            logger.info("Updated template {}", id);
            return saved;
        });
    }

    public boolean deleteTemplate(UUID id) {
        if (repository.findTemplateById(id).isPresent()) {
            repository.deleteTemplate(id);
            logger.info("Deleted template {}", id);
            return true;
        }
        logger.warn("Attempted to delete template {} but it was not found", id);
        return false;
    }
}
