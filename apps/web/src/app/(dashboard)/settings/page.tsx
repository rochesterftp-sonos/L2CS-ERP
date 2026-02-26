"use client";

import { useEffect, useState } from "react";
import { Plus, GripVertical, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

interface LookupValue {
  id: string;
  type_key: string;
  value_key: string;
  label: string;
  sort_order: number;
  is_system: boolean;
  is_active: boolean;
}

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LookupManager
          typeKey="engagement_phase"
          title="Engagement Phases"
          description="Lifecycle stages for customer engagements"
        />
        <LookupManager
          typeKey="service_tier"
          title="Service Tiers"
          description="Service level tiers for customers"
        />
      </div>
    </div>
  );
}

function LookupManager({
  typeKey,
  title,
  description,
}: {
  typeKey: string;
  title: string;
  description: string;
}) {
  const [values, setValues] = useState<LookupValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  useEffect(() => {
    loadValues();
  }, [typeKey]);

  async function loadValues() {
    setLoading(true);
    try {
      const data = await apiFetch<LookupValue[]>(`/lookups/${typeKey}`);
      setValues(data);
    } catch {
      // handled by apiFetch
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const nextSort = values.length > 0 ? Math.max(...values.map((v) => v.sort_order)) + 1 : 1;
    await apiFetch(`/lookups/${typeKey}`, {
      method: "POST",
      body: JSON.stringify({
        value_key: newKey.toLowerCase().replace(/\s+/g, "_"),
        label: newLabel,
        sort_order: nextSort,
      }),
    });
    setNewKey("");
    setNewLabel("");
    setAdding(false);
    loadValues();
  }

  async function handleSaveEdit(id: string) {
    await apiFetch(`/lookups/${typeKey}/${id}`, {
      method: "PUT",
      body: JSON.stringify({ label: editLabel }),
    });
    setEditingId(null);
    loadValues();
  }

  async function handleDelete(id: string) {
    await apiFetch(`/lookups/${typeKey}/${id}`, { method: "DELETE" });
    loadValues();
  }

  async function moveItem(index: number, direction: -1 | 1) {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= values.length) return;

    const updated = [...values];
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];

    const items = updated.map((v, i) => ({ id: v.id, sort_order: i + 1 }));
    await apiFetch(`/lookups/${typeKey}/reorder`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    });
    loadValues();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-1">
            {values.map((v, index) => (
              <div
                key={v.id}
                className="flex items-center gap-2 rounded-md border border-border p-2.5 group"
              >
                {/* Reorder buttons */}
                <div className="flex flex-col">
                  <button
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-0.5"
                    title="Move up"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 12 12"><path d="M6 3L2 8h8z" fill="currentColor" /></svg>
                  </button>
                  <button
                    onClick={() => moveItem(index, 1)}
                    disabled={index === values.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-0.5"
                    title="Move down"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 12 12"><path d="M6 9L2 4h8z" fill="currentColor" /></svg>
                  </button>
                </div>

                {editingId === v.id ? (
                  <>
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="h-8 flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(v.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(v.id)}>
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{v.label}</span>
                    <span className="text-xs text-muted-foreground font-mono">{v.value_key}</span>
                    {v.is_system && (
                      <Badge variant="outline" className="text-xs">system</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        setEditingId(v.id);
                        setEditLabel(v.label);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {!v.is_system && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={() => handleDelete(v.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}

            {values.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No values configured</p>
            )}
          </div>
        )}

        {/* Add new form */}
        {adding && (
          <form onSubmit={handleAdd} className="mt-3 flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Key</label>
              <Input
                placeholder="e.g. enterprise"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
                className="h-8"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Label</label>
              <Input
                placeholder="e.g. Enterprise"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                required
                className="h-8"
                autoFocus
              />
            </div>
            <Button type="submit" size="sm" className="h-8">
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => { setAdding(false); setNewKey(""); setNewLabel(""); }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
