package com.manualmoney.model;

import java.math.BigDecimal;

public class NetWorthEntry {

    private NetWorthCategory category;
    private BigDecimal amount;

    public NetWorthEntry() {}

    public NetWorthEntry(NetWorthCategory category, BigDecimal amount) {
        this.category = category;
        this.amount = amount;
    }

    public NetWorthCategory getCategory() { return category; }
    public void setCategory(NetWorthCategory category) { this.category = category; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
