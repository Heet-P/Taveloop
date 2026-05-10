import Navbar from "@/components/layout/Navbar";
import UserSync from "@/components/layout/UserSync";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <UserSync />
      <Navbar />
      {children}
    </div>
  );
}
