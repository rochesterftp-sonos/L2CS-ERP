"use client";

import { use } from "react";
import BillingTab from "@/components/billing-tab";

export default function FinancialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BillingTab customerId={id} />;
}
