"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Database, RefreshCw, Trash2, Zap,
  CheckCircle, X, AlertTriangle, Activity, Search
} from "lucide-react";

interface AuditData {
  connected: boolean;
  error?: string;
  summary?: {
    neo4j_users: number; pg_users: number;
    orphaned: number; missing: number; isolated: number;
  };
  orphaned_nodes?: { student_id: string; first_name: string; last_name: string }[];
  missing_nodes?:  { student_id: string; first_name: string; last_name: string }[];
  isolated_nodes?: { labels: string[]; student_id: string; name: string }[];
  all_nodes?: {
    users: { student_id: string; first_name: string; last_name: string }[];
    faculties: { name: string }[];
    departments: { name: string }[];
    companies: { name: string }[];
  };
  rel_counts?: Record<string, number>;
}

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

  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

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

  const fetchAudit = async () => {
    setAuditLoading(true);
    setAuditData(null);
    setAuditOpen(true);
    try {
      const res = await api.get("/api/admin/neo4j/audit/");
      setAuditData(res.data);
    } catch {
      setAuditData({ connected: false, error: "ดึงข้อมูลไม่ได้" });
    } finally {
      setAuditLoading(false);
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

      {/* ── Node Audit Section ── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Search size={16} className="text-amber-400" />
              Node Audit — ตรวจสอบ Node
            </h2>
            <p className="text-xs text-slate-500 mt-1">เปรียบเทียบ Node ใน Neo4j กับ PostgreSQL หา orphaned / missing / isolated nodes</p>
          </div>
          <button
            onClick={fetchAudit}
            disabled={auditLoading}
            className="flex items-center gap-2 text-sm px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-60"
          >
            <Search size={14} className={auditLoading ? "animate-spin" : ""} />
            {auditLoading ? "กำลังตรวจสอบ..." : "ตรวจสอบ Nodes"}
          </button>
        </div>

        {auditOpen && (
          <div className="space-y-4">
            {auditLoading && (
              <div className="text-center py-10 text-slate-400 text-sm">
                <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
                กำลังดึงข้อมูลจาก Neo4j...
              </div>
            )}

            {!auditLoading && auditData && !auditData.connected && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
                ❌ {auditData.error}
              </div>
            )}

            {!auditLoading && auditData?.connected && auditData.summary && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: "Neo4j Users", value: auditData.summary.neo4j_users, color: "text-violet-400" },
                    { label: "PG Users", value: auditData.summary.pg_users, color: "text-blue-400" },
                    { label: "Orphaned", value: auditData.summary.orphaned, color: auditData.summary.orphaned > 0 ? "text-red-400" : "text-green-400" },
                    { label: "Missing Sync", value: auditData.summary.missing, color: auditData.summary.missing > 0 ? "text-amber-400" : "text-green-400" },
                    { label: "Isolated", value: auditData.summary.isolated, color: auditData.summary.isolated > 0 ? "text-orange-400" : "text-green-400" },
                  ].map(c => (
                    <div key={c.label} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 text-center">
                      <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{c.label}</p>
                    </div>
                  ))}
                </div>

                {/* Orphaned */}
                {(auditData.orphaned_nodes?.length ?? 0) > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <p className="text-sm font-semibold text-red-400 mb-3">🗑️ Orphaned Nodes — อยู่ใน Neo4j แต่ไม่มีใน PostgreSQL ({auditData.orphaned_nodes!.length} รายการ)</p>
                    <div className="space-y-1">
                      {auditData.orphaned_nodes!.map(u => (
                        <div key={u.student_id} className="text-xs text-slate-400 bg-slate-900/50 rounded-lg px-3 py-2 flex items-center justify-between">
                          <span className="font-mono text-red-300">{u.student_id}</span>
                          <span>{u.first_name} {u.last_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing */}
                {(auditData.missing_nodes?.length ?? 0) > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-sm font-semibold text-amber-400 mb-3">⚠️ Missing Nodes — มีใน PG แต่ยังไม่ sync ไป Neo4j ({auditData.missing_nodes!.length} รายการ)</p>
                    <div className="space-y-1">
                      {auditData.missing_nodes!.map(u => (
                        <div key={u.student_id} className="text-xs text-slate-400 bg-slate-900/50 rounded-lg px-3 py-2 flex items-center justify-between">
                          <span className="font-mono text-amber-300">{u.student_id}</span>
                          <span>{u.first_name} {u.last_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Isolated */}
                {(auditData.isolated_nodes?.length ?? 0) > 0 && (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                    <p className="text-sm font-semibold text-orange-400 mb-3">🔵 Isolated Nodes — ไม่มี Relationship เลย ({auditData.isolated_nodes!.length} รายการ)</p>
                    <div className="space-y-1">
                      {auditData.isolated_nodes!.map((n, i) => (
                        <div key={i} className="text-xs text-slate-400 bg-slate-900/50 rounded-lg px-3 py-2 flex items-center justify-between">
                          <span className="text-orange-300">{n.labels.join(", ")}</span>
                          <span>{n.student_id || n.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All good */}
                {auditData.summary.orphaned === 0 && auditData.summary.missing === 0 && auditData.summary.isolated === 0 && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 text-center">
                    <CheckCircle className="text-green-400 mx-auto mb-2" size={24} />
                    <p className="text-sm text-green-300 font-semibold">ทุก Node สอดคล้องกัน — ไม่พบปัญหา</p>
                  </div>
                )}

                {/* All Nodes Table */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Users */}
                  <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs font-semibold text-violet-400 mb-3 uppercase tracking-wider">👤 User Nodes ({auditData.all_nodes?.users.length ?? 0})</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {auditData.all_nodes?.users.map(u => (
                        <div key={u.student_id} className="text-xs text-slate-400 flex justify-between py-1 border-b border-slate-800/50">
                          <span className="font-mono text-slate-300">{u.student_id}</span>
                          <span>{u.first_name} {u.last_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Faculty / Dept / Company */}
                  <div className="space-y-3">
                    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                      <p className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">🏫 Faculty ({auditData.all_nodes?.faculties.length ?? 0})</p>
                      {auditData.all_nodes?.faculties.map(f => (
                        <p key={f.name} className="text-xs text-slate-400 py-0.5">• {f.name}</p>
                      ))}
                    </div>
                    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                      <p className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wider">📚 Department ({auditData.all_nodes?.departments.length ?? 0})</p>
                      {auditData.all_nodes?.departments.map(d => (
                        <p key={d.name} className="text-xs text-slate-400 py-0.5">• {d.name}</p>
                      ))}
                    </div>
                    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                      <p className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wider">🏢 Company ({auditData.all_nodes?.companies.length ?? 0})</p>
                      {(auditData.all_nodes?.companies.length ?? 0) === 0
                        ? <p className="text-xs text-slate-600">ไม่มี</p>
                        : auditData.all_nodes?.companies.map(c => (
                            <p key={c.name} className="text-xs text-slate-400 py-0.5">• {c.name}</p>
                          ))
                      }
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
