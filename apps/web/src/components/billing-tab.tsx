"use client";

import { useEffect, useState } from "react";
import { Search, Link2, Unlink, DollarSign, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { invoiceStatusColors, formatCurrency, formatDate } from "@/lib/utils";

interface QBOMapping {
  id: string;
  customer_id: string;
  qbo_customer_id: string;
  qbo_display_name: string | null;
  created_at: string;
  updated_at: string;
}

interface BillingSummary {
  total_ar_balance: number;
  overdue_amount: number;
  open_invoices: number;
  overdue_invoices: number;
  last_payment_date: string | null;
  last_payment_amount: number | null;
}

interface Invoice {
  invoice_id: string;
  invoice_number: string;
  date: string;
  due_date: string;
  amount: number;
  balance_due: number;
  status: string;
}

interface Payment {
  payment_id: string;
  date: string;
  amount: number;
  method: string | null;
  applied_to_invoice: string | null;
  memo: string | null;
}

interface QBOCustomer {
  id: string;
  display_name: string;
  company_name: string;
  balance: number;
}

export default function BillingTab({ customerId }: { customerId: string }) {
  const [mapping, setMapping] = useState<QBOMapping | null>(null);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // QBO search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<QBOCustomer[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    loadMapping();
  }, [customerId]);

  useEffect(() => {
    if (mapping) {
      loadBillingData();
    } else {
      setSummary(null);
      setInvoices([]);
      setPayments([]);
    }
  }, [mapping]);

  async function loadMapping() {
    setLoading(true);
    try {
      const data = await apiFetch<QBOMapping | null>(`/customers/${customerId}/qbo-mapping`);
      setMapping(data);
    } catch {
      setMapping(null);
    }
    setLoading(false);
  }

  async function loadBillingData() {
    const [s, i, p] = await Promise.all([
      apiFetch<BillingSummary>(`/customers/${customerId}/billing/summary`),
      apiFetch<Invoice[]>(`/customers/${customerId}/billing/invoices`),
      apiFetch<Payment[]>(`/customers/${customerId}/billing/payments`),
    ]);
    setSummary(s);
    setInvoices(i);
    setPayments(p);
  }

  async function searchQBO(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await apiFetch<QBOCustomer[]>(
        `/integrations/qbo/customers?search=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }

  async function linkCustomer(qboCustomer: QBOCustomer) {
    setLinking(true);
    await apiFetch(`/customers/${customerId}/qbo-mapping`, {
      method: "POST",
      body: JSON.stringify({
        qbo_customer_id: qboCustomer.id,
        qbo_display_name: qboCustomer.display_name,
      }),
    });
    setSearchResults([]);
    setSearchQuery("");
    await loadMapping();
    setLinking(false);
  }

  async function unlinkCustomer() {
    await apiFetch(`/customers/${customerId}/qbo-mapping`, { method: "DELETE" });
    setMapping(null);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading billing data...</p>;
  }

  return (
    <div className="space-y-4">
      {/* QBO Mapping Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">QuickBooks Online Link</CardTitle>
        </CardHeader>
        <CardContent>
          {mapping ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">
                  Linked to: {mapping.qbo_display_name || mapping.qbo_customer_id}
                </span>
                <Badge className="bg-emerald-100 text-emerald-800">Connected</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={unlinkCustomer}>
                <Unlink className="mr-1.5 h-3.5 w-3.5" />
                Unlink
              </Button>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">
                No QuickBooks customer linked. Search to find and link one.
              </p>
              <form onSubmit={searchQBO} className="flex gap-2">
                <Input
                  placeholder="Search QBO customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={searching}>
                  <Search className="mr-1.5 h-3.5 w-3.5" />
                  {searching ? "Searching..." : "Search"}
                </Button>
              </form>
              {searchResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  {searchResults.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-md border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{r.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.company_name} &middot; Balance: {formatCurrency(r.balance)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={linking}
                        onClick={() => linkCustomer(r)}
                      >
                        Link
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      {summary && mapping && (
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">AR Balance</p>
              <p className="text-xl font-bold">{formatCurrency(summary.total_ar_balance)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className={`text-xl font-bold ${summary.overdue_amount > 0 ? "text-red-600" : ""}`}>
                {formatCurrency(summary.overdue_amount)}
              </p>
              {summary.overdue_invoices > 0 && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  {summary.overdue_invoices} invoice{summary.overdue_invoices > 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open Invoices</p>
              <p className="text-xl font-bold">{summary.open_invoices}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Payment</p>
              <p className="text-sm font-medium">
                {summary.last_payment_amount
                  ? formatCurrency(summary.last_payment_amount)
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.last_payment_date ? formatDate(summary.last_payment_date) : "No payments"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices Table */}
      {mapping && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Invoice #</th>
                      <th className="pb-2 pr-4 font-medium">Date</th>
                      <th className="pb-2 pr-4 font-medium">Due Date</th>
                      <th className="pb-2 pr-4 font-medium text-right">Amount</th>
                      <th className="pb-2 pr-4 font-medium text-right">Balance Due</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr
                        key={inv.invoice_id}
                        className={`border-b last:border-0 ${inv.status === "overdue" ? "bg-red-50" : ""}`}
                      >
                        <td className="py-2 pr-4 font-medium">{inv.invoice_number}</td>
                        <td className="py-2 pr-4">{formatDate(inv.date)}</td>
                        <td className="py-2 pr-4">{formatDate(inv.due_date)}</td>
                        <td className="py-2 pr-4 text-right">{formatCurrency(inv.amount)}</td>
                        <td className="py-2 pr-4 text-right">{formatCurrency(inv.balance_due)}</td>
                        <td className="py-2">
                          <Badge className={invoiceStatusColors[inv.status] || "bg-gray-100 text-gray-700"}>
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payments List */}
      {mapping && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments found</p>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div
                    key={p.payment_id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium">{formatCurrency(p.amount)}</span>
                      </div>
                      <p className="ml-6 text-xs text-muted-foreground">
                        {p.method || "—"} &middot; Applied to {p.applied_to_invoice || "—"}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDate(p.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
