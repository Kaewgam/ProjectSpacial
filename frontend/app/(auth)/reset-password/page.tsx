"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash, FaUserGraduate } from "react-icons/fa";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") ?? "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [tokenError, setTokenError] = useState(false);

    useEffect(() => {
        if (!token) setTokenError(true);
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) { toast.error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
        if (password !== confirm) { toast.error("รหัสผ่านไม่ตรงกัน"); return; }

        setSubmitting(true);
        try {
            const res = await fetch("http://127.0.0.1:8000/api/password-reset/confirm/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
            setDone(true);
            setTimeout(() => router.push("/login"), 3000);
        } catch (err: any) {
            toast.error(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = "w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#414E51] focus:border-[#414E51] focus:outline-none transition";

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

                {/* ─── token ไม่ถูกต้อง / ขาด ─── */}
                {tokenError ? (
                    <div className="text-center">
                        <XCircle size={48} className="mx-auto text-red-400 mb-4" />
                        <h1 className="text-xl font-semibold text-gray-800 mb-2">ลิงก์ไม่ถูกต้อง</h1>
                        <p className="text-gray-500 text-sm mb-6">
                            ลิงก์รีเซ็ตรหัสผ่านนี้ไม่ถูกต้องหรือหมดอายุแล้ว
                        </p>
                        <Link href="/forgot-password" className="inline-flex items-center gap-2 text-[#414E51] font-semibold hover:underline text-sm">
                            ขอลิงก์ใหม่
                        </Link>
                    </div>
                ) : done ? (
                    /* ─── สำเร็จ ─── */
                    <div className="text-center">
                        <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                        <h1 className="text-xl font-semibold text-gray-800 mb-2">เปลี่ยนรหัสผ่านสำเร็จ!</h1>
                        <p className="text-gray-500 text-sm mb-2">กำลังพาคุณไปหน้าเข้าสู่ระบบ...</p>
                        <Link href="/login" className="inline-flex items-center gap-2 text-[#414E51] font-semibold hover:underline text-sm">
                            <ArrowLeft size={16} /> เข้าสู่ระบบเลย
                        </Link>
                    </div>
                ) : (
                    /* ─── ฟอร์มรีเซ็ต ─── */
                    <>
                        <div className="text-center mb-6">
                            <h1 className="text-xl font-semibold text-gray-800">ตั้งรหัสผ่านใหม่</h1>
                            <p className="text-gray-500 text-sm mt-1">กรอกรหัสผ่านใหม่ที่ต้องการ</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* รหัสผ่านใหม่ */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
                                <div className="relative">
                                    <input
                                        type={showPass ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="อย่างน้อย 8 ตัวอักษร"
                                        className={`${inputClass} pr-12`}
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)}
                                        className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-500 hover:text-gray-700">
                                        {showPass ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            {/* ยืนยันรหัสผ่าน */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        placeholder="กรอกรหัสผ่านอีกครั้ง"
                                        className={`${inputClass} pr-12`}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-500 hover:text-gray-700">
                                        {showConfirm ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {confirm && password !== confirm && (
                                    <p className="text-red-500 text-xs mt-1">รหัสผ่านไม่ตรงกัน</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full py-3 rounded-lg text-white font-semibold transition-all ${submitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#414E51] hover:bg-[#2b3436] hover:shadow-lg"
                                    }`}
                            >
                                {submitting ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}
