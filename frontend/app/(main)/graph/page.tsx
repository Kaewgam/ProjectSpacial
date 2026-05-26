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
  company?: string;
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
  reason_faculty?: string;
  reason_department?: string;
  reason_company?: string;
  reason_year?: string;
  reason_skill?: string;
  reason_occupation?: string;
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
// 📌 [สำหรับตอนพรีเซนต์: หน้าเครือข่ายศิษย์เก่า (Graph Tracking)]
// นี่คือหน้าแสดงผล Graph Database (Neo4j) ที่ดึงข้อมูลมาวาดเป็น Topology ด้วย react-force-graph-2d
// จะมี Event onClick / onHover เพื่อโชว์รายละเอียดความสัมพันธ์ด้านขวามือ
export default function GraphPage() {
  const [rawGraphData, setRawGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    KNOWS: true,
    STUDIED_IN: true,
    BELONGS_TO: true,
    WORKS_AS: true,
    HAS_SKILL: true,
    WORKS_AS_ROLE: true,
  });
  const [selectedYears, setSelectedYears] = useState<Set<string>>(new Set());
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [occupationSearch, setOccupationSearch] = useState<string>("");
  const [companySearch, setCompanySearch] = useState<string>("");
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
        const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
        const res = await fetch(`${BASE}/graph-data/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const nodes: GraphNode[] = (data.nodes || []).map((n: GraphNode) => ({
          ...n,
          val: n.val || 6,
        }));

        const links = data.links || [];

        // Resolve relationships
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        links.forEach((l: any) => {
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;

          const sNode = nodes.find(n => n.id === s);
          const tNode = nodes.find(n => n.id === t);

          if (sNode && tNode) {
            if (sNode.type === "user") {
              if (l.type === "STUDIED_IN" && tNode.type === "faculty") sNode.faculty = tNode.id;
              if (l.type === "BELONGS_TO" && tNode.type === "department") sNode.department = tNode.id;
              if (l.type === "WORKS_AS" && tNode.type === "company") sNode.company = tNode.id;
            }
            if (sNode.type === "department" && tNode.type === "faculty") {
              sNode.faculty = tNode.id;
            }
          }
        });

        // Assign colors based on Faculty cluster
        const FACULTY_COLORS = [
          "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e",
          "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7",
          "#d946ef", "#ec4899"
        ];
        const facultyColorMap = new Map<string, string>();
        let colorIndex = 0;

        nodes.forEach(n => {
          if (n.type === "faculty" && !facultyColorMap.has(n.id)) {
            facultyColorMap.set(n.id, FACULTY_COLORS[colorIndex % FACULTY_COLORS.length]);
            colorIndex++;
          }
        });

        nodes.forEach(n => {
          if (n.type === "faculty") {
            n.color = "#ec4899"; // Pink
          } else if (n.type === "department") {
            n.color = "#3b82f6"; // Blue
          } else if (n.type === "company") {
            n.color = "#f59e0b"; // Orange
          } else if (n.type === "skill") {
            n.color = "#10b981"; // Emerald Green
          } else if (n.type === "occupation") {
            n.color = "#ef4444"; // Red
          } else if (n.type === "user") {
            n.color = "#a78bfa"; // Purple
          } else {
            n.color = "#94a3b8"; // Slate
          }
        });

        setRawGraphData({ nodes, links });
      } catch (err) {
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลกราฟได้");
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, []);



  // ── Compute Dropdown Options ──
  const { availableYears, availableFaculties, availableDepts, availableOccupations, availableCompanies } = useMemo(() => {
    const years = new Set<string>();
    const faculties = new Set<string>();
    const depts = new Set<string>();
    const occupations = new Set<string>();
    const companies = new Set<string>();

    rawGraphData.nodes.forEach(n => {
      if (n.type === "user") {
        // Validate year: must be exactly 2 digits
        if (n.id && /^\d{2}/.test(n.id)) {
          years.add(n.id.substring(0, 2));
        }

        if (n.faculty) faculties.add(n.faculty);
        if (n.department && (!selectedFaculty || n.faculty === selectedFaculty)) depts.add(n.department);
        if (n.company) companies.add(n.company);
        if (n.occupation) occupations.add(n.occupation);
      }
    });

    return {
      availableYears: Array.from(years).sort((a, b) => b.localeCompare(a)), // ใหม่ไปเก่า
      availableFaculties: Array.from(faculties).sort(),
      availableDepts: Array.from(depts).sort(),
      availableOccupations: Array.from(occupations).sort(),
      availableCompanies: Array.from(companies).sort(),
    };
  }, [rawGraphData.nodes, selectedFaculty]);

  // ── Data Filtering Logic ──
  const displayData = useMemo(() => {
    // 1. Filter Nodes (User) based on search/dropdown criteria
    const validUserIds = new Set<string>();

    rawGraphData.nodes.forEach(n => {
      if (n.type === "user") {
        const isYearValid = n.id && /^\d{2}/.test(n.id);
        const matchYear = selectedYears.size === 0 || (isYearValid && selectedYears.has(n.id.substring(0, 2)));
        const matchFaculty = !selectedFaculty || n.faculty === selectedFaculty;
        const matchDept = !selectedDept || n.department === selectedDept;
        const matchOcc = !occupationSearch || n.occupation === occupationSearch;
        const matchComp = !companySearch || n.company === companySearch;

        if (matchYear && matchFaculty && matchDept && matchOcc && matchComp) {
          validUserIds.add(n.id);
        }
      }
    });

    // 2. Filter Links (Only active types AND connecting valid nodes)
    const links = rawGraphData.links.filter(l => {
      if (!activeFilters[l.type as string]) return false;

      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;

      // Check if the link connects to a valid user (or another non-user node, but user must be valid)
      const sourceUserValid = !rawGraphData.nodes.find(n => n.id === s && n.type === "user") || validUserIds.has(s);
      const targetUserValid = !rawGraphData.nodes.find(n => n.id === t && n.type === "user") || validUserIds.has(t);

      return sourceUserValid && targetUserValid;
    });

    // 3. Decide Node Visibility
    const activeNodeTypes = new Set<string>();
    const isAnyActive = Object.values(activeFilters).some(Boolean);
    if (isAnyActive) activeNodeTypes.add("user");
    if (activeFilters.STUDIED_IN) activeNodeTypes.add("faculty");
    if (activeFilters.BELONGS_TO) activeNodeTypes.add("department");
    if (activeFilters.WORKS_AS) activeNodeTypes.add("company");
    if (activeFilters.HAS_SKILL) activeNodeTypes.add("skill");
    if (activeFilters.WORKS_AS_ROLE) activeNodeTypes.add("occupation");

    const activeNodeIds = new Set<string>();
    rawGraphData.nodes.forEach((n) => {
      if (n.type === "user") {
        if (validUserIds.has(n.id)) activeNodeIds.add(n.id);
      } else if (activeNodeTypes.has(n.type as string)) {
        // Show faculty/company/skill/occupation ONLY if they are connected to valid users
        const hasEdge = links.some((l) => {
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          return s === n.id || t === n.id;
        });
        if (hasEdge) activeNodeIds.add(n.id);
      }
    });

    const nodes = rawGraphData.nodes.filter(n => activeNodeIds.has(n.id));

    // To prevent d3-force mutation crashes when filtering, provide fresh link objects with string IDs
    const safeLinks = links.map(l => ({
      ...l,
      source: typeof l.source === "object" ? (l.source as any).id : l.source,
      target: typeof l.target === "object" ? (l.target as any).id : l.target
    }));

    return { nodes, links: safeLinks };
  }, [rawGraphData, activeFilters, selectedYears, selectedFaculty, selectedDept, occupationSearch, companySearch]);

  // ── Adjust Physics to spread nodes ──
  useEffect(() => {
    // ต้องใส่ Timeout เล็กน้อยเพื่อให้ react-force-graph สร้าง Simulation ให้เสร็จก่อน
    const timer = setTimeout(() => {
      if (graphRef.current) {
        // เพิ่มแรงผลักให้จุดกระจายออกจากกัน (ยิ่งติดลบเยอะ ยิ่งผลักแรง)
        graphRef.current.d3Force('charge')?.strength(-600);
        // เพิ่มระยะความยาวของเส้น
        graphRef.current.d3Force('link')?.distance(50);
        // สั่งให้กราฟขยับใหม่ตามสูตรฟิสิกส์ข้างบน
        graphRef.current.d3ReheatSimulation();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [displayData]);

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

  // Count and list connections for selected node
  const connectionsList = useMemo(() => {
    if (!selectedNode) return [];
    const list: { node: GraphNode; type: string; link: GraphLink }[] = [];
    displayData.links.forEach((l) => {
      const srcId = typeof l.source === "object" ? l.source.id : l.source;
      const tgtId = typeof l.target === "object" ? l.target.id : l.target;

      if (srcId === selectedNode.id) {
        const targetNode = displayData.nodes.find(n => n.id === tgtId);
        if (targetNode) list.push({ node: targetNode, type: l.type || 'UNKNOWN', link: l });
      } else if (tgtId === selectedNode.id) {
        const sourceNode = displayData.nodes.find(n => n.id === srcId);
        if (sourceNode) list.push({ node: sourceNode, type: l.type || 'UNKNOWN', link: l });
      }
    });
    return list;
  }, [selectedNode, displayData]);

  const connectionCount = connectionsList.length;

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
                  return highlightNodes.has(n.id) ? (n.color || "#a78bfa") : "#374151";
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

                const nodeColor = n.color || "#a78bfa";

                // Glow for selected
                if (isSelected) {
                  ctx.beginPath();
                  ctx.arc(x, y, r + 5, 0, 2 * Math.PI);
                  const grd = ctx.createRadialGradient(x, y, r, x, y, r + 5);
                  grd.addColorStop(0, `${nodeColor}88`);
                  grd.addColorStop(1, `${nodeColor}00`);
                  ctx.fillStyle = grd;
                  ctx.fill();
                }

                // Circle
                ctx.beginPath();
                ctx.arc(x, y, r, 0, 2 * Math.PI);
                ctx.fillStyle = isHighlighted
                  ? isSelected
                    ? "#ffffff"
                    : nodeColor
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
              linkCanvasObjectMode={() => "after"}
              linkCanvasObject={(link, ctx) => {
                // Ignore if not highlighted
                if (highlightLinks.size > 0 && !highlightLinks.has(link as GraphLink)) return;
                // If no highlighted nodes, maybe skip text to avoid clutter? Or show all?
                // Let's only show text if the link is highlighted (user hovered/clicked a node)
                if (highlightLinks.size === 0) return;

                const start = (link as GraphLink).source as GraphNode;
                const end = (link as GraphLink).target as GraphNode;
                if (typeof start !== 'object' || typeof end !== 'object') return;

                let label = (link as GraphLink).type || "";
                if (label === "KNOWS") label = "รู้จักกัน";
                else if (label === "STUDIED_IN") label = "เรียนคณะ";
                else if (label === "WORKS_AS") label = "ทำงานที่";
                else if (label === "BELONGS_TO") label = "สาขาวิชา";
                else if (label === "HAS_SKILL") label = "ทักษะ";
                else if (label === "WORKS_AS_ROLE") label = "อาชีพ";

                const x = start.x! + (end.x! - start.x!) / 2;
                const y = start.y! + (end.y! - start.y!) / 2;

                ctx.font = `3px Inter, sans-serif`;
                ctx.fillStyle = "#cbd5e1"; // slate-300
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                const angle = Math.atan2(end.y! - start.y!, end.x! - start.x!);
                ctx.save();
                ctx.translate(x, y);
                if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
                  ctx.rotate(angle + Math.PI);
                } else {
                  ctx.rotate(angle);
                }

                // Draw text background for readability
                const textWidth = ctx.measureText(label).width;
                ctx.fillStyle = "rgba(15, 23, 42, 0.7)"; // bg-slate-900
                ctx.fillRect(-textWidth / 2 - 1, -3, textWidth + 2, 6);

                ctx.fillStyle = "#cbd5e1";
                ctx.fillText(label, 0, 0);
                ctx.restore();
              }}
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
        <div className="w-80 flex flex-col gap-3 flex-shrink-0" style={{ height: "calc(100vh - 180px)" }}>

          {/* ── ส่วนบน: Filter (scroll ได้) ── */}
          <div className="flex flex-col gap-3 overflow-y-auto flex-shrink-0" style={{ maxHeight: "55%" }}>

            {/* ── กรองผู้ใช้ ── */}
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">👥 กรองผู้ใช้</p>
                {(selectedYears.size > 0 || selectedFaculty || selectedDept || occupationSearch || companySearch) && (
                  <button onClick={() => { setSelectedYears(new Set()); setSelectedFaculty(""); setSelectedDept(""); setOccupationSearch(""); setCompanySearch(""); }} className="text-xs text-violet-400 hover:text-violet-200 transition">ล้างทั้งหมด</button>
                )}
              </div>

              {/* รุ่น */}
              <div>
                <p className="text-xs text-slate-400 mb-1.5">🎓 รุ่น (2 ตัวแรกของรหัสนักศึกษา)</p>
                <select
                  value={selectedYears.size > 0 ? [...selectedYears][0] : ""}
                  onChange={e => { const v = e.target.value; setSelectedYears(v ? new Set([v]) : new Set()); }}
                  className="w-full text-xs bg-slate-900/70 border border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-violet-500 transition-colors">
                  <option value="">— ทั้งหมด —</option>
                  {availableYears.map(y => <option key={y} value={y}>รุ่น {y}</option>)}
                </select>
              </div>

              {/* คณะ */}
              <div>
                <p className="text-xs text-slate-400 mb-1.5">🏛️ คณะ</p>
                <select value={selectedFaculty}
                  onChange={e => { setSelectedFaculty(e.target.value); setSelectedDept(""); }}
                  className="w-full text-xs bg-slate-900/70 border border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-violet-500 transition-colors">
                  <option value="">— ทั้งหมด —</option>
                  {availableFaculties.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* สาขาวิชา */}
              <div>
                <p className="text-xs text-slate-400 mb-1.5">📚 สาขาวิชา / หลักสูตร</p>
                <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                  className="w-full text-xs bg-slate-900/70 border border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-violet-500 transition-colors"
                  disabled={availableDepts.length === 0}>
                  <option value="">— ทั้งหมด —</option>
                  {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* ตำแหน่งงาน */}
              <div>
                <p className="text-xs text-slate-400 mb-1.5">💼 ตำแหน่งงาน</p>
                <select value={occupationSearch} onChange={e => setOccupationSearch(e.target.value)}
                  className="w-full text-xs bg-slate-900/70 border border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-violet-500 transition-colors">
                  <option value="">— ทั้งหมด —</option>
                  {availableOccupations.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* บริษัท / หน่วยงาน */}
              <div>
                <p className="text-xs text-slate-400 mb-1.5">🏢 บริษัท / หน่วยงาน</p>
                <select value={companySearch} onChange={e => setCompanySearch(e.target.value)}
                  className="w-full text-xs bg-slate-900/70 border border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-violet-500 transition-colors">
                  <option value="">— ทั้งหมด —</option>
                  {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* จำนวนที่แสดง */}
              <div className="bg-slate-900/50 rounded-lg px-3 py-2 text-center">
                <span className="text-xs text-slate-400">กำลังแสดง </span>
                <span className="text-xs font-bold text-violet-300">{displayData.nodes.filter(n => n.type === "user").length}</span>
                <span className="text-xs text-slate-400"> / {rawGraphData.nodes.filter(n => n.type === "user").length} คน</span>
              </div>
            </div>

            {/* ── ตัวกรองความสัมพันธ์ ── */}
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">🔗 ประเภทความสัมพันธ์</p>
              <div className="flex flex-col gap-2 text-xs">
                {Object.entries(activeFilters).map(([rel, isActive]) => (
                  <button key={rel}
                    onClick={() => setActiveFilters(prev => ({ ...prev, [rel]: !prev[rel] }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border text-left ${isActive
                      ? "bg-violet-500/20 text-violet-300 border-violet-500/50 hover:bg-violet-500/30"
                      : "bg-slate-900/50 text-slate-400 border-slate-700/50 hover:bg-slate-800"
                      }`}>
                    <div className={`w-3 h-3 rounded-sm flex items-center justify-center transition-colors ${isActive ? "bg-violet-500" : "border border-slate-500"}`}>
                      {isActive && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span>
                      {rel === "KNOWS" ? "รู้จักกัน (KNOWS)" :
                        rel === "STUDIED_IN" ? "เรียนที่คณะ (STUDIED_IN)" :
                          rel === "BELONGS_TO" ? "สังกัดสาขา (BELONGS_TO)" :
                            rel === "WORKS_AS" ? "ทำงานที่ (WORKS_AS)" :
                              rel === "HAS_SKILL" ? "ทักษะ (HAS_SKILL)" :
                                rel === "WORKS_AS_ROLE" ? "อาชีพ (WORKS_AS_ROLE)" : rel}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <p className="text-xs font-semibold text-slate-400 mb-2">สัญลักษณ์สี</p>
                <div className="flex flex-col gap-1.5">
                  <LegendItem color="#ec4899" label="คณะ (Faculty)" />
                  <LegendItem color="#3b82f6" label="สาขาวิชา (Department)" />
                  <LegendItem color="#f59e0b" label="บริษัท / หน่วยงาน (Company)" />
                  <LegendItem color="#ef4444" label="ตำแหน่งงาน (Occupation)" />
                  <LegendItem color="#10b981" label="ทักษะ (Skill)" />
                  <LegendItem color="#a78bfa" label="ศิษย์เก่า (User)" />
                </div>
              </div>
            </div>
          </div>

          {/* ── ส่วนล่าง: รายละเอียด + Status ── */}
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            {selectedNode ? (
              <div className="bg-slate-800/60 backdrop-blur border border-violet-500/30 rounded-xl p-4 flex-1 overflow-y-auto">
                <p className="text-xs font-semibold text-violet-400 mb-3 uppercase tracking-wider">รายละเอียด</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center overflow-hidden flex-shrink-0 ${selectedNode.type === "company" ? "border-amber-500/40 bg-amber-500/20" :
                    selectedNode.type === "faculty" ? "border-green-500/40 bg-green-500/20" :
                      selectedNode.type === "department" ? "border-blue-500/40 bg-blue-500/20" :
                        "border-violet-500/40 bg-violet-500/20"
                    }`}>
                    {selectedNode.type === "user" ? (
                      selectedNode.avatar ? (
                        <img src={selectedNode.avatar.startsWith('http') ? selectedNode.avatar : `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${selectedNode.avatar.startsWith('/') ? '' : '/'}${selectedNode.avatar}`} alt={selectedNode.name || "avatar"} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-violet-300 font-bold text-lg">
                          {selectedNode.name ? selectedNode.name.charAt(0).toUpperCase() : selectedNode.id.charAt(0).toUpperCase()}
                        </span>
                      )
                    ) : selectedNode.type === "company" ? (
                      <span className="text-2xl">🏢</span>
                    ) : selectedNode.type === "faculty" ? (
                      <span className="text-2xl">🏛️</span>
                    ) : selectedNode.type === "department" ? (
                      <span className="text-2xl">📚</span>
                    ) : selectedNode.type === "skill" ? (
                      <span className="text-2xl">🎯</span>
                    ) : selectedNode.type === "occupation" ? (
                      <span className="text-2xl">💼</span>
                    ) : (
                      <span className="text-2xl">📍</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight truncate">{selectedNode.name || "—"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedNode.type === "user" ? `🪪 รหัสนักศึกษา: ${selectedNode.id}` : `📍 ID: ${selectedNode.id}`}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {selectedNode.faculty && (
                    <div className="flex items-start gap-2 bg-slate-900/50 rounded-lg px-3 py-2">
                      <span className="text-sm mt-0.5">🎓</span>
                      <div className="min-w-0"><p className="text-xs text-slate-500">คณะ</p><p className="text-xs text-slate-200 font-medium">{selectedNode.faculty}</p></div>
                    </div>
                  )}
                  {selectedNode.department && (
                    <div className="flex items-start gap-2 bg-slate-900/50 rounded-lg px-3 py-2">
                      <span className="text-sm mt-0.5">📚</span>
                      <div className="min-w-0"><p className="text-xs text-slate-500">สาขาวิชา</p><p className="text-xs text-slate-200 font-medium">{selectedNode.department}</p></div>
                    </div>
                  )}
                  {selectedNode.occupation && (
                    <div className="flex items-start gap-2 bg-slate-900/50 rounded-lg px-3 py-2">
                      <span className="text-sm mt-0.5">💼</span>
                      <div className="min-w-0"><p className="text-xs text-slate-500">ตำแหน่ง</p><p className="text-xs text-slate-200 font-medium">{selectedNode.occupation}</p></div>
                    </div>
                  )}
                  {selectedNode.company && (
                    <div className="flex items-start gap-2 bg-slate-900/50 rounded-lg px-3 py-2">
                      <span className="text-sm mt-0.5">🏢</span>
                      <div className="min-w-0"><p className="text-xs text-slate-500">หน่วยงาน</p><p className="text-xs text-slate-200 font-medium">{selectedNode.company}</p></div>
                    </div>
                  )}
                  {!selectedNode.faculty && !selectedNode.department && !selectedNode.occupation && !selectedNode.company && (
                    <p className="text-xs text-slate-500 text-center py-2">ยังไม่มีข้อมูลเพิ่มเติม</p>
                  )}
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 text-center mb-3">
                  <p className="text-2xl font-bold text-violet-400">{connectionCount}</p>
                  <p className="text-xs text-slate-400">ความสัมพันธ์ที่แสดงอยู่</p>
                </div>

                {connectionsList.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-400 mb-2">เชื่อมโยงกับ ({connectionsList.length})</p>
                    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {connectionsList.map((conn, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setSelectedNode(conn.node); handleNodeHover(conn.node); }}
                          className="flex items-center justify-between bg-slate-900/40 rounded-lg p-2 border border-slate-700/50 hover:bg-slate-700 hover:border-slate-500 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 whitespace-nowrap">
                              {conn.type === "KNOWS" ? "รู้จัก" :
                                conn.type === "STUDIED_IN" ? "เรียนคณะ" :
                                  conn.type === "BELONGS_TO" ? "สาขาวิชา" :
                                    conn.type === "WORKS_AS" ? "ทำงานที่" :
                                      conn.type === "HAS_SKILL" ? "ทักษะ" :
                                        conn.type === "WORKS_AS_ROLE" ? "อาชีพ" : conn.type}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs text-slate-200 truncate">{conn.node.name || conn.node.id}</span>
                              {conn.type === "KNOWS" && (conn.link.reason_faculty || conn.link.reason_department || conn.link.reason_company || conn.link.reason_year || conn.link.reason_skill || conn.link.reason_occupation) && (
                                <span className="text-[9px] text-slate-400 truncate">
                                  {[
                                    conn.link.reason_year ? `รุ่น ${conn.link.reason_year}` : null,
                                    conn.link.reason_faculty ? `คณะเดียวกัน` : null,
                                    conn.link.reason_department ? `สาขาเดียวกัน` : null,
                                    conn.link.reason_company ? `ที่ทำงานเดียวกัน` : null,
                                    conn.link.reason_skill ? `ทักษะเดียวกัน` : null,
                                    conn.link.reason_occupation ? `อาชีพเดียวกัน` : null
                                  ].filter(Boolean).join(" • ")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => { setSelectedNode(null); setHighlightNodes(new Set()); setHighlightLinks(new Set()); }}
                  className="w-full text-xs text-slate-400 hover:text-slate-200 transition py-1.5 border border-slate-700 rounded-lg hover:border-slate-500">
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
            <div className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl px-4 py-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${loading ? "bg-yellow-400 animate-pulse" : error ? "bg-red-400" : "bg-green-400"}`} />
                <p className="text-xs text-slate-400">
                  {loading ? "กำลังโหลด..." : error ? "เชื่อมต่อไม่ได้" : "โหลดสำเร็จ • Neo4j"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
