package com.manualmoney.controller;

import com.manualmoney.model.NetWorthCategory;
import com.manualmoney.model.NetWorthEntry;
import com.manualmoney.model.NetWorthSnapshot;
import com.manualmoney.service.NetWorthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NetWorthController.class)
class NetWorthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NetWorthService netWorthService;

    @Test
    void getCategories_shouldReturnFixedCategoryList() throws Exception {
        when(netWorthService.getCategories()).thenReturn(NetWorthCategory.values());

        mockMvc.perform(get("/api/networth/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(NetWorthCategory.values().length))
                .andExpect(jsonPath("$[0].key").value("REAL_ESTATE"))
                .andExpect(jsonPath("$[0].type").value("ASSET"));
    }

    @Test
    void getAllSnapshots_shouldReturnSnapshotList() throws Exception {
        NetWorthSnapshot snapshot = new NetWorthSnapshot();
        snapshot.setDate(LocalDate.of(2024, 1, 28));
        when(netWorthService.getAllSnapshots()).thenReturn(Collections.singletonList(snapshot));

        mockMvc.perform(get("/api/networth/snapshots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].date").value("2024-01-28"));
    }

    @Test
    void getSnapshotById_shouldReturn404_whenNotExists() throws Exception {
        UUID id = UUID.randomUUID();
        when(netWorthService.getSnapshotById(id)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/networth/snapshots/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    void createSnapshot_shouldReturnCreatedSnapshot() throws Exception {
        NetWorthSnapshot snapshot = new NetWorthSnapshot();
        snapshot.setDate(LocalDate.of(2024, 1, 28));
        snapshot.setEntries(Arrays.asList(new NetWorthEntry(NetWorthCategory.CHECKING, new BigDecimal("5000"))));
        when(netWorthService.createSnapshot(eq(LocalDate.of(2024, 1, 28)), any(List.class), any()))
                .thenReturn(snapshot);

        String requestBody = "{\"date\": \"2024-01-28\", \"entries\": [{\"category\": \"CHECKING\", \"amount\": 5000}]}";

        mockMvc.perform(post("/api/networth/snapshots")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value("2024-01-28"))
                .andExpect(jsonPath("$.entries[0].category").value("CHECKING"));
    }

    @Test
    void updateSnapshot_shouldReturnUpdatedSnapshot_whenExists() throws Exception {
        NetWorthSnapshot snapshot = new NetWorthSnapshot();
        UUID id = snapshot.getId();
        snapshot.setDate(LocalDate.of(2024, 3, 2));
        when(netWorthService.updateSnapshot(eq(id), eq(LocalDate.of(2024, 3, 2)), any(List.class), any()))
                .thenReturn(Optional.of(snapshot));

        String requestBody = "{\"date\": \"2024-03-02\", \"entries\": []}";

        mockMvc.perform(put("/api/networth/snapshots/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value("2024-03-02"));
    }

    @Test
    void updateSnapshot_shouldReturn404_whenNotExists() throws Exception {
        UUID id = UUID.randomUUID();
        when(netWorthService.updateSnapshot(eq(id), any(LocalDate.class), any(List.class), any()))
                .thenReturn(Optional.empty());

        String requestBody = "{\"date\": \"2024-03-02\", \"entries\": []}";

        mockMvc.perform(put("/api/networth/snapshots/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteSnapshot_shouldReturn204_whenExists() throws Exception {
        UUID id = UUID.randomUUID();
        when(netWorthService.deleteSnapshot(id)).thenReturn(true);

        mockMvc.perform(delete("/api/networth/snapshots/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteSnapshot_shouldReturn404_whenNotExists() throws Exception {
        UUID id = UUID.randomUUID();
        when(netWorthService.deleteSnapshot(id)).thenReturn(false);

        mockMvc.perform(delete("/api/networth/snapshots/" + id))
                .andExpect(status().isNotFound());
    }
}
