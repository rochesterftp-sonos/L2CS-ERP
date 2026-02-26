"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { ChevronDown, Plus, Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

interface CustomerOption {
  id: string;
  name: string;
  primary_domain: string | null;
}

export function CustomerSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [newTier, setNewTier] = useState("bronze");

  const currentId = params?.id as string | undefined;
  const currentCustomer = customers.find((c) => c.id === currentId);

  // Derive current section from pathname
  const sectionMatch = pathname.match(/\/customers\/[^/]+\/(.+)/);
  const currentSection = sectionMatch ? sectionMatch[1] : "info";

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function loadCustomers() {
    try {
      const data = await apiFetch<CustomerOption[]>("/customers");
      setCustomers(data);
    } catch {
      // handled by apiFetch
    }
  }

  const filtered = search
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.primary_domain && c.primary_domain.toLowerCase().includes(search.toLowerCase()))
      )
    : customers;

  function selectCustomer(id: string) {
    setOpen(false);
    setSearch("");
    router.push(`/customers/${id}/${currentSection}`);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const created = await apiFetch<{ id: string }>("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: newName,
        primary_domain: newDomain || null,
        industry: newIndustry || null,
        phone: newPhone || null,
        website: newWebsite || null,
        service_tier: newTier,
      }),
    });
    setNewName("");
    setNewDomain("");
    setNewIndustry("");
    setNewPhone("");
    setNewWebsite("");
    setNewTier("bronze");
    setCreateOpen(false);
    await loadCustomers();
    router.push(`/customers/${created.id}/info`);
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted transition-colors min-w-[220px]"
        >
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-left truncate">
            {currentCustomer ? currentCustomer.name : "Select Customer"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {open && (
          <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-md border border-border bg-popover shadow-lg">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md bg-muted/50 py-1.5 pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">No customers found</p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c.id)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors ${
                      c.id === currentId ? "bg-muted font-medium" : ""
                    }`}
                  >
                    <span className="flex-1 truncate">{c.name}</span>
                    {c.primary_domain && (
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {c.primary_domain}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-border p-1">
              <button
                onClick={() => {
                  setOpen(false);
                  setCreateOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-primary hover:bg-muted transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                New Customer
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Industry</label>
                <UISelect value={newIndustry} onValueChange={setNewIndustry}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["defense", "manufacturing", "healthcare", "financial", "technology", "government", "education", "other"].map((i) => (
                      <SelectItem key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </UISelect>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Service Tier</label>
                <UISelect value={newTier} onValueChange={setNewTier}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["bronze", "silver", "gold", "platinum"].map((t) => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </UISelect>
              </div>
            </div>
            <Input
              placeholder="Phone"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
            <Input
              placeholder="Website"
              value={newWebsite}
              onChange={(e) => setNewWebsite(e.target.value)}
            />
            <Button type="submit" className="w-full">
              Create
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
