"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, Award, BookOpen, Briefcase, Heart, Sparkles, Trophy, Palette, ChevronRight, X, Building2, MapPin, GraduationCap, Calendar } from "lucide-react";

import { CATEGORIES, HallOfFameEntry, HallOfFameModal } from "@/components/HallOfFameModal";

export default function HallOfFamePage() {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [year, setYear] = useState("");
  const [years, setYears] = useState<string[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HallOfFameEntry | null>(null);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.q = search;
      if (category) params.category = category;
      if (year) params.award_year = year;

      const res = await api.get("/api/hall-of-fame/", { params });
      setEntries(res.data);

      // Extract unique years for the dropdown filter if years list is empty
      if (years.length === 0) {
        const uniqueYears = (Array.from(
          new Set(res.data.map((e: HallOfFameEntry) => e.award_year))
        ) as string[]).sort((a, b) => b.localeCompare(a));
        setYears(uniqueYears);
      }
    } catch (err) {
      console.error("Failed to fetch Hall of Fame:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, year]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEntries();
  };

  const getCategoryStyle = (cat: string) => {
    return CATEGORIES.find(c => c.value === cat) || CATEGORIES[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* ─── Hero Banner ─── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Trophy size={20} className="text-violet-600" />
            </div>
            <span className="text-xs font-bold tracking-widest text-violet-600 uppercase">Hall of Fame</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 leading-tight">
            หอเกียรติยศ
          </h1>
          <p className="text-gray-500 text-sm max-w-lg">
            เชิดชูเกียรติศิษย์เก่าผู้ประสบความสำเร็จ สร้างชื่อเสียง และทำคุณประโยชน์แก่สังคม
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">

        {/* ─── Search & Filter Bar ─── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Search Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ค้นหา</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อ, รหัสนักศึกษา, หรือผลงาน..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-violet-400 rounded-xl px-4 py-2.5 pl-10 text-gray-800 placeholder-gray-400 outline-none transition-all text-sm"
                />
                <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
              </div>
            </div>

            {/* Year Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ปีที่ได้รับรางวัล</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-violet-400 rounded-xl px-4 py-2.5 text-gray-800 outline-none transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="">ทั้งหมด</option>
                {years.map(y => (
                  <option key={y} value={y}>ปีการศึกษา {y}</option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Search size={16} />
              ค้นหาข้อมูล
            </button>
          </form>
        </div>

        {/* ─── Category Filter Pills ─── */}
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-base font-bold text-gray-700">🏆 หมวดหมู่รางวัล</h2>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = category === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 text-sm px-4 py-1.5 rounded-full border transition-all font-medium ${
                  isSelected
                    ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                    : "border-gray-200 text-gray-500 bg-white hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <Icon size={14} className={isSelected ? "text-white" : ""} style={!isSelected ? { color: cat.dot } : undefined} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Content List ─── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white border border-gray-100 rounded-2xl p-6 h-56 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 mt-6">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white border border-gray-100 rounded-2xl">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-sm">ไม่พบข้อมูลศิษย์เก่าในหอเกียรติยศที่ตรงตามเงื่อนไข</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {entries.map(entry => {
              const catStyle = getCategoryStyle(entry.category);
              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative cursor-pointer"
                >
                  {/* Top Image */}
                  <div className="w-full aspect-[4/3] bg-gray-100 overflow-hidden relative">
                    {entry.user.avatar ? (
                        <img src={entry.user.avatar} alt={entry.user.first_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                           <Award size={48} className="mb-2 opacity-50" />
                           <span className="text-xs">ไม่มีรูปภาพ</span>
                        </div>
                    )}
                  </div>
                  
                  {/* Content area */}
                  <div className="p-5 flex flex-col min-h-[140px]">
                      <h4 className="text-[16px] font-bold text-gray-800 mb-3 leading-snug line-clamp-2 group-hover:text-violet-600 transition-colors">
                        {entry.user.first_name} {entry.user.last_name}
                      </h4>
                      <div className="space-y-2 mt-auto">
                         <p className="text-xs text-gray-600 flex items-center gap-1.5 font-medium">
                           <Trophy size={14} className="text-amber-500" /> {entry.category_display}
                         </p>
                         {entry.user.faculty && (
                           <p className="text-xs text-gray-500 flex items-center gap-1.5">
                             <Building2 size={14} className="text-gray-400" /> {entry.user.faculty}
                           </p>
                         )}
                         <p className="text-xs text-gray-500 flex items-center gap-1.5">
                           <Calendar size={14} className="text-gray-400" /> ศิษย์เก่าดีเด่น ปี {entry.award_year}
                         </p>
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Detail Modal ─── */}
      {selectedEntry && (
        <HallOfFameModal
          entry={selectedEntry}
          catStyle={getCategoryStyle(selectedEntry.category)}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}



