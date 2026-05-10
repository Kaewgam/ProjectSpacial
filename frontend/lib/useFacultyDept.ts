/**
 * useFacultyDept — Shared hook สำหรับดึง Faculty + Department
 * Cache ไว้ใน module-level ไม่โหลดซ้ำระหว่าง component ที่ใช้ร่วมกัน
 */
import { useState, useEffect } from "react";

export interface FacultyOption    { id: string | number; name: string; }
export interface DepartmentOption { id: string | number; name: string; short_name: string; code: string; faculty_id: string | number; }

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// Module-level cache — share ระหว่าง instances ทุกตัว
let cachedFaculties:    FacultyOption[]    | null = null;
let cachedDepartments:  DepartmentOption[] | null = null;
let fetchPromise: Promise<void> | null = null;

async function loadData() {
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    const [fRes, dRes] = await Promise.all([
      fetch(`${BASE}/api/faculties/`),
      fetch(`${BASE}/api/departments/`),
    ]);
    cachedFaculties   = await fRes.json();
    cachedDepartments = await dRes.json();
  })();
  return fetchPromise;
}

export function useFacultyDept(facultyId?: string | number | null) {
  const [faculties,    setFaculties]    = useState<FacultyOption[]>(cachedFaculties ?? []);
  const [departments,  setDepartments]  = useState<DepartmentOption[]>(cachedDepartments ?? []);
  const [loading, setLoading] = useState(!cachedFaculties);

  useEffect(() => {
    if (cachedFaculties) {
      setFaculties(cachedFaculties);
      setDepartments(cachedDepartments ?? []);
      setLoading(false);
      return;
    }
    loadData().then(() => {
      setFaculties(cachedFaculties ?? []);
      setDepartments(cachedDepartments ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Filter departments by selected faculty
  const filteredDepts = facultyId
    ? departments.filter(d => String(d.faculty_id) === String(facultyId))
    : [];

  return { faculties, departments, filteredDepts, loading };
}
