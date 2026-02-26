"use client";

import { useEffect, useState, useCallback, createContext, useContext, use } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import {
  riskColors,
  cmmcColors,
  serviceTierColors,
  engagementPhaseColors,
} from "@/lib/utils";
import { EditCustomerForm, type Customer } from "@/components/edit-customer-form";
import { CustomerHealthBar } from "@/components/customer-health-bar";
import { CustomerPortalNav } from "@/components/customer-portal-nav";

interface HealthData {
  health_score: number;
  open_tickets: number;
  sla_compliance_pct: number | null;
  ar_balance: number;
  contract_days_remaining: number | null;
  activity_count_30d: number;
}

interface CustomerContextValue {
  customer: Customer;
  reload: () => void;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used within a customer portal");
  return ctx;
}

export default function CustomerPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadCustomer = useCallback(async () => {
    const data = await apiFetch<Customer>(`/customers/${id}`);
    setCustomer(data);
  }, [id]);

  const loadHealth = useCallback(async () => {
    try {
      const data = await apiFetch<HealthData>(`/customers/${id}/health`);
      setHealth(data);
    } catch {
      // health endpoint may not have data yet
    }
  }, [id]);

  useEffect(() => {
    loadCustomer();
    loadHealth();
  }, [loadCustomer, loadHealth]);

  function reload() {
    loadCustomer();
    loadHealth();
  }

  if (!customer) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <CustomerContext.Provider value={{ customer, reload }}>
      <div>
        {/* Customer Header Card */}
        <Card className="mb-4">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{customer.name}</h1>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Company Details</DialogTitle>
                    </DialogHeader>
                    <EditCustomerForm
                      customer={customer}
                      customerId={id}
                      onSaved={() => {
                        setEditOpen(false);
                        reload();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-muted-foreground">{customer.primary_domain || "No domain"}</p>
              {customer.short_description && (
                <p className="mt-1 text-sm text-muted-foreground">{customer.short_description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <div className="text-muted-foreground">Tier</div>
                <Badge className={serviceTierColors[customer.service_tier] || ""}>{customer.service_tier}</Badge>
              </div>
              <div className="text-right text-sm">
                <div className="text-muted-foreground">Phase</div>
                <Badge className={engagementPhaseColors[customer.engagement_phase] || ""}>
                  {customer.engagement_phase}
                </Badge>
              </div>
              <div className="text-right text-sm">
                <div className="text-muted-foreground">Risk</div>
                <Badge className={riskColors[customer.risk_status]}>{customer.risk_status}</Badge>
              </div>
              <div className="text-right text-sm">
                <div className="text-muted-foreground">CMMC</div>
                <Badge className={cmmcColors[customer.cmmc_status]}>
                  {customer.cmmc_status.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Bar */}
        {health && <CustomerHealthBar data={health} />}

        {/* Two-column: Nav | Content */}
        <div className="flex gap-6">
          <CustomerPortalNav customerId={id} />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </CustomerContext.Provider>
  );
}
