"use client";

import { useEffect, useState, use } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

interface Email {
  message_id: string;
  subject: string;
  from_email: string;
  received_at: string;
  body_preview: string;
  has_attachments: boolean;
}

interface MailboxMapping {
  id: string;
  mailbox_email: string;
  folder_path: string;
  folder_id: string;
  include_subfolders: boolean;
  is_primary: boolean;
}

export default function EmailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [emails, setEmails] = useState<Email[]>([]);
  const [mappings, setMappings] = useState<MailboxMapping[]>([]);

  // Mapping form state
  const [newMailbox, setNewMailbox] = useState("");
  const [newFolderPath, setNewFolderPath] = useState("");
  const [newFolderId, setNewFolderId] = useState("");

  useEffect(() => {
    loadEmails();
    loadMappings();
  }, [id]);

  async function loadEmails() {
    try {
      const data = await apiFetch<Email[]>(`/customers/${id}/emails`);
      setEmails(data);
    } catch {
      setEmails([]);
    }
  }

  async function loadMappings() {
    const data = await apiFetch<MailboxMapping[]>(`/customers/${id}/mailbox-mappings`);
    setMappings(data);
  }

  async function addMapping(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch(`/customers/${id}/mailbox-mappings`, {
      method: "POST",
      body: JSON.stringify({
        mailbox_email: newMailbox,
        folder_id: newFolderId,
        folder_path: newFolderPath,
      }),
    });
    setNewMailbox("");
    setNewFolderPath("");
    setNewFolderId("");
    loadMappings();
    loadEmails();
  }

  async function deleteMapping(mappingId: string) {
    await apiFetch(`/customers/${id}/mailbox-mappings/${mappingId}`, { method: "DELETE" });
    loadMappings();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mailbox Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          {mappings.length > 0 && (
            <div className="mb-4 space-y-2">
              {mappings.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                  <div>
                    <span className="font-medium">{m.mailbox_email}</span>
                    <span className="mx-2 text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{m.folder_path}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteMapping(m.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={addMapping} className="flex gap-2">
            <Input placeholder="mailbox@email.com" value={newMailbox} onChange={(e) => setNewMailbox(e.target.value)} required className="flex-1" />
            <Input placeholder="Folder path" value={newFolderPath} onChange={(e) => setNewFolderPath(e.target.value)} required className="flex-1" />
            <Input placeholder="Folder ID" value={newFolderId} onChange={(e) => setNewFolderId(e.target.value)} required className="w-32" />
            <Button type="submit" size="sm">Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Emails</CardTitle>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <p className="text-sm text-muted-foreground">No emails found. Add a mailbox mapping first.</p>
          ) : (
            <div className="space-y-3">
              {emails.map((e) => (
                <div key={e.message_id} className="border-b border-border pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{e.subject}</p>
                      {e.has_attachments && <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <span className="text-xs text-muted-foreground">{timeAgo(e.received_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">From: {e.from_email}</p>
                  <p className="mt-1 text-sm text-muted-foreground truncate">{e.body_preview}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
