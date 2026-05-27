"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageCircle, Send, ExternalLink, Trash2, Pencil, X, CornerDownRight } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmModal from "@/components/ConfirmModal";

export default function KnowledgeDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [commentContent, setCommentContent] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit Post State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ message: string; danger?: boolean; onConfirm: () => void } | null>(null);

  const fetchPost = () => {
    api.get(`/api/knowledge/${id}/`)
      .then(res => {
        setPost(res.data);
        setEditTitle(res.data.title);
        setEditDesc(res.data.description || "");
        setEditUrl(res.data.url || "");
      })
      .catch(() => alert("ไม่พบกระทู้นี้"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) fetchPost();
  }, [id]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/api/knowledge/${id}/comments/`, {
        content: commentContent,
        parent_id: replyTo?.id || null
      });
      setCommentContent("");
      setReplyTo(null);
      fetchPost();
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการคอมเมนต์ หรือคุณยังไม่ได้เข้าสู่ระบบ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    setConfirmModal({
      message: "ต้องการลบกระทู้นี้ใช่หรือไม่?",
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await api.delete(`/api/knowledge/${id}/`);
          router.push("/knowledge");
        } catch {
          alert("ลบไม่สำเร็จ");
        }
      }
    });
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    try {
      await api.patch(`/api/knowledge/${id}/`, {
        title: editTitle,
        description: editDesc,
        url: editUrl
      });
      setIsEditing(false);
      fetchPost();
    } catch {
      alert("แก้ไขไม่สำเร็จ");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    setConfirmModal({
      message: "ต้องการลบคอมเมนต์นี้ใช่หรือไม่?",
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await api.delete(`/api/knowledge/${id}/comments/${commentId}/`);
          fetchPost();
        } catch {
          alert("ลบไม่สำเร็จ");
        }
      }
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  
  if (!post) return <div className="text-center py-20 text-gray-500">ไม่พบกระทู้นี้</div>;

  const canEditOrDeletePost = user && (user.role === 'ADMIN' || user.id === post.author?.id);

  // Helper to render comments recursively
  const renderComment = (c: any, index: number | string, isReply = false) => {
    const isCommentAuthor = user && (user.role === 'ADMIN' || user.id === c.author?.id);
    const authorName = c.author ? `${c.author.first_name} ${c.author.last_name}` : "ไม่ระบุตัวตน";

    return (
      <div key={c.id} className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm relative overflow-hidden ${isReply ? 'ml-8 sm:ml-12 mt-3 border-l-4 border-l-violet-300' : ''}`}>
         {!isReply && <div className="absolute top-0 left-0 w-1 h-full bg-violet-200" />}
         <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-bold">
                 {c.author?.first_name?.[0] || "👤"}
              </div>
              <div>
                 <p className="text-sm font-semibold text-gray-800">{authorName}</p>
                 <p className="text-[11px] text-gray-400">{c.created_at}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               {!isReply && (
                 <span className="text-xs font-bold text-gray-300">#{index}</span>
               )}
               {isCommentAuthor && (
                 <button onClick={() => handleDeleteComment(c.id)} className="text-red-400 hover:text-red-600 transition-colors">
                   <Trash2 size={14} />
                 </button>
               )}
            </div>
         </div>
         <div className="text-sm text-gray-700 pl-10 whitespace-pre-wrap mb-3">
            {c.content}
         </div>
         {/* Reply button */}
         <div className="pl-10 flex items-center gap-4">
           <button 
             onClick={() => {
               setReplyTo({ id: c.id, name: authorName });
               window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
             }}
             className="text-xs text-violet-600 font-semibold hover:underline flex items-center gap-1"
           >
              <CornerDownRight size={14} /> ตอบกลับ
           </button>
         </div>

         {/* Render Nested Replies */}
         {c.replies && c.replies.length > 0 && (
           <div className="mt-4 border-t border-gray-50 pt-3">
              {c.replies.map((reply: any) => renderComment(reply, '', true))}
           </div>
         )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        
        <Link href="/knowledge" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
          <ChevronLeft size={16} /> กลับหน้าหลักกระทู้
        </Link>

        {/* Post */}
        {isEditing ? (
          <div className="bg-white rounded-2xl shadow-sm border border-violet-200 p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">แก้ไขกระทู้</h2>
            <form onSubmit={handleEditPost} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">หัวข้อกระทู้ <span className="text-red-500">*</span></label>
                <input 
                  value={editTitle} onChange={(e) => setEditTitle(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">รายละเอียด</label>
                <textarea 
                  value={editDesc} onChange={(e) => setEditDesc(e.target.value)} 
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ลิงก์อ้างอิง</label>
                <input 
                  type="url"
                  value={editUrl} onChange={(e) => setEditUrl(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium">บันทึก</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
             <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-4">
                   <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{post.title}</h1>
                   {canEditOrDeletePost && (
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-gray-700 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                           <Pencil size={18} />
                        </button>
                        <button onClick={handleDeletePost} className="text-red-400 hover:text-red-600 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                           <Trash2 size={18} />
                        </button>
                      </div>
                   )}
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
                   <div className="flex items-center gap-1.5 font-medium text-gray-700">
                      <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">
                        {post.author?.first_name?.[0] || "👤"}
                      </div>
                      {post.author ? `${post.author.first_name} ${post.author.last_name}` : "ไม่ระบุตัวตน"}
                   </div>
                   <span>•</span>
                   <span>🕒 {post.created_at}</span>
                </div>

                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-[15px] mb-6">
                  {post.description || <span className="text-gray-400 italic">ไม่มีรายละเอียด</span>}
                </div>

                {post.url && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                     <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-blue-800 mb-1">ลิงก์อ้างอิง</p>
                        <a href={post.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 truncate transition-colors">
                           <ExternalLink size={14} className="flex-shrink-0" /> {post.url}
                        </a>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Comments Section */}
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
           <MessageCircle size={20} className="text-violet-600" />
           ความคิดเห็น ({post.comment_count || 0})
        </h3>

        <div className="space-y-4 mb-8">
           {post.comments?.map((c: any, i: number) => renderComment(c, i + 1))}
           {(!post.comments || post.comments.length === 0) && (
              <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็นสิ!
              </div>
           )}
        </div>

        {/* Comment Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
           {user ? (
             <form onSubmit={handleComment}>
                {replyTo && (
                  <div className="flex items-center justify-between bg-violet-50 text-violet-700 px-3 py-1.5 rounded-lg text-xs font-medium mb-3">
                    <span>ตอบกลับความคิดเห็นของ: {replyTo.name}</span>
                    <button type="button" onClick={() => setReplyTo(null)} className="hover:text-violet-900">
                      <X size={14} />
                    </button>
                  </div>
                )}
                <textarea 
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder={replyTo ? "พิมพ์ข้อความตอบกลับ..." : "แสดงความคิดเห็นของคุณ..."}
                  className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none bg-gray-50 focus:bg-white transition-colors"
                  rows={3}
                  required
                />
                <div className="flex justify-end mt-3">
                   <button 
                     type="submit" 
                     disabled={submitting || !commentContent.trim()}
                     className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                   >
                     {submitting ? "กำลังส่ง..." : <><Send size={16} /> ส่งความคิดเห็น</>}
                   </button>
                </div>
             </form>
           ) : (
             <div className="text-center py-6 text-gray-500">
                กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น <Link href="/login" className="text-violet-600 font-semibold hover:underline">เข้าสู่ระบบ</Link>
             </div>
           )}
        </div>

        </div>
        
        {confirmModal && (
          <ConfirmModal
            message={confirmModal.message}
            danger={confirmModal.danger}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
          />
        )}
      </div>
    </div>
  );
}
