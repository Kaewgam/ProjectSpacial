"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, ChevronDown } from "lucide-react";

export default function Navbar() {
    const { user, loading, logout } = useAuth();

    const [newsOpen, setNewsOpen] = useState(false);
    const [activityOpen, setActivityOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // ปิด dropdown เมื่อคลิกข้างนอก
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // ชื่อย่อสำหรับ avatar
    const initials = user
        ? (user.first_name ? user.first_name.charAt(0) : user.student_id.charAt(0)).toUpperCase()
        : "";

    const roleLabel: Record<string, string> = {
        ALUMNI: "ศิษย์เก่า",
        ADMIN: "ผู้ดูแลระบบ",
        STUDENT: "นักศึกษา",
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">

                <Link href="/" className="text-xl font-bold text-gray-800 hover:text-gray-600 transition">
                    Alumni System
                </Link>

                {/* Menu */}
                <div className="hidden md:flex items-center space-x-8 text-gray-700 font-medium relative">

                    <Link href="/" className="hover:text-black">
                        หน้าแรก
                    </Link>

                    <Link href="/search" className="hover:text-black">
                        ค้นหาศิษย์เก่า
                    </Link>

                    <Link href="/graph" className="hover:text-black">
                        เครือข่าย
                    </Link>

                    {/* ข่าวประชาสัมพันธ์ */}
                    <div
                        className="relative"
                        onMouseEnter={() => setNewsOpen(true)}
                        onMouseLeave={() => setNewsOpen(false)}
                    >
                        <button className="hover:text-black">ข่าวประชาสัมพันธ์</button>
                        {newsOpen && (
                            <div className="absolute top-8 left-0 bg-white shadow-lg rounded-md w-48 py-2 z-50">
                                <Link href="#" className="block px-4 py-2 hover:bg-gray-100">ข่าวทั่วไป</Link>
                                <Link href="#" className="block px-4 py-2 hover:bg-gray-100">ข่าวรับสมัครงาน</Link>
                                <Link href="#" className="block px-4 py-2 hover:bg-gray-100">ข่าวศิษย์เก่าดีเด่น</Link>
                            </div>
                        )}
                    </div>

                    {/* กิจกรรม */}
                    <div
                        className="relative"
                        onMouseEnter={() => setActivityOpen(true)}
                        onMouseLeave={() => setActivityOpen(false)}
                    >
                        <button className="hover:text-black">กิจกรรม</button>
                        {activityOpen && (
                            <div className="absolute top-8 left-0 bg-white shadow-lg rounded-md w-48 py-2 z-50">
                                <Link href="#" className="block px-4 py-2 hover:bg-gray-100">กิจกรรมที่ผ่านมา</Link>
                                <Link href="#" className="block px-4 py-2 hover:bg-gray-100">กิจกรรมที่กำลังจะจัด</Link>
                            </div>
                        )}
                    </div>

                    <Link href="#" className="hover:text-black">แหล่งรวมความน่าสนใจ</Link>
                </div>

                {/* Auth Section */}
                <div>
                    {loading ? (
                        // skeleton loader เล็กๆ ขณะโหลด
                        <div className="w-24 h-8 bg-gray-200 rounded-full animate-pulse" />
                    ) : user ? (
                        // ─── มี user: แสดง avatar + dropdown ───
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen((v) => !v)}
                                className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-gray-100 transition"
                            >
                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-[#414E51] flex items-center justify-center text-white text-sm font-bold">
                                            {initials}
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm text-gray-700 font-medium max-w-[120px] truncate">
                                    {user.first_name || user.student_id}
                                </span>
                                <ChevronDown size={14} className={`text-gray-500 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 top-12 bg-white shadow-xl rounded-xl w-56 py-2 z-50 border border-gray-100">
                                    {/* User info header */}
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-sm font-semibold text-gray-800 truncate">
                                            {user.prefix} {user.first_name} {user.last_name || user.student_id}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-[#414E51]/10 text-[#414E51] rounded-full font-medium">
                                            {roleLabel[user.role] ?? user.role}
                                        </span>
                                    </div>

                                    {/* Links */}
                                    <Link
                                        href="/profile"
                                        onClick={() => setProfileOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        <User size={16} className="text-gray-400" />
                                        โปรไฟล์ของฉัน
                                    </Link>

                                    {user.role === "ADMIN" && (
                                        <Link
                                            href="/admin"
                                            onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-500 hover:bg-amber-50 transition"
                                        >
                                            <span className="text-amber-500">⚙️</span>
                                            Admin Dashboard
                                        </Link>
                                    )}

                                    <div className="border-t border-gray-100 mt-1" />

                                    <button
                                        onClick={logout}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition w-full text-left"
                                    >
                                        <LogOut size={16} />
                                        ออกจากระบบ
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // ─── ไม่มี user: ปุ่ม login / register ───
                        <div className="space-x-4">
                            <Link href="/login" className="text-gray-700 hover:text-black font-medium">
                                เข้าสู่ระบบ
                            </Link>
                            <Link
                                href="/register"
                                className="bg-[#414E51] text-white px-4 py-2 rounded-md hover:bg-[#2b3436] transition"
                            >
                                สมัครสมาชิก
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
