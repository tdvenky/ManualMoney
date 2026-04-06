package com.manualmoney.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.manualmoney.model.Category;
import com.manualmoney.model.CategoryType;
import com.manualmoney.service.CategoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CategoryController.class)
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CategoryService categoryService;

    @Test
    void getAllCategories_shouldReturnCategoryList() throws Exception {
        when(categoryService.getAllCategories()).thenReturn(Arrays.asList(
                new Category("Groceries", CategoryType.EXPENSE),
                new Category("Savings", CategoryType.SAVINGS)
        ));

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Groceries"))
                .andExpect(jsonPath("$[1].name").value("Savings"));
    }

    @Test
    void getCategoryById_shouldReturnCategory_whenExists() throws Exception {
        Category category = new Category("Groceries", CategoryType.EXPENSE);
        UUID id = category.getId();
        when(categoryService.getCategoryById(id)).thenReturn(Optional.of(category));

        mockMvc.perform(get("/api/categories/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Groceries"));
    }

    @Test
    void getCategoryById_shouldReturn404_whenNotExists() throws Exception {
        UUID id = UUID.randomUUID();
        when(categoryService.getCategoryById(id)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/categories/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    void createCategory_shouldReturnCreatedCategory() throws Exception {
        Category category = new Category("Rent", CategoryType.EXPENSE);
        when(categoryService.createCategory(eq("Rent"), eq(CategoryType.EXPENSE))).thenReturn(category);

        String requestBody = "{\"name\": \"Rent\", \"type\": \"EXPENSE\"}";

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Rent"))
                .andExpect(jsonPath("$.type").value("EXPENSE"));
    }

    @Test
    void updateCategory_shouldReturnUpdatedCategory_whenExists() throws Exception {
        Category category = new Category("Food", CategoryType.EXPENSE);
        UUID id = category.getId();
        when(categoryService.updateCategory(eq(id), eq("Food"), eq(CategoryType.EXPENSE)))
                .thenReturn(Optional.of(category));

        String requestBody = "{\"name\": \"Food\", \"type\": \"EXPENSE\"}";

        mockMvc.perform(put("/api/categories/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Food"));
    }

    @Test
    void deleteCategory_shouldReturn204_whenExists() throws Exception {
        UUID id = UUID.randomUUID();
        when(categoryService.deleteCategory(id)).thenReturn(true);

        mockMvc.perform(delete("/api/categories/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteCategory_shouldReturn404_whenNotExists() throws Exception {
        UUID id = UUID.randomUUID();
        when(categoryService.deleteCategory(id)).thenReturn(false);

        mockMvc.perform(delete("/api/categories/" + id))
                .andExpect(status().isNotFound());
    }
}
