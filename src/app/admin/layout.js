import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  // Admin stays in light mode whatever the site theme is.
  return (
    <div data-theme="light" className="min-h-screen bg-paper text-ink">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
