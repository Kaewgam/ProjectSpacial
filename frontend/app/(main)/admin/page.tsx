"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Users, UserCheck, UserPlus, Activity,
  Database, GitBranch, TrendingUp, RefreshCw,
  Building2, GraduationCap, FileText, Settings
} from "lucide-react";

// ─── Types ───────────────────────────────────────────
interface Stats {
  total_users: number;
  active_users: number;
  new_7d: number;
  new_30d: number;
  role_counts: { ALUMNI: number; ADMIN: number };
  faculty_stats: { faculty: string; count: number }[];
  department_stats: { department: string; count: number }[];
  generation_stats: { generation: string; count: number }[];
  neo4j: { connected: boolean; nodes: number; relationships: number; companies: number; departments: number };
}

// ─── Stat Card ───────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 flex gap-4 items-start
                    hover:border-gray-300 hover:shadow-md transition-all">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}20` }}
      >
        <Icon size={20} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/admin/stats/");
      setStats(res.data);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-96">
        <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-96 gap-4">
        <p className="text-red-400">{error || "เกิดข้อผิดพลาด"}</p>
        <button onClick={fetchStats} className="text-xs text-gray-500 hover:text-gray-900 transition">
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900
                     bg-white border border-gray-200 shadow-sm hover:bg-gray-50 px-4 py-2 rounded-lg transition"
        >
          <RefreshCw size={14} />
          รีเฟรช
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="ผู้ใช้ทั้งหมด"
          value={stats.total_users}
          accent="#a78bfa"
        />
        <StatCard
          icon={Database}
          label="สถานะ Neo4j"
          value={stats.neo4j.connected ? "🟢 เชื่อมต่อแล้ว" : "🔴 ขัดข้อง"}
          sub="สถานะการเชื่อมต่อฐานข้อมูลกราฟ"
          accent={stats.neo4j.connected ? "#10b981" : "#ef4444"}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link href="/admin/users"
          className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-3 hover:shadow-md hover:border-violet-200 transition group">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition">
            <Users size={18} className="text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">จัดการผู้ใช้</p>
            <p className="text-xs text-gray-400">{stats.total_users} บัญชี</p>
          </div>
        </Link>
        <Link href="/admin/posts"
          className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-3 hover:shadow-md hover:border-violet-200 transition group">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition">
            <FileText size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">จัดการโพสต์</p>
            <p className="text-xs text-gray-400">ข่าวสาร &amp; ประกาศ</p>
          </div>
        </Link>
        <Link href="/admin/neo4j"
          className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-3 hover:shadow-md hover:border-violet-200 transition group">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition">
            <Database size={18} className="text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Neo4j Tools</p>
            <p className="text-xs text-gray-400">{stats.neo4j.connected ? "🟢 เชื่อมต่อ" : "🔴 ขัดข้อง"}</p>
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Top Faculty */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <GitBranch size={16} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-800 tracking-wider">
              คณะ
            </h2>
          </div>
          {stats.faculty_stats.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.faculty_stats.map((f, i) => {
                const maxVal = stats.faculty_stats[0]?.count || 1;
                const pct = Math.round((f.count / maxVal) * 100);
                return (
                  <div key={f.faculty} className="relative flex items-center gap-3 p-2 rounded-lg overflow-hidden group">
                    <div 
                      className="absolute left-0 top-0 h-full bg-blue-100 border-r-2 border-blue-200 transition-all duration-700 ease-out z-0"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="relative z-10 w-5 h-5 rounded-full bg-white border border-blue-100 text-gray-500
                                     flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                      {i + 1}
                    </span>
                    <div className="relative z-10 flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium truncate">{f.faculty}</p>
                    </div>
                    <span className="relative z-10 text-sm font-bold text-blue-600 flex-shrink-0">
                      {f.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Department */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <GraduationCap size={16} className="text-pink-500" />
            <h2 className="text-sm font-semibold text-gray-800 tracking-wider">
              สาขา
            </h2>
          </div>
          {(!stats.department_stats || stats.department_stats.length === 0) ? (
            <p className="text-gray-400 text-sm text-center py-6">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.department_stats.map((d, i) => {
                const maxVal = stats.department_stats[0]?.count || 1;
                const pct = Math.round((d.count / maxVal) * 100);
                return (
                  <div key={d.department} className="relative flex items-center gap-3 p-2 rounded-lg overflow-hidden group">
                    <div 
                      className="absolute left-0 top-0 h-full bg-pink-100 border-r-2 border-pink-200 transition-all duration-700 ease-out z-0"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="relative z-10 w-5 h-5 rounded-full bg-white border border-pink-100 text-gray-500
                                     flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                      {i + 1}
                    </span>
                    <div className="relative z-10 flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium truncate">{d.department}</p>
                    </div>
                    <span className="relative z-10 text-sm font-bold text-pink-600 flex-shrink-0">
                      {d.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Generation Stats */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users size={16} className="text-emerald-500" />
            <h2 className="text-sm font-semibold text-gray-800 tracking-wider">
              รุ่น
            </h2>
          </div>
          {(!stats.generation_stats || stats.generation_stats.length === 0) ? (
            <p className="text-gray-400 text-sm text-center py-6">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.generation_stats.map((g, i) => {
                const maxVal = stats.generation_stats[0]?.count || 1;
                const pct = Math.round((g.count / maxVal) * 100);
                return (
                  <div key={g.generation} className="relative flex items-center gap-3 p-2 rounded-lg overflow-hidden group">
                    <div 
                      className="absolute left-0 top-0 h-full bg-emerald-100 border-r-2 border-emerald-200 transition-all duration-700 ease-out z-0"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="relative z-10 w-5 h-5 rounded-full bg-white border border-emerald-100 text-gray-500
                                     flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                      {i + 1}
                    </span>
                    <div className="relative z-10 flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium truncate">รุ่น {g.generation}</p>
                    </div>
                    <span className="relative z-10 text-sm font-bold text-emerald-600 flex-shrink-0">
                      {g.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
