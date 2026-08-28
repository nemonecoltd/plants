import { requireAdmin } from "@/lib/admin";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F4]">
        <p className="text-sm text-gray-500">권한이 없습니다.</p>
      </div>
    );
  }

  return <div className="min-h-screen bg-[#F4F6F4]">{children}</div>;
}
