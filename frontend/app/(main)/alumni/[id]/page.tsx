"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User as UserIcon, Calendar, GraduationCap, Briefcase, Award, ArrowLeft, Github, Phone, Mail } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import toast, { Toaster } from "react-hot-toast";

interface AlumniDetail {
    id: string;
    student_id: string;
    email: string;
    prefix: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    github_link: string;
    educations: {
        faculty_name: string;
        department_name: string;
        degree_level: string;
        graduation_year: string;
    }[];
    careers: {
        occupation: string;
        company: string;
        work_email: string;
        is_current: boolean;
        start_year: string;
        end_year: string;
    }[];
    skills: string[];
    certificates: {
        id: number;
        name: string;
        issue_year: number;
        image: string | null;
    }[];
    date_joined: string;
    avatar: string | null;
}

export default function AlumniDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser, loading: authLoading } = useAuth();
    const [alum, setAlum] = useState<AlumniDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAllCerts, setShowAllCerts] = useState(false);

    const alumniId = params.id as string;

    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) return;

        // If not logged in, redirect away
        if (!currentUser) {
            toast.error("กรุณาเข้าสู่ระบบเพื่อดูข้อมูล");
            router.replace("/login");
            return;
        }

        const fetchAlumniDetail = async () => {
            try {
                const res = await api.get(`/api/alumni/${alumniId}/`);
                setAlum(res.data);
            } catch (err) {
                toast.error("ไม่พบข้อมูลศิษย์เก่า");
            } finally {
                setLoading(false);
            }
        };

        fetchAlumniDetail();
    }, [alumniId, currentUser, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!alum) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <p className="text-gray-500 mb-4">ไม่พบข้อมูล หรือเกิดข้อผิดพลาด</p>
                <button onClick={() => router.back()} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    กลับหน้าค้นหา
                </button>
            </div>
        );
    }

    const initials = (alum.first_name ? alum.first_name.charAt(0) : alum.student_id.charAt(0)).toUpperCase();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 py-10 px-6">
            <Toaster position="top-center" />
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* ─── Back Button ─── */}
                <button 
                    onClick={() => router.back()} 
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition font-medium"
                >
                    <ArrowLeft size={16} /> ย้อนกลับ
                </button>

                {/* ─── Header Card ─── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5">
                    <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-full overflow-hidden shadow border border-gray-100">
                            {alum.avatar ? (
                                <img src={alum.avatar} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-3xl font-bold">
                                    {initials}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-gray-800 truncate">
                            {alum.prefix} {alum.first_name} {alum.last_name || "—"}
                        </h1>
                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                            รหัสนักศึกษา: {alum.student_id}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="bg-violet-100 text-violet-700 border-violet-200 text-xs px-3 py-1 rounded-full font-semibold border">
                                ศิษย์เก่า
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar size={12} /> เข้าร่วมเมื่อ {alum.date_joined}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ─── ข้อมูลส่วนตัว ─── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <UserIcon size={18} className="text-violet-500" /> ช่องทางการติดต่อ
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                            <p className="text-xs text-gray-400 mb-1">อีเมล</p>
                            <p className="text-gray-800 font-medium text-sm flex items-center gap-2">
                                <Mail size={14} className="text-gray-400" /> {alum.email || "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">เบอร์โทรศัพท์</p>
                            <p className="text-gray-800 font-medium text-sm flex items-center gap-2">
                                <Phone size={14} className="text-gray-400" /> {alum.phone_number || "—"}
                            </p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-xs text-gray-400 mb-1">ลิงก์ GitHub / Portfolio</p>
                            <p className="text-gray-800 font-medium text-sm flex items-center gap-2">
                                <Github size={14} className="text-gray-400" />
                                {alum.github_link ? (
                                    <a href={alum.github_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                        {alum.github_link}
                                    </a>
                                ) : (
                                    "—"
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ─── ข้อมูลการศึกษา ─── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <GraduationCap size={18} className="text-sky-500" /> ประวัติการศึกษา
                    </h2>
                    {alum.educations && alum.educations.length > 0 ? (
                        <div className="space-y-4">
                            {alum.educations.map((edu, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">ระดับปริญญา / วุฒิ</p>
                                            <p className="text-gray-800 font-medium text-sm">{edu.degree_level || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">ปีที่สำเร็จการศึกษา</p>
                                            <p className="text-gray-800 font-medium text-sm">{edu.graduation_year || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">คณะ</p>
                                            <p className="text-gray-800 font-medium text-sm">{edu.faculty_name || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">สาขาวิชา</p>
                                            <p className="text-gray-800 font-medium text-sm">{edu.department_name || "—"}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">ไม่มีข้อมูลการศึกษา</p>
                    )}
                </div>

                {/* ─── ข้อมูลการทำงาน ─── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <Briefcase size={18} className="text-amber-500" /> ประวัติการทำงาน
                    </h2>
                    {alum.careers && alum.careers.length > 0 ? (
                        <div className="space-y-4">
                            {alum.careers.map((car, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative overflow-hidden">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">ตำแหน่ง / อาชีพ</p>
                                            <p className="text-gray-800 font-medium text-sm">{car.occupation || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">หน่วยงาน / บริษัท</p>
                                            <p className="text-gray-800 font-medium text-sm">{car.company || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">อีเมลบริษัท</p>
                                            <p className="text-gray-800 font-medium text-sm">{car.work_email || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">ระยะเวลา</p>
                                            <p className="text-gray-800 font-medium text-sm">
                                                {car.start_year || "—"} - {car.end_year || "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">ไม่มีข้อมูลการทำงาน</p>
                    )}
                </div>

                {/* ─── ทักษะ ─── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <Award size={18} className="text-pink-500" /> ทักษะและความเชี่ยวชาญ
                    </h2>
                    {alum.skills && alum.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {alum.skills.map((skill, idx) => (
                                <span key={idx} className="bg-pink-50 text-pink-700 border border-pink-100 text-sm px-3 py-1.5 rounded-lg font-medium">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">ไม่มีข้อมูลทักษะ</p>
                    )}
                </div>

                {/* ─── ประกาศนียบัตร ─── */}
                {alum.certificates && alum.certificates.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Award size={18} className="text-emerald-500" /> ประกาศนียบัตร
                            </h2>
                            {alum.certificates.length > 4 && (
                                <button 
                                    onClick={() => setShowAllCerts(!showAllCerts)}
                                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition"
                                >
                                    {showAllCerts ? "ย่อดูน้อยลง" : "ดูเพิ่มเติม"}
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {(showAllCerts ? alum.certificates : alum.certificates.slice(0, 4)).map(cert => (
                                <div key={cert.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow transition">
                                    {cert.image ? (
                                        <div className="aspect-[4/3] w-full bg-gray-100 relative group cursor-pointer">
                                            <img src={cert.image} alt={cert.name} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                <span className="text-white text-xs font-semibold px-2 py-1 bg-black/50 rounded">คลิกดูรูปใหญ่</span>
                                            </div>
                                            <a href={cert.image} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10" />
                                        </div>
                                    ) : (
                                        <div className="aspect-[4/3] w-full bg-gray-100 flex items-center justify-center text-gray-400">
                                            ไม่มีรูปภาพ
                                        </div>
                                    )}
                                    <div className="p-3">
                                        <h3 className="font-semibold text-gray-800 text-sm truncate" title={cert.name}>{cert.name}</h3>
                                        <p className="text-xs text-gray-500 mt-1">ปี: {cert.issue_year}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
