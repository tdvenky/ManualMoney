package com.manualmoney.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.manualmoney.model.*;
import com.manualmoney.service.PayPeriodService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PayPeriodController.class)
class PayPeriodControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @MockBean
    private PayPeriodService payPeriodService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void getAllPayPeriods_shouldReturnPayPeriodList() throws Exception {
        when(payPeriodService.getAllPayPeriods()).thenReturn(Arrays.asList(
                new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000")),
                new PayPeriod(LocalDate.of(2024, 1, 16), LocalDate.of(2024, 1, 31), new BigDecimal("2000"))
        ));

        mockMvc.perform(get("/api/payperiods"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getPayPeriodById_shouldReturnPayPeriod_whenExists() throws Exception {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        UUID id = payPeriod.getId();
        when(payPeriodService.getPayPeriodById(id)).thenReturn(Optional.of(payPeriod));

        mockMvc.perform(get("/api/payperiods/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(2000));
    }

    @Test
    void createPayPeriod_shouldReturnCreatedPayPeriod() throws Exception {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2500"));
        when(payPeriodService.createPayPeriod(any(LocalDate.class), any(LocalDate.class), any(BigDecimal.class)))
                .thenReturn(payPeriod);

        String requestBody = "{\"payDate\": \"2024-01-01\", \"endDate\": \"2024-01-15\", \"amount\": 2500}";

        mockMvc.perform(post("/api/payperiods")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(2500));
    }

    @Test
    void closePayPeriod_shouldReturnClosedPayPeriod() throws Exception {
        PayPeriod payPeriod = new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000"));
        payPeriod.setStatus(PayPeriodStatus.CLOSED);
        UUID id = payPeriod.getId();
        when(payPeriodService.closePayPeriod(id)).thenReturn(Optional.of(payPeriod));

        mockMvc.perform(put("/api/payperiods/" + id + "/close"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    void addAllocation_shouldReturnCreatedAllocation() throws Exception {
        UUID payPeriodId = UUID.randomUUID();
        UUID bucketId = UUID.randomUUID();
        Allocation allocation = new Allocation(bucketId, new BigDecimal("500"));
        when(payPeriodService.addAllocation(eq(payPeriodId), eq(bucketId), any(BigDecimal.class)))
                .thenReturn(Optional.of(allocation));

        String requestBody = String.format("{\"bucketId\": \"%s\", \"allocatedAmount\": 500}", bucketId);

        mockMvc.perform(post("/api/payperiods/" + payPeriodId + "/allocations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allocatedAmount").value(500));
    }

    @Test
    void updateAllocation_shouldReturnUpdatedAllocation() throws Exception {
        UUID allocationId = UUID.randomUUID();
        Allocation allocation = new Allocation(UUID.randomUUID(), new BigDecimal("600"));
        allocation.setId(allocationId);
        when(payPeriodService.updateAllocation(eq(allocationId), any(BigDecimal.class)))
                .thenReturn(Optional.of(allocation));

        String requestBody = "{\"allocatedAmount\": 600}";

        mockMvc.perform(put("/api/allocations/" + allocationId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allocatedAmount").value(600));
    }

    @Test
    void addTransaction_shouldReturnCreatedTransaction() throws Exception {
        UUID allocationId = UUID.randomUUID();
        Transaction transaction = new Transaction("Coffee", new BigDecimal("5"),
                LocalDate.of(2024, 1, 3), new BigDecimal("500"), new BigDecimal("495"));
        when(payPeriodService.addTransaction(eq(allocationId), eq("Coffee"), any(BigDecimal.class), any(LocalDate.class)))
                .thenReturn(Optional.of(transaction));

        String requestBody = "{\"description\": \"Coffee\", \"amount\": 5, \"date\": \"2024-01-03\"}";

        mockMvc.perform(post("/api/allocations/" + allocationId + "/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Coffee"))
                .andExpect(jsonPath("$.amount").value(5))
                .andExpect(jsonPath("$.previousBalance").value(500))
                .andExpect(jsonPath("$.newBalance").value(495));
    }

    @Test
    void addTransaction_shouldReturn400_whenDateOutsidePayPeriod() throws Exception {
        UUID allocationId = UUID.randomUUID();
        when(payPeriodService.addTransaction(eq(allocationId), eq("Coffee"), any(BigDecimal.class), any(LocalDate.class)))
                .thenThrow(new IllegalArgumentException("Transaction date must be between 2024-01-01 and 2024-01-15"));

        String requestBody = "{\"description\": \"Coffee\", \"amount\": 5, \"date\": \"2024-02-01\"}";

        mockMvc.perform(post("/api/allocations/" + allocationId + "/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Transaction date must be between 2024-01-01 and 2024-01-15"));
    }

    @Test
    void updateTransaction_shouldReturnUpdatedTransaction() throws Exception {
        UUID transactionId = UUID.randomUUID();
        Transaction transaction = new Transaction("Lunch", new BigDecimal("10"),
                LocalDate.of(2024, 1, 5), new BigDecimal("500"), new BigDecimal("490"));
        transaction.setId(transactionId);
        when(payPeriodService.updateTransaction(eq(transactionId), eq("Lunch"), any(BigDecimal.class), any(LocalDate.class)))
                .thenReturn(Optional.of(transaction));

        String requestBody = "{\"description\": \"Lunch\", \"amount\": 10, \"date\": \"2024-01-05\"}";

        mockMvc.perform(put("/api/transactions/" + transactionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Lunch"));
    }
}
