"use client";

import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, LogOut, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "./sidebar";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { doc, updateDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState, useEffect } from "react";

export function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const q = query(collection(db, "cohorts"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach(d => list.push({ id: d.data().id, name: d.data().name }));
        setCohorts(list);
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.role === 'super_admin') {
      fetchCohorts();
    }
  }, [user?.role]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const handleCohortSwitch = async (newCohort: string | null) => {
    if (!user || !newCohort) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        cohortId: newCohort
      });
      toast.success(`Switched to cohort ${newCohort.toUpperCase()}`);
      // AuthContext will automatically re-fetch the user doc when the listener updates
      // or we can refresh the page to be absolutely sure everything re-renders properly
      window.location.reload(); 
    } catch (error) {
      toast.error("Failed to switch cohort");
    }
  };

  return (
    <header className="h-16 border-b flex items-center justify-between px-4 lg:px-8 bg-background sticky top-0 z-40">
      <div className="flex items-center gap-4 lg:hidden">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <Sidebar onItemClick={() => setIsSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-bold text-lg text-primary">ICT Portal</span>
      </div>

      <div className="hidden lg:flex items-center">
        {/* Breadcrumb or Search could go here */}
      </div>

      <div className="flex items-center gap-4">
        {user?.role === 'super_admin' ? (
          <div className="hidden sm:block">
            <Select value={user.cohortId} onValueChange={handleCohortSwitch}>
              <SelectTrigger className="h-8 text-xs font-semibold w-[130px]">
                <SelectValue placeholder="Cohort" />
              </SelectTrigger>
              <SelectContent>
                {cohorts.length > 0 ? (
                  cohorts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))
                ) : user?.cohortId ? (
                  <SelectItem value={user.cohortId} disabled>{user.cohortId.toUpperCase()}</SelectItem>
                ) : (
                  <SelectItem value="none" disabled>NO COHORT</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        ) : (
          user?.cohortId && (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {user.cohortId.toUpperCase()}
            </Badge>
          )
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-8 w-8 rounded-full" />}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} alt={user?.name || "User"} />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-2">
                  <div>
                    <p className="text-sm font-medium leading-none">{user?.name || "Student"}</p>
                    <p className="text-xs leading-none text-muted-foreground mt-1">{user?.email}</p>
                  </div>
                  {user?.regNo && (
                    <p className="text-xs font-mono text-muted-foreground">Reg No: {user.regNo}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="outline" className="text-[10px]">{user?.role?.replace('_', ' ').toUpperCase() || 'STUDENT'}</Badge>
                    {user?.cohortId && <Badge variant="secondary" className="text-[10px]">{user.cohortId.toUpperCase()}</Badge>}
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
