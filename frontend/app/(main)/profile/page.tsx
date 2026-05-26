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

const SUGGESTED_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "C#", "C++", 
    "SQL", "NoSQL", "Docker", "Kubernetes", "AWS", "Machine Learning", "Data Analysis", 
    "Project Management", "Digital Marketing", "Graphic Design", "UI/UX Design", "Communication"
];

export default function ProfilePage() {
    const { user, loading, logout, refreshUser } = useAuth();
    const router = useRouter();
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
    const [pendingAvatarPreview, setPendingAvatarPreview] = useState<string | null>(null);

    interface PendingCert {
        id: string;
        name: string;
        issue_year: string;
        file: File;
        previewUrl: string;
    }
    const [pendingCertificates, setPendingCertificates] = useState<PendingCert[]>([]);
    const [showAllCerts, setShowAllCerts] = useState(false);

    const { faculties, departments } = useFacultyDept();

    const [form, setForm] = useState({
        prefix: "", first_name: "", last_name: "", email: "",
        phone_number: "", github_link: "",
        educations: [] as { faculty_id: string | null, department_id: string | null, degree_level: string, graduation_year: string }[],
        careers: [] as { occupation: string, company: string, work_email: string, is_current: boolean, start_year: string, end_year: string }[],
        skills: [] as string[],
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
                phone_number: user.phone_number ?? "",
                github_link: user.github_link ?? "",
                educations: user.educations && user.educations.length > 0 ? user.educations.map(e => ({
                    faculty_id: e.faculty_id ? String(e.faculty_id) : null,
                    department_id: e.department_id ? String(e.department_id) : null,
                    degree_level: e.degree_level || "",
                    graduation_year: e.graduation_year || ""
                })) : [{ faculty_id: null, department_id: null, degree_level: "", graduation_year: "" }],
                careers: user.careers && user.careers.length > 0 ? user.careers.map(c => ({
                    occupation: c.occupation || "",
                    company: c.company || "",
                    work_email: c.work_email || "",
                    is_current: c.is_current ?? true,
                    start_year: c.start_year || "",
                    end_year: c.end_year || ""
                })) : [{ occupation: "", company: "", work_email: "", is_current: true, start_year: "", end_year: "" }],
                skills: user.skills || [],
            });
        }
    }, [user, editMode]);

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
                phone_number: form.phone_number,
                github_link: form.github_link,
                educations: form.educations,
                careers: form.careers,
                skills: form.skills,
            });

            // 2.5 Upload pending certificates
            if (pendingCertificates.length > 0) {
                const certPromises = pendingCertificates.map(cert => {
                    const fd = new FormData();
                    fd.append("name", cert.name);
                    fd.append("issue_year", cert.issue_year);
                    fd.append("image", cert.file);
                    return api.post("/api/me/certificates/", fd, {
                        headers: { "Content-Type": "multipart/form-data" }
                    });
                });
                await Promise.all(certPromises);
                setPendingCertificates([]);
            }

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
                phone_number: user.phone_number ?? "", github_link: user.github_link ?? "",
                educations: user.educations && user.educations.length > 0 ? user.educations.map(e => ({
                    faculty_id: e.faculty_id ? String(e.faculty_id) : null,
                    department_id: e.department_id ? String(e.department_id) : null,
                    degree_level: e.degree_level || "", graduation_year: e.graduation_year || ""
                })) : [{ faculty_id: null, department_id: null, degree_level: "", graduation_year: "" }],
                careers: user.careers && user.careers.length > 0 ? user.careers.map(c => ({
                    occupation: c.occupation || "", company: c.company || "", work_email: c.work_email || "",
                    is_current: c.is_current ?? true, start_year: c.start_year || "", end_year: c.end_year || ""
                })) : [{ occupation: "", company: "", work_email: "", is_current: true, start_year: "", end_year: "" }],
                skills: user.skills || [],
            });
        }
        setPendingAvatarFile(null);
        setPendingAvatarPreview(null);
        setPendingCertificates([]);
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

                                {/* เบอร์โทรศัพท์ */}
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">เบอร์โทรศัพท์</p>
                                    {editMode
                                        ? <input type="tel" value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} placeholder="08X-XXX-XXXX" className={inputClass} />
                                        : <p className="text-gray-800 font-medium text-sm">{user.phone_number || "—"}</p>
                                    }
                                </div>

                                {/* ลิงก์ GitHub */}
                                <div className="sm:col-span-2">
                                    <p className="text-xs text-gray-400 mb-1">ลิงก์ GitHub / Portfolio</p>
                                    {editMode
                                        ? <input type="url" value={form.github_link} onChange={(e) => set("github_link", e.target.value)} placeholder="https://github.com/yourusername" className={inputClass} />
                                        : user.github_link ? (
                                            <a href={user.github_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium text-sm break-all">
                                                {user.github_link}
                                            </a>
                                        ) : (
                                            <p className="text-gray-800 font-medium text-sm">—</p>
                                        )
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
                                                                <option value="ปวช.">ปวช.</option>
                                                                <option value="ปวส.">ปวส.</option>
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
                                                        <>
                                                            <input list="occupations-list" value={car.occupation} onChange={(e) => {
                                                                const newCar = [...form.careers];
                                                                newCar[idx].occupation = e.target.value;
                                                                setForm(p => ({ ...p, careers: newCar }));
                                                            }} placeholder="เลือกหรือพิมพ์ตำแหน่ง" className={inputClass} />
                                                            <datalist id="occupations-list">
                                                                <option value="Software Engineer" />
                                                                <option value="Web Developer" />
                                                                <option value="Data Scientist" />
                                                                <option value="Data Analyst" />
                                                                <option value="System Analyst" />
                                                                <option value="Network Engineer" />
                                                                <option value="Project Manager" />
                                                                <option value="IT Support" />
                                                                <option value="Programmer" />
                                                                <option value="QA / Tester" />
                                                            </datalist>
                                                        </>
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
                                                    <p className="text-xs text-gray-400 mb-1">อีเมลบริษัท</p>
                                                    {editMode ? (
                                                        <input type="email" value={car.work_email} onChange={(e) => {
                                                            const newCar = [...form.careers];
                                                            newCar[idx].work_email = e.target.value;
                                                            setForm(p => ({ ...p, careers: newCar }));
                                                        }} placeholder="เช่น name@company.com" className={inputClass} />
                                                    ) : (
                                                        <p className="text-gray-800 font-medium text-sm">{car.work_email || "—"}</p>
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
                                                        }} placeholder="เช่น ปัจจุบัน หรือ 2567" className={inputClass} />
                                                    ) : (
                                                        <p className="text-gray-800 font-medium text-sm">{car.end_year || "—"}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {editMode && (
                                        <button onClick={() => setForm(p => ({ ...p, careers: [...p.careers, { occupation: "", company: "", work_email: "", is_current: true, start_year: "", end_year: "" }] }))}
                                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-[#414E51] hover:text-[#414E51] transition flex items-center justify-center gap-2">
                                            + เพิ่มประวัติการทำงาน
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* ทักษะและความสามารถ */}
                        {user.role !== "ADMIN" && (
                            <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <BookOpen size={18} className="text-[#414E51]" /> ทักษะและความสามารถ
                                    </h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {form.skills.map((skill, idx) => (
                                            <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 flex items-center gap-2">
                                                {skill}
                                                {editMode && (
                                                    <button onClick={() => setForm(p => ({ ...p, skills: p.skills.filter((_, i) => i !== idx) }))} className="hover:text-blue-900">
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                    {editMode && (
                                        <div className="space-y-3">
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-2">เลือกจากทักษะที่แนะนำ</p>
                                                    <select
                                                        className={inputClass}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val && !form.skills.includes(val)) {
                                                                setForm(p => ({ ...p, skills: [...p.skills, val] }));
                                                            }
                                                            e.target.value = "";
                                                        }}
                                                    >
                                                        <option value="">-- เลือกทักษะ --</option>
                                                        {SUGGESTED_SKILLS.filter(s => !form.skills.includes(s)).map((skill, idx) => (
                                                            <option key={idx} value={skill}>{skill}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-2">หรือพิมพ์เพิ่มเอง (กด Enter เพื่อเพิ่ม)</p>
                                                    <input
                                                        type="text"
                                                        placeholder="พิมพ์ทักษะอื่นๆ..."
                                                        className={inputClass}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                const val = e.currentTarget.value.trim();
                                                                if (val && !form.skills.includes(val)) {
                                                                    setForm(p => ({ ...p, skills: [...p.skills, val] }));
                                                                }
                                                                e.currentTarget.value = "";
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ใบประกาศ */}
                        {user.role !== "ADMIN" && (
                            <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <Shield size={18} className="text-[#414E51]" /> ใบประกาศนียบัตร
                                    </h2>
                                    {user.certificates && user.certificates.length > 4 && !editMode && (
                                        <button 
                                            onClick={() => setShowAllCerts(!showAllCerts)}
                                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition"
                                        >
                                            {showAllCerts ? "ย่อดูน้อยลง" : "ดูเพิ่มเติม"}
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {(showAllCerts || editMode ? user.certificates || [] : (user.certificates || []).slice(0, 4)).map((cert) => (
                                            <div key={cert.id} className="relative bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col items-center text-center">
                                                {editMode && (
                                                    <button onClick={async () => {
                                                        if (confirm("ต้องการลบใบประกาศนี้ใช่หรือไม่?")) {
                                                            try {
                                                                await api.delete(`/api/me/certificates/${cert.id}/`);
                                                                await refreshUser();
                                                                toast.success("ลบใบประกาศสำเร็จ");
                                                            } catch {
                                                                toast.error("เกิดข้อผิดพลาด");
                                                            }
                                                        }
                                                    }} className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-white shadow rounded-full p-1 transition" title="ลบข้อมูลนี้">
                                                        <X size={14} />
                                                    </button>
                                                )}
                                                {cert.image && (
                                                    <div className="w-full h-32 mb-3 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                                                        <img src={cert.image} alt={cert.name} className="max-w-full max-h-full object-contain" />
                                                    </div>
                                                )}
                                                <p className="text-gray-800 font-medium text-sm line-clamp-2">{cert.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">ปีที่ได้รับ: {cert.issue_year || "—"}</p>
                                            </div>
                                        ))}
                                        {/* Pending certificates */}
                                        {pendingCertificates.map((cert) => (
                                            <div key={cert.id} className="relative bg-green-50 p-4 rounded-xl border border-green-200 flex flex-col items-center text-center">
                                                <button onClick={() => setPendingCertificates(prev => prev.filter(c => c.id !== cert.id))} className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-white shadow rounded-full p-1 transition" title="ยกเลิกการเพิ่ม">
                                                    <X size={14} />
                                                </button>
                                                <div className="w-full h-32 mb-3 bg-white rounded-lg overflow-hidden flex items-center justify-center border border-green-100">
                                                    <img src={cert.previewUrl} alt={cert.name} className="max-w-full max-h-full object-contain" />
                                                </div>
                                                <p className="text-gray-800 font-medium text-sm line-clamp-2">{cert.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">ปีที่ได้รับ: {cert.issue_year || "—"}</p>
                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-2 absolute top-2 left-2 font-medium">รอเพิ่ม...</span>
                                            </div>
                                        ))}
                                    </div>
                                    {editMode && (
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const target = e.target as typeof e.target & {
                                                name: { value: string };
                                                issue_year: { value: string };
                                                image: { files: FileList };
                                            };
                                            const file = target.image.files[0];
                                            if (!file || !target.name.value) {
                                                toast.error("กรุณากรอกชื่อและเลือกไฟล์รูปภาพ");
                                                return;
                                            }
                                            
                                            const newCert: PendingCert = {
                                                id: Math.random().toString(36).substring(2, 9),
                                                name: target.name.value,
                                                issue_year: target.issue_year.value,
                                                file: file,
                                                previewUrl: URL.createObjectURL(file)
                                            };
                                            
                                            setPendingCertificates(prev => [...prev, newCert]);
                                            (e.target as HTMLFormElement).reset();
                                        }} className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                                            <p className="text-sm font-medium text-gray-700 mb-3">เพิ่มใบประกาศใหม่</p>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <input name="name" required placeholder="ชื่อใบประกาศ" className={inputClass} />
                                                <input name="issue_year" placeholder="ปีที่ได้รับ (พ.ศ.)" className={inputClass} />
                                                <div className="sm:col-span-2">
                                                    <input type="file" name="image" required accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#414E51] file:text-white hover:file:bg-[#2b3436]" />
                                                </div>
                                            </div>
                                            <button type="submit" className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition flex items-center gap-2">
                                                + เพิ่มใบประกาศลงคิว
                                            </button>
                                        </form>
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
