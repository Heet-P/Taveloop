"use client";

import { use, useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, Trash2, Edit2, Search, ChevronDown } from "lucide-react";
import { useTripContext } from "@/contexts/TripContext";
import { getNotes, createNote, updateNote, deleteNote } from "@/lib/api";
import type { Note } from "@/lib/types";
import Skeleton from "react-loading-skeleton";
import Button from "@/components/ui/Button";

type Tab = "All" | "by Day" | "by stop";

export default function NotesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const { trip } = useTripContext();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  async function load() {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await getNotes(id, token);
      setNotes(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleCreate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      const note = await createNote({ tripId: id, content: draft.trim() }, token);
      setNotes((prev) => [note, ...prev]);
      setDraft("");
      setShowAddForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(noteId: string) {
    if (!editDraft.trim()) return;
    const token = await getToken();
    if (!token) return;
    const updated = await updateNote(noteId, editDraft.trim(), token);
    setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
    setEditingId(null);
  }

  async function handleDelete(noteId: string) {
    if (!confirm("Delete this note?")) return;
    const token = await getToken();
    if (!token) return;
    await deleteNote(noteId, token);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  const getDayNumber = (dateString: string) => {
    if (!trip?.startDate) return "";
    const start = new Date(trip.startDate).getTime();
    const current = new Date(dateString).getTime();
    const diff = Math.ceil((current - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `Day ${diff}: ` : "";
  };

  const filteredNotes = notes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Skeleton height={40} borderRadius={20} />
      <Skeleton height={30} width={250} className="mb-4" />
      {[1, 2, 3].map((i) => <Skeleton key={i} height={120} borderRadius={16} />)}
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
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-[var(--radius-full)] text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30 shadow-sm"
          />
        </div>
        <button className="px-5 py-2 border border-slate-300 rounded-[var(--radius-full)] text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm bg-white">
          Group by
        </button>
        <button className="px-5 py-2 border border-slate-300 rounded-[var(--radius-full)] text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm bg-white">
          Filter
        </button>
        <button className="px-5 py-2 border border-slate-300 rounded-[var(--radius-full)] text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm bg-white">
          Sort by...
        </button>
      </div>

      <div className="space-y-5">
        <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Trip notes</h2>
        
        {/* Selectors and Add Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white shadow-sm">
            <span className="font-medium text-slate-600">Trip: <span className="text-slate-800">{trip?.name || "Loading..."}</span></span>
            <ChevronDown size={14} className="text-slate-400 ml-3" />
          </div>

          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors bg-white shadow-sm text-slate-700"
          >
            <Plus size={15} /> Add Note
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["All", "by Day", "by stop"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-6 py-2 rounded-lg text-sm font-medium border-2 transition-colors shadow-sm ${
                activeTab === t
                  ? "bg-gray-100 border-gray-300 text-slate-800"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-white p-4 border-2 border-slate-800 rounded-xl shadow-sm space-y-3">
          <textarea
            autoFocus
            placeholder="Write a note... The first line will be used as the header."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500/30 resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button type="submit" loading={saving} className="bg-slate-800 hover:bg-slate-700 text-white">Save Note</Button>
          </div>
        </form>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 && !showAddForm ? (
          <div className="text-center py-10 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl">
            No notes found. Create one to get started!
          </div>
        ) : (
          filteredNotes.map((note) => {
            const lines = note.content.split("\n");
            const header = lines[0];
            const body = lines.slice(1).join("\n");
            const dateStr = new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const dayStr = getDayNumber(note.updatedAt);

            return (
              <div key={note.id} className="bg-white border-2 border-slate-800 rounded-xl p-5 shadow-sm group">
                {editingId === note.id ? (
                  <div className="space-y-3">
                    <textarea
                      autoFocus
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                      <Button size="sm" onClick={() => handleSaveEdit(note.id)} className="bg-slate-800 text-white hover:bg-slate-700">Save</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-slate-800">{header}</h3>
                      <div className="flex gap-2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingId(note.id); setEditDraft(note.content); }} className="hover:text-slate-600 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(note.id)} className="hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {body && (
                      <p className="text-[15px] text-slate-600 whitespace-pre-wrap leading-relaxed mb-4">
                        {body}
                      </p>
                    )}
                    <div className="text-xs font-medium text-slate-500 mt-3 pt-3 border-t border-slate-100">
                      {dayStr}{dateStr}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
