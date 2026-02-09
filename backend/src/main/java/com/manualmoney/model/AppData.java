package com.manualmoney.model;

import java.util.ArrayList;
import java.util.List;

public class AppData {
    private List<Bucket> buckets;
    private List<PayPeriod> payPeriods;

    public AppData() {
        this.buckets = new ArrayList<>();
        this.payPeriods = new ArrayList<>();
    }

    public List<Bucket> getBuckets() {
        return buckets;
    }

    public void setBuckets(List<Bucket> buckets) {
        this.buckets = buckets;
    }

    public List<PayPeriod> getPayPeriods() {
        return payPeriods;
    }

    public void setPayPeriods(List<PayPeriod> payPeriods) {
        this.payPeriods = payPeriods;
    }
}
