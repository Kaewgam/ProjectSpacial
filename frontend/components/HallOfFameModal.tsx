import React, { useEffect } from "react";
import { BookOpen, Trophy, Briefcase, Heart, Palette, Sparkles, X, Building2, MapPin, GraduationCap, Calendar } from "lucide-react";

export interface Alumnus {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string | null;
  faculty: string;
  department: string;
  graduation_year: string;
  skills: string[];
}

export interface HallOfFameEntry {
  id: number;
  user: Alumnus;
  award_year: string;
  category: string;
  category_display: string;
  title: string;
  description: string;
  image: string | null;
}

export const CATEGORIES = [
  { value: "", label: "ทั้งหมด", icon: Trophy, bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", dot: "#6b7280" },
  { value: "ACADEMIC", label: "วิชาการดีเด่น", icon: BookOpen, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "#3b82f6" },
  { value: "BUSINESS", label: "ความสำเร็จในอาชีพ/ธุรกิจ", icon: Briefcase, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "#10b981" },
  { value: "SOCIAL", label: "ทำประโยชน์ต่อสังคม", icon: Heart, bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "#f43f5e" },
  { value: "SPORTS_ARTS", label: "กีฬาและศิลปวัฒนธรรม", icon: Palette, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "#a855f7" },
];

export function HallOfFameModal({
  entry,
  catStyle,
  onClose,
}: {
  entry: HallOfFameEntry;
  catStyle: (typeof CATEGORIES)[number];
  onClose: () => void;
}) {
  const CatIcon = catStyle.icon;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">


        {/* Top colored strip */}
        <div className="w-full h-1.5 flex-shrink-0" style={{ background: catStyle.dot }} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors shadow-sm z-10"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">

          {/* User Info Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
              {entry.user.avatar ? (
                <img src={entry.user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white font-bold text-2xl">
                  {entry.user.first_name ? entry.user.first_name.charAt(0) : entry.user.student_id.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-1">
                {entry.user.first_name} {entry.user.last_name}
              </h2>
              <p className="text-sm text-gray-500">รหัสนักศึกษา: {entry.user.student_id}</p>
            </div>
          </div>

          {/* Info Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {entry.user.faculty && (
              <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-full px-3 py-1">
                <Building2 size={12} className="text-violet-500 flex-shrink-0" />
                <span className="text-xs text-violet-700">{entry.user.faculty}</span>
              </div>
            )}
            {entry.user.department && (
              <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-100 rounded-full px-3 py-1">
                <MapPin size={12} className="text-sky-500 flex-shrink-0" />
                <span className="text-xs text-sky-700">{entry.user.department}</span>
              </div>
            )}
            {entry.user.graduation_year && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                <GraduationCap size={12} className="text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-emerald-700">รุ่นปีการศึกษา {entry.user.graduation_year}</span>
              </div>
            )}
          </div>

          {/* Award Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CatIcon size={16} style={{ color: catStyle.dot }} />
              <span className={`text-xs font-semibold ${catStyle.text} ${catStyle.bg} border ${catStyle.border} px-2.5 py-1 rounded-full`}>
                {entry.category_display}
              </span>
              <span className="text-xs text-gray-500 ml-auto flex items-center gap-1">
                <Calendar size={12} /> ปี {entry.award_year}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug">
              {entry.title}
            </h3>
            {entry.image && (
              <div className="mb-4 w-full rounded-xl overflow-hidden flex justify-center bg-gray-100">
                <img src={entry.image} alt={entry.title} className="max-w-full max-h-80 object-contain" />
              </div>
            )}
          </div>

          {/* Description Section */}
          {entry.description && (
            <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-violet-600" />
                รายละเอียดผลงาน
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {entry.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-100 p-4 sm:px-8 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-lg">
              🏆
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">หอเกียรติยศ</p>
              <p className="text-xs text-gray-500">Alumni Network System</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
