"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ImagePlus, X,
  AlignLeft, Tag, User, FileText, Send, Trash2
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ────────────────────────────────────────────────────
interface CategoryDef {
  value: string;
  label: string;
  icon: string;
  text: string;
  border: string;
  bg: string;
}

function CharCounter({ current, max, warn = 0.8 }: { current: number; max: number; warn?: number }) {
  const ratio = current / max;
  const color = ratio >= 1 ? "text-red-500" : ratio >= warn ? "text-amber-500" : "text-gray-400";
  return <span className={`text-xs ${color}`}>{current}/{max}</span>;
}

function Label({ icon, text, required }: { icon: React.ReactNode; text: string; required?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
      <span className="text-gray-400">{icon}</span>
      {text}
      {required && <span className="text-red-400 text-xs">*</span>}
    </label>
  );
}

export default function EditPostPage() {
  const router  = useRouter();
  const params  = useParams();
  const id      = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [loadingInitial, setLoadingInitial] = useState(true);
  
  const [title, setTitle]       = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [excerpt, setExcerpt]   = useState("");
  const [content, setContent]   = useState("");
  const [author, setAuthor]     = useState("");
  const [pinned, setPinned]     = useState(false);
  const [is_active, setIsActive] = useState(true);
  
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");

  // ── Guard: เฉพาะ Admin ──
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  // ── ดึง Categories จาก API ──
  useEffect(() => {
    api.get("/api/posts/categories/").then(res => setCategories(res.data)).catch(console.error);
  }, []);

  // ── Load Initial Data ──
  useEffect(() => {
    if (!id || authLoading) return;
    
    api.get(`/api/posts/${id}/`)
      .then(res => {
        const p = res.data;
        setTitle(p.title || "");
        setCategory((p.category as Category) || "");
        setExcerpt(p.excerpt || "");
        setContent(p.content || "");
        setAuthor(p.author || "");
        setPinned(p.pinned || false);
        setIsActive(p.is_active ?? true);
        if (p.cover_image) {
           setPreviewUrl(p.cover_image);
        }
      })
      .catch(err => {
         setError("ไม่พบโพสต์ที่ต้องการแก้ไข หรือมีข้อผิดพลาด");
      })
      .finally(() => {
         setLoadingInitial(false);
      });
  }, [id, authLoading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("รูปภาพต้องมีขนาดไม่เกิน 5MB"); return; }
    setCoverImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
  };

  const removeImage = () => { 
    setCoverImage(null); 
    setPreviewUrl(null); 
  };

  const isValid = title.trim().length > 0 && category !== "" && content.trim().length > 0;

  // ── Submit → PATCH /api/posts/<id>/ ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title",    title.trim());
      formData.append("excerpt",  excerpt.trim());
      formData.append("content",  content.trim());
      formData.append("category", category);
      formData.append("author",   author.trim());
      formData.append("pinned",   String(pinned));
      formData.append("is_active", String(is_active));
      
      if (coverImage) {
        formData.append("cover_image", coverImage);
      }

      await api.patch(`/api/posts/${id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSubmitted(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).join(", ")
        : err?.response?.data?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete → DELETE /api/posts/<id>/ ──
  const handleDelete = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้")) return;
    setDeleting(true);
    try {
      await api.delete(`/api/posts/${id}/`);
      router.push("/");
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดในการลบโพสต์");
      setDeleting(false);
    }
  };

  // ─── Loading / Unauthorized ───────────────────────
  if (authLoading || loadingInitial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") return null;

  // ─── Success State ─────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center max-w-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">อัปเดตโพสต์สำเร็จ!</h2>
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
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ChevronLeft size={18} /> กลับหน้าหลัก
          </Link>
          <h1 className="text-base font-bold text-gray-800">✏️ แก้ไขโพสต์</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting || deleting}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
               {deleting ? "กำลังลบ..." : <Trash2 size={16} />}
            </button>
            <button
              form="post-form"
              type="submit"
              disabled={!isValid || submitting}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all active:scale-95 shadow-sm"
            >
              {submitting
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Send size={14} />}
              {submitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Form ─── */}
      <form id="post-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            ⚠️ {error}
          </div>
        )}

        {/* Category */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <Label icon={<Tag size={15} />} text="หมวดหมู่" required />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  category === cat.value
                    ? `${cat.bg} ${cat.border} ${cat.text}`
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
            placeholder="เขียนสรุปเนื้อหาสั้นๆ..."
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
          <Label icon={<ImagePlus size={15} />} text="รูปภาพประกอบ (อัปโหลดรูปใหม่จะแทนที่รูปเดิม)" />
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
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          )}
        </div>

        {/* Author + Pinned */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <Label icon={<User size={15} />} text="ผู้โพสต์ / หน่วยงาน" />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="เช่น ฝ่ายกิจการศิษย์เก่า, ชมรม IT"
              className="w-full text-sm text-gray-700 placeholder-gray-300 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-300 transition"
            />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-700">📌 ปักหมุดโพสต์นี้</p>
              <p className="text-xs text-gray-400 mt-0.5">โพสต์จะแสดงที่ด้านบนสุดของหน้าหลัก</p>
            </div>
            <button
              type="button"
              onClick={() => setPinned((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${pinned ? "bg-violet-500" : "bg-gray-200"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${pinned ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-700">👁️ สถานะการแสดงผล</p>
              <p className="text-xs text-gray-400 mt-0.5">ปิดการใช้งานหากต้องการซ่อนโพสต์</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${is_active ? "bg-emerald-500" : "bg-gray-200"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${is_active ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
