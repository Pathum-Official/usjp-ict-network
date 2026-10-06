import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { Sidebar } from "@/components/portal/sidebar";
import { Header } from "@/components/portal/header";
import { PortalGuard } from "@/components/portal/PortalGuard";
import { BirthdaySurprise } from "@/components/portal/BirthdaySurprise";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex bg-muted/20">
        <aside className="w-64 hidden lg:block fixed inset-y-0 z-30">
          <Sidebar />
        </aside>
        <main className="flex-1 flex flex-col lg:pl-64">
          <Header />
          <div className="flex-1 p-6 lg:p-8 overflow-auto">
            <PortalGuard>
              {children}
              <BirthdaySurprise />
            </PortalGuard>
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}
