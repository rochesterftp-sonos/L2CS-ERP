"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

export interface Customer {
  id: string;
  name: string;
  primary_domain: string | null;
  engagement_manager_id: string | null;
  risk_status: string;
  cmmc_status: string;
  contract_start: string | null;
  contract_end: string | null;
  sharepoint_url: string | null;
  grc_url: string | null;
  vault_url: string | null;
  notes: string | null;
  created_at: string;
  industry: string | null;
  employee_count: number | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  founded_year: number | null;
  linkedin_url: string | null;
  short_description: string | null;
  annual_revenue: number | null;
  contract_value: number | null;
  service_tier: string;
  engagement_phase: string;
  onboarding_date: string | null;
}

export function EditCustomerForm({
  customer,
  customerId,
  onSaved,
}: {
  customer: Customer;
  customerId: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: customer.name,
    primary_domain: customer.primary_domain || "",
    phone: customer.phone || "",
    website: customer.website || "",
    industry: customer.industry || "",
    employee_count: customer.employee_count?.toString() || "",
    address: customer.address || "",
    city: customer.city || "",
    state: customer.state || "",
    zip: customer.zip || "",
    founded_year: customer.founded_year?.toString() || "",
    linkedin_url: customer.linkedin_url || "",
    short_description: customer.short_description || "",
    annual_revenue: customer.annual_revenue?.toString() || "",
    contract_value: customer.contract_value?.toString() || "",
    service_tier: customer.service_tier,
    engagement_phase: customer.engagement_phase,
    risk_status: customer.risk_status,
    cmmc_status: customer.cmmc_status,
    contract_start: customer.contract_start || "",
    contract_end: customer.contract_end || "",
    onboarding_date: customer.onboarding_date || "",
    sharepoint_url: customer.sharepoint_url || "",
    grc_url: customer.grc_url || "",
    vault_url: customer.vault_url || "",
  });
  const [saving, setSaving] = useState(false);

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await apiFetch(`/customers/${customerId}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: form.name,
        primary_domain: form.primary_domain || null,
        phone: form.phone || null,
        website: form.website || null,
        industry: form.industry || null,
        employee_count: form.employee_count ? parseInt(form.employee_count) : null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,
        founded_year: form.founded_year ? parseInt(form.founded_year) : null,
        linkedin_url: form.linkedin_url || null,
        short_description: form.short_description || null,
        annual_revenue: form.annual_revenue ? parseFloat(form.annual_revenue) : null,
        contract_value: form.contract_value ? parseFloat(form.contract_value) : null,
        service_tier: form.service_tier,
        engagement_phase: form.engagement_phase,
        risk_status: form.risk_status,
        cmmc_status: form.cmmc_status,
        contract_start: form.contract_start || null,
        contract_end: form.contract_end || null,
        onboarding_date: form.onboarding_date || null,
        sharepoint_url: form.sharepoint_url || null,
        grc_url: form.grc_url || null,
        vault_url: form.vault_url || null,
      }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Basic Info */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Company Name</label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Primary Domain</label>
            <Input value={form.primary_domain} onChange={(e) => set("primary_domain", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Phone</label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Website</label>
            <Input value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Industry</label>
            <Select value={form.industry} onValueChange={(v) => set("industry", v)}>
              <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent>
                {["defense", "manufacturing", "healthcare", "financial", "technology", "government", "education", "other"].map((i) => (
                  <SelectItem key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Short Description</label>
            <Input value={form.short_description} onChange={(e) => set("short_description", e.target.value)} />
          </div>
        </div>
      </section>

      {/* Location */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Location</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Address</label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">City</label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">State</label>
              <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">ZIP</label>
              <Input value={form.zip} onChange={(e) => set("zip", e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      {/* Size & Financial */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Size & Financial</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Employees</label>
            <Input type="number" value={form.employee_count} onChange={(e) => set("employee_count", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Founded Year</label>
            <Input type="number" value={form.founded_year} onChange={(e) => set("founded_year", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Annual Revenue ($)</label>
            <Input type="number" step="0.01" value={form.annual_revenue} onChange={(e) => set("annual_revenue", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Contract Value (MRR/ARR $)</label>
            <Input type="number" step="0.01" value={form.contract_value} onChange={(e) => set("contract_value", e.target.value)} />
          </div>
        </div>
      </section>

      {/* Engagement */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Engagement</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Service Tier</label>
            <Select value={form.service_tier} onValueChange={(v) => set("service_tier", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["bronze", "silver", "gold", "platinum"].map((t) => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Engagement Phase</label>
            <Select value={form.engagement_phase} onValueChange={(v) => set("engagement_phase", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["prospect", "onboarding", "active", "renewal", "offboarding"].map((p) => (
                  <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Risk Status</label>
            <Select value={form.risk_status} onValueChange={(v) => set("risk_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["green", "yellow", "red"].map((r) => (
                  <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">CMMC Status</label>
            <Select value={form.cmmc_status} onValueChange={(v) => set("cmmc_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["not_started", "in_progress", "audit_ready", "certified"].map((c) => (
                  <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Contract Start</label>
            <Input type="date" value={form.contract_start} onChange={(e) => set("contract_start", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Contract End</label>
            <Input type="date" value={form.contract_end} onChange={(e) => set("contract_end", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Onboarding Date</label>
            <Input type="date" value={form.onboarding_date} onChange={(e) => set("onboarding_date", e.target.value)} />
          </div>
        </div>
      </section>

      {/* Links */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Links</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">LinkedIn URL</label>
            <Input value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">SharePoint URL</label>
            <Input value={form.sharepoint_url} onChange={(e) => set("sharepoint_url", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">GRC Platform URL</label>
            <Input value={form.grc_url} onChange={(e) => set("grc_url", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Vault URL</label>
            <Input value={form.vault_url} onChange={(e) => set("vault_url", e.target.value)} />
          </div>
        </div>
      </section>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
