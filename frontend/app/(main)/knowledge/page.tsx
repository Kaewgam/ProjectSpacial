"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, ExternalLink, Plus, Search } from "lucide-react";
import api from "@/lib/api";

export default function KnowledgeList() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const fetchPosts = () => {
    setLoading(true);
    api.get(`/api/knowledge/?q=${q}`)
      .then(res => {
        setPosts(res.data.results || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPosts();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [q]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await api.post("/api/knowledge/", {
        title: newTitle,
        description: newDesc,
        url: newUrl
      });
      setShowCreate(false);
      setNewTitle("");
      setNewDesc("");
      setNewUrl("");
      fetchPosts();
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการสร้างโพสต์");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">แชร์ความรู้น่าสนใจ</h1>
          </div>
          <button 
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all"
          >
            <Plus size={18} />
            สร้างกระทู้ใหม่
          </button>
        </div>

        {showCreate && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-lg font-bold mb-4">เขียนกระทู้ใหม่</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">หัวข้อกระทู้ <span className="text-red-500">*</span></label>
                <input 
                  value={newTitle} onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="เรื่องอะไรที่อยากแบ่งปัน..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">รายละเอียด</label>
                <textarea 
                  value={newDesc} onChange={(e) => setNewDesc(e.target.value)} 
                  placeholder="เขียนอธิบายสั้นๆ เกี่ยวกับสิ่งนี้..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ลิงก์อ้างอิง (ถ้ามี)</label>
                <input 
                  type="url"
                  value={newUrl} onChange={(e) => setNewUrl(e.target.value)} 
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium">โพสต์กระทู้</button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
             value={q} onChange={(e) => setQ(e.target.value)}
             placeholder="ค้นหากระทู้ความรู้..."
             className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
           />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
             {[1,2,3].map(i => <div key={i} className="h-24 bg-white border border-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map(post => (
              <Link href={`/knowledge/${post.id}`} key={post.id} className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-violet-300 transition-all group">
                 <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-violet-700 transition-colors">{post.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{post.description || "ไม่มีรายละเอียด"}</p>
                      {post.url && (
                        <div className="flex items-center gap-1 text-xs text-blue-500 mt-2">
                           <ExternalLink size={12} /> {post.url}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 text-sm text-gray-500 shrink-0">
                       <span className="text-xs">🕒 {post.created_at}</span>
                       <div className="flex items-center gap-1 bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-violet-100">
                          <MessageCircle size={14} /> {post.comment_count} ตอบกลับ
                       </div>
                    </div>
                 </div>
                 <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold">
                      {post.author?.first_name?.[0] || "👤"}
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {post.author ? `${post.author.first_name} ${post.author.last_name}` : "ไม่ระบุตัวตน"}
                    </span>
                 </div>
              </Link>
            ))}
          </div>
        ) : (
           <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
              <div className="text-4xl mb-2">📚</div>
              <p>ยังไม่มีกระทู้ความรู้ในขณะนี้</p>
           </div>
        )}

      </div>
    </div>
  );
}
