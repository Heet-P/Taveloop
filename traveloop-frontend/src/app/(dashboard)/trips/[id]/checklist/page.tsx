"use client";

import { use, useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, Trash2, Check, Search, ChevronDown } from "lucide-react";
import { useTripContext } from "@/contexts/TripContext";
import { getChecklist, addChecklistItem, updateChecklistItem, deleteChecklistItem, resetChecklist } from "@/lib/api";
import type { ChecklistItem } from "@/lib/types";
import Button from "@/components/ui/Button";
import Skeleton from "react-loading-skeleton";

export default function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const { trip } = useTripContext();

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState<ChecklistItem["category"]>("clothing");
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await getChecklist(id, token);
      setItems(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleAdd(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const token = await getToken();
      if (!token) return;
      const item = await addChecklistItem({ tripId: id, name: newName.trim(), category: newCat }, token);
      setItems((prev) => [...prev, item]);
      setNewName("");
      setShowAddForm(false);
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(item: ChecklistItem) {
    const token = await getToken();
    if (!token) return;
    
    // Optimistic UI update
    const previousState = [...items];
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isPacked: !i.isPacked } : i)));

    try {
      const updated = await updateChecklistItem(item.id, { isPacked: !item.isPacked }, token);
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      // Revert on failure
      setItems(previousState);
      alert("Failed to update checklist item");
    }
  }

  async function handleDelete(itemId: string) {
    const token = await getToken();
    if (!token) return;
    await deleteChecklistItem(itemId, token);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  async function handleReset() {
    if (!confirm("Mark all items as unpacked?")) return;
    setResetting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await resetChecklist(id, token);
      setItems((prev) => prev.map((i) => ({ ...i, isPacked: false })));
    } finally {
      setResetting(false);
    }
  }

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const packed = items.filter((i) => i.isPacked).length;
  const progress = items.length > 0 ? Math.round((packed / items.length) * 100) : 0;

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  if (loading) return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Skeleton height={40} borderRadius={20} />
      <Skeleton height={20} width={200} />
      <Skeleton height={12} borderRadius={6} />
      {[1, 2, 3].map((i) => <Skeleton key={i} height={60} borderRadius={8} className="mt-4" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {/* Controls Row */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search bar ......"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[var(--border)] rounded-[var(--radius-full)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          />
        </div>
        <button className="px-4 py-2 border border-[var(--border)] rounded-[var(--radius-full)] text-sm font-medium hover:bg-[var(--bg-muted)] transition-colors bg-white">
          Group by
        </button>
        <button className="px-4 py-2 border border-[var(--border)] rounded-[var(--radius-full)] text-sm font-medium hover:bg-[var(--bg-muted)] transition-colors bg-white">
          Filter
        </button>
        <button className="px-4 py-2 border border-[var(--border)] rounded-[var(--radius-full)] text-sm font-medium hover:bg-[var(--bg-muted)] transition-colors bg-white">
          Sort by...
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3 text-[var(--text-primary)] tracking-tight">Packing checklist</h2>
        <div className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-[var(--radius-md)] text-sm mb-6 bg-white shadow-sm">
          <span className="font-medium text-[var(--text-secondary)]">Trip: <span className="text-[var(--text-primary)]">{trip?.name || "Loading..."}</span></span>
          <ChevronDown size={14} className="text-[var(--text-muted)] ml-2" />
        </div>

        <div className="mb-2">
          <div className="text-sm font-medium mb-2 text-[var(--text-primary)]">Progress: {packed}/{items.length} items packed</div>
          <div className="h-3.5 w-full bg-gray-200 border border-gray-300 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-slate-800 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* List by category */}
      <div className="space-y-8">
        {Object.entries(groupedItems).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catItems]) => (
          <div key={cat} className="space-y-4">
            {/* Category Header */}
            <div className="flex justify-between items-center px-4 py-2.5 border-2 border-slate-700 rounded-full bg-white text-slate-800 shadow-sm">
              <span className="font-semibold capitalize text-sm tracking-wide">{cat}</span>
              <span className="text-sm font-medium">{catItems.filter(i => i.isPacked).length}/{catItems.length}</span>
            </div>

            {/* Items */}
            <div className="space-y-3 px-3">
              {catItems.map(item => (
                <label key={item.id} className="flex items-center gap-3.5 cursor-pointer group w-fit">
                  <div 
                    onClick={(e) => { e.preventDefault(); handleToggle(item); }} 
                    className={`relative flex items-center justify-center w-5 h-5 border-2 rounded-md transition-colors ${item.isPacked ? 'border-slate-800' : 'border-gray-400 group-hover:border-slate-600'}`}
                  >
                    {item.isPacked && (
                      <>
                        <div className="absolute inset-0 bg-slate-800 rounded-[4px]" />
                        <Check size={14} strokeWidth={3} className="text-white z-10" />
                      </>
                    )}
                  </div>
                  <span className={`text-[15px] select-none transition-colors ${item.isPacked ? 'line-through text-gray-400' : 'text-slate-700 font-medium'}`}>
                    {item.name}
                  </span>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(item.id); }} 
                    className="ml-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </label>
              ))}
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && items.length > 0 && (
          <div className="text-center py-10 text-[var(--text-muted)] text-sm">
            No items match your search.
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-[var(--border)]">
        {showAddForm ? (
          <form onSubmit={handleAdd} className="flex-1 flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-[var(--radius-lg)] border border-[var(--border)] shadow-sm">
            <input
              type="text"
              autoFocus
              placeholder="e.g. Passport"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 px-3 py-2 border border-[var(--border)] rounded-[var(--radius-md)] text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30"
            />
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value as ChecklistItem["category"])}
              className="px-3 py-2 border border-[var(--border)] rounded-[var(--radius-md)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/30"
            >
              {(["documents", "clothing", "electronics", "toiletries", "other"] as const).map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <Button type="submit" loading={adding} className="bg-slate-800 hover:bg-slate-700 text-white border-none shrink-0">Add Item</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)} className="shrink-0">Cancel</Button>
          </form>
        ) : (
          <button 
            onClick={() => setShowAddForm(true)} 
            className="flex-1 px-4 py-3 border border-slate-300 rounded-[var(--radius-md)] text-sm font-semibold hover:bg-slate-50 transition-colors text-center text-slate-700 shadow-sm"
          >
            + add item to checklist
          </button>
        )}
        
        <button 
          onClick={handleReset} 
          disabled={resetting || items.length === 0}
          className="px-8 py-3 border border-slate-300 rounded-[var(--radius-md)] text-sm font-semibold hover:bg-slate-50 transition-colors text-slate-700 shadow-sm disabled:opacity-50"
        >
          {resetting ? "Resetting..." : "Reset all"}
        </button>
        <button className="px-8 py-3 border border-slate-300 rounded-[var(--radius-md)] text-sm font-semibold hover:bg-slate-50 transition-colors text-slate-700 shadow-sm">
          Share Checklist
        </button>
      </div>
    </div>
  );
}
