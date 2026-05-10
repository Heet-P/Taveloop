"use client";

import { useState, useEffect } from "react";
import { useTripContext } from "@/contexts/TripContext";
import { getBudget } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import type { BudgetSummary } from "@/lib/types";
import Skeleton from "react-loading-skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Download, FileText, CheckCircle, PieChart, Plus, X } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";

export default function InvoicePage() {
  const { trip, loading: tripLoading } = useTripContext();
  const { getToken } = useAuth();
  
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Invoice state
  const [isPaid, setIsPaid] = useState(false);
  const [travelers, setTravelers] = useState<string[]>(["Me"]);
  const [newTraveler, setNewTraveler] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  
  const [invoiceId, setInvoiceId] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  // Load from localStorage
  useEffect(() => {
    if (trip?.id && !isInitialized) {
      const saved = localStorage.getItem(`invoice_state_${trip.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.isPaid !== undefined) setIsPaid(parsed.isPaid);
          if (parsed.travelers) setTravelers(parsed.travelers);
          if (parsed.discount !== undefined) setDiscount(parsed.discount);
          if (parsed.invoiceId) {
            setInvoiceId(parsed.invoiceId);
          } else {
            setInvoiceId(`INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
          }
        } catch (e) {
          setInvoiceId(`INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
        }
      } else {
        setInvoiceId(`INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
      }
      setIsInitialized(true);
    }
  }, [trip?.id, isInitialized]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (trip?.id && isInitialized && invoiceId) {
      localStorage.setItem(`invoice_state_${trip.id}`, JSON.stringify({
        isPaid, travelers, discount, invoiceId
      }));
    }
  }, [trip?.id, isPaid, travelers, discount, invoiceId, isInitialized]);

  useEffect(() => {
    if (trip?.id) {
      setLoading(true);
      getToken().then((token) => {
        if (!token) return;
        getBudget(trip.id, token).then(setBudget).finally(() => setLoading(false));
      });
    }
  }, [trip, getToken]);

  const handleAddTraveler = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTraveler.trim() && !travelers.includes(newTraveler.trim())) {
      setTravelers([...travelers, newTraveler.trim()]);
      setNewTraveler("");
    }
  };

  const handleRemoveTraveler = (t: string) => {
    setTravelers(travelers.filter(x => x !== t));
  };

  const handlePrint = () => {
    window.print();
  };

  if (tripLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton height={200} borderRadius={16} />
        <Skeleton height={400} borderRadius={16} />
      </div>
    );
  }

  // Calculations
  const subtotal = budget?.grandTotal ?? 0;
  const taxAmount = subtotal * 0.05; // 5% tax
  const grandTotal = subtotal + taxAmount - discount;
  const splitAmount = travelers.length > 0 ? grandTotal / travelers.length : grandTotal;

  // Mock budget limit for the "Insights"
  const mockTotalBudget = Math.max(subtotal, 5000); 
  const remainingBudget = mockTotalBudget - grandTotal;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 print:p-0 print:m-0 print:w-full print:max-w-none">
      
      {/* Hide on print */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}} />

      <div id="printable-invoice" className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] overflow-hidden">
        
        {/* Top Section */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-[1fr_1fr_300px] gap-8 items-start border-b border-[var(--border)]">
          
          {/* Left: Trip Info */}
          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 bg-[var(--bg-muted)] rounded-[var(--radius-md)] overflow-hidden shrink-0 border border-[var(--border)]">
              {trip?.coverPhoto ? (
                <img src={trip.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)] text-xl font-bold">
                  {trip?.name[0]}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>
                {trip?.name}
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {trip?.startDate ? formatDate(trip.startDate) : ""} - {trip?.endDate ? formatDate(trip.endDate) : ""}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                {trip?.stops?.length} {(trip?.stops?.length === 1) ? "city" : "cities"}
              </p>
            </div>
          </div>

          {/* Middle: Invoice Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Invoice Id</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{invoiceId}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Generated Date</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{today}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Payment Status:</p>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {isPaid ? "PAID" : "PENDING"}
              </span>
            </div>

            <div className="pt-2">
              <p className="text-xs text-[var(--text-muted)] uppercase font-semibold mb-2">Traveler Details ({travelers.length})</p>
              <div className="flex flex-wrap gap-2">
                {travelers.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 bg-[var(--bg-muted)] border border-[var(--border)] px-2 py-1 rounded text-xs text-[var(--text-secondary)]">
                    {t}
                    <button onClick={() => handleRemoveTraveler(t)} className="text-[var(--text-muted)] hover:text-red-500 no-print"><X size={12}/></button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddTraveler} className="flex gap-2 mt-2 no-print">
                <input 
                  type="text" 
                  value={newTraveler} 
                  onChange={e => setNewTraveler(e.target.value)} 
                  placeholder="Add traveler name..." 
                  className="text-xs border border-[var(--border)] rounded px-2 py-1 bg-[var(--bg-base)] focus:outline-none focus:border-[var(--primary)] flex-1"
                />
                <button type="submit" className="bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-secondary)] px-2 rounded transition-colors">
                  <Plus size={14}/>
                </button>
              </form>
              {travelers.length > 0 && (
                <p className="text-xs font-medium text-[var(--primary)] mt-2">
                  Cost per person: {formatCurrency(splitAmount)}
                </p>
              )}
            </div>
          </div>

          {/* Right: Budget Insights */}
          <div className="bg-[var(--bg-base)] p-4 rounded-[var(--radius-lg)] border border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5 mb-3">
              <PieChart size={16} className="text-[var(--primary)]" />
              Budget Insights
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Total Budget:</span>
                <span className="font-medium text-[var(--text-primary)]">{formatCurrency(mockTotalBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Total Spent:</span>
                <span className="font-medium text-[var(--text-primary)]">{formatCurrency(grandTotal)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Remaining:</span>
                <span className={`font-semibold ${remainingBudget < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {formatCurrency(remainingBudget)}
                </span>
              </div>
            </div>
            <Link href={`/trips/${trip?.id}/budget`} className="no-print mt-4 block">
              <Button variant="secondary" size="sm" className="w-full">
                View Full Budget
              </Button>
            </Link>
          </div>

        </div>

        {/* Table Section */}
        <div className="p-6 md:p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-[var(--border)] text-[var(--text-muted)]">
                  <th className="pb-3 font-semibold w-10">#</th>
                  <th className="pb-3 font-semibold w-1/5">Category</th>
                  <th className="pb-3 font-semibold w-1/3">Description</th>
                  <th className="pb-3 font-semibold">Qty/Details</th>
                  <th className="pb-3 font-semibold text-right">Unit Cost</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {budget?.items.map((item, i) => (
                  <tr key={item.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-muted)]/50 transition-colors">
                    <td className="py-4 text-[var(--text-muted)]">{i + 1}</td>
                    <td className="py-4">
                      <span className="capitalize px-2 py-1 bg-[var(--bg-muted)] rounded text-xs font-medium text-[var(--text-secondary)]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 text-[var(--text-primary)] font-medium">
                      {item.description}
                    </td>
                    <td className="py-4 text-[var(--text-secondary)]">
                      {item.quantity}
                    </td>
                    <td className="py-4 text-right text-[var(--text-secondary)]">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="py-4 text-right font-semibold text-[var(--text-primary)]">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
                {(!budget?.items || budget.items.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                      No budget items found. Add items to the budget to generate an invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mt-8 border-t-2 border-[var(--border)] pt-6">
            <div className="w-full md:w-64 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)] font-medium">Subtotal</span>
                <span className="text-[var(--text-primary)]">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)] font-medium">Tax (5%)</span>
                <span className="text-[var(--text-primary)]">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm items-center no-print">
                <span className="text-[var(--text-muted)] font-medium">Discount</span>
                <input 
                  type="number" 
                  value={discount || ''} 
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-20 text-right border border-[var(--border)] rounded px-2 py-1 text-xs bg-[var(--bg-base)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
              <div className="flex justify-between text-sm items-center print:flex hidden">
                <span className="text-[var(--text-muted)] font-medium">Discount</span>
                <span className="text-[var(--text-primary)]">{formatCurrency(discount)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-[var(--border)]">
                <span className="font-bold text-[var(--text-primary)]">Grand Total</span>
                <span className="font-bold text-xl text-[var(--text-primary)]">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6 no-print">
        <div className="flex items-center gap-3">
          <Button onClick={handlePrint} variant="secondary" className="gap-2">
            <Download size={16} />
            Download Invoice
          </Button>
          <Button onClick={handlePrint} variant="secondary" className="gap-2">
            <FileText size={16} />
            Export as PDF
          </Button>
        </div>

        <Button 
          onClick={() => setIsPaid(!isPaid)} 
          variant={isPaid ? "secondary" : "primary"} 
          className="gap-2"
        >
          <CheckCircle size={16} className={isPaid ? "text-green-500" : ""} />
          {isPaid ? "Mark as Pending" : "Mark as Paid"}
        </Button>
      </div>
    </div>
  );
}
