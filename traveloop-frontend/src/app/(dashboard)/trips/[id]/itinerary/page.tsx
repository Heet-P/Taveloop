"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Search, MapPin, Clock, DollarSign, Calendar } from "lucide-react";
import { useTripContext } from "@/contexts/TripContext";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Skeleton from "react-loading-skeleton";
import {
  addStop, deleteStop, reorderStops, addActivity, deleteActivity,
  searchCities, discoverCityActivities,
} from "@/lib/api";
import type { Stop, City, Activity } from "@/lib/types";

// ─── Formatting Helpers ──────────────────────────────────────────────

const formatDateInput = (dateStr?: string) => {
  if (!dateStr) return "";
  return dateStr.split('T')[0];
};

// ─── Modals ──────────────────────────────────────────────────────────

function AddStopModal({ open, tripId, tripStart, tripEnd, onClose, onAdded }: any) {
  const { getToken } = useAuth();
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<City | null>(null);
  const [startDate, setStartDate] = useState(formatDateInput(tripStart));
  const [endDate, setEndDate] = useState(formatDateInput(tripEnd));
  const [saving, setSaving] = useState(false);

  // Update dates if trip changes
  useEffect(() => {
    if (open) {
      setStartDate(formatDateInput(tripStart));
      setEndDate(formatDateInput(tripEnd));
    }
  }, [open, tripStart, tripEnd]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await searchCities({ search: query }, token);
      setCities(res);
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      await addStop({ tripId, cityId: selected.id, startDate, endDate }, token);
      onAdded();
      onClose();
    } catch (e) {
      alert("Failed to add stop");
    } finally {
      setSaving(false);
    }
  };

  const minDate = formatDateInput(tripStart);
  const maxDate = formatDateInput(tripEnd);

  return (
    <Modal open={open} onClose={onClose} title="Add Stop">
      <div className="space-y-4">
        {!selected ? (
          <>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input id="city-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search city..." className="flex-1" />
              <Button type="submit" loading={searching}>Search</Button>
            </form>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {cities.map((city) => (
                <div key={city.id} onClick={() => setSelected(city)} className="p-3 border border-[var(--border)] rounded-[var(--radius-md)] cursor-pointer hover:border-[var(--primary)] bg-[var(--bg-card)] transition-colors flex items-center gap-3">
                  <MapPin size={18} className="text-[var(--primary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{city.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{city.country}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-[var(--radius-md)]">
              <span className="text-sm font-medium text-[var(--text-primary)]">{selected.name}, {selected.country}</span>
              <button onClick={() => setSelected(null)} className="text-xs text-[var(--primary)] hover:underline">Change</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input id="start" label="Start Date" type="date" value={startDate} min={minDate} max={maxDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input id="end" label="End Date" type="date" value={endDate} min={minDate} max={maxDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={handleSave} loading={saving} className="w-full mt-2">Save Stop</Button>
          </>
        )}
      </div>
    </Modal>
  );
}

function ActivityModal({ open, stop, onClose, onAdded }: any) {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<"discover" | "custom">("discover");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState<"sightseeing" | "food" | "adventure" | "shopping" | "culture">("sightseeing");
  const [customCost, setCustomCost] = useState("");
  const [customDuration, setCustomDuration] = useState("");
  const [savingCustom, setSavingCustom] = useState(false);

  useEffect(() => {
    if (open && stop?.city?.id) {
      setLoading(true);
      getToken().then((token) => {
        if (!token) return;
        discoverCityActivities(stop.city.id, token).then(setActivities).finally(() => setLoading(false));
      });
    }
  }, [open, stop]);

  const handleAdd = async (act: Activity) => {
    setSavingId(act.id);
    try {
      const token = await getToken();
      if (!token) return;
      await addActivity({
        stopId: stop.id,
        name: act.name,
        category: act.category || "sightseeing",
        cost: act.cost || 0,
        durationMinutes: act.durationMinutes || 120,
      }, token);
      onAdded();
    } catch (e) {
      alert("Failed to add activity");
    } finally {
      setSavingId(null);
    }
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    setSavingCustom(true);
    try {
      const token = await getToken();
      if (!token) return;
      await addActivity({
        stopId: stop.id,
        name: customName,
        category: customCategory,
        cost: parseFloat(customCost) || 0,
        durationMinutes: parseInt(customDuration) || 60,
      }, token);
      setCustomName("");
      setCustomCost("");
      setCustomDuration("");
      onAdded();
      onClose();
    } catch (e) {
      alert("Failed to add custom activity");
    } finally {
      setSavingCustom(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Add Activity in ${stop?.city?.name}`}>
      <div className="flex border-b border-[var(--border)] mb-4">
        <button 
          onClick={() => setTab("discover")} 
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "discover" ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          Discover
        </button>
        <button 
          onClick={() => setTab("custom")} 
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "custom" ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          Custom
        </button>
      </div>

      {tab === "discover" ? (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} height={70} borderRadius={12} className="mb-2" />)
          ) : activities.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">No activities found.</p>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="p-3.5 border border-[var(--border)] rounded-[var(--radius-lg)] flex items-center justify-between bg-[var(--bg-card)] hover:border-[var(--primary)] transition-all">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{act.name}</p>
                  <div className="flex gap-3 mt-1.5 text-xs text-[var(--text-muted)]">
                    <span className="capitalize px-2 py-0.5 bg-[var(--bg-muted)] rounded-full">{act.category}</span>
                    <span className="flex items-center gap-1 font-medium text-[var(--text-primary)]">
                      <DollarSign size={12} /> {act.cost || 0}
                    </span>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleAdd(act)} loading={savingId === act.id}>Add</Button>
              </div>
            ))
          )}
        </div>
      ) : (
        <form onSubmit={handleAddCustom} className="space-y-4">
          <Input id="custom-name" label="Activity Name" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Hiking the Trail" required />
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Category</label>
            <select 
              value={customCategory} 
              onChange={(e) => setCustomCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--bg-base)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            >
              <option value="sightseeing">Sightseeing</option>
              <option value="food">Food</option>
              <option value="shopping">Shopping</option>
              <option value="culture">Culture</option>
              <option value="adventure">Adventure</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="custom-cost" label="Estimated Cost ($)" type="number" min="0" value={customCost} onChange={(e) => setCustomCost(e.target.value)} placeholder="0" />
            <Input id="custom-duration" label="Duration (mins)" type="number" min="0" value={customDuration} onChange={(e) => setCustomDuration(e.target.value)} placeholder="60" />
          </div>
          <Button type="submit" loading={savingCustom} className="w-full mt-2">Save Custom Activity</Button>
        </form>
      )}
    </Modal>
  );
}

// ─── Sortable Stop Component (Premium UI) ────────────────────────────

function SortableTimelineStop({
  stop, stopIndex, onDeleteStop, onAddActivity, onDeleteActivity
}: {
  stop: Stop; stopIndex: number; onDeleteStop: (id: string) => void;
  onAddActivity: (stop: Stop) => void; onDeleteActivity: (sId: string, aId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 10 : 1,
  };

  const activities = stop.activities ?? [];

  return (
    <div ref={setNodeRef} style={style} className="relative group/stop mb-8">
      
      {/* Drag Handle (Hovering on the left) */}
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute -left-10 top-4 p-2 cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--primary)] opacity-0 group-hover/stop:opacity-100 transition-opacity touch-none z-10 hidden md:flex"
      >
        <GripVertical size={20} />
      </div>

      <div className="flex gap-4 md:gap-6">
        {/* Timeline Line & Node */}
        <div className="relative flex flex-col items-center">
          <div className="absolute top-0 bottom-0 w-0.5 bg-[var(--border)] -z-10" />
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shadow-lg ring-4 ring-[var(--bg-base)] z-10">
            <span className="font-bold text-xs">{stopIndex + 1}</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 pb-6">
          
          {/* Stop Header */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <MapPin size={20} className="text-[var(--primary)]" />
                  {stop.city?.name}
                </h3>
                <p className="text-sm text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
                  <Calendar size={14} />
                  {stop.startDate ? `${formatDateInput(stop.startDate)} to ${formatDateInput(stop.endDate)}` : "Dates not set"}
                </p>
              </div>
              <button 
                onClick={() => onDeleteStop(stop.id)} 
                className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors opacity-0 group-hover/stop:opacity-100"
                aria-label="Remove Stop"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            {/* Activities List */}
            <div className="mt-5 space-y-3">
              {activities.length === 0 ? (
                <div className="py-6 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-lg)] text-center">
                  <p className="text-sm text-[var(--text-muted)] mb-3">No activities planned yet.</p>
                  <Button size="sm" variant="secondary" onClick={() => onAddActivity(stop)}>
                    <Plus size={14} className="mr-1.5" /> Add Activity
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((act) => (
                    <div 
                      key={act.id} 
                      className="group/act relative bg-[var(--bg-base)] border border-[var(--border)] rounded-[var(--radius-md)] p-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 hover:border-[var(--primary)] transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium text-[var(--text-primary)] truncate">{act.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                          {act.durationMinutes && (
                            <span className="flex items-center gap-1"><Clock size={12} /> {act.durationMinutes}m</span>
                          )}
                          <span className="capitalize px-1.5 py-0.5 bg-[var(--bg-muted)] rounded text-[var(--text-secondary)]">{act.category}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] font-semibold rounded-full text-sm">
                          <DollarSign size={14} /> {act.cost || 0}
                        </div>
                        <button 
                          onClick={() => onDeleteActivity(stop.id, act.id)} 
                          className="text-[var(--text-muted)] hover:text-red-500 p-1 opacity-0 group-hover/act:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-2">
                    <button 
                      onClick={() => onAddActivity(stop)}
                      className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] flex items-center gap-1 transition-colors"
                    >
                      <Plus size={14} /> Browse & Add Activity
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────

export default function ItineraryPage() {
  const { getToken } = useAuth();
  const { trip, loading: tripLoading, refetch } = useTripContext();
  
  const [stops, setStops] = useState<Stop[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [activeStopForActivity, setActiveStopForActivity] = useState<Stop | null>(null);

  useEffect(() => {
    if (trip) {
      setStops([...(trip.stops ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    }
  }, [trip]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stops.findIndex((s) => s.id === active.id);
      const newIndex = stops.findIndex((s) => s.id === over.id);
      const newStops = arrayMove(stops, oldIndex, newIndex);
      setStops(newStops);

      const token = await getToken();
      if (token) {
        await reorderStops({
          tripId: trip!.id,
          order: newStops.map((s, i) => ({ stopId: s.id, newOrder: i })),
        }, token);
        refetch();
      }
    }
  }

  async function handleDeleteStop(id: string) {
    if (!confirm("Remove this stop completely?")) return;
    const token = await getToken();
    if (token) {
      await deleteStop(id, token);
      refetch();
    }
  }

  async function handleDeleteActivity(stopId: string, actId: string) {
    if (!confirm("Remove this activity?")) return;
    const token = await getToken();
    if (token) {
      await deleteActivity(actId, token);
      refetch();
    }
  }

  if (tripLoading) return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Skeleton height={40} borderRadius={20} />
      <Skeleton height={30} width={300} className="mx-auto" />
      {[1, 2].map((i) => <Skeleton key={i} height={150} borderRadius={16} />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 md:px-8">
      
      {/* Controls Row */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search activities or stops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-[var(--border)] rounded-[var(--radius-full)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 bg-[var(--bg-base)] text-[var(--text-primary)] transition-all"
          />
        </div>
      </div>

      <div className="mb-10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>
          Itinerary for {trip?.name}
        </h2>
      </div>

      {/* Main Timeline Grid */}
      <div className="mt-6 ml-4 md:ml-10">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stops.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div>
              {stops.map((stop, index) => (
                <SortableTimelineStop
                  key={stop.id}
                  stop={stop}
                  stopIndex={index}
                  onDeleteStop={handleDeleteStop}
                  onAddActivity={setActiveStopForActivity}
                  onDeleteActivity={handleDeleteActivity}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
        {/* End of Timeline Action */}
        <div className="flex gap-4 md:gap-6 mt-4">
          <div className="relative flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-muted)] border-2 border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] z-10">
              <Plus size={16} />
            </div>
          </div>
          <div className="flex-1 pt-0.5">
            <Button onClick={() => setStopModalOpen(true)} className="shadow-md hover:shadow-lg transition-all rounded-full px-6">
              Add New Destination
            </Button>
          </div>
        </div>
      </div>

      <AddStopModal
        open={stopModalOpen}
        onClose={() => setStopModalOpen(false)}
        tripId={trip?.id}
        tripStart={trip?.startDate}
        tripEnd={trip?.endDate}
        onAdded={refetch}
      />
      
      <ActivityModal
        open={!!activeStopForActivity}
        stop={activeStopForActivity}
        onClose={() => setActiveStopForActivity(null)}
        onAdded={refetch}
      />
    </div>
  );
}
