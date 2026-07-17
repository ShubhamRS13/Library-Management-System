import PortalHeader from "@/components/layout/PortalHeader";
import Footer from "@/components/layout/Footer";
import RequirePortalAccess from "@/components/auth/RequirePortalAccess";

export default function LibraryPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequirePortalAccess>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <PortalHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
        <Footer />
      </div>
    </RequirePortalAccess>
  );
}
