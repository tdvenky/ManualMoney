package com.manualmoney.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.manualmoney.model.*;
import com.manualmoney.service.DataService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DataController.class)
class DataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @MockBean
    private DataService dataService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void exportData_shouldReturnAppData() throws Exception {
        AppData appData = new AppData();
        appData.getCategories().add(new Category("Groceries", CategoryType.EXPENSE));
        appData.getPayPeriods().add(new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000")));
        when(dataService.exportData()).thenReturn(appData);

        mockMvc.perform(get("/api/export"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories.length()").value(1))
                .andExpect(jsonPath("$.categories[0].name").value("Groceries"))
                .andExpect(jsonPath("$.categories[0].type").value("EXPENSE"))
                .andExpect(jsonPath("$.payPeriods.length()").value(1))
                .andExpect(jsonPath("$.payPeriods[0].amount").value(2000));

        verify(dataService).exportData();
    }

    @Test
    void exportData_shouldReturnEmptyAppData_whenNoDataExists() throws Exception {
        AppData emptyData = new AppData();
        when(dataService.exportData()).thenReturn(emptyData);

        mockMvc.perform(get("/api/export"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories.length()").value(0))
                .andExpect(jsonPath("$.payPeriods.length()").value(0));

        verify(dataService).exportData();
    }

    @Test
    void exportData_shouldReturnMultipleBucketsAndPayPeriods() throws Exception {
        AppData appData = new AppData();
        appData.getCategories().add(new Category("Groceries", CategoryType.EXPENSE));
        appData.getCategories().add(new Category("Emergency Fund", CategoryType.SAVINGS));
        appData.getPayPeriods().add(new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000")));
        appData.getPayPeriods().add(new PayPeriod(LocalDate.of(2024, 1, 16), LocalDate.of(2024, 1, 31), new BigDecimal("2500")));
        when(dataService.exportData()).thenReturn(appData);

        mockMvc.perform(get("/api/export"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories.length()").value(2))
                .andExpect(jsonPath("$.categories[0].name").value("Groceries"))
                .andExpect(jsonPath("$.categories[1].name").value("Emergency Fund"))
                .andExpect(jsonPath("$.payPeriods.length()").value(2));
    }

    @Test
    void importData_shouldReturn200_whenValidData() throws Exception {
        String requestBody = "{\"buckets\": [{\"name\": \"Rent\", \"type\": \"EXPENSE\"}], \"payPeriods\": []}";

        mockMvc.perform(post("/api/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        verify(dataService).importData(any(AppData.class));
    }

    @Test
    void importData_shouldReturn200_whenEmptyData() throws Exception {
        String requestBody = "{\"buckets\": [], \"payPeriods\": []}";

        mockMvc.perform(post("/api/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        verify(dataService).importData(any(AppData.class));
    }

    @Test
    void importData_shouldAcceptDataWithPayPeriods() throws Exception {
        String requestBody = "{\"buckets\": [], \"payPeriods\": [{\"payDate\": \"2024-01-01\", \"endDate\": \"2024-01-15\", \"amount\": 2000, \"status\": \"ACTIVE\", \"allocations\": []}]}";

        mockMvc.perform(post("/api/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        verify(dataService).importData(any(AppData.class));
    }
}
