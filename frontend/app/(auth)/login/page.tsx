"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash, FaUserGraduate } from "react-icons/fa";
import api from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();

    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!studentId.trim() || !password.trim()) {
            toast.error("กรอกข้อมูลให้ครบถ้วน");
            return;
        }

        try {
            setSubmitting(true);

            const res = await api.post("/api/token/", {
                student_id: studentId,
                password: password,
            });
            const data = res.data;

            if (!data.access) throw new Error();

            localStorage.setItem("access", data.access);
            localStorage.setItem("refresh", data.refresh);

            toast.success("เข้าสู่ระบบสำเร็จ!");

            setTimeout(() => router.push("/"), 800);
        } catch {
            toast.error("รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง");
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

                {/* หัวข้อ */}
                <div className="text-center mb-8">
                    <h1 className="text-xl font-semibold text-gray-800">
                        Alumni System
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        ลงชื่อเข้าสู่ระบบ
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Student ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            รหัสนักศึกษา
                        </label>
                        <input
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#414E51] focus:border-[#414E51] focus:outline-none transition"
                            placeholder="123456"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            รหัสผ่าน
                        </label>

                        <div className="relative">
                            <input
                                type={passwordVisible ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#414E51] focus:border-[#414E51] focus:outline-none transition pr-12"
                                placeholder="••••••••"
                            />

                            <button
                                type="button"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                                className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-500 hover:text-gray-700"
                            >
                                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    {/* ลืมรหัสผ่าน */}
                    <div className="text-right">
                        <a
                            href="/forgot-password"
                            className="text-sm text-[#414E51] hover:underline"
                        >
                            ลืมรหัสผ่าน?
                        </a>
                    </div>

                    {/* ปุ่ม */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full py-3 rounded-lg text-white font-semibold transition-all duration-300 ${submitting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-[#414E51] hover:bg-[#2b3436] hover:shadow-lg"
                            }`}
                    >
                        {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                    </button>
                </form>

                {/* ลิงก์สมัคร */}
                <div className="text-center mt-6 text-sm text-gray-600">
                    ยังไม่มีบัญชี?{" "}
                    <a
                        href="/register"
                        className="text-[#414E51] font-semibold hover:underline"
                    >
                        สมัครสมาชิก
                    </a>
                </div>
            </div>
        </div>
    );
}