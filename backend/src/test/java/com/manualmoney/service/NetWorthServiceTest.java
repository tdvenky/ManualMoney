package com.manualmoney.service;

import com.manualmoney.model.NetWorthCategory;
import com.manualmoney.model.NetWorthEntry;
import com.manualmoney.model.NetWorthSnapshot;
import com.manualmoney.repository.JsonDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NetWorthServiceTest {

    @Mock
    private JsonDataRepository repository;

    private NetWorthService netWorthService;

    @BeforeEach
    void setUp() {
        netWorthService = new NetWorthService(repository);
    }

    @Test
    void getCategories_shouldReturnAllFixedCategories() {
        NetWorthCategory[] result = netWorthService.getCategories();

        assertEquals(NetWorthCategory.values().length, result.length);
    }

    @Test
    void getAllSnapshots_shouldReturnAllSnapshots() {
        NetWorthSnapshot snapshot = new NetWorthSnapshot();
        when(repository.findAllNetWorthSnapshots()).thenReturn(Collections.singletonList(snapshot));

        List<NetWorthSnapshot> result = netWorthService.getAllSnapshots();

        assertEquals(1, result.size());
        verify(repository).findAllNetWorthSnapshots();
    }

    @Test
    void getSnapshotById_shouldReturnSnapshot_whenExists() {
        NetWorthSnapshot snapshot = new NetWorthSnapshot();
        UUID id = snapshot.getId();
        when(repository.findNetWorthSnapshotById(id)).thenReturn(Optional.of(snapshot));

        Optional<NetWorthSnapshot> result = netWorthService.getSnapshotById(id);

        assertTrue(result.isPresent());
    }

    @Test
    void getSnapshotById_shouldReturnEmpty_whenNotExists() {
        UUID id = UUID.randomUUID();
        when(repository.findNetWorthSnapshotById(id)).thenReturn(Optional.empty());

        Optional<NetWorthSnapshot> result = netWorthService.getSnapshotById(id);

        assertFalse(result.isPresent());
    }

    @Test
    void createSnapshot_shouldCreateAndReturnSnapshot() {
        when(repository.saveNetWorthSnapshot(any(NetWorthSnapshot.class))).thenAnswer(i -> i.getArgument(0));
        List<NetWorthEntry> entries = Arrays.asList(
                new NetWorthEntry(NetWorthCategory.CHECKING, new BigDecimal("5000")),
                new NetWorthEntry(NetWorthCategory.CREDIT_CARD, new BigDecimal("500"))
        );

        NetWorthSnapshot result = netWorthService.createSnapshot(LocalDate.of(2024, 1, 28), entries, "first snapshot");

        assertNotNull(result);
        assertEquals(LocalDate.of(2024, 1, 28), result.getDate());
        assertEquals(2, result.getEntries().size());
        assertEquals("first snapshot", result.getNotes());
        verify(repository).saveNetWorthSnapshot(any(NetWorthSnapshot.class));
    }

    @Test
    void updateSnapshot_shouldUpdateAndReturnSnapshot_whenExists() {
        NetWorthSnapshot snapshot = new NetWorthSnapshot();
        UUID id = snapshot.getId();
        when(repository.findNetWorthSnapshotById(id)).thenReturn(Optional.of(snapshot));
        when(repository.saveNetWorthSnapshot(any(NetWorthSnapshot.class))).thenAnswer(i -> i.getArgument(0));
        List<NetWorthEntry> entries = Collections.singletonList(
                new NetWorthEntry(NetWorthCategory.SAVINGS, new BigDecimal("10000"))
        );

        Optional<NetWorthSnapshot> result = netWorthService.updateSnapshot(id, LocalDate.of(2024, 3, 2), entries, null);

        assertTrue(result.isPresent());
        assertEquals(LocalDate.of(2024, 3, 2), result.get().getDate());
        assertEquals(1, result.get().getEntries().size());
    }

    @Test
    void updateSnapshot_shouldReturnEmpty_whenNotExists() {
        UUID id = UUID.randomUUID();
        when(repository.findNetWorthSnapshotById(id)).thenReturn(Optional.empty());

        Optional<NetWorthSnapshot> result = netWorthService.updateSnapshot(id, LocalDate.of(2024, 3, 2), Collections.emptyList(), null);

        assertFalse(result.isPresent());
    }

    @Test
    void deleteSnapshot_shouldReturnTrue_whenExists() {
        UUID id = UUID.randomUUID();
        when(repository.findNetWorthSnapshotById(id)).thenReturn(Optional.of(new NetWorthSnapshot()));

        boolean result = netWorthService.deleteSnapshot(id);

        assertTrue(result);
        verify(repository).deleteNetWorthSnapshot(id);
    }

    @Test
    void deleteSnapshot_shouldReturnFalse_whenNotExists() {
        UUID id = UUID.randomUUID();
        when(repository.findNetWorthSnapshotById(id)).thenReturn(Optional.empty());

        boolean result = netWorthService.deleteSnapshot(id);

        assertFalse(result);
        verify(repository, never()).deleteNetWorthSnapshot(any());
    }
}
