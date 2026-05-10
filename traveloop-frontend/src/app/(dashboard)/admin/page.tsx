"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { Users, Map, Activity, TrendingUp, Search } from "lucide-react";
import { getAdminStats, getAdminUsers, getTopCities, getTripsPerDay, getActivityCategories } from "@/lib/api";
import type { AdminStats } from "@/lib/api";
import PageWrapper from "@/components/layout/PageWrapper";
import Skeleton from "react-loading-skeleton";

const PIE_COLORS = ["#14B8A6", "#0EA5E9", "#F59E0B", "#F43F5E", "#8B5CF6", "#10B981"];

type Tab = "Manage Users" | "Popular cities" | "Popular Activites" | "User Trends and Analytics";

export default function AdminPage() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<object[]>([]);
  const [topCities, setTopCities] = useState<{ name: string; country: string; stop_count: number }[]>([]);
  const [tripsPerDay, setTripsPerDay] = useState<{ date: string; count: number }[]>([]);
  const [activityCategories, setActivityCategories] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("User Trends and Analytics");

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const [s, u, c, t, a] = await Promise.all([
          getAdminStats(token),
          getAdminUsers({}, token),
          getTopCities(token),
          getTripsPerDay(token),
          getActivityCategories(token),
        ]);
        setStats(s);
        setUsers(u);
        setTopCities(c);
        setTripsPerDay(t);
        setActivityCategories(a);
      } catch (err: any) {
        setError(err.message || "Access denied.");
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600 bg-blue-50" },
        { label: "Total Trips", value: stats.totalTrips, icon: Map, color: "text-[var(--primary)] bg-[var(--primary-light)]" },
        { label: "Active This Week", value: stats.activeThisWeek, icon: Activity, color: "text-green-600 bg-green-50" },
        { label: "Top City", value: stats.topCity?.name ?? "—", icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
      ]
    : [];

  if (loading) return (
    <PageWrapper title="Admin Panel" subtitle="System insights and management">
      <div className="flex gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} width={120} height={40} borderRadius={20} />)}
      </div>
      <Skeleton height={500} borderRadius={24} />
    </PageWrapper>
  );

  if (error) return (
    <PageWrapper title="Admin Panel" subtitle="System insights and management">
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-100 text-red-600 rounded-3xl p-8 text-center">
        <Activity size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p>{error}</p>
      </div>
    </PageWrapper>
  );

  return (
    <PageWrapper title="Admin Panel" subtitle="Screen 12">
      <div className="space-y-6 max-w-5xl">
        
        {/* Controls Row */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search bar ......"
              className="w-full pl-9 pr-4 py-2 border border-[var(--border)] rounded-[var(--radius-full)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            />
          </div>
          <button className="px-4 py-2 border border-[var(--border)] rounded-[var(--radius-full)] text-sm font-medium hover:bg-[var(--bg-muted)] transition-colors">
            Group by
          </button>
          <button className="px-4 py-2 border border-[var(--border)] rounded-[var(--radius-full)] text-sm font-medium hover:bg-[var(--bg-muted)] transition-colors">
            Filter
          </button>
          <button className="px-4 py-2 border border-[var(--border)] rounded-[var(--radius-full)] text-sm font-medium hover:bg-[var(--bg-muted)] transition-colors">
            Sort by...
          </button>
        </div>

        {/* Tabs Row */}
        <div className="flex flex-wrap gap-3">
          {(["Manage Users", "Popular cities", "Popular Activites", "User Trends and Analytics"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-[var(--radius-full)] text-sm font-medium border transition-colors ${
                activeTab === tab
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-[var(--border)] p-6 lg:p-10">
          
          {activeTab === "User Trends and Analytics" && (
            <div className="space-y-8">
              
              {/* Top Row: Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {statCards.map((stat, i) => (
                  <div key={i} className="p-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-base)] flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.color} shrink-0`}>
                        <stat.icon size={20} />
                      </div>
                      <span className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</span>
                    </div>
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Middle Row: Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Pie Chart */}
                <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-base)]">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Activity Breakdown</h3>
                  <div className="h-[250px] flex justify-center items-center min-w-0 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activityCategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="category"
                        >
                          {activityCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Line Chart */}
                <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-base)]">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Trips Created (Last 7 Days)</h3>
                  <div className="h-[250px] w-full min-w-0 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={tripsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
                          tickFormatter={(d) => {
                            try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
                            catch { return d; }
                          }} 
                          axisLine={false} 
                          tickLine={false} 
                          dy={10}
                        />
                        <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#14B8A6" 
                          strokeWidth={4} 
                          dot={{ r: 4, fill: "#14B8A6", stroke: "#fff", strokeWidth: 2 }} 
                          activeDot={{ r: 7 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Bottom Row: Top Cities */}
              <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-base)]">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Top Destinations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Bar Chart (Left) */}
                  <div className="h-[250px] min-w-0 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topCities.slice(0, 5)} barSize={40} margin={{ left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: 'var(--bg-muted)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="stop_count" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Cities List (Right) */}
                  <div className="space-y-5">
                    {topCities.slice(0, 5).map((city, i) => (
                      <div key={city.name} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-[var(--text-primary)]">{city.name}</span>
                          <span className="text-[var(--text-secondary)] font-medium">{city.stop_count} stops</span>
                        </div>
                        <div className="h-2 bg-[var(--bg-muted)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0EA5E9] rounded-full transition-all duration-500"
                            style={{ width: `${(city.stop_count / (topCities[0]?.stop_count || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {topCities.length === 0 && (
                      <p className="text-center text-[var(--text-muted)] text-sm py-8">No destinations tracked yet.</p>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

          {activeTab === "Manage Users" && (
            <div className="bg-white border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Manage Users ({users.length})</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-base)]">
                    <tr className="text-left">
                      {["Name", "Email", "Role", "Trips", "Joined"].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs font-medium text-[var(--text-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {(users as Record<string, unknown>[]).map((u, i) => (
                      <tr key={i} className="hover:bg-[var(--bg-muted)] transition-colors">
                        <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{u.name as string}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{u.email as string}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>
                            {u.role as string}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{u.trip_count as number}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{new Date(u.created_at as string).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(activeTab === "Popular cities" || activeTab === "Popular Activites") && (
            <div className="flex items-center justify-center h-40 text-[var(--text-muted)]">
              Data for {activeTab} will appear here.
            </div>
          )}

        </div>
      </div>
    </PageWrapper>
  );
}
