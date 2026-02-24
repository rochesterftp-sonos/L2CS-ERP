"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, Shield, Clock, FileText, MessageSquare, StickyNote, Save, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import {
  riskColors,
  cmmcColors,
  statusColors,
  priorityColors,
  formatDateTime,
  timeAgo,
} from "@/lib/utils";
import BillingTab from "@/components/billing-tab";

interface Customer {
  id: string;
  name: string;
  primary_domain: string | null;
  engagement_manager_id: string | null;
  risk_status: string;
  cmmc_status: string;
  sharepoint_url: string | null;
  grc_url: string | null;
  notes: string | null;
  created_at: string;
}

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  summary: string | null;
  occurred_at: string;
  created_by_name: string | null;
}

interface Email {
  message_id: string;
  subject: string;
  from_email: string;
  received_at: string;
  body_preview: string;
  has_attachments: boolean;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  assigned_to_name: string | null;
  created_at: string;
}

interface MailboxMapping {
  id: string;
  mailbox_email: string;
  folder_path: string;
  folder_id: string;
  include_subfolders: boolean;
  is_primary: boolean;
}

export default function Customer360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [mappings, setMappings] = useState<MailboxMapping[]>([]);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Mapping form state
  const [newMailbox, setNewMailbox] = useState("");
  const [newFolderPath, setNewFolderPath] = useState("");
  const [newFolderId, setNewFolderId] = useState("");

  useEffect(() => {
    loadCustomer();
    loadActivities();
    loadEmails();
    loadTickets();
    loadMappings();
  }, [id]);

  async function loadCustomer() {
    const data = await apiFetch<Customer>(`/customers/${id}`);
    setCustomer(data);
    setNotes(data.notes || "");
  }

  async function loadActivities() {
    const data = await apiFetch<Activity[]>(`/customers/${id}/activities`);
    setActivities(data);
  }

  async function loadEmails() {
    try {
      const data = await apiFetch<Email[]>(`/customers/${id}/emails`);
      setEmails(data);
    } catch {
      setEmails([]);
    }
  }

  async function loadTickets() {
    const data = await apiFetch<Ticket[]>(`/customers/${id}/tickets`);
    setTickets(data);
  }

  async function loadMappings() {
    const data = await apiFetch<MailboxMapping[]>(`/customers/${id}/mailbox-mappings`);
    setMappings(data);
  }

  async function saveNotes() {
    setSavingNotes(true);
    await apiFetch(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    });
    setSavingNotes(false);
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

  if (!customer) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/customers")}
          className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </button>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              <p className="text-muted-foreground">{customer.primary_domain || "No domain"}</p>
            </div>
            <div className="flex items-center gap-3">
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline"><Clock className="mr-1.5 h-3.5 w-3.5" /> Timeline</TabsTrigger>
          <TabsTrigger value="email"><Mail className="mr-1.5 h-3.5 w-3.5" /> Email</TabsTrigger>
          <TabsTrigger value="support"><MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Support</TabsTrigger>
          <TabsTrigger value="billing"><DollarSign className="mr-1.5 h-3.5 w-3.5" /> Billing</TabsTrigger>
          <TabsTrigger value="files"><FileText className="mr-1.5 h-3.5 w-3.5" /> Files</TabsTrigger>
          <TabsTrigger value="compliance"><Shield className="mr-1.5 h-3.5 w-3.5" /> Compliance</TabsTrigger>
          <TabsTrigger value="notes"><StickyNote className="mr-1.5 h-3.5 w-3.5" /> Notes</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((a) => (
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
                        {a.created_by_name && (
                          <p className="mt-0.5 text-xs text-muted-foreground">by {a.created_by_name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <div className="space-y-4">
            {/* Mailbox Mappings */}
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
                  <Input
                    placeholder="mailbox@email.com"
                    value={newMailbox}
                    onChange={(e) => setNewMailbox(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Input
                    placeholder="Folder path"
                    value={newFolderPath}
                    onChange={(e) => setNewFolderPath(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Input
                    placeholder="Folder ID"
                    value={newFolderId}
                    onChange={(e) => setNewFolderId(e.target.value)}
                    required
                    className="w-32"
                  />
                  <Button type="submit" size="sm">Add</Button>
                </form>
              </CardContent>
            </Card>

            {/* Emails list */}
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
                          <p className="text-sm font-medium">{e.subject}</p>
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
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Support Tickets</CardTitle>
              <Button
                size="sm"
                onClick={() => router.push(`/tickets?customer_id=${id}`)}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tickets</p>
              ) : (
                <div className="space-y-2">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/tickets?selected=${t.id}`)}
                    >
                      <div>
                        <p className="text-sm font-medium">{t.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.assigned_to_name || "Unassigned"} &middot; {timeAgo(t.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={statusColors[t.status]}>{t.status.replace(/_/g, " ")}</Badge>
                        <Badge className={priorityColors[t.priority]}>{t.priority}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <BillingTab customerId={id} />
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Files</CardTitle>
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
                <p className="text-sm text-muted-foreground">No SharePoint URL configured for this customer.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compliance / GRC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">CMMC Status: </span>
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
                    Open GRC Platform
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">No GRC URL configured.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={10}
                placeholder="Customer notes..."
              />
              <Button onClick={saveNotes} disabled={savingNotes} className="mt-3">
                <Save className="mr-2 h-4 w-4" />
                {savingNotes ? "Saving..." : "Save Notes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
