package com.manualmoney.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class NetWorthEntry {

    private String category;
    private List<NetWorthSubItem> subItems;

    // Legacy field kept only for backward-compatible deserialization of snapshots
    // saved before sub-items existed (flat {category, amount} shape). Not written
    // going forward; JsonDataRepository.backfillNetWorthSubItems() migrates it.
    private BigDecimal amount;

    public NetWorthEntry() {
        this.subItems = new ArrayList<>();
    }

    public NetWorthEntry(String category, List<NetWorthSubItem> subItems) {
        this();
        this.category = category;
        this.subItems = subItems;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public List<NetWorthSubItem> getSubItems() { return subItems; }
    public void setSubItems(List<NetWorthSubItem> subItems) { this.subItems = subItems; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
