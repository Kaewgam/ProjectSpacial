"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Users, Database, ChevronRight } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") return null;

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "จัดการบัญชี", icon: Users },
    { href: "/admin/neo4j", label: "Neo4j Tools", icon: Database },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-5 py-6 border-b border-slate-200">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Admin Panel</p>
          <p className="text-sm font-semibold text-slate-900 truncate">
            {user.first_name || user.student_id}
          </p>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-medium">
            ADMIN
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600
                         hover:bg-slate-50 hover:text-slate-900 transition-all group"
            >
              <Icon size={16} className="group-hover:text-violet-600 transition-colors" />
              <span>{label}</span>
              <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-slate-200">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 transition">
            ← กลับหน้าหลัก
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
