"use client";

import { useEffect, useState } from "react";
import {
  Ticket,
  Users,
  ShieldCheck,
  CalendarClock,
  AlertTriangle,
  UserX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import {
  statusColors,
  riskColors,
  cmmcColors,
  serviceTierColors,
  timeAgo,
} from "@/lib/utils";

interface TicketKPIs {
  open_count: number;
  unassigned_count: number;
  avg_resolution_hours: number | null;
  sla_compliance_pct: number | null;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
}

interface CustomerKPIs {
  total_active: number;
  by_risk: Record<string, number>;
  by_cmmc: Record<string, number>;
  by_service_tier: Record<string, number>;
  contracts_expiring_30d: number;
  contracts_expiring_90d: number;
}

interface ActivityKPIs {
  volume_7d: number;
  volume_30d: number;
  recent: Array<{
    id: string;
    activity_type: string;
    title: string;
    summary: string | null;
    occurred_at: string;
    customer_name: string | null;
  }>;
}

interface DashboardData {
  tickets: TicketKPIs;
  customers: CustomerKPIs;
  activities: ActivityKPIs;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<DashboardData>("/dashboard/kpis")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="text-muted-foreground">Loading dashboard...</div>;
  }

  const { tickets, customers, activities } = data;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      {/* Top row — 4 stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Ticket className="h-5 w-5 text-blue-600" />}
          label="Open Tickets"
          value={tickets.open_count}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-emerald-600" />}
          label="Active Customers"
          value={customers.total_active}
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5 text-purple-600" />}
          label="SLA Compliance"
          value={tickets.sla_compliance_pct != null ? `${tickets.sla_compliance_pct}%` : "N/A"}
        />
        <StatCard
          icon={<CalendarClock className="h-5 w-5 text-orange-600" />}
          label="Contracts Expiring (30d)"
          value={customers.contracts_expiring_30d}
        />
      </div>

      {/* Secondary row — unassigned + expiring 90d */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<UserX className="h-5 w-5 text-red-500" />}
          label="Unassigned Tickets"
          value={tickets.unassigned_count}
        />
        <StatCard
          icon={<CalendarClock className="h-5 w-5 text-yellow-600" />}
          label="Contracts Expiring (90d)"
          value={customers.contracts_expiring_90d}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          label="Avg Resolution (hrs)"
          value={tickets.avg_resolution_hours != null ? tickets.avg_resolution_hours.toFixed(1) : "N/A"}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-blue-500" />}
          label="Activity (30d)"
          value={activities.volume_30d}
        />
      </div>

      {/* Middle row — Tickets by Status + Customers by Risk */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Tickets by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tickets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(tickets.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge className={statusColors[status] || "bg-gray-100 text-gray-700"}>
                    {status.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
              {Object.keys(tickets.by_status).length === 0 && (
                <p className="text-sm text-muted-foreground">No tickets yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customers by Risk */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customers by Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(customers.by_risk).map(([risk, count]) => (
                <div key={risk} className="flex items-center justify-between">
                  <Badge className={riskColors[risk] || "bg-gray-100 text-gray-700"}>{risk}</Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
              {Object.keys(customers.by_risk).length === 0 && (
                <p className="text-sm text-muted-foreground">No customers yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution row — CMMC + Service Tier */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CMMC Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(customers.by_cmmc).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge className={cmmcColors[status] || "bg-gray-100 text-gray-700"}>
                    {status.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Service Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(customers.by_service_tier).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <Badge className={serviceTierColors[tier] || "bg-gray-100 text-gray-700"}>
                    {tier}
                  </Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom — Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activities.recent.map((a) => (
                <div key={a.id} className="flex gap-3 border-b border-border pb-3 last:border-0">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{a.title}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {timeAgo(a.occurred_at)}
                      </span>
                    </div>
                    {a.summary && (
                      <p className="mt-0.5 text-sm text-muted-foreground truncate">{a.summary}</p>
                    )}
                    {a.customer_name && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.customer_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-lg bg-muted p-2.5">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
