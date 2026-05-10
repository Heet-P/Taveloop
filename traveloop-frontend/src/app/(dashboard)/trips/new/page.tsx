"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Upload, X } from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { createTrip, uploadFile } from "@/lib/api";

const POPULAR_COMBOS = [
  { id: 1, label: "Tokyo → Kyoto → Osaka", emoji: "🇯🇵", desc: "Classic Japan circuit" },
  { id: 2, label: "Paris → Lisbon → Barcelona", emoji: "🇪🇺", desc: "European trail" },
  { id: 3, label: "Bali → Bangkok → Singapore", emoji: "🌴", desc: "Southeast Asia loop" },
  { id: 4, label: "New York → Mexico City", emoji: "🌎", desc: "Americas adventure" },
];

interface FormErrors {
  name?: string;
  startDate?: string;
  endDate?: string;
}

export default function NewTripPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [form, setForm] = useState({ name: "", description: "", startDate: "", endDate: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Trip name is required";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.endDate) e.endDate = "End date is required";
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      e.endDate = "End date must be after start date";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setApiError("Image must be under 5 MB");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setApiError("");
  }

  function clearCover() {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      let coverPhoto: string | undefined;
      if (coverFile) {
        coverPhoto = await uploadFile(coverFile, token);
      }

      const trip = await createTrip(
        { name: form.name, description: form.description || undefined, startDate: form.startDate, endDate: form.endDate, coverPhoto },
        token
      );
      router.push(`/trips/${trip.id}/itinerary`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to create trip");
    } finally {
      setLoading(false);
    }
  }

  function applyCombo(label: string) {
    setForm((prev) => ({ ...prev, name: label }));
    setErrors((prev) => ({ ...prev, name: undefined }));
  }

  return (
    <PageWrapper title="Plan New Trip" subtitle="Give your adventure a name and set the dates">
      <div className="max-w-[560px] mx-auto">
        <Card className="p-6 sm:p-8">
          {apiError && (
            <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-sm text-red-600">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Input
              id="trip-name"
              label="Trip Name"
              placeholder="e.g. Summer in Southeast Asia"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              error={errors.name}
              aria-required="true"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="start-date"
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                error={errors.startDate}
                aria-required="true"
              />
              <Input
                id="end-date"
                label="End Date"
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                error={errors.endDate}
                aria-required="true"
              />
            </div>

            <Textarea
              id="description"
              label="Description (optional)"
              placeholder="What's this trip about?"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />

            {/* Cover photo */}
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                Cover Photo <span className="text-[var(--text-muted)] font-normal">(optional)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                aria-label="Upload cover photo"
              />

              {coverPreview ? (
                <div className="relative rounded-[var(--radius-md)] overflow-hidden h-40 group">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <button
                    type="button"
                    onClick={clearCover}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
                    aria-label="Remove cover photo"
                  >
                    <X size={14} className="text-[var(--text-primary)]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 text-xs px-2.5 py-1 bg-white/90 rounded-full shadow hover:bg-white transition-colors text-[var(--text-secondary)]"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`border-2 border-dashed rounded-[var(--radius-md)] p-6 text-center cursor-pointer transition-colors ${
                    dragging
                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                      : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5"
                  }`}
                >
                  <Upload size={24} className={`mx-auto mb-2 transition-colors ${dragging ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`} />
                  <p className="text-sm text-[var(--text-muted)]">
                    {dragging ? "Drop to upload" : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">PNG, JPG, WEBP up to 5 MB</p>
                </div>
              )}
            </div>

            <Button type="submit" loading={loading} className="w-full gap-2" size="lg">
              Start Planning <ArrowRight size={18} />
            </Button>
          </form>
        </Card>

        {/* Popular combinations */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Popular combinations — quick start</h3>
          <div className="grid grid-cols-2 gap-3">
            {POPULAR_COMBOS.map((combo) => (
              <button
                key={combo.id}
                onClick={() => applyCombo(combo.label)}
                className="text-left p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-md)] hover:border-[var(--primary)] hover:shadow-[var(--shadow-card)] transition-all active:scale-[0.98]"
              >
                <span className="text-xl">{combo.emoji}</span>
                <p className="text-sm font-medium text-[var(--text-primary)] mt-1 leading-snug">{combo.label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{combo.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
