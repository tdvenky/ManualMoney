package com.manualmoney.service;

import com.manualmoney.model.Category;
import com.manualmoney.model.CategoryType;
import com.manualmoney.repository.JsonDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private JsonDataRepository repository;

    private CategoryService categoryService;

    @BeforeEach
    void setUp() {
        categoryService = new CategoryService(repository);
    }

    @Test
    void getAllCategories_shouldReturnAllCategories() {
        List<Category> expected = Arrays.asList(
                new Category("Groceries", CategoryType.EXPENSE),
                new Category("Emergency Fund", CategoryType.SAVINGS)
        );
        when(repository.findAllCategories()).thenReturn(expected);

        List<Category> result = categoryService.getAllCategories();

        assertEquals(2, result.size());
        verify(repository).findAllCategories();
    }

    @Test
    void getCategoryById_shouldReturnCategory_whenExists() {
        Category category = new Category("Groceries", CategoryType.EXPENSE);
        UUID id = category.getId();
        when(repository.findCategoryById(id)).thenReturn(Optional.of(category));

        Optional<Category> result = categoryService.getCategoryById(id);

        assertTrue(result.isPresent());
        assertEquals("Groceries", result.get().getName());
    }

    @Test
    void getCategoryById_shouldReturnEmpty_whenNotExists() {
        UUID id = UUID.randomUUID();
        when(repository.findCategoryById(id)).thenReturn(Optional.empty());

        Optional<Category> result = categoryService.getCategoryById(id);

        assertFalse(result.isPresent());
    }

    @Test
    void createCategory_shouldCreateAndReturnCategory() {
        when(repository.saveCategory(any(Category.class))).thenAnswer(i -> i.getArgument(0));

        Category result = categoryService.createCategory("Rent", CategoryType.EXPENSE);

        assertNotNull(result);
        assertEquals("Rent", result.getName());
        assertEquals(CategoryType.EXPENSE, result.getType());
        verify(repository).saveCategory(any(Category.class));
    }

    @Test
    void updateCategory_shouldUpdateAndReturnCategory_whenExists() {
        Category category = new Category("Groceries", CategoryType.EXPENSE);
        UUID id = category.getId();
        when(repository.findCategoryById(id)).thenReturn(Optional.of(category));
        when(repository.saveCategory(any(Category.class))).thenAnswer(i -> i.getArgument(0));

        Optional<Category> result = categoryService.updateCategory(id, "Food", CategoryType.EXPENSE);

        assertTrue(result.isPresent());
        assertEquals("Food", result.get().getName());
    }

    @Test
    void updateCategory_shouldReturnEmpty_whenNotExists() {
        UUID id = UUID.randomUUID();
        when(repository.findCategoryById(id)).thenReturn(Optional.empty());

        Optional<Category> result = categoryService.updateCategory(id, "Food", CategoryType.EXPENSE);

        assertFalse(result.isPresent());
    }

    @Test
    void deleteCategory_shouldReturnTrue_whenExists() {
        UUID id = UUID.randomUUID();
        when(repository.findCategoryById(id)).thenReturn(Optional.of(new Category()));

        boolean result = categoryService.deleteCategory(id);

        assertTrue(result);
        verify(repository).deleteCategory(id);
    }

    @Test
    void deleteCategory_shouldReturnFalse_whenNotExists() {
        UUID id = UUID.randomUUID();
        when(repository.findCategoryById(id)).thenReturn(Optional.empty());

        boolean result = categoryService.deleteCategory(id);

        assertFalse(result);
        verify(repository, never()).deleteCategory(any());
    }
}
