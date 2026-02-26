"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  healthScoreColor,
  healthScoreBg,
  formatCurrency,
} from "@/lib/utils";
import {
  Heart,
  Ticket,
  ShieldCheck,
  DollarSign,
  CalendarClock,
  Activity,
} from "lucide-react";

interface HealthData {
  health_score: number;
  open_tickets: number;
  sla_compliance_pct: number | null;
  ar_balance: number;
  contract_days_remaining: number | null;
  activity_count_30d: number;
}

export function CustomerHealthBar({ data }: { data: HealthData }) {
  return (
    <Card className="mb-6">
      <CardContent className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* Health Score */}
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                className={healthScoreBg(data.health_score).replace("bg-", "stroke-")}
                strokeWidth="3"
                strokeDasharray={`${data.health_score}, 100`}
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${healthScoreColor(data.health_score)}`}>
              {data.health_score}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Health</p>
            <p className={`text-sm font-semibold ${healthScoreColor(data.health_score)}`}>
              {data.health_score >= 80 ? "Good" : data.health_score >= 60 ? "Fair" : data.health_score >= 40 ? "At Risk" : "Critical"}
            </p>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2">
            <Ticket className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Open Tickets</p>
            <p className="text-sm font-semibold">{data.open_tickets}</p>
          </div>
        </div>

        {/* SLA */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-50 p-2">
            <ShieldCheck className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">SLA Compliance</p>
            <p className="text-sm font-semibold">
              {data.sla_compliance_pct != null ? `${data.sla_compliance_pct}%` : "N/A"}
            </p>
          </div>
        </div>

        {/* AR Balance */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-50 p-2">
            <DollarSign className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">AR Balance</p>
            <p className="text-sm font-semibold">{formatCurrency(data.ar_balance)}</p>
          </div>
        </div>

        {/* Contract Days */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-50 p-2">
            <CalendarClock className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Contract Days</p>
            <p className="text-sm font-semibold">
              {data.contract_days_remaining != null ? data.contract_days_remaining : "N/A"}
            </p>
          </div>
        </div>

        {/* Activity 30d */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-50 p-2">
            <Activity className="h-4 w-4 text-cyan-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Activity (30d)</p>
            <p className="text-sm font-semibold">{data.activity_count_30d}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
