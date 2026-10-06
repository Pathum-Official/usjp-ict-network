"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, doc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FileText, Search, Download, ExternalLink, Plus, Edit, Trash2, Image as ImageIcon, Code } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { ResourceViewerModal } from "@/components/shared/ResourceViewerModal";
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
import { Badge } from "@/components/ui/badge";

export default function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedResource, setSelectedResource] = useState<{ url: string, title: string, type: string } | null>(null);

  useEffect(() => {
    const fetchResourcesAndModules = async () => {
      if (!user?.cohortId) return;
      try {
        // Fetch Cohorts to determine allowed cohorts
        const cohortsSnap = await getDocs(collection(db, "cohorts"));
        const allowedCohorts: string[] = [];
        cohortsSnap.forEach(d => {
          const data = d.data();
          if (user?.role === 'super_admin') {
             allowedCohorts.push(data.id);
          } else {
             if (data.id === user.cohortId) {
               allowedCohorts.push(data.id);
             } else if (data.shareResourcesWith?.includes('all') || data.shareResourcesWith?.includes(user.cohortId)) {
               allowedCohorts.push(data.id);
             }
          }
        });

        // Fetch resources in chunks of 10 to respect Firestore 'in' query limit
        const list: any[] = [];
        if (allowedCohorts.length > 0) {
          for (let i = 0; i < allowedCohorts.length; i += 10) {
            const chunk = allowedCohorts.slice(i, i + 10);
            const q = query(collection(db, "resources"), where("cohortId", "in", chunk));
            const snapshot = await getDocs(q);
            snapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() });
            });
          }
        }
        
        list.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
          return timeB - timeA;
        });

        setResources(list);

        // Fetch modules for all allowed cohorts
        const modsList: any[] = [];
        if (allowedCohorts.length > 0) {
          for (let i = 0; i < allowedCohorts.length; i += 10) {
            const chunk = allowedCohorts.slice(i, i + 10);
            const qMods = query(collection(db, "modules"), where("cohortId", "in", chunk));
            const snapMods = await getDocs(qMods);
            snapMods.forEach((doc) => {
              modsList.push({ id: doc.id, ...doc.data() });
            });
          }
        }
        modsList.sort((a: any, b: any) => (a.code || "").localeCompare(b.code || ""));
        setModules(modsList);

      } catch (error) {
        console.error("Error fetching resources:", error);
        toast.error("Failed to fetch resources");
      } finally {
        setLoading(false);
      }
    };
    
    fetchResourcesAndModules();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "resources", id));
      setResources(resources.filter((r) => r.id !== id));
      toast.success("Resource deleted");
    } catch (error) {
      toast.error("Failed to delete resource");
    }
  };

  const filteredResources = resources.filter(r => {
    if (activeTab !== "ALL" && r.category !== activeTab) return false;
    if (subjectFilter !== "ALL" && r.moduleId !== subjectFilter) return false;
    if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.title?.toLowerCase().includes(q) && !r.description?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Hub</h1>
          <p className="text-muted-foreground mt-2">Access study materials, lecture notes, and past papers.</p>
        </div>
        {(user?.role === 'rep' || user?.role === 'academic_rep' || user?.role === 'super_admin') && (
          <Link href="/admin?tab=resources" className={buttonVariants({ variant: "default" })}>
            <Plus className="mr-2 h-4 w-4" /> Upload Resource
          </Link>
        )}
      </div>

      <Card className="border-primary/10 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search resources..." 
                className="pl-9 h-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={subjectFilter}
                onChange={e => setSubjectFilter(e.target.value)}
              >
                <option value="ALL">All Subjects</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                ))}
              </select>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="pdf_document">PDF Documents</option>
                <option value="video_lecture">Video Lectures</option>
                <option value="external_link">External Links</option>
                <option value="source_code">Source Code</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="mb-4 w-max sm:w-auto h-11 p-1">
            <TabsTrigger value="ALL" className="rounded-md">All Resources</TabsTrigger>
            <TabsTrigger value="Lecture Notes" className="rounded-md">Lecture Notes</TabsTrigger>
            <TabsTrigger value="Past Papers" className="rounded-md">Past Papers</TabsTrigger>
            <TabsTrigger value="Tutorials" className="rounded-md">Tutorials</TabsTrigger>
            <TabsTrigger value="Assignments" className="rounded-md">Assignments</TabsTrigger>
            <TabsTrigger value="Other" className="rounded-md">Other</TabsTrigger>
          </TabsList>
        </div>

        {["ALL", "Lecture Notes", "Past Papers", "Tutorials", "Assignments", "Other"].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-0 outline-none">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="text-center py-20 px-4 mt-6 border border-dashed rounded-xl bg-card/50">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium text-foreground">No resources found</h3>
                <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                  We couldn't find any materials matching your search criteria. Try adjusting your filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                {filteredResources.map((r, i) => {
                  const mod = modules.find(m => m.id === r.moduleId);
                  
                  // Helper function to render the appropriate icon based on resource type
                  const renderTypeIcon = () => {
                    switch(r.type) {
                      case 'pdf_document': return <FileText className="h-8 w-8 text-red-500" />;
                      case 'video_lecture': return <ImageIcon className="h-8 w-8 text-blue-500" />;
                      case 'source_code': return <Code className="h-8 w-8 text-emerald-500" />;
                      default: return <ExternalLink className="h-8 w-8 text-primary" />;
                    }
                  };
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={r.id}
                    >
                      <Card className="h-full flex flex-col hover:shadow-md transition-all group overflow-hidden border-border/50 hover:border-primary/30">
                        <CardContent className="p-0 flex flex-col h-full">
                          <div className="p-5 flex-1 space-y-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="p-3 bg-muted/50 rounded-xl group-hover:bg-primary/5 transition-colors">
                                {renderTypeIcon()}
                              </div>
                              <div className="flex gap-2">
                                {(user?.role === 'super_admin' || (user?.role === 'rep' && user?.cohortId === r.cohortId)) && (
                                  <>
                                    <Link href={`/admin?tab=resources&editId=${r.id}`} className="p-2 text-muted-foreground hover:text-primary bg-background shadow-sm border rounded-md opacity-100 transition-opacity">
                                      <Edit className="h-4 w-4" />
                                    </Link>
                                    <AlertDialog>
                                      <AlertDialogTrigger>
                                        <div className="p-2 text-muted-foreground hover:text-destructive bg-background shadow-sm border rounded-md opacity-100 transition-opacity cursor-pointer inline-flex items-center justify-center">
                                          <Trash2 className="h-4 w-4" />
                                        </div>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the resource "{r.title}".
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(r.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                {mod && (
                                  <Badge variant="outline" className="font-mono text-xs text-primary/80 border-primary/20 bg-primary/5">
                                    {mod.code}
                                  </Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                  {r.category}
                                </span>
                              </div>
                              <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                                {r.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5">
                                {r.description || "No description provided."}
                              </p>
                              {user?.cohortId !== r.cohortId && (
                                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-medium">Shared by {r.cohortId.toUpperCase()}</p>
                              )}
                            </div>
                          </div>

                          <div className="border-t bg-muted/20 p-3 px-5 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              {new Date(r.createdAt?.toDate ? r.createdAt.toDate() : r.createdAt).toLocaleDateString()}
                            </span>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary hover:text-primary hover:bg-primary/10 -mr-2"
                              onClick={() => {
                                // If it's a Drive file or supported preview format, open in modal
                                if (r.url.includes('drive.google.com') || r.url.endsWith('.pdf') || r.url.includes('youtube.com') || r.url.includes('youtu.be')) {
                                  setSelectedResource({ url: r.url, title: r.title, type: r.type });
                                } else {
                                  // Otherwise open in new tab
                                  window.open(r.url, '_blank');
                                }
                              }}
                            >
                              <span className="mr-2">View</span>
                              {r.type === 'external_link' ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ResourceViewerModal 
        isOpen={!!selectedResource}
        onClose={() => setSelectedResource(null)}
        url={selectedResource?.url || ""}
        title={selectedResource?.title || ""}
        type={selectedResource?.type || ""}
      />
    </div>
  );
}
