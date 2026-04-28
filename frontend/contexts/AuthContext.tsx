"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export interface AuthUser {
    id: string;
    student_id: string;
    email: string;
    role: "ALUMNI" | "ADMIN" | "STUDENT";
    prefix: string;
    first_name: string;
    last_name: string;
    faculty: string;
    department: string;
    occupation: string;
    date_joined: string;
    avatar: string | null;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: () => { },
    refreshUser: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUser = async () => {
        const token = localStorage.getItem("access");
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const res = await api.get("/api/me/");
            setUser(res.data);
        } catch {
            // token หมดอายุหรือ invalid — ล้างออก
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const logout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, refreshUser: fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
