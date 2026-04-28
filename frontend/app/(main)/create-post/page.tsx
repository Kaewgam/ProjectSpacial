"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ImagePlus,
  X,
  AlignLeft,
  Tag,
  User,
  FileText,
  Send,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────
type Category = "ประกาศ" | "กิจกรรม" | "ข่าวสาร" | "โอกาสงาน";

const CATEGORIES: { value: Category; label: string; icon: string; color: string; border: string; bg: string }[] = [
  { value: "ประกาศ",   label: "ประกาศ",    icon: "📢", color: "text-violet-700", border: "border-violet-300", bg: "bg-violet-50" },
  { value: "กิจกรรม",  label: "กิจกรรม",   icon: "📅", color: "text-emerald-700", border: "border-emerald-300", bg: "bg-emerald-50" },
  { value: "ข่าวสาร",  label: "ข่าวสาร",   icon: "🗞️", color: "text-sky-700", border: "border-sky-300", bg: "bg-sky-50" },
  { value: "โอกาสงาน", label: "โอกาสงาน",  icon: "💼", color: "text-amber-700", border: "border-amber-300", bg: "bg-amber-50" },
];

// ─── Character counter ────────────────────────────────
function CharCounter({ current, max, warn = 0.8 }: { current: number; max: number; warn?: number }) {
  const ratio = current / max;
  const color = ratio >= 1 ? "text-red-500" : ratio >= warn ? "text-amber-500" : "text-gray-400";
  return (
    <span className={`text-xs ${color}`}>
      {current}/{max}
    </span>
  );
}

// ─── Section Label ────────────────────────────────────
function Label({ icon, text, required }: { icon: React.ReactNode; text: string; required?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
      <span className="text-gray-400">{icon}</span>
      {text}
      {required && <span className="text-red-400 text-xs">*</span>}
    </label>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function CreatePostPage() {
  const router = useRouter();

  const [title, setTitle]         = useState("");
  const [category, setCategory]   = useState<Category | "">("");
  const [excerpt, setExcerpt]     = useState("");
  const [content, setContent]     = useState("");
  const [author, setAuthor]       = useState("");
  const [pinned, setPinned]       = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Image handler ──
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setCoverImage(null);
    setPreviewUrl(null);
  };

  // ── Validation ──
  const isValid = title.trim().length > 0 && category !== "" && content.trim().length > 0;

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);

    try {
      // TODO: เชื่อม API จริง
      await new Promise((r) => setTimeout(r, 1000)); // mock delay
      setSubmitted(true);
      setTimeout(() => router.push("/"), 1500);
    } catch {
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Success State ─────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center max-w-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ✅
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">โพสต์สำเร็จ!</h2>
          <p className="text-sm text-gray-500">กำลังพาคุณกลับหน้าหลัก...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ─── Top Bar ─── */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft size={18} />
            กลับหน้าหลัก
          </Link>

          <h1 className="text-base font-bold text-gray-800">✏️ สร้างโพสต์ใหม่</h1>

          <button
            form="post-form"
            type="submit"
            disabled={!isValid || submitting}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {submitting ? "กำลังโพสต์..." : "โพสต์"}
          </button>
        </div>
      </div>

      {/* ─── Form ─── */}
      <form id="post-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Category */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <Label icon={<Tag size={15} />} text="หมวดหมู่" required />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  category === cat.value
                    ? `${cat.bg} ${cat.border} ${cat.color}`
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <Label icon={<FileText size={15} />} text="หัวข้อโพสต์" required />
            <CharCounter current={title.length} max={120} />
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 120))}
            placeholder="กรอกหัวข้อที่น่าสนใจ..."
            className="w-full text-lg font-medium text-gray-800 placeholder-gray-300 border-0 outline-none focus:ring-0 resize-none"
          />
        </div>

        {/* Excerpt */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <Label icon={<AlignLeft size={15} />} text="สรุปย่อ (แสดงในหน้ารายการ)" />
            <CharCounter current={excerpt.length} max={200} />
          </div>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value.slice(0, 200))}
            placeholder="เขียนสรุปเนื้อหาสั้นๆ เพื่อให้ผู้อ่านเข้าใจภาพรวม..."
            rows={3}
            className="w-full text-sm text-gray-700 placeholder-gray-300 border-0 outline-none focus:ring-0 resize-none leading-relaxed"
          />
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <Label icon={<AlignLeft size={15} />} text="เนื้อหาโพสต์" required />
            <CharCounter current={content.length} max={5000} warn={0.9} />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 5000))}
            placeholder="เขียนเนื้อหารายละเอียดที่ต้องการแชร์กับศิษย์เก่า..."
            rows={10}
            className="w-full text-sm text-gray-700 placeholder-gray-300 border-0 outline-none focus:ring-0 resize-none leading-loose"
          />
        </div>

        {/* Cover Image */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <Label icon={<ImagePlus size={15} />} text="รูปภาพประกอบ" />
          {previewUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="cover" className="w-full h-52 object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-3 right-3 bg-white/80 backdrop-blur hover:bg-white text-gray-700 rounded-full p-1.5 shadow transition"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-gray-200 hover:border-violet-300 hover:bg-violet-50/30 cursor-pointer transition-all group">
              <ImagePlus size={28} className="text-gray-300 group-hover:text-violet-400 mb-2 transition-colors" />
              <span className="text-sm text-gray-400 group-hover:text-violet-500 transition-colors">คลิกเพื่ออัปโหลดรูปภาพ</span>
              <span className="text-xs text-gray-300 mt-1">PNG, JPG ขนาดไม่เกิน 5MB</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          )}
        </div>

        {/* Author + Options */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          {/* Author */}
          <div>
            <Label icon={<User size={15} />} text="ผู้โพสต์ / หน่วยงาน" />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="เช่น ฝ่ายกิจการศิษย์เก่า, ชมรม IT"
              className="w-full text-sm text-gray-700 placeholder-gray-300 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition"
            />
          </div>

          {/* Pinned toggle */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-700">📌 ปักหมุดโพสต์นี้</p>
              <p className="text-xs text-gray-400 mt-0.5">โพสต์จะแสดงที่ด้านบนสุดของหน้าหลัก</p>
            </div>
            <button
              type="button"
              onClick={() => setPinned((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                pinned ? "bg-violet-500" : "bg-gray-200"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  pinned ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Validation hint */}
        {!isValid && (
          <p className="text-xs text-gray-400 text-center">
            กรุณากรอก <span className="text-red-400 font-medium">หมวดหมู่ • หัวข้อ • เนื้อหา</span> ก่อนโพสต์
          </p>
        )}

        {/* Submit (mobile) */}
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-95 shadow-sm sm:hidden"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {submitting ? "กำลังโพสต์..." : "โพสต์"}
        </button>

      </form>
    </div>
  );
}
