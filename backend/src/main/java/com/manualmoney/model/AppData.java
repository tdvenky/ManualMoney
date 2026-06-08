package com.manualmoney.model;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.util.ArrayList;
import java.util.List;

public class AppData {

    @JsonAlias("buckets")
    private List<Category> categories;

    private List<SubCategory> subCategories;
    private List<PayPeriod> payPeriods;
    private List<Template> templates;

    public AppData() {
        this.categories = new ArrayList<>();
        this.subCategories = new ArrayList<>();
        this.payPeriods = new ArrayList<>();
        this.templates = new ArrayList<>();
    }

    public List<Category> getCategories() { return categories; }
    public void setCategories(List<Category> categories) { this.categories = categories; }

    public List<SubCategory> getSubCategories() { return subCategories; }
    public void setSubCategories(List<SubCategory> subCategories) { this.subCategories = subCategories; }

    public List<PayPeriod> getPayPeriods() { return payPeriods; }
    public void setPayPeriods(List<PayPeriod> payPeriods) { this.payPeriods = payPeriods; }

    public List<Template> getTemplates() { return templates; }
    public void setTemplates(List<Template> templates) { this.templates = templates; }
}
