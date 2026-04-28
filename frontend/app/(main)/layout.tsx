import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <Navbar />
            <div>{children}</div>
        </AuthProvider>
    );
}
