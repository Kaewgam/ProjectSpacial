"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import type { ForceGraphMethods } from "react-force-graph-2d";

// Dynamic import เพราะ react-force-graph ต้องการ browser environment
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full">
      <div className="text-slate-400 text-sm animate-pulse">กำลังโหลด Graph Engine...</div>
    </div>
  ),
});

// ─── Types ───────────────────────────────────────────
interface GraphNode {
  id: string;
  name: string;
  type?: string;        // "user" | "faculty" | "department" | "company"
  faculty?: string;
  department?: string;
  occupation?: string;
  avatar?: string;
  val?: number;
  color?: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type?: string;        // "KNOWS" | "STUDIED_IN" | "BELONGS_TO" | "WORKS_AS"
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ─── Node color by type ───────────────────────────────
function getNodeColor(node: GraphNode): string {
  return node.color ?? "#a78bfa";
}

// ─── Stats Card ──────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl px-5 py-4 flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
        style={{ background: `${accent}22` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

// ─── Legend Item ─────────────────────────────────────
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function GraphPage() {
  const [rawGraphData, setRawGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    KNOWS: false,
    STUDIED_IN: false,
    BELONGS_TO: false,
    WORKS_AS: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<GraphLink>>(new Set());
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);

  // Responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Fetch graph data
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:8000/graph-data/");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // กำหนดสีและขนาดตาม type ของ Node
        const nodes: GraphNode[] = (data.nodes || []).map((n: GraphNode) => ({
          ...n,
          color: n.type === "faculty" ? "#10b981" : 
                 n.type === "department" ? "#3b82f6" : 
                 n.type === "company" ? "#f59e0b" : "#a78bfa",
          val: n.val || 6,
        }));

        setRawGraphData({ nodes, links: data.links || [] });
      } catch (err) {
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลกราฟได้");
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, []);



  // ── Data Filtering Logic ──
  const displayData = useMemo(() => {
    // 1. Filter Links
    const links = rawGraphData.links.filter((l) => activeFilters[l.type as string]);

    // 2. Decide Node Visibility
    const activeNodeTypes = new Set<string>();
    
    // โชว์ User ก็ต่อเมื่อมีการเปิดตัวกรองความสัมพันธ์ใดๆ ก็ตามอย่างน้อย 1 อัน
    const isAnyActive = Object.values(activeFilters).some(Boolean);
    if (isAnyActive) {
      activeNodeTypes.add("user");
    }

    if (activeFilters.STUDIED_IN) activeNodeTypes.add("faculty");
    if (activeFilters.BELONGS_TO) activeNodeTypes.add("department");
    if (activeFilters.WORKS_AS) activeNodeTypes.add("company");

    const activeNodeIds = new Set<string>();
    rawGraphData.nodes.forEach((n) => {
      if (n.type === "user") {
        activeNodeIds.add(n.id);
      } else if (activeNodeTypes.has(n.type as string)) {
        // Option: Show faculty/company node ONLY if there's a link connected to it to avoid clutter
        // For now, let's just show those that have active edges pointing to them
        const hasEdge = links.some((l) => {
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          return s === n.id || t === n.id;
        });
        if (hasEdge) {
          activeNodeIds.add(n.id);
        }
      }
    });

    const nodes = rawGraphData.nodes.filter((n) => activeNodeIds.has(n.id));

    return { nodes, links };
  }, [rawGraphData, activeFilters]);

  // Highlight on hover
  const handleNodeHover = useCallback(
    (node: GraphNode | null) => {
      if (!node) {
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
        return;
      }
      const neighbors = new Set<string>([node.id]);
      const links = new Set<GraphLink>();

      displayData.links.forEach((link) => {
        const srcId = typeof link.source === "object" ? link.source.id : link.source;
        const tgtId = typeof link.target === "object" ? link.target.id : link.target;
        if (srcId === node.id || tgtId === node.id) {
          neighbors.add(srcId);
          neighbors.add(tgtId);
          links.add(link);
        }
      });

      setHighlightNodes(neighbors);
      setHighlightLinks(links);
    },
    [displayData.links]
  );

  // ── Manual Spatial Detection (Bypass library's broken hit area) ──
  const graphDataRef = useRef(displayData);
  useEffect(() => { graphDataRef.current = displayData; }, [displayData]);

  // Handle Coordinates
  const getNearestNode = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fg = graphRef.current as any;
    if (!fg || !fg.screen2GraphCoords) return null;

    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const { x: gx, y: gy } = fg.screen2GraphCoords(e.clientX - rect.left, e.clientY - rect.top);

    let nearest: GraphNode | null = null;
    let minDist = Infinity;

    graphDataRef.current.nodes.forEach((node) => {
      if (node.x === undefined || node.y === undefined) return;
      const dx = node.x - gx;
      const dy = node.y - gy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 15 && dist < minDist) {
        minDist = dist;
        nearest = node;
      }
    });
    return nearest;
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const nearest = getNearestNode(e);
    if (nearest) {
      const node: GraphNode = nearest;  // capture narrow type ก่อนเข้า callback
      setSelectedNode((prev) => (prev?.id === node.id ? null : node));
    } else {
      setSelectedNode(null);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
  }, [getNearestNode]);

  const handleCanvasHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const nearest = getNearestNode(e);
    handleNodeHover(nearest);
  }, [getNearestNode, handleNodeHover]);

  // Count connections for selected node
  const connectionCount = selectedNode
    ? displayData.links.filter((l) => {
        const srcId = typeof l.source === "object" ? l.source.id : l.source;
        const tgtId = typeof l.target === "object" ? l.target.id : l.target;
        return srcId === selectedNode.id || tgtId === selectedNode.id;
      }).length
    : 0;

  return (
    <div className="min-h-screen bg-[#080b14] flex flex-col text-white">
      {/* ─── Header ─── */}
      <div className="px-8 pt-8 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
              🕸️
            </div>
            <h1 className="text-2xl font-bold text-white">Alumni Network Graph</h1>
          </div>
          <p className="text-slate-400 text-sm">
            แสดงความสัมพันธ์ระหว่างศิษย์เก่า — ดึงข้อมูลจาก Neo4j โดยตรง
          </p>
        </div>

        {/* Stats */}
        {!loading && !error && (
          <div className="flex gap-3 flex-wrap">
            <StatCard
              icon="👤"
              label="ศิษย์เก่า"
              value={rawGraphData.nodes.filter(n => n.type === 'user').length}
              accent="#a78bfa"
            />
            <StatCard
              icon="🔗"
              label="ความสัมพันธ์ทั้งหมด"
              value={rawGraphData.links.length}
              accent="#60a5fa"
            />
          </div>
        )}
      </div>

      {/* ─── Main Area ─── */}
      <div className="flex flex-1 gap-4 px-8 pb-8 min-h-0">
        {/* Graph Container */}
        <div
          className="flex-1 relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-[0_0_60px_rgba(139,92,246,0.15)]"
          style={{ background: "#0a0e1a", minHeight: "520px", cursor: highlightNodes.size > 0 ? "pointer" : "default" }}
          ref={containerRef}
          onClick={handleCanvasClick}
          onPointerMove={handleCanvasHover}
          onPointerLeave={() => handleNodeHover(null)}
        >
          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
              <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm animate-pulse">กำลังโหลดข้อมูลจาก Neo4j...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
              <div className="text-4xl">❌</div>
              <p className="text-red-400 text-sm font-medium">เชื่อมต่อไม่ได้</p>
              <p className="text-slate-500 text-xs max-w-xs text-center">{error}</p>
              <p className="text-slate-600 text-xs">ตรวจสอบว่า Django server กำลังรันอยู่</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && displayData.nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
              <div className="text-4xl">🌐</div>
              <p className="text-slate-400 text-sm">ยังไม่มีข้อมูลที่จะแสดง</p>
              <p className="text-slate-600 text-xs">ลองกดเปิดตัวกรองความสัมพันธ์ด้านขวามือ</p>
            </div>
          )}

          {/* Graph */}
          {!loading && !error && displayData.nodes.length > 0 && (
            <ForceGraph2D
              /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              ref={graphRef as any}
              graphData={displayData}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor="#0a0e1a"
              // Node appearance
              nodeColor={(node) => {
                const n = node as GraphNode;
                if (highlightNodes.size > 0) {
                  return highlightNodes.has(n.id) ? "#c4b5fd" : "#374151";
                }
                return getNodeColor(n);
              }}
              nodeVal={() => 6}
              nodeLabel={(node) => {
                const n = node as GraphNode;
                return n.name !== n.id ? `${n.name} (${n.id})` : n.id;
              }}
              // Node custom draw
              nodeCanvasObject={(node, ctx) => {
                const n = node as GraphNode;
                const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(n.id);
                const isSelected = selectedNode?.id === n.id;
                const r = isSelected ? 9 : 6;
                const x = n.x ?? 0;
                const y = n.y ?? 0;

                // Glow for selected
                if (isSelected) {
                  ctx.beginPath();
                  ctx.arc(x, y, r + 5, 0, 2 * Math.PI);
                  const grd = ctx.createRadialGradient(x, y, r, x, y, r + 5);
                  grd.addColorStop(0, "#a78bfa88");
                  grd.addColorStop(1, "#a78bfa00");
                  ctx.fillStyle = grd;
                  ctx.fill();
                }

                // Circle
                ctx.beginPath();
                ctx.arc(x, y, r, 0, 2 * Math.PI);
                ctx.fillStyle = isHighlighted
                  ? isSelected
                    ? "#c4b5fd"
                    : highlightNodes.has(n.id)
                    ? "#a78bfa"
                    : "#a78bfa"
                  : "#374151";
                ctx.fill();

                // Border
                ctx.strokeStyle = isSelected ? "#ddd6fe" : "#ffffff22";
                ctx.lineWidth = isSelected ? 2 : 1;
                ctx.stroke();

                // Label
                if (isHighlighted || highlightNodes.size === 0) {
                  ctx.font = `${isSelected ? "bold " : ""}${r > 6 ? 5 : 4}px Inter, sans-serif`;
                  ctx.fillStyle = isHighlighted ? "#e2e8f0" : "#64748b";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "top";
                  const label = n.name && n.name !== n.id ? n.name.split(" ")[0] : n.id;
                  ctx.fillText(label, x, y + r + 2);
                  
                  // วาด Tooltip ชื่อเต็มเวลา custom hover ทำงาน
                  if (highlightNodes.size > 0 && !isSelected) {
                     // วาดก็ต่อเมื่อ node นี้คือ node ตรงกลางที่โดนชี้
                     // ใน hover mode เรามีเพื่อนบ้าน แต่ node หลักมันจะไม่มี flag บอกโดยตรง แต่อยู่ใน highlightNodes
                     // ซึ่งก็โอเค มันจะขึ้นป้ายเหนือ node 
                  }
                }
              }}
              nodeCanvasObjectMode={() => "replace"}
              // Link appearance
              linkColor={(link) => {
                if (highlightLinks.size > 0) {
                  return highlightLinks.has(link as GraphLink) ? "#818cf8" : "#1e293b";
                }
                return "#334155";
              }}
              linkWidth={(link) => (highlightLinks.has(link as GraphLink) ? 2 : 1)}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
              linkDirectionalArrowColor={() => "#6366f1"}
              linkDirectionalParticles={(link) =>
                highlightLinks.has(link as GraphLink) ? 3 : 0
              }
              linkDirectionalParticleSpeed={0.004}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleColor={() => "#a78bfa"}
              // Hover and Click interactions bypass the library through container events
              // Physics
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
              cooldownTicks={200}
            />
          )}

          {/* Controls hint */}
          {!loading && !error && displayData.nodes.length > 0 && (
            <div className="absolute bottom-4 left-4 flex gap-3 text-xs text-slate-600">
              <span>🖱️ ลาก = เลื่อน</span>
              <span>🔍 Scroll = Zoom</span>
              <span>👆 คลิก = เลือก Node</span>
            </div>
          )}
        </div>

        {/* ─── Side Panel ─── */}
        <div className="w-64 flex flex-col gap-4 flex-shrink-0">
          {/* Legend */}
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
              Legend
            </p>
            <div className="flex flex-col gap-2">
              <LegendItem color="#a78bfa" label="User / ศิษย์เก่า" />
              <LegendItem color="#34d399" label="Faculty / คณะ" />
              <LegendItem color="#60a5fa" label="Department / ภาควิชา" />
              <LegendItem color="#f59e0b" label="Company / ที่ทำงาน" />
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <p className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Relationship Filters
              </p>
              <div className="flex flex-col gap-2 text-xs">
                {Object.entries(activeFilters).map(([rel, isActive]) => (
                  <button
                    key={rel}
                    onClick={() => setActiveFilters(prev => ({ ...prev, [rel]: !prev[rel] }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border text-left ${
                      isActive 
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/50 hover:bg-violet-500/30' 
                        : 'bg-slate-900/50 text-slate-400 border-slate-700/50 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-sm flex items-center justify-center transition-colors ${isActive ? 'bg-violet-500' : 'border border-slate-500'}`}>
                      {isActive && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span>
                      {rel === 'KNOWS' ? '→ KNOWS (รู้จักกัน)' :
                       rel === 'STUDIED_IN' ? '→ STUDIED_IN (เรียนที่)' :
                       rel === 'BELONGS_TO' ? '→ BELONGS_TO (สังกัด)' :
                       '→ WORKS_AS (ทำงานที่)'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Node Info */}
          {selectedNode ? (
            <div className="bg-slate-800/60 backdrop-blur border border-violet-500/30 rounded-xl p-4 flex-1 overflow-y-auto">
              <p className="text-xs font-semibold text-violet-400 mb-3 uppercase tracking-wider">
                รายละเอียด
              </p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full border-2 border-violet-500/40 flex items-center justify-center overflow-hidden flex-shrink-0 bg-violet-500/20">
                  {selectedNode.avatar ? (
                    <img 
                      src={selectedNode.avatar} 
                      alt={selectedNode.name || "avatar"} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-violet-300 font-bold text-lg">
                      {selectedNode.name
                        ? selectedNode.name.charAt(0).toUpperCase()
                        : selectedNode.id.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight truncate">
                    {selectedNode.name || "—"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">🪪 {selectedNode.id}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {selectedNode.faculty ? (
                  <div className="flex items-start gap-2 bg-slate-900/50 rounded-lg px-3 py-2">
                    <span className="text-sm mt-0.5">🎓</span>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">คณะ</p>
                      <p className="text-xs text-slate-200 font-medium truncate">{selectedNode.faculty}</p>
                    </div>
                  </div>
                ) : null}
                {selectedNode.department ? (
                  <div className="flex items-start gap-2 bg-slate-900/50 rounded-lg px-3 py-2">
                    <span className="text-sm mt-0.5">📚</span>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">สาขา</p>
                      <p className="text-xs text-slate-200 font-medium truncate">{selectedNode.department}</p>
                    </div>
                  </div>
                ) : null}
                {selectedNode.occupation ? (
                  <div className="flex items-start gap-2 bg-slate-900/50 rounded-lg px-3 py-2">
                    <span className="text-sm mt-0.5">💼</span>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">อาชีพ / บริษัท</p>
                      <p className="text-xs text-slate-200 font-medium truncate">{selectedNode.occupation}</p>
                    </div>
                  </div>
                ) : null}
                {!selectedNode.faculty && !selectedNode.department && !selectedNode.occupation ? (
                  <p className="text-xs text-slate-500 text-center py-2">ยังไม่มีข้อมูลเพิ่มเติม</p>
                ) : null}
              </div>

              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-violet-400">{connectionCount}</p>
                <p className="text-xs text-slate-400">ความสัมพันธ์ที่แสดงอยู่</p>
              </div>

              <button
                onClick={() => {
                  setSelectedNode(null);
                  setHighlightNodes(new Set());
                  setHighlightLinks(new Set());
                }}
                className="mt-3 w-full text-xs text-slate-400 hover:text-slate-200 transition py-1 border border-slate-700 rounded-lg hover:border-slate-500"
              >
                ยกเลิกการเลือก
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-4 flex-1 flex flex-col items-center justify-center text-center gap-2">
              <div className="text-3xl">👆</div>
              <p className="text-xs text-slate-400">คลิก Node เพื่อดูรายละเอียด</p>
            </div>
          )}

          {/* Status */}
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  loading
                    ? "bg-yellow-400 animate-pulse"
                    : error
                    ? "bg-red-400"
                    : "bg-green-400"
                }`}
              />
              <p className="text-xs text-slate-400">
                {loading
                  ? "กำลังโหลด..."
                  : error
                  ? "เชื่อมต่อไม่ได้"
                  : `โหลดสำเร็จ • Neo4j`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
