// layout สำหรับหน้า Auth (login, register) — ไม่มี Navbar
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
