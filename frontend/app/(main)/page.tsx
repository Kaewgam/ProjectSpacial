"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────
interface NewsItem {
  id: number;
  category: "ประกาศ" | "กิจกรรม" | "ข่าวสาร" | "โอกาสงาน";
  title: string;
  excerpt: string;
  date: string;
  author: string;
  pinned?: boolean;
  tag?: string;
}

// ─── Mock Data ────────────────────────────────────────
const NEWS_DATA: NewsItem[] = [
  {
    id: 1,
    category: "ประกาศ",
    title: "ขอเชิญศิษย์เก่าร่วมงานคืนสู่เหย้า ประจำปี 2569",
    excerpt:
      "คณะวิทยาศาสตร์และเทคโนโลยีขอเชิญศิษย์เก่าทุกรุ่นร่วมงานคืนสู่เหย้า เพื่อพบปะและแลกเปลี่ยนประสบการณ์ร่วมกัน",
    date: "25 เม.ย. 2569",
    author: "ฝ่ายกิจการศิษย์เก่า",
    pinned: true,
    tag: "ด่วน",
  },
  {
    id: 2,
    category: "กิจกรรม",
    title: "Workshop: AI & Machine Learning สำหรับศิษย์เก่า",
    excerpt:
      "เวิร์คช็อปพิเศษสำหรับศิษย์เก่า เรียนรู้การประยุกต์ใช้ AI และ Machine Learning ในการทำงานจริง วิทยากรโดยศิษย์เก่ารุ่นพี่",
    date: "20 เม.ย. 2569",
    author: "ชมรมศิษย์เก่า IT",
    pinned: true,
  },
  {
    id: 3,
    category: "โอกาสงาน",
    title: "บริษัท TechCorp Thailand เปิดรับสมัครศิษย์เก่า 5 อัตรา",
    excerpt:
      "TechCorp Thailand กำลังมองหาศิษย์เก่าสาขาวิทยาการคอมพิวเตอร์และวิศวกรรมซอฟต์แวร์ เงินเดือนเริ่มต้น 35,000 บาท",
    date: "18 เม.ย. 2569",
    author: "ฝ่ายแนะแนวอาชีพ",
  },
  {
    id: 4,
    category: "ข่าวสาร",
    title: "ศิษย์เก่าคว้ารางวัล Young Entrepreneur Award 2569",
    excerpt:
      "ขอแสดงความยินดีกับคุณ ธนพล สุขสมบูรณ์ ศิษย์เก่ารุ่นที่ 15 ที่ได้รับรางวัล Young Entrepreneur Award จากหอการค้าไทย",
    date: "15 เม.ย. 2569",
    author: "ฝ่ายประชาสัมพันธ์",
  },
  {
    id: 5,
    category: "กิจกรรม",
    title: "กีฬาสีศิษย์เก่าสัมพันธ์ ครั้งที่ 7",
    excerpt:
      "ขอเชิญชวนศิษย์เก่าทุกรุ่นเข้าร่วมการแข่งขันกีฬาสีศิษย์เก่าสัมพันธ์ รับสมัครทีมได้ตั้งแต่วันนี้ถึง 30 เมษายน 2569",
    date: "12 เม.ย. 2569",
    author: "ชมรมกีฬาศิษย์เก่า",
  },
  {
    id: 6,
    category: "ประกาศ",
    title: "อัปเดตข้อมูลศิษย์เก่าประจำปีการศึกษา 2569",
    excerpt:
      "ขอความร่วมมือศิษย์เก่าทุกท่านอัปเดตข้อมูลส่วนตัวในระบบให้เป็นปัจจุบัน เพื่อประโยชน์ในการติดต่อประสานงาน",
    date: "10 เม.ย. 2569",
    author: "ฝ่ายทะเบียนศิษย์เก่า",
  },
];

const CATEGORY_STYLES: Record<
  NewsItem["category"],
  { bg: string; text: string; border: string; dot: string }
> = {
  ประกาศ:   { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200", dot: "#7c3aed" },
  กิจกรรม:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "#059669" },
  ข่าวสาร:  { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200",    dot: "#0284c7" },
  โอกาสงาน: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",  dot: "#d97706" },
};

const ALL_CATEGORIES = ["ทั้งหมด", "ประกาศ", "กิจกรรม", "ข่าวสาร", "โอกาสงาน"] as const;

// ─── Sub Components ───────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl px-6 py-5 flex items-center gap-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: `${accent}18` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function PinnedCard({ item }: { item: NewsItem }) {
  const style = CATEGORY_STYLES[item.category];
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-violet-200 transition-all group cursor-pointer relative overflow-hidden">
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ background: style.dot }}
      />

      {/* Pinned badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-1">
        <span className="text-[10px] text-gray-500 font-semibold">📌 ปักหมุด</span>
      </div>

      {/* Category */}
      <div className="flex items-center gap-2 mb-3 mt-2">
        <div className="w-2 h-2 rounded-full" style={{ background: style.dot }} />
        <span className={`text-xs font-semibold ${style.text} ${style.bg} border ${style.border} px-2 py-0.5 rounded-full`}>
          {item.category}
        </span>
        {item.tag && (
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            {item.tag}
          </span>
        )}
      </div>

      <h3 className="text-gray-800 font-semibold text-base leading-snug mb-2 group-hover:text-violet-700 transition-colors line-clamp-2">
        {item.title}
      </h3>
      <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">{item.excerpt}</p>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">
            👤
          </div>
          <span className="text-xs text-gray-400">{item.author}</span>
        </div>
        <span className="text-xs text-gray-400">{item.date}</span>
      </div>
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const style = CATEGORY_STYLES[item.category];
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-gray-200 transition-all group cursor-pointer">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ background: style.dot }} />
        <span className={`text-xs font-semibold ${style.text} ${style.bg} border ${style.border} px-2 py-0.5 rounded-full`}>
          {item.category}
        </span>
      </div>

      <h3 className="text-gray-800 font-medium text-sm leading-snug mb-2 group-hover:text-violet-700 transition-colors line-clamp-2">
        {item.title}
      </h3>
      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">{item.excerpt}</p>

      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <span className="text-xs text-gray-400">{item.author}</span>
        <span className="text-xs text-gray-400">{item.date}</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("ทั้งหมด");

  const pinned = NEWS_DATA.filter((n) => n.pinned);
  const filtered =
    activeCategory === "ทั้งหมด"
      ? NEWS_DATA.filter((n) => !n.pinned)
      : NEWS_DATA.filter((n) => !n.pinned && n.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* ─── Hero Banner ─── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-gray-400">อัปเดตล่าสุด 25 เม.ย. 2569</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 leading-tight">
              ข่าวสาร &amp; ประกาศ
            </h1>
            <p className="text-gray-500 text-sm max-w-lg">
              ติดตามข่าวสาร กิจกรรม โอกาสงาน และประกาศต่างๆ สำหรับศิษย์เก่า
            </p>
          </div>

          {/* Create Post Button */}
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/create-post"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
            >
              ✏️ สร้างโพสต์
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">


        {/* ─── Pinned Section ─── */}
        {pinned.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-base font-bold text-gray-700">📌 ประกาศสำคัญ</h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {pinned.map((item) => (
                <PinnedCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* ─── News Section ─── */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-base font-bold text-gray-700">🗞️ ข่าวสารทั้งหมด</h2>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap mb-6">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-sm px-4 py-1.5 rounded-full border transition-all font-medium ${
                  activeCategory === cat
                    ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                    : "border-gray-200 text-gray-500 bg-white hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          {filtered.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm">ไม่มีข่าวสารในหมวดหมู่นี้</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}