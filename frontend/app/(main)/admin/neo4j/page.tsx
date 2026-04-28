"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Database, RefreshCw, Trash2, Zap,
  CheckCircle, X, AlertTriangle, Activity
} from "lucide-react";

// ─── Types ───────────────────────────────────────────
interface Neo4jStatus {
  connected: boolean;
  node_counts: Record<string, number>;
  rel_counts: Record<string, number>;
  error?: string;
}

interface ActionResult {
  message: string;
  deleted?: string[];
  synced?: number;
  failed?: number;
  errors?: string[];
}

// ─── Status Badge ─────────────────────────────────────
const NODE_COLORS: Record<string, string> = {
  User: "#a78bfa",
  Faculty: "#34d399",
  Department: "#60a5fa",
  Company: "#f59e0b",
};

const REL_COLORS: Record<string, string> = {
  KNOWS: "#a78bfa",
  STUDIED_IN: "#34d399",
  BELONGS_TO: "#60a5fa",
  WORKS_AS: "#f59e0b",
};

// ─── Tool Card ────────────────────────────────────────
function ToolCard({
  icon: Icon,
  title,
  description,
  buttonLabel,
  buttonColor,
  loading,
  onClick,
  result,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonLabel: string;
  buttonColor: string;
  loading: boolean;
  onClick: () => void;
  result: ActionResult | null;
}) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
          <Icon size={18} className="text-slate-300" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>

      <button
        onClick={onClick}
        disabled={loading}
        className={`w-full py-2.5 text-sm font-medium rounded-xl transition flex items-center justify-center gap-2
          ${loading ? "opacity-60 cursor-not-allowed" : ""}
          ${buttonColor}`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Zap size={14} />
        )}
        {loading ? "กำลังดำเนินการ..." : buttonLabel}
      </button>

      {/* Result */}
      {result && (
        <div className={`mt-4 rounded-xl p-4 text-xs
          ${result.failed && result.failed > 0
            ? "bg-amber-500/10 border border-amber-500/20"
            : "bg-green-500/10 border border-green-500/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.failed && result.failed > 0
              ? <AlertTriangle size={13} className="text-amber-400" />
              : <CheckCircle size={13} className="text-green-400" />
            }
            <span className={`font-medium ${result.failed && result.failed > 0 ? "text-amber-300" : "text-green-300"}`}>
              {result.message}
            </span>
          </div>

          {result.deleted && result.deleted.length > 0 && (
            <div className="mt-2 space-y-1">
              {result.deleted.map((id) => (
                <p key={id} className="text-red-400">— ลบ: {id}</p>
              ))}
            </div>
          )}

          {result.synced !== undefined && (
            <div className="mt-2 flex gap-4">
              <span className="text-green-400">✓ Synced: {result.synced}</span>
              {result.failed !== undefined && result.failed > 0 && (
                <span className="text-red-400">✗ Failed: {result.failed}</span>
              )}
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {result.errors.map((e, i) => (
                <p key={i} className="text-red-400">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function AdminNeo4jPage() {
  const [status, setStatus] = useState<Neo4jStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<ActionResult | null>(null);

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<ActionResult | null>(null);

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await api.get("/api/admin/neo4j/status/");
      setStatus(res.data);
    } catch {
      setStatus({ connected: false, node_counts: {}, rel_counts: {}, error: "ดึงข้อมูลไม่ได้" });
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleCleanup = async () => {
    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const res = await api.post("/api/admin/neo4j/cleanup/");
      setCleanupResult(res.data);
      fetchStatus();
    } catch {
      setCleanupResult({ message: "เกิดข้อผิดพลาด" });
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await api.post("/api/admin/neo4j/sync-all/");
      setSyncResult(res.data);
      fetchStatus();
    } catch {
      setSyncResult({ message: "เกิดข้อผิดพลาด" });
    } finally {
      setSyncLoading(false);
    }
  };

  const totalNodes = status
    ? Object.values(status.node_counts).reduce((a, b) => a + b, 0)
    : 0;
  const totalRels = status
    ? Object.values(status.rel_counts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Neo4j Tools</h1>
          <p className="text-slate-400 text-sm mt-1">จัดการและตรวจสอบ Graph Database</p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={statusLoading}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white
                     bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition"
        >
          <RefreshCw size={14} className={statusLoading ? "animate-spin" : ""} />
          รีเฟรช
        </button>
      </div>

      {/* Connection Status Card */}
      <div className={`rounded-2xl p-5 mb-6 border flex items-center gap-4
        ${status?.connected
          ? "bg-green-500/5 border-green-500/20"
          : "bg-red-500/5 border-red-500/20"
        }`}
      >
        <div className={`w-3 h-3 rounded-full flex-shrink-0
          ${statusLoading ? "bg-yellow-400 animate-pulse" : status?.connected ? "bg-green-400" : "bg-red-400"}`}
        />
        <div>
          <p className={`font-semibold text-sm ${status?.connected ? "text-green-300" : "text-red-300"}`}>
            {statusLoading
              ? "กำลังตรวจสอบการเชื่อมต่อ..."
              : status?.connected
              ? "Neo4j เชื่อมต่อสำเร็จ"
              : "ไม่สามารถเชื่อมต่อ Neo4j ได้"
            }
          </p>
          {status?.error && (
            <p className="text-xs text-red-400 mt-0.5">{status.error}</p>
          )}
          {status?.connected && (
            <p className="text-xs text-slate-400 mt-0.5">
              bolt://localhost:7687 • {totalNodes} nodes • {totalRels} relationships
            </p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Node / Rel counts */}
        {status?.connected && (
          <>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database size={15} className="text-violet-400" />
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  Nodes
                </h2>
              </div>
              <div className="space-y-3">
                {Object.entries(status.node_counts).length === 0 ? (
                  <p className="text-slate-600 text-sm">ไม่มี Node</p>
                ) : (
                  Object.entries(status.node_counts).map(([label, count]) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: NODE_COLORS[label] ?? "#64748b" }}
                        />
                        <span className="text-sm text-slate-300">{label}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={15} className="text-blue-400" />
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  Relationships
                </h2>
              </div>
              <div className="space-y-3">
                {Object.entries(status.rel_counts).length === 0 ? (
                  <p className="text-slate-600 text-sm">ไม่มี Relationship</p>
                ) : (
                  Object.entries(status.rel_counts).map(([rel, count]) => (
                    <div key={rel} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: REL_COLORS[rel] ?? "#64748b" }}
                        />
                        <span className="text-sm text-slate-300">{rel}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Tools */}
        <ToolCard
          icon={Trash2}
          title="Cleanup Orphaned Nodes"
          description="ลบ Node ใน Neo4j ที่ไม่มีคู่ใน PostgreSQL แล้ว (ข้อมูลที่ตกค้าง) ทำให้ Graph ตรงกับฐานข้อมูลหลัก"
          buttonLabel="เริ่ม Cleanup"
          buttonColor="bg-red-600 hover:bg-red-700 text-white"
          loading={cleanupLoading}
          onClick={handleCleanup}
          result={cleanupResult}
        />

        <ToolCard
          icon={RefreshCw}
          title="Sync All Users to Neo4j"
          description="บังคับ sync ข้อมูล User ทั้งหมดจาก Django ไปยัง Neo4j ใหม่ทั้งหมด รวมถึงสร้าง KNOWS relationship ใหม่"
          buttonLabel="Sync ทั้งหมด"
          buttonColor="bg-violet-600 hover:bg-violet-700 text-white"
          loading={syncLoading}
          onClick={handleSyncAll}
          result={syncResult}
        />
      </div>
    </div>
  );
}
