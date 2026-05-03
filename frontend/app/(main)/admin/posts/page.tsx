"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus, Trash2, Pin, PinOff, Eye, EyeOff,
  RefreshCw, ChevronLeft, AlertTriangle
} from "lucide-react";

interface Post {
  id:          string;
  title:       string;
  category:    string;
  author:      string;
  pinned:      boolean;
  is_active:   boolean;
  created_at:  string;
  cover_image: string | null;
  excerpt:     string;
}

const DEFAULT_CAT_STYLE = "bg-gray-50 text-gray-600 border-gray-200";


export default function AdminPostsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [posts,      setPosts]      = useState<Post[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [confirm,    setConfirm]    = useState<string | null>(null);
  const [catColors,  setCatColors]  = useState<Record<string, string>>({});

  // Guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) router.replace("/");
  }, [user, authLoading, router]);

  // ดึง categories จาก API
  useEffect(() => {
    api.get("/api/posts/categories/").then(res => {
      const map: Record<string, string> = {};
      res.data.forEach((c: any) => {
        map[c.value] = `${c.bg} ${c.text} ${c.border}`;
      });
      setCatColors(map);
    }).catch(console.error);
  }, []);

  const fetchPosts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/posts/?page=${p}&limit=10`);
      setPosts(res.data.results || []);
      setTotalPages(res.data.total_pages || 1);
      setTotal(res.data.total || 0);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(page); }, [page, fetchPosts]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete(`/api/posts/${id}/`);
      fetchPosts(page);
    } catch { alert("ลบไม่สำเร็จ"); }
    finally { setDeleting(null); setConfirm(null); }
  };

  const togglePinned = async (post: Post) => {
    try {
      await api.patch(`/api/posts/${post.id}/`, { pinned: !post.pinned });
      fetchPosts(page);
    } catch { alert("อัปเดตไม่สำเร็จ"); }
  };

  const toggleActive = async (post: Post) => {
    try {
      await api.patch(`/api/posts/${post.id}/`, { is_active: !post.is_active });
      fetchPosts(page);
    } catch { alert("อัปเดตไม่สำเร็จ"); }
  };

  if (authLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition">
              <ChevronLeft size={16} /> Admin
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-base font-bold text-gray-800">📋 จัดการโพสต์</h1>
            <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {total} โพสต์
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchPosts(page)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-2 transition hover:border-gray-300"
            >
              <RefreshCw size={14} /> รีเฟรช
            </button>
            <Link
              href="/create-post"
              className="flex items-center gap-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              <Plus size={14} /> สร้างโพสต์ใหม่
            </Link>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 h-16 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500 text-sm mb-4">ยังไม่มีโพสต์ในระบบ</p>
            <Link href="/create-post" className="text-sm text-violet-600 hover:underline font-medium">
              + สร้างโพสต์แรก
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 border-b border-gray-100 bg-gray-50">
                <div className="col-span-5">หัวข้อ</div>
                <div className="col-span-2">หมวดหมู่</div>
                <div className="col-span-2">ผู้โพสต์</div>
                <div className="col-span-1">วันที่</div>
                <div className="col-span-2 text-right">จัดการ</div>
              </div>

              {posts.map((post) => (
                <div
                  key={post.id}
                  className={`grid grid-cols-12 items-center px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition ${!post.is_active ? "opacity-50" : ""}`}
                >
                  {/* Title */}
                  <div className="col-span-5 flex items-start gap-2.5">
                    {post.cover_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{post.title}</p>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{post.excerpt}</p>
                      <div className="flex gap-1.5 mt-1">
                        {post.pinned && (
                          <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full font-semibold">📌 ปักหมุด</span>
                        )}
                        {!post.is_active && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full font-semibold">ซ่อน</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="col-span-2">
                    <span className={`text-xs font-semibold border px-2 py-0.5 rounded-full ${catColors[post.category] || DEFAULT_CAT_STYLE}`}>
                      {post.category}
                    </span>
                  </div>

                  {/* Author */}
                  <div className="col-span-2 text-sm text-gray-500 truncate">{post.author || "—"}</div>

                  {/* Date */}
                  <div className="col-span-1 text-xs text-gray-400">{post.created_at}</div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    {/* Toggle pinned */}
                    <button
                      onClick={() => togglePinned(post)}
                      title={post.pinned ? "เลิกปักหมุด" : "ปักหมุด"}
                      className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-500 transition"
                    >
                      {post.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                    </button>

                    {/* Toggle active */}
                    <button
                      onClick={() => toggleActive(post)}
                      title={post.is_active ? "ซ่อนโพสต์" : "แสดงโพสต์"}
                      className="p-1.5 rounded-lg hover:bg-sky-50 text-gray-400 hover:text-sky-500 transition"
                    >
                      {post.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>

                    {/* Delete */}
                    {confirm === post.id ? (
                      <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                        <AlertTriangle size={12} className="text-red-500" />
                        <span className="text-xs text-red-600">ยืนยัน?</span>
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={deleting === post.id}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 ml-1"
                        >
                          {deleting === post.id ? "..." : "ลบ"}
                        </button>
                        <button onClick={() => setConfirm(null)} className="text-xs text-gray-400 hover:text-gray-600 ml-1">ยกเลิก</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirm(post.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                        title="ลบโพสต์"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-5">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${
                      page === i + 1
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-500 hover:border-violet-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
