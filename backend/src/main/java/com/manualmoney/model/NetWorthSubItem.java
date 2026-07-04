package com.manualmoney.model;

import java.math.BigDecimal;

public class NetWorthSubItem {

    private String name;
    private BigDecimal amount;

    public NetWorthSubItem() {}

    public NetWorthSubItem(String name, BigDecimal amount) {
        this.name = name;
        this.amount = amount;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
