package com.manualmoney.controller;

import com.manualmoney.model.CustomNetWorthCategory;
import com.manualmoney.model.NetWorthCategory;
import com.manualmoney.model.NetWorthCategoryType;
import com.manualmoney.model.NetWorthEntry;
import com.manualmoney.model.NetWorthSnapshot;
import com.manualmoney.model.NetWorthSubItem;
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
    void getCategories_shouldReturnFixedAndCustomCategoryList() throws Exception {
        when(netWorthService.getCategories()).thenReturn(NetWorthCategory.values());
        CustomNetWorthCategory custom = new CustomNetWorthCategory("Gold", NetWorthCategoryType.ASSET);
        when(netWorthService.getCustomCategories()).thenReturn(Collections.singletonList(custom));

        mockMvc.perform(get("/api/networth/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(NetWorthCategory.values().length + 1))
                .andExpect(jsonPath("$[0].key").value("REAL_ESTATE"))
                .andExpect(jsonPath("$[0].type").value("ASSET"))
                .andExpect(jsonPath("$[0].custom").value(false))
                .andExpect(jsonPath("$[" + NetWorthCategory.values().length + "].key").value(custom.getId().toString()))
                .andExpect(jsonPath("$[" + NetWorthCategory.values().length + "].custom").value(true));
    }

    @Test
    void createCategory_shouldReturnCreatedCustomCategory() throws Exception {
        CustomNetWorthCategory created = new CustomNetWorthCategory("Gold", NetWorthCategoryType.ASSET);
        when(netWorthService.createCustomCategory(eq("Gold"), eq(NetWorthCategoryType.ASSET))).thenReturn(created);

        String requestBody = "{\"name\": \"Gold\", \"type\": \"ASSET\"}";

        mockMvc.perform(post("/api/networth/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value(created.getId().toString()))
                .andExpect(jsonPath("$.label").value("Gold"))
                .andExpect(jsonPath("$.custom").value(true));
    }

    @Test
    void deleteCategory_shouldReturn204_whenExists() throws Exception {
        UUID id = UUID.randomUUID();
        when(netWorthService.deleteCustomCategory(id)).thenReturn(true);

        mockMvc.perform(delete("/api/networth/categories/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteCategory_shouldReturn404_whenNotAValidUuid() throws Exception {
        mockMvc.perform(delete("/api/networth/categories/REAL_ESTATE"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteCategory_shouldReturn422_whenUsedInExistingSnapshot() throws Exception {
        UUID id = UUID.randomUUID();
        when(netWorthService.deleteCustomCategory(id))
                .thenThrow(new IllegalStateException("Cannot delete a category that is used in an existing snapshot"));

        mockMvc.perform(delete("/api/networth/categories/" + id))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error").value("Cannot delete a category that is used in an existing snapshot"));
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
        snapshot.setEntries(Arrays.asList(new NetWorthEntry("CHECKING",
                Collections.singletonList(new NetWorthSubItem(null, new BigDecimal("5000"))))));
        when(netWorthService.createSnapshot(eq(LocalDate.of(2024, 1, 28)), any(List.class), any()))
                .thenReturn(snapshot);

        String requestBody = "{\"date\": \"2024-01-28\", \"entries\": [{\"category\": \"CHECKING\", \"subItems\": [{\"amount\": 5000}]}]}";

        mockMvc.perform(post("/api/networth/snapshots")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value("2024-01-28"))
                .andExpect(jsonPath("$.entries[0].category").value("CHECKING"))
                .andExpect(jsonPath("$.entries[0].subItems[0].amount").value(5000));
    }

    @Test
    void createSnapshot_shouldSupportNamedSubItems() throws Exception {
        NetWorthSnapshot snapshot = new NetWorthSnapshot();
        snapshot.setDate(LocalDate.of(2024, 1, 28));
        snapshot.setEntries(Arrays.asList(new NetWorthEntry("SAVINGS", Arrays.asList(
                new NetWorthSubItem("Chase Savings", new BigDecimal("5000")),
                new NetWorthSubItem("Ally Savings", new BigDecimal("3000"))
        ))));
        when(netWorthService.createSnapshot(eq(LocalDate.of(2024, 1, 28)), any(List.class), any()))
                .thenReturn(snapshot);

        String requestBody = "{\"date\": \"2024-01-28\", \"entries\": [{\"category\": \"SAVINGS\", \"subItems\": "
                + "[{\"name\": \"Chase Savings\", \"amount\": 5000}, {\"name\": \"Ally Savings\", \"amount\": 3000}]}]}";

        mockMvc.perform(post("/api/networth/snapshots")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entries[0].subItems.length()").value(2))
                .andExpect(jsonPath("$.entries[0].subItems[0].name").value("Chase Savings"));
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
