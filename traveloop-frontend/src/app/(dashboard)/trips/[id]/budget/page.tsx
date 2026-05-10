"use client";

import { use, useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { useTripContext } from "@/contexts/TripContext";
import { getBudget, addBudgetItem, deleteBudgetItem } from "@/lib/api";
import type { BudgetSummary, BudgetItem } from "@/lib/types";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Skeleton from "react-loading-skeleton";

const CAT_COLORS: Record<string, string> = {
  transport: "#4aabb8",
  accommodation: "#e8734a",
  activities: "#7c6af7",
  meals: "#f59e0b",
  misc: "#94a3b8",
};

const CATS = ["transport", "accommodation", "activities", "meals", "misc"] as const;

export default function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { trip } = useTripContext();
  const { getToken } = useAuth();

  const [data, setData] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ category: "transport", description: "", quantity: "1", unitCost: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await getBudget(id, token);
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleAdd() {
    if (!form.description.trim() || !form.unitCost) return;
    setSaving(true);
    setErr("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await addBudgetItem({
        tripId: id,
        category: form.category as BudgetItem["category"],
        description: form.description,
        quantity: parseInt(form.quantity) || 1,
        unitCost: parseFloat(form.unitCost),
      }, token);
      setForm({ category: "transport", description: "", quantity: "1", unitCost: "" });
      setAddOpen(false);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(itemId: string) {
    const token = await getToken();
    if (!token) return;
    await deleteBudgetItem(itemId, token);
    load();
  }

  if (loading) return (
    <div className="space-y-4">
      <Skeleton height={200} borderRadius={16} />
      <Skeleton height={160} borderRadius={16} />
      <Skeleton count={4} height={48} borderRadius={8} className="mb-2" />
    </div>
  );

  const pieData = data?.summary?.map((s) => ({
    name: s.category,
    value: Number(s.category_total),
  })) ?? [];

  const barData = data?.dailyCosts?.map((d) => ({
    day: d.day,
    cost: Number(d.daily_activity_cost),
  })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>
            Budget
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Total: <span className="font-semibold text-[var(--primary)]">${(data?.grandTotal ?? 0).toLocaleString()}</span>
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus size={15} /> Add Item
        </Button>
      </div>

      {(data?.items?.length ?? 0) === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-xl)]">
          <DollarSign size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="font-medium text-[var(--text-secondary)]">No budget items yet</p>
          <p className="text-sm text-[var(--text-muted)] mt-1 mb-5">Track your travel expenses here</p>
          <Button size="sm" onClick={() => setAddOpen(true)}>Add first item</Button>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pieData.length > 0 && (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4">
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">By Category</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={CAT_COLORS[entry.name] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `$${Number(v ?? 0).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {barData.length > 0 && (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4">
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">Daily Activity Costs</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `$${Number(v ?? 0)}`} />
                    <Bar dataKey="cost" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Items table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] text-xs font-medium text-[var(--text-muted)] grid grid-cols-[1fr_auto_auto_auto_auto] gap-4">
              <span>Description</span>
              <span>Category</span>
              <span>Qty</span>
              <span>Unit</span>
              <span>Total</span>
            </div>
            <ul className="divide-y divide-[var(--border)]">
              {data?.items?.map((item) => (
                <li key={item.id} className="px-4 py-3 grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center text-sm">
                  <span className="text-[var(--text-primary)] truncate">{item.description}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: `${CAT_COLORS[item.category]}22`, color: CAT_COLORS[item.category] }}
                  >
                    {item.category}
                  </span>
                  <span className="text-[var(--text-muted)] text-center">{item.quantity}</span>
                  <span className="text-[var(--text-muted)]">${Number(item.unitCost).toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--text-primary)]">${Number(item.total).toFixed(2)}</span>
                    <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-4 py-3 border-t border-[var(--border)] flex justify-end">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Grand total: ${(data?.grandTotal ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Budget Item">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-[var(--radius-md)] text-sm bg-[var(--bg-base)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            >
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input id="b-desc" label="Description" placeholder="e.g. Flight BOM → DEL" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input id="b-qty" label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
            <Input id="b-cost" label="Unit cost ($)" type="number" placeholder="0.00" value={form.unitCost} onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))} />
          </div>
          {err && <p className="text-sm text-red-500">{err}</p>}
          <Button onClick={handleAdd} loading={saving} className="w-full">Add item</Button>
        </div>
      </Modal>
    </div>
  );
}
