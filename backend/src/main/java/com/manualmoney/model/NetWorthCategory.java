package com.manualmoney.model;

public enum NetWorthCategory {
    REAL_ESTATE(NetWorthCategoryType.ASSET, "Real Estate"),
    CHECKING(NetWorthCategoryType.ASSET, "Checking"),
    SAVINGS(NetWorthCategoryType.ASSET, "Savings"),
    RETIREMENT(NetWorthCategoryType.ASSET, "Retirement"),
    INVESTMENTS(NetWorthCategoryType.ASSET, "Investments"),
    HSA(NetWorthCategoryType.ASSET, "HSA"),
    CARS(NetWorthCategoryType.ASSET, "Cars"),

    REAL_ESTATE_LOAN(NetWorthCategoryType.LIABILITY, "Real Estate Loan"),
    CREDIT_CARD(NetWorthCategoryType.LIABILITY, "Credit Card"),
    PERSONAL_LOAN(NetWorthCategoryType.LIABILITY, "Personal Loan"),
    STUDENT_LOAN(NetWorthCategoryType.LIABILITY, "Student Loan"),
    CAR_LOAN(NetWorthCategoryType.LIABILITY, "Car Loan");

    private final NetWorthCategoryType type;
    private final String label;

    NetWorthCategory(NetWorthCategoryType type, String label) {
        this.type = type;
        this.label = label;
    }

    public NetWorthCategoryType getType() { return type; }
    public String getLabel() { return label; }
}
