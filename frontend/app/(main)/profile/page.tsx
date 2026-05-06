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
import { useFacultyDept } from "@/lib/useFacultyDept";

export default function ProfilePage() {
    const { user, loading, logout, refreshUser } = useAuth();
    const router = useRouter();
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
    const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);

    const { faculties, departments } = useFacultyDept();

    const [form, setForm] = useState({
        prefix: "", first_name: "", last_name: "", email: "",
        educations: [] as { faculty_id: string | null, department_id: string | null, degree_level: string, graduation_year: string }[],
        careers: [] as { occupation: string, company: string, is_current: boolean, start_year: string, end_year: string }[],
    });

    // Protected route
    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    // Sync form from user
    useEffect(() => {
        if (user) {
            setForm({
                prefix: user.prefix ?? "",
                first_name: user.first_name ?? "",
                last_name: user.last_name ?? "",
                email: user.email ?? "",
                educations: user.educations && user.educations.length > 0 ? user.educations.map(e => ({
                    faculty_id: e.faculty_id ? String(e.faculty_id) : null,
                    department_id: e.department_id ? String(e.department_id) : null,
                    degree_level: e.degree_level || "",
                    graduation_year: e.graduation_year || ""
                })) : [{ faculty_id: null, department_id: null, degree_level: "", graduation_year: "" }],
                careers: user.careers && user.careers.length > 0 ? user.careers.map(c => ({
                    occupation: c.occupation || "",
                    company: c.company || "",
                    is_current: c.is_current ?? true,
                    start_year: c.start_year || "",
                    end_year: c.end_year || ""
                })) : [{ occupation: "", company: "", is_current: true, start_year: "", end_year: "" }],
            });
        }
    }, [user]);

    const set = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    // ─── Save profile ───
    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Upload avatar ถ้ามีไฟล์ค้างอยู่
            if (pendingAvatarFile) {
                const fd = new FormData();
                fd.append("avatar", pendingAvatarFile);
                await api.post("/api/me/avatar/", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                setPendingAvatarFile(null);
                setPendingAvatarPreview(null);
            }
            // 2. ส่งข้อมูล array ของการศึกษาและอาชีพ
            await api.patch("/api/me/update/", {
                prefix: form.prefix,
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                educations: form.educations,
                careers: form.careers,
            });
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
                educations: user.educations && user.educations.length > 0 ? user.educations.map(e => ({
                    faculty_id: e.faculty_id ? String(e.faculty_id) : null,
                    department_id: e.department_id ? String(e.department_id) : null,
                    degree_level: e.degree_level || "", graduation_year: e.graduation_year || ""
                })) : [{ faculty_id: null, department_id: null, degree_level: "", graduation_year: "" }],
                careers: user.careers && user.careers.length > 0 ? user.careers.map(c => ({
                    occupation: c.occupation || "", company: c.company || "",
                    is_current: c.is_current ?? true, start_year: c.start_year || "", end_year: c.end_year || ""
                })) : [{ occupation: "", company: "", is_current: true, start_year: "", end_year: "" }],
            });
        }
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
    const roleLabel: Record<string, string> = { ALUMNI: "ศิษย์เก่า", ADMIN: "ผู้ดูแลระบบ" };

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
                        {!editMode && (
                            <button
                                onClick={() => setEditMode(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-[#414E51] text-white rounded-lg hover:bg-[#2b3436] transition"
                            >
                                <Pencil size={15} /> แก้ไข
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── ฟอร์มข้อมูล (สำหรับทุกคน) ─── */}
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
                                {user.role !== "ADMIN" && (
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">รหัสนักศึกษา</p>
                                        <p className="text-gray-800 font-medium text-sm">{user.student_id}</p>
                                    </div>
                                )}

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

                            </div>
                        </div>

                        {/* ข้อมูลการศึกษา */}
                        {user.role !== "ADMIN" && (
                            <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <GraduationCap size={18} className="text-[#414E51]" /> ประวัติการศึกษา
                                    </h2>
                                </div>
                                <div className="space-y-4">
                                    {form.educations.map((edu, idx) => {
                                        const eduFilteredDepts = departments.filter(d => String(d.faculty_id) === String(edu.faculty_id));
                                        return (
                                            <div key={idx} className="relative bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                {editMode && (
                                                    <button onClick={() => setForm(p => ({ ...p, educations: p.educations.filter((_, i) => i !== idx) }))}
                                                        className="absolute top-3 right-3 text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-lg transition" title="ลบข้อมูลนี้">
                                                        <X size={16} />
                                                    </button>
                                                )}
                                                <div className="grid sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-gray-400 mb-1">คณะ</p>
                                                        {editMode ? (
                                                            <select value={edu.faculty_id ?? ""} onChange={(e) => {
                                                                const newEdu = [...form.educations];
                                                                newEdu[idx].faculty_id = e.target.value ? String(e.target.value) : null;
                                                                newEdu[idx].department_id = null;
                                                                setForm(p => ({ ...p, educations: newEdu }));
                                                            }} className={selectClass}>
                                                                <option value="">เลือกคณะ</option>
                                                                {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                            </select>
                                                        ) : (
                                                            <p className="text-gray-800 font-medium text-sm">{faculties.find(f => String(f.id) === String(edu.faculty_id))?.name || "—"}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400 mb-1">สาขาวิชา</p>
                                                        {editMode ? (
                                                            <select value={edu.department_id ?? ""} onChange={(e) => {
                                                                const newEdu = [...form.educations];
                                                                newEdu[idx].department_id = e.target.value ? String(e.target.value) : null;
                                                                setForm(p => ({ ...p, educations: newEdu }));
                                                            }} disabled={!edu.faculty_id} className={`${selectClass} ${!edu.faculty_id ? "opacity-50 cursor-not-allowed" : ""}`}>
                                                                <option value="">เลือกสาขาวิชา</option>
                                                                {eduFilteredDepts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                            </select>
                                                        ) : (
                                                            <p className="text-gray-800 font-medium text-sm">{departments.find(d => String(d.id) === String(edu.department_id))?.name || "—"}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400 mb-1">ระดับปริญญา</p>
                                                        {editMode ? (
                                                            <select value={edu.degree_level} onChange={(e) => {
                                                                const newEdu = [...form.educations];
                                                                newEdu[idx].degree_level = e.target.value;
                                                                setForm(p => ({ ...p, educations: newEdu }));
                                                            }} className={selectClass}>
                                                                <option value="">เลือก...</option>
                                                                <option value="ปริญญาตรี">ปริญญาตรี</option>
                                                                <option value="ปริญญาโท">ปริญญาโท</option>
                                                                <option value="ปริญญาเอก">ปริญญาเอก</option>
                                                            </select>
                                                        ) : (
                                                            <p className="text-gray-800 font-medium text-sm">{edu.degree_level || "—"}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400 mb-1">ปีที่สำเร็จการศึกษา</p>
                                                        {editMode ? (
                                                            <input value={edu.graduation_year} onChange={(e) => {
                                                                const newEdu = [...form.educations];
                                                                newEdu[idx].graduation_year = e.target.value;
                                                                setForm(p => ({ ...p, educations: newEdu }));
                                                            }} placeholder="พ.ศ." className={inputClass} />
                                                        ) : (
                                                            <p className="text-gray-800 font-medium text-sm">{edu.graduation_year || "—"}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {editMode && (
                                        <button onClick={() => setForm(p => ({ ...p, educations: [...p.educations, { faculty_id: null, department_id: null, degree_level: "", graduation_year: "" }] }))}
                                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-[#414E51] hover:text-[#414E51] transition flex items-center justify-center gap-2">
                                            + เพิ่มประวัติการศึกษา
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ข้อมูลการทำงาน */}
                        {user.role !== "ADMIN" && (
                            <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <Briefcase size={18} className="text-[#414E51]" /> ประวัติการทำงาน
                                    </h2>
                                </div>
                                <div className="space-y-4">
                                    {form.careers.map((car, idx) => (
                                        <div key={idx} className="relative bg-gray-50 p-4 rounded-xl border border-gray-200">
                                            {editMode && (
                                                <button onClick={() => setForm(p => ({ ...p, careers: p.careers.filter((_, i) => i !== idx) }))}
                                                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-lg transition" title="ลบข้อมูลนี้">
                                                    <X size={16} />
                                                </button>
                                            )}
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">ตำแหน่ง / อาชีพ</p>
                                                    {editMode ? (
                                                        <input value={car.occupation} onChange={(e) => {
                                                            const newCar = [...form.careers];
                                                            newCar[idx].occupation = e.target.value;
                                                            setForm(p => ({ ...p, careers: newCar }));
                                                        }} placeholder="เช่น วิศวกร" className={inputClass} />
                                                    ) : (
                                                        <p className="text-gray-800 font-medium text-sm">{car.occupation || "—"}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">หน่วยงาน / บริษัท</p>
                                                    {editMode ? (
                                                        <input value={car.company} onChange={(e) => {
                                                            const newCar = [...form.careers];
                                                            newCar[idx].company = e.target.value;
                                                            setForm(p => ({ ...p, careers: newCar }));
                                                        }} placeholder="เช่น บริษัทเอบีซี" className={inputClass} />
                                                    ) : (
                                                        <p className="text-gray-800 font-medium text-sm">{car.company || "—"}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">ปีที่เริ่มทำงาน</p>
                                                    {editMode ? (
                                                        <input value={car.start_year} onChange={(e) => {
                                                            const newCar = [...form.careers];
                                                            newCar[idx].start_year = e.target.value;
                                                            setForm(p => ({ ...p, careers: newCar }));
                                                        }} placeholder="พ.ศ." className={inputClass} />
                                                    ) : (
                                                        <p className="text-gray-800 font-medium text-sm">{car.start_year || "—"}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">ปีที่สิ้นสุด</p>
                                                    {editMode ? (
                                                        <input value={car.end_year} onChange={(e) => {
                                                            const newCar = [...form.careers];
                                                            newCar[idx].end_year = e.target.value;
                                                            setForm(p => ({ ...p, careers: newCar }));
                                                        }} placeholder={car.is_current ? "ปัจจุบัน" : "พ.ศ."} disabled={car.is_current} className={`${inputClass} ${car.is_current ? "opacity-50" : ""}`} />
                                                    ) : (
                                                        <p className="text-gray-800 font-medium text-sm">{car.is_current ? "ปัจจุบัน" : (car.end_year || "—")}</p>
                                                    )}
                                                </div>
                                                {editMode && (
                                                    <div className="sm:col-span-2 flex items-center gap-2 mt-1">
                                                        <input type="checkbox" id={`current-${idx}`} checked={car.is_current} onChange={(e) => {
                                                            const newCar = [...form.careers];
                                                            // ถ้าติ๊กถูก (เป็นงานปัจจุบัน) ให้ไปยกเลิกงานปัจจุบันอันอื่น
                                                            if (e.target.checked) {
                                                                newCar.forEach(c => c.is_current = false);
                                                                newCar[idx].is_current = true;
                                                                newCar[idx].end_year = "";
                                                            } else {
                                                                newCar[idx].is_current = false;
                                                            }
                                                            setForm(p => ({ ...p, careers: newCar }));
                                                        }} className="w-4 h-4 text-[#414E51] rounded border-gray-300 focus:ring-[#414E51]" />
                                                        <label htmlFor={`current-${idx}`} className="text-sm text-gray-600 cursor-pointer">งานปัจจุบัน (เลือกได้เพียง 1 รายการ)</label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {editMode && (
                                        <button onClick={() => setForm(p => ({ ...p, careers: [...p.careers, { occupation: "", company: "", is_current: true, start_year: "", end_year: "" }] }))}
                                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-[#414E51] hover:text-[#414E51] transition flex items-center justify-center gap-2">
                                            + เพิ่มประวัติการทำงาน
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                </>



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
