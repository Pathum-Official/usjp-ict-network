"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, PlayCircle, Plus, Edit, Trash2, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getYouTubeEmbedUrl } from "@/lib/utils";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { ZoomLobbyCard } from "@/components/shared/ZoomLobbyCard";
import { VideoThumbnailCard } from "@/components/shared/VideoThumbnailCard";
import { LectureVideoModal } from "@/components/shared/LectureVideoModal";

// Helper function to extract YouTube ID (no longer used directly but kept just in case)
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function LecturesPage() {
  const { user } = useAuth();
  const [lectures, setLectures] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  useEffect(() => {
    const fetchLectures = async () => {
      if (!user?.cohortId) return;
      try {
        const q = query(
          collection(db, "lectures"),
          where("cohortId", "==", user.cohortId)
        );
        const snapshot = await getDocs(q);
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        list.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
          return timeB - timeA;
        });

        setLectures(list);
      } catch (error) {
        console.error("Error fetching lectures:", error);
        toast.error("Failed to fetch lectures");
      } finally {
        setLoading(false);
      }
    };

    const fetchModules = async () => {
      try {
        const q = query(collection(db, "modules"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a: any, b: any) => (a.code || "").localeCompare(b.code || ""));
        setModules(list);
      } catch (e) {
        console.error("Error fetching modules", e);
      }
    };

    fetchLectures();
    fetchModules();
  }, [user?.cohortId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "lectures", id));
      setLectures(lectures.filter((l) => l.id !== id));
      toast.success("Lecture deleted");
    } catch (error) {
      toast.error("Failed to delete lecture");
    }
  };

  const filteredLectures = lectures.filter(lec => {
    const resType = lec.type || (lec.url?.includes('youtube') ? 'youtube_video' : 'zoom_meeting');

    if (subjectFilter !== "ALL" && (lec.moduleCode !== subjectFilter && lec.module !== subjectFilter)) {
      return false;
    }

    if (typeFilter !== "ALL" && resType !== typeFilter) {
      return false;
    }

    const matchesSearch = (lec.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (lec.moduleCode || lec.module || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const groupedLectures = filteredLectures.reduce((acc, lec) => {
    const mod = lec.moduleCode || lec.module || "Uncategorized";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(lec);
    return acc;
  }, {} as Record<string, typeof lectures>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Video className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">කුප්පි Sessions</h1>
            <p className="text-muted-foreground">Recorded sessions for {user?.cohortId?.toUpperCase() || 'your cohort'}.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto">
          <div className="flex gap-2">
            <select 
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="flex h-10 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Subjects</option>
              {modules.map(m => (
                <option key={m.id} value={m.code}>{m.code}</option>
              ))}
            </select>
            <select 
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="flex h-10 w-full sm:w-36 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Types</option>
              <option value="youtube_video">Recorded Video</option>
              <option value="zoom_meeting">Zoom Live</option>
            </select>
          </div>
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground mt-0.5" />
            <Input 
              placeholder="Search title..." 
              className="pl-9 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {user && ['rep', 'academic_rep', 'super_admin'].includes(user.role) && (
            <Link href="/admin?tab=resources" className={buttonVariants()}>
              <Plus className="mr-2 h-4 w-4" /> Add Lecture
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-0 overflow-hidden flex flex-col h-full border-none shadow-sm">
                <Skeleton className="w-full aspect-video rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-8 w-full mt-4" />
                </div>
              </Card>
            ))}
          </div>
        ) : Object.keys(groupedLectures).length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <p>No sessions found for this cohort.</p>
          </div>
        ) : (
          (Object.entries(groupedLectures) as [string, any[]][]).map(([moduleName, moduleLectures], groupIdx) => (
            <div key={moduleName} className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <div className="h-8 w-1 bg-primary rounded-full"></div>
                <h2 className="text-xl font-bold tracking-tight text-primary">{moduleName}</h2>
                <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{moduleLectures.length} sessions</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {moduleLectures.map((lec: any, i: number) => (
                  <motion.div
                    key={lec.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: (groupIdx * 0.1) + (i * 0.05) }}
                  >
                    <Card className="overflow-hidden h-full flex flex-col hover:border-primary/50 transition-colors">
                      {lec.type === "zoom_meeting" || lec.startTime ? (
                        <>
                          <ZoomLobbyCard 
                            title={lec.title} 
                            module={lec.moduleCode || lec.module} 
                            url={lec.url} 
                            startTime={lec.startTime} 
                            endTime={lec.endTime} 
                          />
                          {user && ['rep', 'academic_rep', 'super_admin'].includes(user.role) && (
                            <CardContent className="pt-4 border-t mt-auto flex justify-end gap-2">
                              <Link href={`/admin?tab=resources&editId=${lec.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </Link>
                              <AlertDialog>
                                <AlertDialogTrigger render={<Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>} />
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the session link.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(lec.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </CardContent>
                          )}
                        </>
                      ) : (
                        <VideoThumbnailCard
                          url={lec.url}
                          title={lec.title}
                          description={lec.description}
                          moduleCode={lec.moduleCode || lec.module}
                          onClick={() => setSelectedVideo(lec)}
                          actionComponent={
                            user && ['rep', 'academic_rep', 'super_admin'].includes(user.role) ? (
                              <>
                                <Link href={`/admin?tab=resources&editId=${lec.id}`} className={buttonVariants({ variant: "ghost", size: "icon", className: "h-6 w-6" })}>
                                  <Edit className="h-3 w-3" />
                                </Link>
                                <AlertDialog>
                                  <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" />}>
                                    <Trash2 className="h-3 w-3" />
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                                      <AlertDialogDescription>This action cannot be undone. This will permanently delete the session link.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(lec.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            ) : null
                          }
                        />
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedVideo && (
        <LectureVideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          url={selectedVideo.url}
          title={selectedVideo.title}
          moduleCode={selectedVideo.moduleCode || selectedVideo.module}
          chapters={selectedVideo.chapters}
        />
      )}
    </div>
  );
}
