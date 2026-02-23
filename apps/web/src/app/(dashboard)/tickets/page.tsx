"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, X, Send, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { statusColors, priorityColors, formatDateTime, timeAgo } from "@/lib/utils";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  customer_name: string | null;
  customer_id: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  sla_first_response_due: string | null;
  sla_resolution_due: string | null;
  created_at: string;
}

interface TicketMessage {
  id: string;
  direction: string;
  body: string;
  sender_email: string | null;
  created_by_name: string | null;
  created_at: string;
}

export default function TicketsPage() {
  const searchParams = useSearchParams();
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessageBody, setNewMessageBody] = useState("");
  const [messageDirection, setMessageDirection] = useState<"outbound" | "internal_note">("internal_note");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const customerIdParam = searchParams.get("customer_id");
    const params = customerIdParam ? `?customer_id=${customerIdParam}` : "";
    const data = await apiFetch<Ticket[]>(`/tickets${params}`);
    setAllTickets(data);
    setLoading(false);

    const selectedId = searchParams.get("selected");
    if (selectedId) {
      const found = data.find((t) => t.id === selectedId);
      if (found) selectTicket(found);
    }
  }, [searchParams]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  async function selectTicket(ticket: Ticket) {
    setSelectedTicket(ticket);
    const msgs = await apiFetch<TicketMessage[]>(`/tickets/${ticket.id}/messages`);
    setMessages(msgs);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !newMessageBody.trim()) return;
    await apiFetch(`/tickets/${selectedTicket.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ direction: messageDirection, body: newMessageBody }),
    });
    setNewMessageBody("");
    const msgs = await apiFetch<TicketMessage[]>(`/tickets/${selectedTicket.id}/messages`);
    setMessages(msgs);
  }

  async function updateTicketStatus(status: string) {
    if (!selectedTicket) return;
    const updated = await apiFetch<Ticket>(`/tickets/${selectedTicket.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setSelectedTicket(updated);
    loadTickets();
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    const customerIdParam = searchParams.get("customer_id");
    await apiFetch("/tickets", {
      method: "POST",
      body: JSON.stringify({
        subject: newSubject,
        priority: newPriority,
        customer_id: customerIdParam || undefined,
      }),
    });
    setNewSubject("");
    setNewPriority("medium");
    setDialogOpen(false);
    loadTickets();
  }

  const unassigned = allTickets.filter((t) => !t.assigned_to);
  const allOpen = allTickets.filter((t) => t.status !== "closed");

  function TicketList({ tickets }: { tickets: Ticket[] }) {
    return (
      <div className="space-y-2">
        {tickets.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No tickets</p>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between rounded-md border p-3 cursor-pointer transition-colors ${
                selectedTicket?.id === t.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              }`}
              onClick={() => selectTicket(t)}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {t.customer_name || "No customer"} &middot; {timeAgo(t.created_at)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-2">
                <Badge className={statusColors[t.status]}>{t.status.replace(/_/g, " ")}</Badge>
                <Badge className={priorityColors[t.priority]}>{t.priority}</Badge>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-3rem)]">
      {/* Left panel: ticket list */}
      <div className="w-1/2 flex flex-col min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tickets</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" /> New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Ticket</DialogTitle>
              </DialogHeader>
              <form onSubmit={createTicket} className="space-y-4">
                <Input
                  placeholder="Subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  required
                />
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="flex-1 overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="unassigned">Unassigned ({unassigned.length})</TabsTrigger>
            <TabsTrigger value="all">All Open ({allOpen.length})</TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto mt-2">
            <TabsContent value="unassigned">
              <TicketList tickets={unassigned} />
            </TabsContent>
            <TabsContent value="all">
              <TicketList tickets={allOpen} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Right panel: ticket detail */}
      <div className="w-1/2 flex flex-col min-w-0">
        {selectedTicket ? (
          <Card className="flex flex-col flex-1 overflow-hidden">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg truncate">{selectedTicket.subject}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTicket.customer_name || "No customer"} &middot;{" "}
                    {selectedTicket.assigned_to_name || "Unassigned"}
                  </p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge className={statusColors[selectedTicket.status]}>
                  {selectedTicket.status.replace(/_/g, " ")}
                </Badge>
                <Badge className={priorityColors[selectedTicket.priority]}>
                  {selectedTicket.priority}
                </Badge>
                {selectedTicket.sla_first_response_due && (
                  <span className="text-xs text-muted-foreground">
                    SLA Response: {formatDateTime(selectedTicket.sla_first_response_due)}
                  </span>
                )}
              </div>
              <div className="flex gap-1 mt-3">
                {["new", "in_progress", "waiting_on_client", "escalated", "closed"].map((s) => (
                  <Button
                    key={s}
                    variant={selectedTicket.status === s ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => updateTicketStatus(s)}
                  >
                    {s.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-md p-3 text-sm ${
                    m.direction === "inbound"
                      ? "bg-muted"
                      : m.direction === "internal_note"
                      ? "bg-yellow-50 border border-yellow-200"
                      : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">
                      {m.direction === "inbound"
                        ? m.sender_email
                        : m.direction === "internal_note"
                        ? `${m.created_by_name || "System"} (note)`
                        : `${m.created_by_name || "System"} (reply)`}
                    </span>
                    <span className="text-xs text-muted-foreground">{timeAgo(m.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </div>
              ))}
            </CardContent>

            {/* Reply form */}
            <div className="border-t border-border p-4 flex-shrink-0">
              <form onSubmit={sendMessage} className="space-y-2">
                <Textarea
                  placeholder={messageDirection === "internal_note" ? "Add internal note..." : "Type reply..."}
                  value={newMessageBody}
                  onChange={(e) => setNewMessageBody(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={messageDirection === "internal_note" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMessageDirection("internal_note")}
                    >
                      <StickyNote className="mr-1 h-3 w-3" /> Note
                    </Button>
                    <Button
                      type="button"
                      variant={messageDirection === "outbound" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMessageDirection("outbound")}
                    >
                      <Send className="mr-1 h-3 w-3" /> Reply
                    </Button>
                  </div>
                  <Button type="submit" size="sm" disabled={!newMessageBody.trim()}>
                    Send
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Select a ticket to view details
          </div>
        )}
      </div>
    </div>
  );
}
