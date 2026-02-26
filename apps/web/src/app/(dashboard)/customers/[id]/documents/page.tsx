"use client";

import { ExternalLink, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomer } from "../layout";

export default function DocumentsPage() {
  const { customer } = useCustomer();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {customer.sharepoint_url ? (
          <a
            href={customer.sharepoint_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Open SharePoint Folder
          </a>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <FolderOpen className="h-8 w-8" />
            <p className="text-sm">No SharePoint URL configured for this customer.</p>
            <p className="text-xs">Use the edit button to add a SharePoint URL.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
