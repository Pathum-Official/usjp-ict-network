"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      <Link 
        href="/" 
        onClick={onClick}
        className={`text-lg md:text-sm font-medium transition-colors hover:text-primary ${isActive("/") ? "text-primary font-semibold" : "text-foreground/80"}`}
      >
        Home
      </Link>
      <Link 
        href="/#about" 
        onClick={onClick}
        className="text-lg md:text-sm font-medium transition-colors hover:text-primary text-foreground/80"
      >
        About
      </Link>
      <Link 
        href="/#events" 
        onClick={onClick}
        className="text-lg md:text-sm font-medium transition-colors hover:text-primary text-foreground/80"
      >
        Events
      </Link>
      <Link 
        href="/#gallery" 
        onClick={onClick}
        className="text-lg md:text-sm font-medium transition-colors hover:text-primary text-foreground/80"
      >
        Gallery
      </Link>
      <Link 
        href="/#achievements" 
        onClick={onClick}
        className="text-lg md:text-sm font-medium transition-colors hover:text-primary text-foreground/80"
      >
        Achievements
      </Link>
      <Link 
        href="/#committee" 
        onClick={onClick}
        className="text-lg md:text-sm font-medium transition-colors hover:text-primary text-foreground/80"
      >
        Committee
      </Link>
      <Link 
        href="/#birthdays" 
        onClick={onClick}
        className="text-lg md:text-sm font-medium transition-colors hover:text-primary text-foreground/80"
      >
        Birthdays
      </Link>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-extrabold text-2xl bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">ICT Network</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLinks />
          </nav>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Log In</Link>
              <Link href="/register" className={`${buttonVariants({ size: "sm" })} bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:scale-105`}>Register</Link>
            </div>
            
            {/* Mobile Nav */}
            <div className="md:hidden flex items-center">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger render={<button className="p-2 -mr-2 text-foreground/80 hover:text-primary transition-colors"><Menu className="h-6 w-6" /></button>} />
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="text-left text-2xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent mb-6">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-6 mt-4">
                    <nav className="flex flex-col gap-6">
                      <NavLinks onClick={() => setIsOpen(false)} />
                    </nav>
                    <div className="h-px bg-border w-full my-2"></div>
                    <div className="flex flex-col gap-3">
                      <Link href="/login" onClick={() => setIsOpen(false)} className={buttonVariants({ variant: "outline", className: "w-full justify-center" })}>Log In</Link>
                      <Link href="/register" onClick={() => setIsOpen(false)} className={buttonVariants({ className: "w-full justify-center" })}>Register</Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full">{children}</main>
      
      <footer className="border-t py-12 mt-12 bg-card relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <div>
              <span className="font-bold text-xl text-primary">ICT Network</span>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">University of Sri Jayewardenepura. Fostering excellence in Physics, Mathematics & Technology.</p>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} USJP ICT Network. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
