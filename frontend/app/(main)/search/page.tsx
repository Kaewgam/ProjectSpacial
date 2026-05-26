"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, User, Briefcase, Building2, MapPin, SlidersHorizontal } from "lucide-react";
import api from "@/lib/api";
import { useFacultyDept } from "@/lib/useFacultyDept";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

// ─── Types ───────────────────────────────────────────
interface AlumniResult {
    id: string;
    student_id: string;
    email: string;
    role: string;
    date_joined: string;
    avatar: string | null;
    first_name?: string;
    last_name?: string;
    faculty?: string;
    department?: string;
    occupation?: string;
    company?: string;
    educations?: { faculty?: string; department?: string; degree_level?: string; graduation_year?: string }[];
    careers?: { occupation?: string; company?: string; is_current?: boolean; start_year?: string; end_year?: string }[];
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    ALUMNI: { label: "ศิษย์เก่า", color: "bg-violet-100 text-violet-700 border-violet-200" },
    ADMIN: { label: "ผู้ดูแลระบบ", color: "bg-red-100 text-red-700 border-red-200" },
};

// ─── Result Card ─────────────────────────────────────
function AlumniCard({ alum }: { alum: AlumniResult }) {
    const { user } = useAuth();
    const router = useRouter();
    const roleInfo = ROLE_LABELS[alum.role] ?? { label: alum.role, color: "bg-gray-100 text-gray-600 border-gray-200" };
    const displayName = alum.first_name
        ? `${alum.first_name} ${alum.last_name ?? ""}`.trim()
        : alum.student_id;

    const handleClick = () => {
        if (!user) {
            toast.error("กรุณาเข้าสู่ระบบเพื่อดูข้อมูลศิษย์เก่า");
            return;
        }
        router.push(`/alumni/${alum.id}`);
    };

    return (
        <div 
            onClick={handleClick}
            className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-violet-200 transition-all group cursor-pointer"
        >
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    {alum.avatar ? (
                        <img src={alum.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white font-bold text-lg">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-800 group-hover:text-violet-700 transition-colors truncate">
                            {displayName}
                        </p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleInfo.color}`}>
                            {roleInfo.label}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">🪪 {alum.student_id} &nbsp;·&nbsp; {alum.email}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        {alum.educations && alum.educations.length > 0 ? alum.educations.map((edu, idx) => (
                            <div key={`edu-${idx}`} className="flex flex-wrap gap-2">
                                {edu.faculty && (
                                    <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-full px-3 py-1" title={edu.faculty}>
                                        <Building2 size={11} className="text-violet-500 flex-shrink-0" />
                                        <span className="text-xs text-violet-700 truncate max-w-[140px]">{edu.faculty}</span>
                                    </div>
                                )}
                                {edu.department && (
                                    <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-100 rounded-full px-3 py-1" title={edu.department}>
                                        <MapPin size={11} className="text-sky-500 flex-shrink-0" />
                                        <span className="text-xs text-sky-700 truncate max-w-[140px]">{edu.department}</span>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <>
                                {alum.faculty && (
                                    <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-full px-3 py-1">
                                        <Building2 size={11} className="text-violet-500 flex-shrink-0" />
                                        <span className="text-xs text-violet-700 truncate max-w-[140px]">{alum.faculty}</span>
                                    </div>
                                )}
                                {alum.department && (
                                    <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-100 rounded-full px-3 py-1">
                                        <MapPin size={11} className="text-sky-500 flex-shrink-0" />
                                        <span className="text-xs text-sky-700 truncate max-w-[140px]">{alum.department}</span>
                                    </div>
                                )}
                            </>
                        )}

                        {alum.careers && alum.careers.length > 0 ? alum.careers.map((car, idx) => (
                            <div key={`car-${idx}`} className="flex flex-wrap gap-2">
                                {car.occupation && (
                                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1" title={car.occupation}>
                                        <Briefcase size={11} className="text-amber-600 flex-shrink-0" />
                                        <span className="text-xs text-amber-700 truncate max-w-[140px]">{car.occupation}</span>
                                    </div>
                                )}
                                {car.company && (
                                    <div className="flex items-center gap-1.5 bg-pink-50 border border-pink-100 rounded-full px-3 py-1" title={car.company}>
                                        <Building2 size={11} className="text-pink-600 flex-shrink-0" />
                                        <span className="text-xs text-pink-700 truncate max-w-[140px]">{car.company}</span>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <>
                                {alum.occupation && (
                                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
                                        <Briefcase size={11} className="text-amber-600 flex-shrink-0" />
                                        <span className="text-xs text-amber-700 truncate max-w-[140px]">{alum.occupation}</span>
                                    </div>
                                )}
                                {alum.company && (
                                    <div className="flex items-center gap-1.5 bg-pink-50 border border-pink-100 rounded-full px-3 py-1">
                                        <Building2 size={11} className="text-pink-600 flex-shrink-0" />
                                        <span className="text-xs text-pink-700 truncate max-w-[140px]">{alum.company}</span>
                                    </div>
                                )}
                            </>
                        )}
                        
                        {!(alum.educations?.length) && !(alum.careers?.length) && !alum.faculty && !alum.department && !alum.occupation && !alum.company && (
                            <span className="text-xs text-gray-400 italic">ยังไม่มีข้อมูลเพิ่มเติม</span>
                        )}
                    </div>
                </div>

                {/* Date */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-xs text-gray-400">เข้าร่วม</p>
                    <p className="text-xs font-medium text-gray-600">{alum.date_joined}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────
// 📌 [สำหรับตอนพรีเซนต์: หน้าค้นหาศิษย์เก่า (Filter & Search)]
// หน้านี้ออกแบบมาเพื่อให้ค้นหาและกรองข้อมูลแบบมีเงื่อนไข (เช่น คณะ, สาขา) จากตาราง PostgreSQL ได้อย่างรวดเร็ว
export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [faculty, setFaculty] = useState("");
    const [department, setDepartment] = useState("");
    const [occupation, setOccupation] = useState("");
    const [company, setCompany] = useState("");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    const [results, setResults] = useState<AlumniResult[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const { faculties, departments: allDepartments } = useFacultyDept();
    const filteredDepts = faculty 
        ? allDepartments.filter(d => String(d.faculty_id) === String(faculties.find(f => f.name === faculty)?.id))
        : allDepartments;

    const fetchResults = useCallback(
        async (q: string, fac: string, dep: string, occ: string, comp: string, p: number) => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (q) params.set("q", q);
                if (fac) params.set("faculty", fac);
                if (dep) params.set("department", dep);
                if (occ) params.set("occupation", occ);
                if (comp) params.set("company", comp);
                params.set("page", String(p));

                const res = await api.get(`/api/alumni/search/?${params}`);
                const data = res.data;
                setResults(data.results || []);
                setTotal(data.total || 0);
                setTotalPages(data.total_pages || 0);
                setSearched(true);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Fetch only when page changes AND user has already searched at least once
    useEffect(() => {
        if (searched) {
            fetchResults(query, faculty, department, occupation, company, page);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchResults(query, faculty, department, occupation, company, 1);
    };

    const hasActiveFilters = !!(faculty || department || occupation || company);

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-center" />

            {/* ─── Header ─── */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">🔍 ค้นหาศิษย์เก่า</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">

                {/* ─── Search Form ─── */}
                <form onSubmit={handleSearch} className="mb-6">
                    {/* Filter Panel (Always Visible) */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            {/* Faculty */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                                    <Building2 size={13} className="text-violet-500" /> คณะ
                                </label>
                                <select
                                    value={faculty}
                                    onChange={(e) => {
                                        setFaculty(e.target.value);
                                        setDepartment("");
                                    }}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-violet-300 focus:border-violet-400 focus:outline-none transition text-black"
                                >
                                    <option value="">ทุกคณะ</option>
                                    {faculties.map((f) => (
                                        <option key={f.id} value={f.name}>{f.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Department */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                                    <MapPin size={13} className="text-sky-500" /> หลักสูตร/สาขาวิชา
                                </label>
                                <select
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    disabled={!faculty}
                                    className={`w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-300 focus:border-sky-400 focus:outline-none transition text-black ${!faculty ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    <option value="">ทุกสาขาวิชา</option>
                                    {filteredDepts.map((d) => (
                                        <option key={d.id} value={d.original_name || d.name}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Occupation */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                                    <Briefcase size={13} className="text-amber-500" /> ตำแหน่ง
                                </label>
                                <input
                                    value={occupation}
                                    onChange={(e) => setOccupation(e.target.value)}
                                    placeholder="เช่น Software Engineer"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-300 focus:border-amber-400 focus:outline-none transition text-black"
                                />
                            </div>

                            {/* Company */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                                    <Building2 size={13} className="text-pink-500" /> หน่วยงาน / สังกัด
                                </label>
                                <input
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    placeholder="เช่น บริษัท, โรงงาน, สถาบัน"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-300 focus:border-pink-400 focus:outline-none transition text-black"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-4">
                            {hasActiveFilters || query ? (
                                <button
                                    type="button"
                                    onClick={() => { setQuery(""); setFaculty(""); setDepartment(""); setOccupation(""); setCompany(""); }}
                                    className="text-xs text-red-500 hover:text-red-700 transition underline font-medium"
                                >
                                    ล้างข้อมูลทั้งหมด
                                </button>
                            ) : (
                                <div></div>
                            )}
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition shadow-sm text-sm flex items-center gap-2"
                            >
                                <Search size={16} /> ค้นหา
                            </button>
                        </div>
                    </div>
                </form>

                {/* ─── Loading ─── */}
                {loading && (
                    <div className="text-center py-16 text-gray-400">
                        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-violet-500 rounded-full animate-spin mb-4" />
                        <p className="text-sm">กำลังค้นหา...</p>
                    </div>
                )}

                {/* ─── Empty (no search yet) ─── */}
                {!loading && !searched && (
                    <div className="text-center py-20 text-gray-400">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Search size={28} className="text-gray-300" />
                        </div>
                        <p className="font-medium text-gray-500">เริ่มต้นค้นหาศิษย์เก่า</p>
                    </div>
                )}

                {/* ─── No Results ─── */}
                {!loading && searched && results.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <User size={28} className="text-gray-300" />
                        </div>
                        <p className="font-medium text-gray-500">ไม่พบข้อมูลที่ตรงกัน</p>
                        <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                    </div>
                )}

                {/* ─── Results ─── */}
                {!loading && results.length > 0 && (
                    <>
                        <p className="text-sm text-gray-500 mb-4">
                            พบ <span className="font-semibold text-gray-800">{total}</span> รายการ
                        </p>

                        <div className="grid gap-3">
                            {results.map((alum) => (
                                <AlumniCard key={alum.id} alum={alum} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8">
                                <button
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-sm text-gray-600">
                                    หน้า <span className="font-semibold text-gray-800">{page}</span> จาก {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
