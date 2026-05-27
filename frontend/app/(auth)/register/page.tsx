"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { User, Lock, Mail, Briefcase, BookOpen, GraduationCap, Building2, Info, CheckCircle, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import { useFacultyDept } from "@/lib/useFacultyDept";


export default function Register() {
    const router = useRouter();

    const [form, setForm] = useState({
        prefix: "",
        first_name: "",
        last_name: "",
        student_id: "",
        email: "",
        password: "",
        faculty_id: null as string | null,
        department_id: null as string | null,
        other_faculty: "",
        other_department: "",
        occupation: "",
        company: "",
    });

    const { faculties, filteredDepts, loading: fdLoading } = useFacultyDept(form.faculty_id);

    const [submitting, setSubmitting] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const set = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleFacultyChange = (facultyId: string | null) => {
        setForm((prev) => ({ ...prev, faculty_id: facultyId, department_id: null }));
    };

    const handleRegister = async () => {
        if (!form.student_id || !form.email || !form.password) {
            toast.error("กรุณากรอกรหัสนักศึกษา อีเมล และรหัสผ่านให้ครบ");
            return;
        }

        if (form.password.length <= 6) {
            toast.error("ตัวอักษรความยาวมากกว่า 6 ");
            return;
        }
        if (!/[A-Z]/.test(form.password)) {
            toast.error("ตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว");
            return;
        }
        if (!/[0-9]/.test(form.password)) {
            toast.error("ตัวเลขอย่างน้อย 1 ตัว");
            return;
        }

        try {
            setSubmitting(true);
            await api.post("/api/register/", {
                prefix: form.prefix,
                first_name: form.first_name,
                last_name: form.last_name,
                student_id: form.student_id,
                email: form.email,
                password: form.password,
                occupation: form.occupation,
                company: form.company,
                faculty_id: form.faculty_id === 'OTHER' ? null : form.faculty_id,
                department_id: form.department_id === 'OTHER' ? null : form.department_id,
                other_faculty: form.faculty_id === 'OTHER' ? form.other_faculty : "",
                other_department: form.department_id === 'OTHER' ? form.other_department : "",
                role: "ALUMNI",
            });
            toast.success("สมัครสมาชิกสำเร็จ 🎉");
            setTimeout(() => router.push("/login"), 1000);
        } catch (err: any) {
            const detail =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                JSON.stringify(err?.response?.data) ||
                "สมัครไม่สำเร็จ";

            let msg = detail;
            if (detail.toLowerCase().includes("email already") || detail.toLowerCase().includes("already exists")) {
                msg = "อีเมลหรือรหัสนักศึกษานี้ถูกใช้งานแล้ว";
            }
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass =
        "w-full px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#414E51] focus:border-[#414E51] focus:outline-none transition text-sm";
    const selectClass =
        "w-full px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-800 focus:ring-2 focus:ring-[#414E51] focus:border-[#414E51] focus:outline-none transition text-sm appearance-none";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 py-10 px-4">
            <Toaster position="top-center" />

            <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-full bg-[#414E51] flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <GraduationCap className="text-white" size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">แบบฟอร์มสมัครสมาชิก</h1>
                    <p className="text-gray-500 text-sm mt-1">Alumni Information System</p>
                </div>

                <div className="space-y-5">

                    {/* ─── ข้อมูลส่วนตัว ─── */}
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <User size={15} /> ข้อมูลส่วนตัว
                        </h2>

                        {/* คำนำหน้า + ชื่อ + นามสกุล */}
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-3">
                                <label className={labelClass}>คำนำหน้า</label>
                                <div className="relative">
                                    <select
                                        value={form.prefix}
                                        onChange={(e) => set("prefix", e.target.value)}
                                        className={selectClass}
                                    >
                                        <option value="">เลือก...</option>
                                        <option value="นาย">นาย</option>
                                        <option value="นาง">นาง</option>
                                        <option value="นางสาว">นางสาว</option>
                                    </select>
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                                </div>
                            </div>
                            <div className="col-span-5">
                                <label className={labelClass}>ชื่อ</label>
                                <input
                                    value={form.first_name}
                                    onChange={(e) => set("first_name", e.target.value)}
                                    placeholder="กรอกชื่อ"
                                    className={inputClass}
                                />
                            </div>
                            <div className="col-span-4">
                                <label className={labelClass}>นามสกุล</label>
                                <input
                                    value={form.last_name}
                                    onChange={(e) => set("last_name", e.target.value)}
                                    placeholder="กรอกนามสกุล"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* รหัสนักศึกษา */}
                        <div className="mt-3">
                            <label className={labelClass}>รหัสนักศึกษา <span className="text-red-500">*</span></label>
                            <input
                                value={form.student_id}
                                onChange={(e) => set("student_id", e.target.value)}
                                placeholder="กรอกรหัสนักศึกษา"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* ─── การศึกษา ─── */}
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <BookOpen size={15} /> ข้อมูลการศึกษา
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>คณะ</label>
                                <div className="relative">
                                    <select
                                        value={form.faculty_id ?? ""}
                                        onChange={(e) => handleFacultyChange(e.target.value ? String(e.target.value) : null)}
                                        className={selectClass}
                                    >
                                        <option value="">เลือกคณะ</option>
                                        {faculties.map((f) => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                        <option value="OTHER">อื่นๆ (ระบุเอง)</option>
                                    </select>
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                                </div>
                                {form.faculty_id === 'OTHER' && (
                                    <input
                                        type="text"
                                        placeholder="ระบุชื่อคณะ..."
                                        value={form.other_faculty}
                                        onChange={(e) => set("other_faculty", e.target.value)}
                                        className={`${inputClass} mt-2`}
                                    />
                                )}
                            </div>
                            <div>
                                <label className={labelClass}>สาขาวิชา</label>
                                <div className="relative">
                                    <select
                                        value={form.department_id ?? ""}
                                        onChange={(e) => setForm(prev => ({ ...prev, department_id: e.target.value ? String(e.target.value) : null }))}
                                        disabled={!form.faculty_id}
                                        className={`${selectClass} ${!form.faculty_id ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        <option value="">เลือกสาขาวิชา</option>
                                        {filteredDepts.map((d) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                        <option value="OTHER">อื่นๆ (ระบุเอง)</option>
                                    </select>
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                                </div>
                                {form.department_id === 'OTHER' && (
                                    <input
                                        type="text"
                                        placeholder="ระบุชื่อสาขาวิชา..."
                                        value={form.other_department}
                                        onChange={(e) => set("other_department", e.target.value)}
                                        className={`${inputClass} mt-2`}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ─── ข้อมูลติดต่อและอาชีพ ─── */}
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Briefcase size={15} /> ข้อมูลติดต่อและอาชีพ
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className={labelClass}>อีเมล <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => set("email", e.target.value)}
                                        placeholder="example@email.com"
                                        className={`${inputClass} pl-9`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>ตำแหน่ง</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        list="occupations-list"
                                        value={form.occupation}
                                        onChange={(e) => set("occupation", e.target.value)}
                                        placeholder="เลือกหรือพิมพ์ตำแหน่ง"
                                        className={`${inputClass} pl-9`}
                                    />
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
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>หน่วยงาน / สังกัด</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        value={form.company}
                                        onChange={(e) => set("company", e.target.value)}
                                        placeholder="เช่น บริษัท, โรงงาน, สถาบัน"
                                        className={`${inputClass} pl-9`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── รหัสผ่าน ─── */}
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Lock size={15} /> รหัสผ่าน
                        </h2>
                        <div>
                            <label className={labelClass}>รหัสผ่าน <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={form.password}
                                    onChange={(e) => set("password", e.target.value)}
                                    placeholder="••••••••"
                                    className={`${inputClass} pl-9 pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            
                            {/* Password Rules Checklist */}
                            <div className="mt-3 space-y-1.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-xs font-semibold text-gray-600 mb-2">รหัสผ่านต้องประกอบด้วย:</p>
                                <div className={`flex items-center gap-2 text-xs transition-colors ${form.password.length > 6 ? "text-emerald-600" : "text-gray-400"}`}>
                                    {form.password.length > 6 ? <CheckCircle size={14} className="flex-shrink-0" /> : <Info size={14} className="flex-shrink-0" />}
                                    <span>ตัวอักษรความยาวมากกว่า 6</span>
                                </div>
                                <div className={`flex items-center gap-2 text-xs transition-colors ${/[A-Z]/.test(form.password) ? "text-emerald-600" : "text-gray-400"}`}>
                                    {/[A-Z]/.test(form.password) ? <CheckCircle size={14} className="flex-shrink-0" /> : <Info size={14} className="flex-shrink-0" />}
                                    <span>ตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว</span>
                                </div>
                                <div className={`flex items-center gap-2 text-xs transition-colors ${/[0-9]/.test(form.password) ? "text-emerald-600" : "text-gray-400"}`}>
                                    {/[0-9]/.test(form.password) ? <CheckCircle size={14} className="flex-shrink-0" /> : <Info size={14} className="flex-shrink-0" />}
                                    <span>ตัวเลขอย่างน้อย 1 ตัว</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── ปุ่มสมัคร ─── */}
                    <button
                        onClick={handleRegister}
                        disabled={submitting}
                        className={`w-full py-3 rounded-xl text-white font-semibold text-base transition-all duration-300 ${submitting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-[#414E51] hover:bg-[#2b3436] hover:shadow-lg"
                            }`}
                    >
                        {submitting ? "กำลังสมัคร..." : "สร้างบัญชี"}
                    </button>

                    <p className="text-center text-sm text-gray-600">
                        มีบัญชีอยู่แล้ว?{" "}
                        <a href="/login" className="text-[#414E51] font-semibold hover:underline">
                            เข้าสู่ระบบ
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}