"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { X, Pencil } from "lucide-react";

// ─── Types ───────────────────────────────────────────
interface Post {
  id:          string;
  category:    "ประกาศ" | "กิจกรรม" | "ข่าวสาร" | "ประกาศสมัครงาน";
  title:       string;
  excerpt:     string;
  content:     string;
  created_at:  string;
  author:      string;
  pinned:      boolean;
  is_active?:  boolean;
  cover_image: string | null;
}

interface CategoryDef {
  id: string;
  value: string;
  label: string;
  icon: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}


// ─── Sub Components ───────────────────────────────────
function PinnedCard({ item, onClick, styleMap }: { item: Post; onClick: () => void; styleMap: Record<string, any> }) {
  const style = styleMap[item.category] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "#6b7280" };
  return (
    <div 
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-violet-200 transition-all group cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: style.dot }} />
      {item.cover_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.cover_image} alt={item.title} className="w-full h-36 object-cover rounded-xl mb-4" />
      )}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
        {item.is_active === false && (
          <div className="bg-red-100 text-red-600 rounded-full px-2.5 py-1 shadow-sm border border-red-200">
            <span className="text-[10px] font-bold flex items-center gap-1">👁️ ซ่อนอยู่</span>
          </div>
        )}
        <div className="bg-gray-100 rounded-full px-2.5 py-1 shadow-sm">
          <span className="text-[10px] text-gray-500 font-semibold">📌 ปักหมุด</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3 mt-2">
        <div className="w-2 h-2 rounded-full" style={{ background: style.dot }} />
        <span className={`text-xs font-semibold ${style.text} ${style.bg} border ${style.border} px-2 py-0.5 rounded-full`}>
          {item.category}
        </span>
      </div>
      <h3 className="text-gray-800 font-semibold text-base leading-snug mb-2 group-hover:text-violet-700 transition-colors line-clamp-2">
        {item.title}
      </h3>
      <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">{item.excerpt || item.content.slice(0, 100)}</p>
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">👤</div>
          <span className="text-xs text-gray-400">{item.author || "Admin"}</span>
        </div>
        <span className="text-xs text-gray-400">{item.created_at}</span>
      </div>
    </div>
  );
}

function NewsCard({ item, onClick, styleMap }: { item: Post; onClick: () => void; styleMap: Record<string, any> }) {
  const style = styleMap[item.category] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "#6b7280" };
  return (
    <div 
      onClick={onClick}
      className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-200 transition-all group cursor-pointer"
    >
      {item.cover_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.cover_image} alt={item.title} className="w-full h-36 object-cover" />
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full" style={{ background: style.dot }} />
          <span className={`text-xs font-semibold ${style.text} ${style.bg} border ${style.border} px-2 py-0.5 rounded-full`}>
            {item.category}
          </span>
          {item.is_active === false && (
            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200 ml-auto">
              👁️ ซ่อนอยู่
            </span>
          )}
        </div>
        <h3 className="text-gray-800 font-medium text-sm leading-snug mb-2 group-hover:text-violet-700 transition-colors line-clamp-2">
          {item.title}
        </h3>
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">
          {item.excerpt || item.content.slice(0, 80)}
        </p>
        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
          <span className="text-xs text-gray-400">{item.author || "Admin"}</span>
          <span className="text-xs text-gray-400">{item.created_at}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const isAdmin  = user?.role === "ADMIN";
  const searchParams = useSearchParams();

  const [activeCategory, setActiveCategory] = useState<string>("ทั้งหมด");
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [styleMap, setStyleMap] = useState<Record<string, any>>({});
  const [allCategoriesList, setAllCategoriesList] = useState<string[]>(["ทั้งหมด"]);
  const [pinned,   setPinned]   = useState<Post[]>([]);
  const [posts,    setPosts]    = useState<Post[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // ── ดึงโพสต์ปักหมุด (แยก request) ──
  const fetchPinned = useCallback(async () => {
    try {
      const res = await api.get("/api/posts/?pinned=1&limit=4");
      setPinned(res.data.results || []);
    } catch { setPinned([]); }
  }, []);

  // ── ดึงโพสต์ทั่วไป ──
  const fetchPosts = useCallback(async (cat: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pinned: "0", page: String(p), limit: "9" });
      if (cat !== "ทั้งหมด") params.set("category", cat);
      const res = await api.get(`/api/posts/?${params}`);
      setPosts(res.data.results || []);
      setTotalPages(res.data.total_pages || 1);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPinned(); }, [fetchPinned]);

  useEffect(() => {
    api.get("/api/posts/categories/").then(res => {
      setCategories(res.data);
      const map: Record<string, any> = {};
      const valid: string[] = [];
      res.data.forEach((c: CategoryDef) => {
        map[c.value] = c;
        valid.push(c.value);
      });
      setStyleMap(map);
      setAllCategoriesList(["ทั้งหมด", ...valid]);
      
      const cat = searchParams.get("cat");
      if (cat && valid.includes(cat)) {
        setActiveCategory(cat);
      } else {
        setActiveCategory("ทั้งหมด");
      }
    }).catch(console.error);
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
    fetchPosts(activeCategory, 1);
  }, [activeCategory, fetchPosts]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchPosts(activeCategory, p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* ─── Hero Banner ─── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 leading-tight">
              ข่าวสาร &amp; ประกาศ
            </h1>
            <p className="text-gray-500 text-sm max-w-lg">
              ติดตามข่าวสาร กิจกรรม ประกาศสมัครงาน และประกาศต่างๆ สำหรับศิษย์เก่า
            </p>
          </div>
          {/* ── ปุ่มสร้างโพสต์: เฉพาะ Admin ── */}
          {isAdmin && (
            <Link
              href="/create-post"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
            >
              ✏️ สร้างโพสต์
            </Link>
          )}
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
                <PinnedCard key={item.id} item={item} onClick={() => setSelectedPost(item)} styleMap={styleMap} />
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
          <div className="flex flex-wrap gap-2 mb-8">
            {allCategoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setPage(1); }}
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

          {/* Posts Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 h-52 animate-pulse" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((item) => (
                <NewsCard key={item.id} item={item} onClick={() => setSelectedPost(item)} styleMap={styleMap} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm">ไม่มีข่าวสารในหมวดหมู่นี้</p>
              {isAdmin && (
                <Link href="/create-post" className="mt-4 text-sm text-violet-600 hover:underline">
                  + สร้างโพสต์แรก
                </Link>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
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
        </div>
      </div>

      {/* ─── Post Modal ─── */}
      {selectedPost && <PostModal post={selectedPost} isAdmin={isAdmin} onClose={() => setSelectedPost(null)} styleMap={styleMap} />}
    </div>
  );
}

// ─── Modal Component ───────────────────────────────────
function PostModal({ post, isAdmin, onClose, styleMap }: { post: Post; isAdmin?: boolean; onClose: () => void; styleMap: Record<string, any> }) {
  const style = styleMap[post.category] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "#6b7280" };
  
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header/Image Area */}
        <div className="relative flex-shrink-0">
          {post.cover_image ? (
            <div className="w-full h-64 sm:h-80 bg-gray-100">
              <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-16 bg-gray-50 border-b border-gray-100" />
          )}
          
          <div className="absolute top-4 right-4 flex gap-2">
            {isAdmin && (
              <Link 
                href={`/edit-post/${post.id}`}
                className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors shadow-sm"
              >
                <Pencil size={20} />
              </Link>
            )}
            <button 
              onClick={onClose}
              className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors shadow-sm"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: style.dot }} />
            <span className={`text-xs font-bold ${style.text} ${style.bg} border ${style.border} px-2.5 py-1 rounded-full`}>
              {post.category}
            </span>
            {post.is_active === false && (
               <span className="text-xs font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full border border-red-200">
                 👁️ ถูกซ่อนไว้
               </span>
            )}
            <span className="text-sm text-gray-500 ml-auto flex items-center gap-1.5">
               🕒 {post.created_at}
            </span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 leading-snug">
            {post.title}
          </h2>

          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-[15px]">
            {post.content}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-100 p-4 sm:px-8 sm:py-5 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-lg">
               👤
             </div>
             <div>
               <p className="text-sm font-bold text-gray-800">{post.author || "Admin"}</p>
               <p className="text-xs text-gray-500">ผู้โพสต์</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}