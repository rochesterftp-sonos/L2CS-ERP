"use client";

import { ExternalLink, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cmmcColors } from "@/lib/utils";
import { useCustomer } from "../layout";

export default function CmmcPage() {
  const { customer } = useCustomer();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">CMMC Compliance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <span className="text-sm text-muted-foreground">Current CMMC Status: </span>
            <Badge className={cmmcColors[customer.cmmc_status]}>
              {customer.cmmc_status.replace(/_/g, " ")}
            </Badge>
          </div>

          {customer.grc_url ? (
            <a
              href={customer.grc_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Open IntelliGRC Platform
            </a>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Shield className="h-8 w-8" />
              <p className="text-sm">No GRC platform URL configured.</p>
              <p className="text-xs">Use the edit button to add a GRC URL.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
