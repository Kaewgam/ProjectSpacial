"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Award, Plus, Search, Edit, Trash2, X, Loader2, User, Check } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

interface Alumnus {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string | null;
  faculty: string;
  department: string;
  graduation_year: string;
}

interface HallOfFameEntry {
  id: number;
  user: Alumnus;
  award_year: string;
  category: string;
  category_display: string;
  title: string;
  description: string;
  image: string | null;
}

interface UserSearchResult {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  faculty: string;
  department: string;
}

const CATEGORY_CHOICES = [
  { value: "ACADEMIC", label: "วิชาการดีเด่น (Academic Excellence)" },
  { value: "BUSINESS", label: "ความสำเร็จในอาชีพ/ธุรกิจ (Business & Career Success)" },
  { value: "SOCIAL", label: "ทำประโยชน์ต่อสังคม (Social Contribution)" },
  { value: "SPORTS_ARTS", label: "กีฬาและศิลปวัฒนธรรม (Sports & Arts)" },
];

export default function AdminHallOfFame() {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; danger?: boolean; onConfirm: () => void } | null>(null);

  // Modal control
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

  // Form states
  const [userId, setUserId] = useState("");
  const [awardYear, setAwardYear] = useState("");
  const [category, setCategory] = useState("ACADEMIC");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Search User states
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Fetch entries
  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/admin/hall-of-fame/");
      setEntries(res.data);
    } catch {
      setError("ไม่สามารถดึงข้อมูลหอเกียรติยศได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Search user dynamically
  useEffect(() => {
    if (userQuery.trim().length < 2) {
      setUserResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setSearchingUsers(true);
        // We query from the admin users endpoint
        const res = await api.get(`/api/admin/users/?q=${userQuery}`);
        // The API returns { results: [...] }
        setUserResults(res.data.results || []);
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setSearchingUsers(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [userQuery]);

  const handleOpenCreate = () => {
    setModalMode("create");
    setUserId("");
    setAwardYear((new Date().getFullYear() + 543).toString());
    setCategory("ACADEMIC");
    setTitle("");
    setDescription("");
    setUserQuery("");
    setSelectedUser(null);
    setUserResults([]);
    setSelectedEntryId(null);
    setImageFile(null);
    setImagePreview(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (entry: HallOfFameEntry) => {
    setModalMode("edit");
    setSelectedEntryId(entry.id);
    setUserId(entry.user.id);
    setAwardYear(entry.award_year);
    setCategory(entry.category);
    setTitle(entry.title);
    setDescription(entry.description);
    setSelectedUser({
      id: entry.user.id,
      student_id: entry.user.student_id,
      first_name: entry.user.first_name,
      last_name: entry.user.last_name,
      faculty: entry.user.faculty,
      department: entry.user.department
    });
    setImageFile(null);
    setImagePreview(entry.image);
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert("กรุณาเลือกศิษย์เก่า");
      return;
    }
    if (!awardYear || !title) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const fd = new FormData();
    fd.append("user_id", userId);
    fd.append("award_year", awardYear);
    fd.append("category", category);
    fd.append("title", title);
    fd.append("description", description || "-");
    if (imageFile) {
      fd.append("image", imageFile);
    }

    try {
      if (modalMode === "create") {
        await api.post("/api/admin/hall-of-fame/", fd, { headers: { "Content-Type": "multipart/form-data" }});
      } else {
        await api.patch(`/api/admin/hall-of-fame/${selectedEntryId}/`, fd, { headers: { "Content-Type": "multipart/form-data" }});
      }
      setIsOpen(false);
      fetchEntries();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleDelete = async (id: number) => {
    setConfirmModal({
      message: "คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้ออกจากหอเกียรติยศ?",
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await api.delete(`/api/admin/hall-of-fame/${id}/`);
          fetchEntries();
        } catch (err) {
          console.error(err);
          alert("ไม่สามารถลบข้อมูลได้");
        }
      }
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="text-amber-500" />
            จัดการหอเกียรติยศ (Hall of Fame)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            บันทึก แก้ไข หรือลบข้อมูลรางวัลเกียรติยศของศิษย์เก่าในระบบ
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all text-sm"
        >
          <Plus size={16} />
          เพิ่มรายชื่อเกียรติยศ
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center">
          {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <Award size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">ยังไม่มีข้อมูลในหอเกียรติยศ</p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 text-amber-600 hover:text-amber-700 text-sm font-semibold inline-flex items-center gap-1"
          >
            สร้างเกียรติยศเป็นคนแรก <Plus size={14} />
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">ศิษย์เก่า</th>
                  <th className="px-6 py-4">ปีรางวัล</th>
                  <th className="px-6 py-4">ประเภทรางวัล</th>
                  <th className="px-6 py-4">ชื่อเกียรติยศ/ผลงาน</th>
                  <th className="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                          {entry.user.avatar ? (
                            <img src={entry.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                              <User size={16} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {entry.user.first_name} {entry.user.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {entry.user.student_id} | {entry.user.faculty}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">{entry.award_year}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                        {entry.category_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-semibold text-gray-800 truncate">{entry.title}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(entry)}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="ลบข้อมูล"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Award className="text-amber-500" />
                {modalMode === "create" ? "เพิ่มศิษย์เก่าในหอเกียรติยศ" : "แก้ไขข้อมูลหอเกียรติยศ"}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-auto p-6 space-y-4">
              {/* Alumnus Selector */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">เลือกศิษย์เก่า</label>
                {selectedUser ? (
                  <div className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-950">
                        {selectedUser.first_name} {selectedUser.last_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedUser.student_id} • คณะ{selectedUser.faculty}
                      </p>
                    </div>
                    {modalMode === "create" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(null);
                          setUserId("");
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-0.5"
                      >
                        เปลี่ยนคน
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ค้นหาศิษย์เก่าด้วย ชื่อ หรือ รหัสนักศึกษา..."
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 focus:border-amber-500/50 rounded-xl px-4 py-3 pl-11 text-slate-900 placeholder-slate-400 outline-none transition-all text-sm"
                      />
                      <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
                      {searchingUsers && (
                        <Loader2 className="absolute right-4 top-3.5 w-4 h-4 text-amber-500 animate-spin" />
                      )}
                    </div>

                    {/* Results Dropdown */}
                    {userResults.length > 0 && (
                      <div className="absolute top-[70px] left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-gray-50">
                        {userResults.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedUser(u);
                              setUserId(u.id);
                              setUserResults([]);
                              setUserQuery("");
                            }}
                            className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors text-sm"
                          >
                            <p className="font-semibold text-gray-800">
                              {u.first_name} {u.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              รหัส: {u.student_id} | คณะ: {u.faculty || "ไม่ระบุ"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {userQuery.trim().length >= 2 && userResults.length === 0 && !searchingUsers && (
                      <p className="text-xs text-red-500 mt-1">ไม่พบรายชื่อศิษย์เก่าในระบบ</p>
                    )}
                  </>
                )}
              </div>

              {/* Award Year */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">ปีการศึกษาที่ได้รับรางวัล (พ.ศ.)</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="ตัวอย่าง 2568"
                  value={awardYear}
                  onChange={(e) => setAwardYear(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-50 border border-gray-200 focus:border-amber-500/50 rounded-xl px-4 py-2.5 text-slate-900 outline-none transition-all text-sm"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">หมวดหมู่เกียรติยศ</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 focus:border-amber-500/50 rounded-xl px-4 py-2.5 text-slate-900 outline-none transition-all text-sm cursor-pointer"
                >
                  {CATEGORY_CHOICES.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Award Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">ชื่อรางวัล / ความสำเร็จ</label>
                <input
                  type="text"
                  placeholder="เช่น ศิษย์เก่าเกียรติยศ ด้านนวัตกรรมเทคโนโลยีดีเด่น"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 focus:border-amber-500/50 rounded-xl px-4 py-2.5 text-slate-900 outline-none transition-all text-sm"
                />
              </div>

              {/* Award Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">รายละเอียดผลงาน / ประวัติการทำงาน</label>
                <textarea
                  rows={4}
                  placeholder="รายละเอียดของรางวัลหรือผลงานที่โดดเด่น..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 focus:border-amber-500/50 rounded-xl px-4 py-2.5 text-slate-900 outline-none transition-all text-sm resize-none"
                />
              </div>

              {/* Image Upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">รูปภาพเกียรติยศ (ถ้ามี)</label>
                {imagePreview && (
                  <div className="w-full h-32 mb-2 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center relative">
                    <img src={imagePreview} alt="preview" className="max-w-full max-h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-red-500 hover:text-red-700 hover:bg-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 border border-gray-200 hover:bg-slate-50 text-gray-700 font-semibold rounded-xl text-sm transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition flex items-center gap-1.5"
                >
                  <Check size={16} />
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          danger={confirmModal.danger}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
