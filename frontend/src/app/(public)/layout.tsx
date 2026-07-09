import PublicHeader from "@/components/layout/PublicHeader";
import Footer from "@/components/layout/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
      <Footer />
    </div>
  );
}
