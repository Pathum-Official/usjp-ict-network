"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Briefcase, GraduationCap, Mail, BookOpen, Hash, Cake, Landmark } from "lucide-react";
import { FacebookIcon, InstagramIcon, LinkedInIcon, GitHubIcon, YouTubeIcon, WhatsAppIcon, PhoneIconColor } from "@/components/SocialIcons";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";

export default function DirectoryPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [settings, setSettings] = useState({
    showEmail: true,
    showPhone: true,
    showWhatsapp: true,
    showAddress: true,
    showDob: false,
    showRegNo: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Settings
        const docRef = doc(db, "settings", "directory");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }

        // Fetch Users
        const q = query(collection(db, "users"), where("status", "==", "approved"));
        const snapshot = await getDocs(q);
        const userList: User[] = [];
        snapshot.forEach(doc => {
          userList.push({ uid: doc.id, ...doc.data() } as User);
        });
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching directory:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isRestrictedAccess = batchFilter !== "all" && batchFilter !== currentUser?.cohortId && currentUser?.role !== 'super_admin';

  const filteredUsers = isRestrictedAccess ? [] : users.filter(u => {
    // Normal users and reps can only see their own cohort. Only super_admin sees all.
    if (currentUser?.role !== 'super_admin' && u.cohortId !== currentUser?.cohortId) {
      return false;
    }

    const matchesSearch = (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (u.school || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.combination || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.address || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = batchFilter === "all" || u.cohortId === batchFilter;
    return matchesSearch && matchesBatch;
  });

  // Sort so the logged-in user is always first
  filteredUsers.sort((a, b) => {
    if (a.uid === currentUser?.uid) return -1;
    if (b.uid === currentUser?.uid) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Directory</h1>
        <p className="text-muted-foreground mt-2">Connect with your peers and alumni from ICT Network.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, school, combination or city..." 
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={batchFilter} onValueChange={(v) => setBatchFilter(v || "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            <SelectItem value="ict-2022">ICT 2022</SelectItem>
            <SelectItem value="ict-2023">ICT 2023</SelectItem>
            <SelectItem value="ict-2024">ICT 2024</SelectItem>
            <SelectItem value="ict-2025">ICT 2025</SelectItem>
            <SelectItem value="ict-2026">ICT 2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-24 bg-muted/50" />
              <CardContent className="pt-0 relative">
                <Skeleton className="h-16 w-16 rounded-full absolute -top-8 border-4 border-background" />
                <div className="mt-10 space-y-3">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isRestrictedAccess ? (
        <div className="text-center py-12">
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg inline-block max-w-md">
            <h3 className="font-semibold text-lg mb-1">Access Denied</h3>
            <p className="text-sm">You do not have permission to view the directory for {batchFilter.toUpperCase()}.</p>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No students found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(u => (
            <Card key={u.uid} className="overflow-hidden group hover:shadow-md transition-all">
              <div className="h-20 bg-gradient-to-r from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors" />
              <CardContent className="pt-0 relative">
                <Avatar className="h-16 w-16 absolute -top-8 border-4 border-background shadow-sm">
                  <AvatarImage src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} className="object-cover" />
                  <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="mt-10 mb-4">
                  <h3 className="font-semibold text-lg leading-none">{u.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm text-primary font-medium">{u.cohortId.toUpperCase()}</p>
                    {u.role && u.role !== 'student' && (
                      <Badge variant={u.role === 'super_admin' ? 'destructive' : 'default'} className="text-[10px] px-1.5 py-0 h-4">
                        {u.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {settings.showRegNo && u.regNo && (
                    <div className="flex items-start gap-2">
                      <Hash className="h-4 w-4 shrink-0 mt-0.5 text-foreground/50" />
                      <span className="line-clamp-1">{u.regNo}</span>
                    </div>
                  )}
                  {u.degree && (
                    <div className="flex items-start gap-2">
                      <GraduationCap className="h-4 w-4 shrink-0 mt-0.5 text-foreground/50" />
                      <span className="line-clamp-1">{u.degree}</span>
                    </div>
                  )}
                  {u.combination && (
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-4 w-4 shrink-0 mt-0.5 text-foreground/50" />
                      <span className="line-clamp-1">{u.combination}</span>
                    </div>
                  )}
                  {settings.showAddress && (u.address || u.currentAddress) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-foreground/50" />
                      <span className="line-clamp-1">{u.address || u.currentAddress}</span>
                    </div>
                  )}
                  {u.school && (
                    <div className="flex items-start gap-2">
                      <Landmark className="h-4 w-4 shrink-0 mt-0.5 text-foreground/50" />
                      <span className="line-clamp-1">{u.school}</span>
                    </div>
                  )}
                  {settings.showDob && u.dob && (
                    <div className="flex items-start gap-2">
                      <Cake className="h-4 w-4 shrink-0 mt-0.5 text-foreground/50" />
                      <span className="line-clamp-1">{u.dob}</span>
                    </div>
                  )}
                  {settings.showEmail && (u.publicEmail || u.email) && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 shrink-0 mt-0.5 text-foreground/50" />
                      <span className="line-clamp-1">{u.publicEmail || u.email}</span>
                    </div>
                  )}
                  {(u.jobCompany || u.jobPosition) && (
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-4 w-4 shrink-0 mt-0.5 text-foreground/50" />
                      <span className="line-clamp-1">{u.jobPosition} {u.jobCompany && `@ ${u.jobCompany}`}</span>
                    </div>
                  )}
                </div>
                {((u.socialLinks && Object.values(u.socialLinks).some(link => link)) || (settings.showPhone && u.phone) || (settings.showWhatsapp && u.whatsapp)) && (
                  <div className="mt-4 pt-4 border-t flex items-center gap-3 flex-wrap">
                    {settings.showPhone && u.phone && (
                      <a href={`tel:${u.phone}`} className="hover:scale-110 transition-transform" title="Call">
                        <PhoneIconColor className="h-5 w-5" />
                      </a>
                    )}
                    {settings.showWhatsapp && u.whatsapp && (
                      <a href={`https://wa.me/${u.whatsapp.startsWith('0') ? '94' + u.whatsapp.substring(1) : u.whatsapp}`} target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform" title="WhatsApp">
                        <WhatsAppIcon className="h-5 w-5" />
                      </a>
                    )}
                    {u.socialLinks?.linkedin && (
                      <a href={u.socialLinks.linkedin} target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform" title="LinkedIn">
                        <LinkedInIcon className="h-5 w-5" />
                      </a>
                    )}
                    {u.socialLinks?.github && (
                      <a href={u.socialLinks.github} target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform" title="GitHub">
                        <GitHubIcon className="h-5 w-5" />
                      </a>
                    )}
                    {u.socialLinks?.facebook && (
                      <a href={u.socialLinks.facebook} target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform" title="Facebook">
                        <FacebookIcon className="h-5 w-5" />
                      </a>
                    )}
                    {u.socialLinks?.instagram && (
                      <a href={u.socialLinks.instagram} target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform" title="Instagram">
                        <InstagramIcon className="h-5 w-5" />
                      </a>
                    )}
                    {u.socialLinks?.youtube && (
                      <a href={u.socialLinks.youtube} target="_blank" rel="noreferrer" className="hover:scale-110 transition-transform" title="YouTube">
                        <YouTubeIcon className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
