"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
  Search, ChevronLeft, ChevronRight, Shield, Trash2,
  Edit, CheckCircle, X, UserPlus, Eye, EyeOff, Info
} from "lucide-react";

// ─── Types ───────────────────────────────────────────
interface AdminUser {
  id: string;
  student_id: string;
  email: string;
  role: "ALUMNI" | "ADMIN";
  prefix: string;
  first_name: string;
  last_name: string;
  faculty: string;
  department: string;
  faculty_id?: number | string;
  department_id?: number | string;
  occupation: string;
  company: string;
  is_active: boolean;
  date_joined: string;
  avatar: string | null;
}

interface FacultyOption {
  id: number;
  name: string;
}

interface DepartmentOption {
  id: number;
  name: string;
  faculty_id: number;
}

interface UsersResponse {
  results: AdminUser[];
  total: number;
  total_pages: number;
  page: number;
}

interface CreateForm {
  student_id: string;
  email: string;
  password: string;
  role: string;
  prefix: string;
  first_name: string;
  last_name: string;
  faculty: string;
  department: string;
  faculty_id?: string | number;
  department_id?: string | number;
  occupation: string;
  company: string;
}

const EMPTY_FORM: CreateForm = {
  student_id: "", email: "", password: "", role: "ALUMNI",
  prefix: "", first_name: "", last_name: "",
  faculty: "", department: "", faculty_id: "", department_id: "", occupation: "", company: "",
};

const ROLE_COLORS: Record<string, string> = {
  ALUMNI: "bg-violet-100 text-violet-700 border border-violet-200",
  ADMIN: "bg-rose-100 text-rose-700 border border-rose-200",
};

// ─── Field Component ──────────────────────────────────
function Field({
  label, required, error, children,
}: {
  label: React.ReactNode;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center text-xs font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls = (err?: string) =>
  `w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-900
   placeholder-slate-400 focus:outline-none transition
   ${err ? "border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400" : "border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"}`;

// ─── Create User Modal ────────────────────────────────
function CreateUserModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (msg?: string) => void;
}) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<CreateForm>>({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [neo4jWarn, setNeo4jWarn] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  useEffect(() => {
    api.get("/api/faculties/").then((res) => setFaculties(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.faculty_id) {
      api.get(`/api/departments/?faculty_id=${form.faculty_id}`).then((res) => setDepartments(res.data)).catch(() => {});
    } else {
      setDepartments([]);
    }
  }, [form.faculty_id]);

  const set = (k: keyof CreateForm, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
    setGeneralError("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    setGeneralError("");


    try {
      const res = await api.post("/api/admin/users/create/", form);
      if (res.data.neo4j_synced === false) {
        onSuccess("สร้างบัญชีสำเร็จ! 🎉 (⚠️ แต่ไม่ได้ซิงค์ไป Neo4j เนื่องจากไม่ได้เปิดใช้งาน)");
      } else {
        onSuccess("สร้างบัญชีสำเร็จ! 🎉");
      }
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Partial<CreateForm>; error?: string } } };
      const errs = axiosErr.response?.data?.errors;
      const msg = axiosErr.response?.data?.error;
      if (errs) setErrors(errs as Partial<CreateForm>);
      if (msg) setGeneralError(msg);
      if (!errs && !msg) setGeneralError("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl
                      flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <UserPlus size={17} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">สร้างบัญชีใหม่</h2>
              <p className="text-xs text-slate-500">กรอกข้อมูลผู้ใช้ที่ต้องการสร้าง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Section: บัญชี */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              ข้อมูลบัญชี
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Student ID" required error={errors.student_id}>
                <input
                  className={inputCls(errors.student_id)}
                  value={form.student_id}
                  onChange={(e) => set("student_id", e.target.value)}
                  placeholder="เช่น 6501234"
                />
              </Field>

              <Field label="Role" required>
                <select
                  className={inputCls()}
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                >
                  <option value="ALUMNI">ALUMNI — ศิษย์เก่า</option>
                  <option value="ADMIN">ADMIN — ผู้ดูแล</option>
                </select>
              </Field>

              <Field label="Email" required error={errors.email}>
                <input
                  type="email"
                  className={inputCls(errors.email)}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="example@email.com"
                />
              </Field>

              <Field
                label={
                  <span className="flex items-center gap-1.5">
                    รหัสผ่าน
                  </span>
                }
                required
                error={errors.password}
              >
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className={inputCls(errors.password)}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="กำหนดรหัสผ่านเบื้องต้น"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
            </div>
          </div>

          {/* Section: ข้อมูลส่วนตัว */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              ข้อมูลส่วนตัว
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="คำนำหน้า" required error={errors.prefix}>
                <select
                  className={inputCls(errors.prefix)}
                  value={form.prefix}
                  onChange={(e) => set("prefix", e.target.value)}
                >
                  <option value="">— ไม่ระบุ —</option>
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                </select>
              </Field>
              <Field label="ชื่อ" required error={errors.first_name}>
                <input
                  className={inputCls(errors.first_name)}
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  placeholder="ชื่อจริง"
                />
              </Field>
              <Field label="นามสกุล" required error={errors.last_name}>
                <input
                  className={inputCls(errors.last_name)}
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  placeholder="นามสกุล"
                />
              </Field>
            </div>
          </div>

          {/* Section: การศึกษา / อาชีพ */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              การศึกษา & อาชีพ <span className="normal-case font-normal text-slate-600">(ไม่บังคับ)</span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="คณะ">
                <select
                  className={inputCls()}
                  value={form.faculty_id || ""}
                  onChange={(e) => {
                    set("faculty_id", e.target.value);
                    set("department_id", "");
                  }}
                >
                  <option value="">— ไม่ระบุ —</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="หลักสูตร/สาขาวิชา">
                <select
                  className={inputCls()}
                  value={form.department_id || ""}
                  onChange={(e) => set("department_id", e.target.value)}
                  disabled={!form.faculty_id}
                >
                  <option value="">— ไม่ระบุ —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="ตำแหน่ง" >
                <input
                  list="admin-occupations-list-create"
                  className={`${inputCls()}`}
                  value={form.occupation}
                  onChange={(e) => set("occupation", e.target.value)}
                  placeholder="เลือกหรือพิมพ์ตำแหน่ง"
                />
                <datalist id="admin-occupations-list-create">
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
              </Field>
              <Field label="หน่วยงาน / สังกัด" >
                <input
                  className={`${inputCls()}`}
                  value={form.company}
                  onChange={(e) => set("company", e.target.value)}
                  placeholder="เช่น บริษัท, โรงงาน, สถาบัน"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center gap-3">
          {neo4jWarn && (
            <p className="text-xs text-amber-400 flex-1">
              ⚠️ บัญชีสร้างสำเร็จ แต่ยังไม่ได้ sync ไป Neo4j (Neo4j อาจไม่ได้รัน)
            </p>
          )}
          {generalError && (
            <p className="text-xs text-red-400 flex-1">
              ⚠️ {generalError}
            </p>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm text-slate-400 border border-slate-700
                         rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700
                         text-white rounded-xl transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus size={15} />
              )}
              {loading ? "กำลังสร้าง..." : "สร้างบัญชี"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit User Modal ────────────────────────────────
function EditUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUser;
  onClose: () => void;
  onSuccess: (msg?: string) => void;
}) {
  const [form, setForm] = useState<Partial<CreateForm>>({
    student_id: user.student_id,
    email: user.email,
    role: user.role,
    prefix: user.prefix || "",
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    faculty: user.faculty || "",
    department: user.department || "",
    faculty_id: user.faculty_id || "",
    department_id: user.department_id || "",
    occupation: user.occupation || "",
    company: user.company || "",
  });
  const [errors, setErrors] = useState<Partial<CreateForm>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  useEffect(() => {
    api.get("/api/faculties/").then((res) => setFaculties(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.faculty_id) {
      api.get(`/api/departments/?faculty_id=${form.faculty_id}`).then((res) => setDepartments(res.data)).catch(() => {});
    } else {
      setDepartments([]);
    }
  }, [form.faculty_id]);

  const set = (k: keyof CreateForm, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
    setGeneralError("");
  };

  const handleSubmit = async () => {
    // Check if anything changed
    const isUnchanged = (
      form.student_id === user.student_id &&
      form.email === user.email &&
      form.role === user.role &&
      (form.prefix || "") === (user.prefix || "") &&
      (form.first_name || "") === (user.first_name || "") &&
      (form.last_name || "") === (user.last_name || "") &&
      (form.faculty_id || "") == (user.faculty_id || "") &&
      (form.department_id || "") == (user.department_id || "") &&
      (form.occupation || "") === (user.occupation || "") &&
      (form.company || "") === (user.company || "")
    );

    if (isUnchanged) {
      onSuccess("ไม่มีการเปลี่ยนแปลงข้อมูล");
      onClose();
      return;
    }

    setLoading(true);
    setErrors({});
    setGeneralError("");
    let isValid = true;
    if (!form.prefix) {
      setErrors((prev) => ({ ...prev, prefix: "กรุณาเลือกคำนำหน้า" }));
      isValid = false;
    }
    if (!form.first_name) {
      setErrors((prev) => ({ ...prev, first_name: "กรุณากรอกชื่อ" }));
      isValid = false;
    }
    if (!form.last_name) {
      setErrors((prev) => ({ ...prev, last_name: "กรุณากรอกนามสกุล" }));
      isValid = false;
    }

    if (!isValid) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.patch(`/api/admin/users/${user.id}/`, form);
      if (res.data.neo4j_synced === false) {
        onSuccess("อัปเดตข้อมูลสำเร็จ! 🎉 (⚠️ แต่ไม่ได้ซิงค์ไป Neo4j เนื่องจากไม่ได้เปิดใช้งาน)");
      } else {
        onSuccess("อัปเดตข้อมูลสำเร็จ! 🎉");
      }
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Partial<CreateForm>; error?: string } } };
      const errs = axiosErr.response?.data?.errors;
      const msg = axiosErr.response?.data?.error;
      if (errs) setErrors(errs as Partial<CreateForm>);
      if (msg) setGeneralError(msg);
      if (!errs && !msg) setGeneralError("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl
                      flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <Edit size={17} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">แก้ไขข้อมูลผู้ใช้</h2>
              <p className="text-xs text-slate-500">แก้ไขข้อมูลของ {user.student_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Section: บัญชี */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              ข้อมูลบัญชี
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Student ID" error={errors.student_id}>
                <input
                  className={inputCls(errors.student_id)}
                  value={form.student_id}
                  onChange={(e) => set("student_id", e.target.value)}
                />
              </Field>

              <Field label="Role">
                <select
                  className={inputCls()}
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                >
                  <option value="ALUMNI">ALUMNI — ศิษย์เก่า</option>
                  <option value="ADMIN">ADMIN — ผู้ดูแล</option>
                </select>
              </Field>

              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  className={inputCls(errors.email)}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
            </div>
          </div>

          {/* Section: ข้อมูลส่วนตัว */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              ข้อมูลส่วนตัว
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="คำนำหน้า" required error={errors.prefix}>
                <select
                  className={inputCls(errors.prefix)}
                  value={form.prefix}
                  onChange={(e) => set("prefix", e.target.value)}
                >
                  <option value="">— ไม่ระบุ —</option>
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                </select>
              </Field>
              <Field label="ชื่อ" required error={errors.first_name}>
                <input
                  className={inputCls(errors.first_name)}
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                />
              </Field>
              <Field label="นามสกุล" required error={errors.last_name}>
                <input
                  className={inputCls(errors.last_name)}
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                />
              </Field>
            </div>
          </div>

          {/* Section: การศึกษา / อาชีพ */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              การศึกษา & อาชีพ
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="คณะ">
                <select
                  className={inputCls()}
                  value={form.faculty_id || ""}
                  onChange={(e) => {
                    set("faculty_id", e.target.value);
                    set("department_id", "");
                  }}
                >
                  <option value="">— ไม่ระบุ —</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="หลักสูตร/สาขาวิชา">
                <select
                  className={inputCls()}
                  value={form.department_id || ""}
                  onChange={(e) => set("department_id", e.target.value)}
                  disabled={!form.faculty_id}
                >
                  <option value="">— ไม่ระบุ —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="ตำแหน่ง" >
                <input
                  list="admin-occupations-list-edit"
                  className={`${inputCls()}`}
                  value={form.occupation}
                  onChange={(e) => set("occupation", e.target.value)}
                  placeholder="เลือกหรือพิมพ์ตำแหน่ง"
                />
                <datalist id="admin-occupations-list-edit">
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
              </Field>
              <Field label="หน่วยงาน / สังกัด" >
                <input
                  className={`${inputCls()}`}
                  value={form.company}
                  onChange={(e) => set("company", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
          {generalError && (
            <p className="text-xs text-red-500 flex-1">
              ⚠️ {generalError}
            </p>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-300
                         rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700
                         text-white rounded-xl transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Edit size={15} />
              )}
              {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────
function ConfirmModal({
  message, onConfirm, onCancel, danger,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <p className="text-slate-900 text-sm mb-6 text-center leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition
              ${danger ? "bg-red-600 hover:bg-red-700 text-white" : "bg-violet-600 hover:bg-violet-700 text-white"}`}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [confirm, setConfirm] = useState<{
    message: string; onConfirm: () => void; danger?: boolean;
  } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/users/", { params: { q, role, page } });
      setData(res.data);
    } catch {
      showToast("โหลดข้อมูลไม่ได้", false);
    } finally {
      setLoading(false);
    }
  }, [q, role, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [q, role]);

  const changeRole = (user: AdminUser, newRole: string) => {
    setConfirm({
      message: `เปลี่ยน role ของ ${user.student_id} เป็น ${newRole}?`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.patch(`/api/admin/users/${user.id}/`, { role: newRole });
          showToast("เปลี่ยน Role สำเร็จ");
          fetchUsers();
        } catch { showToast("เกิดข้อผิดพลาด", false); }
      },
    });
  };



  const deleteUser = (user: AdminUser) => {
    setConfirm({
      message: `ลบบัญชี ${user.student_id} ออกจากระบบ? ไม่สามารถย้อนกลับได้`,
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.delete(`/api/admin/users/${user.id}/`);
          showToast("ลบ User สำเร็จ");
          fetchUsers();
        } catch { showToast("เกิดข้อผิดพลาด", false); }
      },
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl
          flex items-center gap-2 ${toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.ok ? <CheckCircle size={15} /> : <X size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onSuccess={(msg) => { showToast(msg || "สร้างบัญชีสำเร็จ! 🎉"); setTimeout(() => window.location.reload(), 1500); }}
        />
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={(msg) => { showToast(msg || "แก้ไขข้อมูลสำเร็จ! 🎉"); fetchUsers(); }}
        />
      )}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการบัญชี</h1>
          <p className="text-slate-500 text-sm mt-1">
            {data ? `${data.total.toLocaleString()} ผู้ใช้ทั้งหมด` : "กำลังโหลด..."}
          </p>
        </div>
        {/* ── ปุ่มสร้างบัญชีใหม่ ── */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700
                     text-white text-sm font-semibold rounded-xl transition shadow-lg
                     shadow-violet-900/30 hover:shadow-violet-800/40"
        >
          <UserPlus size={16} />
          สร้างบัญชีใหม่
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="ค้นหา ชื่อ, รหัสนักศึกษา..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl
                       text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 transition focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="bg-white border border-slate-300 rounded-xl px-4 py-2.5
                     text-sm text-slate-900 focus:outline-none focus:border-violet-500 transition focus:ring-1 focus:ring-violet-500"
        >
          <option value="">ทั้งหมด</option>
          <option value="ALUMNI">ALUMNI</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : !data || data.results.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">ไม่พบผู้ใช้</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">ผู้ใช้</th>
                  <th className="text-left px-4 py-3">คณะ</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">สมัครวันที่</th>
                  <th className="text-right px-5 py-3">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-slate-100">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                              {u.first_name ? u.first_name[0] : u.student_id[0]}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {u.prefix} {u.first_name} {u.last_name || ""}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{u.student_id} · {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-700 truncate max-w-32">{u.faculty || "—"}</p>
                      <p className="text-xs text-slate-500 truncate max-w-32">{u.department || ""}</p>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer
                          focus:outline-none focus:ring-2 focus:ring-violet-500
                          ${ROLE_COLORS[u.role] || "bg-slate-100 text-slate-700"} bg-transparent`}
                      >
                        <option value="ALUMNI">ALUMNI</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">{u.date_joined}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(u)}
                          title="แก้ไขข้อมูล"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => deleteUser(u)}
                          title="ลบ User"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-slate-500">
            หน้า {data.page} / {data.total_pages} ({data.total} รายการ)
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= data.total_pages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
