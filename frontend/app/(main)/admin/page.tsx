"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Users, UserCheck, UserPlus, Activity,
  Database, GitBranch, TrendingUp, RefreshCw
} from "lucide-react";

// ─── Types ───────────────────────────────────────────
interface Stats {
  total_users: number;
  active_users: number;
  new_7d: number;
  new_30d: number;
  role_counts: { ALUMNI: number; STUDENT: number; ADMIN: number };
  faculty_stats: { faculty: string; count: number }[];
  neo4j: { connected: boolean; nodes: number; relationships: number };
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
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex gap-4 items-start
                    hover:border-slate-700 transition-colors">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}20` }}
      >
        <Icon size={20} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Role Badge ──────────────────────────────────────
function RolePill({ role, count, total }: { role: string; count: number; total: number }) {
  const colors: Record<string, string> = {
    ALUMNI: "#a78bfa",
    STUDENT: "#60a5fa",
    ADMIN: "#f87171",
  };
  const color = colors[role] ?? "#94a3b8";
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium" style={{ color }}>{role}</span>
        <span className="text-slate-400">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
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
        <button onClick={fetchStats} className="text-xs text-slate-400 hover:text-white transition">
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
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">ภาพรวมระบบ Alumni Network</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white
                     bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition"
        >
          <RefreshCw size={14} />
          รีเฟรช
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="ผู้ใช้ทั้งหมด"
          value={stats.total_users}
          accent="#a78bfa"
        />
        <StatCard
          icon={UserCheck}
          label="บัญชีที่ใช้งานอยู่"
          value={stats.active_users}
          sub={`${stats.total_users > 0 ? Math.round((stats.active_users / stats.total_users) * 100) : 0}% ของทั้งหมด`}
          accent="#34d399"
        />
        <StatCard
          icon={UserPlus}
          label="สมาชิกใหม่ (7 วัน)"
          value={stats.new_7d}
          sub={`30 วัน: ${stats.new_30d} คน`}
          accent="#60a5fa"
        />
        <StatCard
          icon={Activity}
          label="Neo4j Nodes"
          value={stats.neo4j.nodes}
          sub={`${stats.neo4j.relationships} relationships`}
          accent="#f59e0b"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Role Distribution */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              สัดส่วน Role
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            <RolePill role="ALUMNI" count={stats.role_counts.ALUMNI} total={stats.total_users} />
            <RolePill role="STUDENT" count={stats.role_counts.STUDENT} total={stats.total_users} />
            <RolePill role="ADMIN" count={stats.role_counts.ADMIN} total={stats.total_users} />
          </div>
        </div>

        {/* Top Faculty */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <GitBranch size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Top Faculty
            </h2>
          </div>
          {stats.faculty_stats.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-6">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.faculty_stats.map((f, i) => (
                <div key={f.faculty} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-500
                                   flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{f.faculty}</p>
                  </div>
                  <span className="text-sm font-semibold text-violet-400 flex-shrink-0">
                    {f.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Neo4j Status */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Database size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Neo4j Status
            </h2>
          </div>
          <div className="flex items-center gap-2 mb-5">
            <div className={`w-2.5 h-2.5 rounded-full ${stats.neo4j.connected ? "bg-green-400" : "bg-red-400"}`} />
            <span className={`text-sm font-medium ${stats.neo4j.connected ? "text-green-400" : "text-red-400"}`}>
              {stats.neo4j.connected ? "เชื่อมต่อแล้ว" : "เชื่อมต่อไม่ได้"}
            </span>
          </div>
          {stats.neo4j.connected && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-white">{stats.neo4j.nodes}</p>
                <p className="text-xs text-slate-400 mt-0.5">Nodes</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-white">{stats.neo4j.relationships}</p>
                <p className="text-xs text-slate-400 mt-0.5">Relationships</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
