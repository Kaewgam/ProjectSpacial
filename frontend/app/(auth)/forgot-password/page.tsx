"use client";

import { useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { FaUserGraduate } from "react-icons/fa";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) { toast.error("กรุณากรอกอีเมล"); return; }

        setSubmitting(true);
        try {
            await api.post("/api/password-reset/", { email });
            setSent(true);
        } catch {
            toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 p-4">
            <Toaster position="top-center" />
            <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-7 border border-gray-200">

                {/* โลโก้ */}
                <div className="flex justify-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-[#414E51] flex items-center justify-center shadow-lg">
                        <FaUserGraduate className="text-white text-2xl" />
                    </div>
                </div>

                {sent ? (
                    /* ─── สถานะส่งสำเร็จ ─── */
                    <div className="text-center">
                        <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                        <h1 className="text-xl font-semibold text-gray-800 mb-2">ส่งอีเมลแล้ว!</h1>
                        <p className="text-gray-500 text-sm mb-6">
                            ถ้าอีเมล <span className="font-medium text-gray-700">{email}</span> มีในระบบ
                            คุณจะได้รับลิงก์รีเซ็ตรหัสผ่านภายในไม่กี่นาที ลิงก์จะหมดอายุใน <strong>1 ชั่วโมง</strong>
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-[#414E51] font-semibold hover:underline text-sm"
                        >
                            <ArrowLeft size={16} /> กลับไปหน้าเข้าสู่ระบบ
                        </Link>
                    </div>
                ) : (
                    /* ─── ฟอร์มกรอกอีเมล ─── */
                    <>
                        <div className="text-center mb-6">
                            <h1 className="text-xl font-semibold text-gray-800">ลืมรหัสผ่าน?</h1>
                            <p className="text-gray-500 text-sm mt-1">กรอกอีเมลที่ลงทะเบียนไว้ เราจะส่งลิงก์รีเซ็ตให้</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#414E51] focus:border-[#414E51] focus:outline-none transition"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full py-3 rounded-lg text-white font-semibold transition-all ${submitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#414E51] hover:bg-[#2b3436] hover:shadow-lg"
                                    }`}
                            >
                                {submitting ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
                            </button>
                        </form>

                        <div className="text-center mt-5">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
                            >
                                <ArrowLeft size={14} /> กลับหน้าเข้าสู่ระบบ
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
