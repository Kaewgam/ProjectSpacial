"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import api from "@/lib/api";
import {
    User, Mail, BookOpen, Briefcase, GraduationCap,
    Calendar, LogOut, Shield, Users, Search,
    Pencil, Check, X, Camera,
} from "lucide-react";
import Link from "next/link";

const FACULTIES: Record<string, string[]> = {
    "คณะวิศวกรรมศาสตร์": ["วิศวกรรมคอมพิวเตอร์", "วิศวกรรมไฟฟ้า", "วิศวกรรมโยธา", "วิศวกรรมเครื่องกล"],
    "คณะวิทยาศาสตร์": ["วิทยาการคอมพิวเตอร์", "คณิตศาสตร์", "ฟิสิกส์", "เคมี"],
    "คณะบริหารธุรกิจ": ["การจัดการ", "การตลาด", "การบัญชี", "การเงิน"],
    "คณะศิลปศาสตร์": ["ภาษาไทย", "ภาษาอังกฤษ", "ภาษาจีน", "ประวัติศาสตร์"],
    "คณะแพทยศาสตร์": ["แพทย์ทั่วไป", "ทันตแพทย์", "เภสัชศาสตร์", "พยาบาลศาสตร์"],
};

export default function ProfilePage() {
    const { user, loading, logout, refreshUser } = useAuth();
    const router = useRouter();
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);   // ไฟล์ที่รอ upload
    const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null); // preview ก่อนบันทึก

    const [form, setForm] = useState({
        prefix: "", first_name: "", last_name: "",
        email: "", faculty: "", department: "", occupation: "",
    });

    // Protected route
    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    // Sync form ค่าเริ่มต้นจาก user
    useEffect(() => {
        if (user) {
            setForm({
                prefix: user.prefix ?? "",
                first_name: user.first_name ?? "",
                last_name: user.last_name ?? "",
                email: user.email ?? "",
                faculty: user.faculty ?? "",
                department: user.department ?? "",
                occupation: user.occupation ?? "",
            });
        }
    }, [user]);

    const set = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    // ─── Save profile (รวม avatar ถ้ามี) ───
    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. อัปโหลด avatar ถ้ามีไฟล์ค้างอยู่
            if (pendingAvatarFile) {
                const fd = new FormData();
                fd.append("avatar", pendingAvatarFile);
                await api.post("/api/me/avatar/", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                setPendingAvatarFile(null);
                setPendingAvatarPreview(null);
            }
            // 2. บันทึกข้อมูลข้อความ
            await api.patch("/api/me/update/", form);
            // 3. ดึง user ใหม่ → Navbar + ทุกที่อัปเดตทันที
            await refreshUser();
            toast.success("บันทึกข้อมูลสำเร็จ ✓");
            setEditMode(false);
        } catch {
            toast.error("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setForm({
                prefix: user.prefix ?? "", first_name: user.first_name ?? "",
                last_name: user.last_name ?? "", email: user.email ?? "",
                faculty: user.faculty ?? "", department: user.department ?? "",
                occupation: user.occupation ?? "",
            });
        }
        // คืนรูปกลับเป็นเดิม ยกเลิกการเลือกไฟล์
        setPendingAvatarFile(null);
        setPendingAvatarPreview(null);
        setEditMode(false);
    };

    // ─── เลือกไฟล์ avatar (preview เท่านั้น ยังไม่ upload) ───
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingAvatarFile(file);
        setPendingAvatarPreview(URL.createObjectURL(file));
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-[#414E51] rounded-full animate-spin" />
            </div>
        );
    }

    const initials = (user.first_name ? user.first_name.charAt(0) : user.student_id.charAt(0)).toUpperCase();
    const roleLabel: Record<string, string> = { ALUMNI: "ศิษย์เก่า", ADMIN: "ผู้ดูแลระบบ", STUDENT: "นักศึกษา" };

    const inputClass = "w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-800 text-sm focus:ring-2 focus:ring-[#414E51] focus:border-[#414E51] focus:outline-none transition";
    const selectClass = `${inputClass} appearance-none`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 py-10 px-6">
            <Toaster position="top-center" />
            <div className="max-w-4xl mx-auto space-y-6">

                {/* ─── Header Card ─── */}
                <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-5">
                    {/* Avatar + upload trigger (ทำงานเฉพาะ editMode) */}
                    <div className="relative flex-shrink-0">
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                        {/* Avatar display */}
                        <div
                            onClick={() => editMode && avatarInputRef.current?.click()}
                            className={`group relative w-20 h-20 rounded-full overflow-hidden shadow-lg ${editMode ? "cursor-pointer" : "cursor-default"}`}
                            title={editMode ? "คลิกเพื่อเปลี่ยนรูป" : ""}
                        >
                            {/* รูปหรือ initials */}
                            {(pendingAvatarPreview || user.avatar) ? (
                                <img src={pendingAvatarPreview ?? user.avatar!} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#414E51] flex items-center justify-center text-white text-3xl font-bold">
                                    {initials}
                                </div>
                            )}
                            {/* Camera Overlay — แสดงเฉพาะ editMode */}
                            {editMode && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    {saving
                                        ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : <Camera size={20} className="text-white" />
                                    }
                                </div>
                            )}
                        </div>
                        {/* Badge กล้อง เฉพาะ editMode */}
                        {editMode && !saving && (
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#414E51] rounded-full flex items-center justify-center shadow border-2 border-white">
                                <Camera size={13} className="text-white" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-gray-800 truncate">
                            {user.prefix} {user.first_name} {user.last_name || "—"}
                        </h1>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${user.role === "ADMIN" ? "bg-red-100 text-red-700"
                                : user.role === "ALUMNI" ? "bg-blue-100 text-blue-700"
                                    : "bg-green-100 text-green-700"
                                }`}>
                                {roleLabel[user.role] ?? user.role}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar size={12} /> เข้าร่วมเมื่อ {user.date_joined}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {!editMode && user.role !== "ADMIN" && (
                            <button
                                onClick={() => setEditMode(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-[#414E51] text-white rounded-lg hover:bg-[#2b3436] transition"
                            >
                                <Pencil size={15} /> แก้ไข
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── ALUMNI / STUDENT: ฟอร์มข้อมูล ─── */}
                {user.role !== "ADMIN" && (
                    <>
                        {/* ข้อมูลส่วนตัว */}
                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <User size={18} className="text-[#414E51]" /> ข้อมูลส่วนตัว
                                </h2>
                                {editMode && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#414E51] text-white text-sm rounded-lg hover:bg-[#2b3436] disabled:opacity-50 transition"
                                        >
                                            <Check size={15} /> {saving ? "กำลังบันทึก..." : "บันทึก"}
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
                                        >
                                            <X size={15} /> ยกเลิก
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {/* คำนำหน้า */}
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">คำนำหน้า</p>
                                    {editMode ? (
                                        <select value={form.prefix} onChange={(e) => set("prefix", e.target.value)} className={selectClass}>
                                            <option value="">เลือก...</option>
                                            <option value="นาย">นาย</option>
                                            <option value="นาง">นาง</option>
                                            <option value="นางสาว">นางสาว</option>
                                        </select>
                                    ) : (
                                        <p className="text-gray-800 font-medium text-sm">{user.prefix || "—"}</p>
                                    )}
                                </div>

                                {/* รหัสนักศึกษา (read-only) */}
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">รหัสนักศึกษา</p>
                                    <p className="text-gray-800 font-medium text-sm">{user.student_id}</p>
                                </div>

                                {/* ชื่อ */}
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">ชื่อ</p>
                                    {editMode
                                        ? <input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} placeholder="ชื่อ" className={inputClass} />
                                        : <p className="text-gray-800 font-medium text-sm">{user.first_name || "—"}</p>
                                    }
                                </div>

                                {/* นามสกุล */}
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">นามสกุล</p>
                                    {editMode
                                        ? <input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} placeholder="นามสกุล" className={inputClass} />
                                        : <p className="text-gray-800 font-medium text-sm">{user.last_name || "—"}</p>
                                    }
                                </div>

                                {/* อีเมล */}
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">อีเมล</p>
                                    {editMode
                                        ? <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="อีเมล" className={inputClass} />
                                        : <p className="text-gray-800 font-medium text-sm">{user.email || "—"}</p>
                                    }
                                </div>

                                {/* อาชีพ */}
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">อาชีพปัจจุบัน</p>
                                    {editMode
                                        ? <input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="เช่น วิศวกร" className={inputClass} />
                                        : <p className="text-gray-800 font-medium text-sm">{user.occupation || "—"}</p>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* ข้อมูลการศึกษา */}
                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <GraduationCap size={18} className="text-[#414E51]" /> ข้อมูลการศึกษา
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {/* คณะ */}
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">คณะ</p>
                                    {editMode ? (
                                        <select
                                            value={form.faculty}
                                            onChange={(e) => { set("faculty", e.target.value); set("department", ""); }}
                                            className={selectClass}
                                        >
                                            <option value="">เลือกคณะ</option>
                                            {Object.keys(FACULTIES).map((f) => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    ) : (
                                        <p className="text-gray-800 font-medium text-sm">{user.faculty || "—"}</p>
                                    )}
                                </div>

                                {/* สาขา */}
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">สาขา</p>
                                    {editMode ? (
                                        <select
                                            value={form.department}
                                            onChange={(e) => set("department", e.target.value)}
                                            disabled={!form.faculty}
                                            className={`${selectClass} ${!form.faculty ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                            <option value="">เลือกสาขา</option>
                                            {(FACULTIES[form.faculty] ?? []).map((d) => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    ) : (
                                        <p className="text-gray-800 font-medium text-sm">{user.department || "—"}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ─── ADMIN Panel ─── */}
                {user.role === "ADMIN" && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-[#414E51] to-[#2b3436] rounded-2xl shadow-md p-6 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <Shield size={24} />
                                <h2 className="text-xl font-bold">Admin Panel</h2>
                            </div>
                            <p className="text-white/70 text-sm">คุณมีสิทธิ์จัดการระบบและข้อมูลผู้ใช้ทั้งหมด</p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <AdminCard icon={<Users size={24} className="text-blue-600" />} bg="bg-blue-50" title="จัดการผู้ใช้" desc="ดู แก้ไข และจัดการบัญชีผู้ใช้ทั้งหมด" href="/search" />
                            <AdminCard icon={<Search size={24} className="text-green-600" />} bg="bg-green-50" title="ค้นหาศิษย์เก่า" desc="ค้นหาและกรองข้อมูลศิษย์เก่า" href="/search" />
                        </div>
                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <User size={18} className="text-[#414E51]" /> ข้อมูลบัญชี
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <InfoRow icon={<User size={16} />} label="รหัสผู้ใช้" value={user.student_id} />
                                <InfoRow icon={<Mail size={16} />} label="อีเมล" value={user.email} />
                                <InfoRow icon={<Calendar size={16} />} label="เข้าร่วมเมื่อ" value={user.date_joined} />
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
            <span className="mt-0.5 text-gray-400">{icon}</span>
            <div>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-gray-800 font-medium text-sm">{value}</p>
            </div>
        </div>
    );
}

function AdminCard({ icon, bg, title, desc, href }: { icon: React.ReactNode; bg: string; title: string; desc: string; href: string }) {
    return (
        <Link href={href} className="bg-white rounded-2xl shadow-md p-5 flex items-start gap-4 hover:shadow-lg transition group">
            <div className={`${bg} p-3 rounded-xl flex-shrink-0`}>{icon}</div>
            <div>
                <p className="font-semibold text-gray-800 group-hover:text-[#414E51] transition">{title}</p>
                <p className="text-sm text-gray-500 mt-1">{desc}</p>
            </div>
        </Link>
    );
}
