"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Megaphone, FileText, Video, Receipt, MessageSquare, Shield, Users, Image, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Announcements", href: "/announcements", icon: Megaphone },
  { name: "Resources", href: "/resources", icon: FileText },
  { name: "කුප්පි Sessions", href: "/lectures", icon: Video },
  { name: "Batch Funds", href: "/finances", icon: Receipt },
  { name: "Directory", href: "/directory", icon: Users },
  { name: "Moments", href: "/moments", icon: Image },
  { name: "My Profile", href: "/profile", icon: User },
  { name: "Feedback", href: "/complaints", icon: MessageSquare },
];

export function Sidebar({ className, onItemClick }: { className?: string, onItemClick?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className={cn("flex flex-col h-full bg-card border-r", className)}>
      <div className="p-6 border-b flex items-center gap-2">
        <span className="font-extrabold text-2xl tracking-tight">ICT Portal</span>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
        {user && ['rep', 'academic_rep', 'treasurer', 'media_rep', 'super_admin'].includes(user.role) && (
          <Link
            href="/admin"
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname.startsWith("/admin") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Shield className="h-4 w-4" />
            Admin Panel
          </Link>
        )}
      </div>
    </div>
  );
}
