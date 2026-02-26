"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Mail, DollarSign, FolderOpen, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "info", label: "Company Information", icon: Building2 },
  { href: "emails", label: "Emails", icon: Mail },
  { href: "financial", label: "Financial Information", icon: DollarSign },
  { href: "documents", label: "Documents", icon: FolderOpen },
  { href: "cmmc", label: "CMMC Levels", icon: Shield },
];

export function CustomerPortalNav({ customerId }: { customerId: string }) {
  const pathname = usePathname();

  return (
    <nav className="w-48 shrink-0 space-y-1">
      {navItems.map((item) => {
        const href = `/customers/${customerId}/${item.href}`;
        const active = pathname === href;
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
