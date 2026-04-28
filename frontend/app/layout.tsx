import "./globals.css";

// Root layout — แค่ HTML shell เท่านั้น
// Navbar จะจัดการโดย (main)/layout.tsx
// หน้า auth ใช้ (auth)/layout.tsx ที่ไม่มี Navbar
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="bg-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}