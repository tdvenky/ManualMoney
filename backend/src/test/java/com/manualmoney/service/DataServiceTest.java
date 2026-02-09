package com.manualmoney.service;

import com.manualmoney.model.AppData;
import com.manualmoney.model.Bucket;
import com.manualmoney.model.BucketType;
import com.manualmoney.model.PayPeriod;
import com.manualmoney.repository.JsonDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataServiceTest {

    @Mock
    private JsonDataRepository repository;

    private DataService dataService;

    @BeforeEach
    void setUp() {
        dataService = new DataService(repository);
    }

    @Test
    void exportData_shouldReturnAppDataFromRepository() {
        AppData appData = new AppData();
        appData.getBuckets().add(new Bucket("Groceries", BucketType.EXPENSE));
        appData.getPayPeriods().add(new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000")));
        when(repository.exportData()).thenReturn(appData);

        AppData result = dataService.exportData();

        assertNotNull(result);
        assertEquals(1, result.getBuckets().size());
        assertEquals("Groceries", result.getBuckets().get(0).getName());
        assertEquals(1, result.getPayPeriods().size());
        verify(repository).exportData();
    }

    @Test
    void exportData_shouldReturnEmptyAppData_whenNoDataExists() {
        AppData emptyData = new AppData();
        when(repository.exportData()).thenReturn(emptyData);

        AppData result = dataService.exportData();

        assertNotNull(result);
        assertTrue(result.getBuckets().isEmpty());
        assertTrue(result.getPayPeriods().isEmpty());
        verify(repository).exportData();
    }

    @Test
    void importData_shouldDelegateToRepository() {
        AppData appData = new AppData();
        appData.getBuckets().add(new Bucket("Rent", BucketType.EXPENSE));
        appData.getBuckets().add(new Bucket("Savings", BucketType.SAVINGS));

        dataService.importData(appData);

        verify(repository).importData(appData);
    }

    @Test
    void importData_shouldAcceptEmptyData() {
        AppData emptyData = new AppData();

        dataService.importData(emptyData);

        verify(repository).importData(emptyData);
    }

    @Test
    void importData_shouldAcceptDataWithMultipleEntities() {
        AppData appData = new AppData();
        appData.getBuckets().add(new Bucket("Groceries", BucketType.EXPENSE));
        appData.getBuckets().add(new Bucket("Emergency Fund", BucketType.SAVINGS));
        appData.getPayPeriods().add(new PayPeriod(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 15), new BigDecimal("2000")));
        appData.getPayPeriods().add(new PayPeriod(LocalDate.of(2024, 1, 16), LocalDate.of(2024, 1, 31), new BigDecimal("2500")));

        dataService.importData(appData);

        verify(repository).importData(appData);
    }
}
