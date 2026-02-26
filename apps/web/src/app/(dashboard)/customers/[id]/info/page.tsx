"use client";

import { useEffect, useState, use } from "react";
import { UserPlus, Trash2, Save, Globe, Phone, MapPin, Briefcase, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useCustomer } from "../layout";

interface ContactItem {
  id: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

export default function CompanyInfoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { customer, reload } = useCustomer();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [notes, setNotes] = useState(customer.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);

  // Contact form state
  const [contactFirst, setContactFirst] = useState("");
  const [contactLast, setContactLast] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactTitle, setContactTitle] = useState("");

  useEffect(() => {
    loadContacts();
  }, [id]);

  useEffect(() => {
    setNotes(customer.notes || "");
  }, [customer]);

  async function loadContacts() {
    const data = await apiFetch<ContactItem[]>(`/customers/${id}/contacts`);
    setContacts(data);
  }

  async function saveNotes() {
    setSavingNotes(true);
    await apiFetch(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    });
    setSavingNotes(false);
    reload();
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch(`/customers/${id}/contacts`, {
      method: "POST",
      body: JSON.stringify({
        first_name: contactFirst,
        last_name: contactLast,
        email: contactEmail || null,
        phone: contactPhone || null,
        title: contactTitle || null,
      }),
    });
    setContactFirst("");
    setContactLast("");
    setContactEmail("");
    setContactPhone("");
    setContactTitle("");
    loadContacts();
  }

  async function deleteContact(contactId: string) {
    await apiFetch(`/customers/${id}/contacts/${contactId}`, { method: "DELETE" });
    loadContacts();
  }

  return (
    <div className="space-y-6">
      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {customer.industry && (
              <div className="flex items-start gap-2">
                <Briefcase className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Industry</p>
                  <p className="capitalize">{customer.industry}</p>
                </div>
              </div>
            )}
            {customer.employee_count && (
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Employees</p>
                  <p>{customer.employee_count.toLocaleString()}</p>
                </div>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p>{customer.phone}</p>
                </div>
              </div>
            )}
            {customer.website && (
              <div className="flex items-start gap-2">
                <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Website</p>
                  <a href={customer.website.startsWith("http") ? customer.website : `https://${customer.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {customer.website}
                  </a>
                </div>
              </div>
            )}
            {(customer.address || customer.city) && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p>
                    {[customer.address, customer.city, customer.state, customer.zip]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}
            {customer.founded_year && (
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Founded</p>
                  <p>{customer.founded_year}</p>
                </div>
              </div>
            )}
            {customer.annual_revenue != null && customer.annual_revenue > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Annual Revenue</p>
                <p>{formatCurrency(customer.annual_revenue)}</p>
              </div>
            )}
            {customer.contract_value != null && customer.contract_value > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Contract Value</p>
                <p>{formatCurrency(customer.contract_value)}</p>
              </div>
            )}
            {customer.contract_start && (
              <div>
                <p className="text-xs text-muted-foreground">Contract Period</p>
                <p>{formatDate(customer.contract_start)} — {formatDate(customer.contract_end)}</p>
              </div>
            )}
            {customer.linkedin_url && (
              <div>
                <p className="text-xs text-muted-foreground">LinkedIn</p>
                <a href={customer.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs truncate block">
                  {customer.linkedin_url}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length > 0 && (
            <div className="mb-4 space-y-2">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {c.first_name} {c.last_name}
                      </span>
                      {c.is_primary && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">Primary</Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex gap-4 text-xs text-muted-foreground">
                      {c.title && <span>{c.title}</span>}
                      {c.email && <span>{c.email}</span>}
                      {c.phone && <span>{c.phone}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteContact(c.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={addContact} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="First name" value={contactFirst} onChange={(e) => setContactFirst(e.target.value)} required />
              <Input placeholder="Last name" value={contactLast} onChange={(e) => setContactLast(e.target.value)} required />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              <Input placeholder="Phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              <Input placeholder="Title/Role" value={contactTitle} onChange={(e) => setContactTitle(e.target.value)} />
            </div>
            <Button type="submit" size="sm">
              <UserPlus className="mr-2 h-4 w-4" /> Add Contact
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            placeholder="Customer notes..."
          />
          <Button onClick={saveNotes} disabled={savingNotes} className="mt-3">
            <Save className="mr-2 h-4 w-4" />
            {savingNotes ? "Saving..." : "Save Notes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
