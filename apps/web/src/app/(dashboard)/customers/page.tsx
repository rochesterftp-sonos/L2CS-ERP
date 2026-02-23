"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { riskColors, cmmcColors } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  primary_domain: string | null;
  risk_status: string;
  cmmc_status: string;
  engagement_manager_id: string | null;
  created_at: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");

  async function loadCustomers() {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const data = await apiFetch<Customer[]>(`/customers${params}`);
      setCustomers(data);
    } catch {
      // handled by apiFetch
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, [search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch("/customers", {
      method: "POST",
      body: JSON.stringify({ name: newName, primary_domain: newDomain || null }),
    });
    setNewName("");
    setNewDomain("");
    setDialogOpen(false);
    loadCustomers();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                placeholder="Customer Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <Input
                placeholder="Primary Domain (e.g. acme.com)"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
              <Button type="submit" className="w-full">
                Create
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Domain</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Risk</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">CMMC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/customers/${c.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.primary_domain || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge className={riskColors[c.risk_status] || ""}>{c.risk_status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cmmcColors[c.cmmc_status] || ""}>
                        {c.cmmc_status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
