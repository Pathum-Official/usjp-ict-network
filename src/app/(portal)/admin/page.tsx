"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, Plus, Upload, Megaphone, Users, MessageSquare, Sparkles, Trash2, LibraryBig, Settings, FolderGit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UserManagementTab } from "@/components/admin/UserManagementTab";
import { ComplaintsManagementTab } from "@/components/admin/ComplaintsManagementTab";
import { SubjectsManagementTab } from "@/components/admin/SubjectsManagementTab";
import { AnnouncementsTable } from "@/components/admin/AnnouncementsTable";
import { ResourcesTable } from "@/components/admin/ResourcesTable";
import { FinancesTable } from "@/components/admin/FinancesTable";
import { FundsManager } from "@/components/admin/FundsManager";
import { PublicContentManagementTab } from "@/components/admin/PublicContentManagementTab";
import { CombinationsManagementTab } from "@/components/admin/CombinationsManagementTab";
import { DirectorySettingsTab } from "@/components/admin/DirectorySettingsTab";
import { CohortsManagementTab } from "@/components/admin/CohortsManagementTab";
import { ProfileRequestsTab } from "@/components/admin/ProfileRequestsTab";
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, serverTimestamp, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToImgBB } from "@/lib/imgbb";
import { Loader2, Image as ImageIcon, Link as LinkIcon, UserCog } from "lucide-react";

function AdminPageContent() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const cohortId = user?.cohortId || '';
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("announcements");

  const editId = searchParams.get("editId");

  const [refreshKeys, setRefreshKeys] = useState({
    announcements: 0,
    resources: 0,
    finances: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [annTitle, setAnnTitle] = useState("");
  const [annCategory, setAnnCategory] = useState("General");
  const [annContent, setAnnContent] = useState("");
  const [annHasPoll, setAnnHasPoll] = useState(false);
  const [annBannerUrl, setAnnBannerUrl] = useState("");
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [annAttachedResources, setAnnAttachedResources] = useState<any[]>([]);
  const [systemResources, setSystemResources] = useState<any[]>([]);
  const [attachSearch, setAttachSearch] = useState("");
  const [attachFilter, setAttachFilter] = useState("ALL");

  const [pollQuestion, setPollQuestion] = useState("");
  const [pollType, setPollType] = useState<"single" | "multiple">("single");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const [resType, setResType] = useState("pdf_document");
  const [resCategory, setResCategory] = useState("Lecture Notes");
  const [resTitle, setResTitle] = useState("");
  const [resModule, setResModule] = useState("");
  const [resUrl, setResUrl] = useState("");
  const [resDesc, setResDesc] = useState("");
  const [resChaptersList, setResChaptersList] = useState<{time: string, title: string}[]>([]);
  const [newChapterTime, setNewChapterTime] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [txType, setTxType] = useState("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txDesc, setTxDesc] = useState("");
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txFundId, setTxFundId] = useState("");
  const [fundsList, setFundsList] = useState<any[]>([]);

  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        if (!user) return;
        
        let q;
        if (isSuperAdmin) {
          q = query(collection(db, "modules"));
        } else {
          q = query(collection(db, "modules"), where("cohortId", "==", cohortId));
        }
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setModules(list);

        // Fetch System Resources, Gallery Moments, and Lectures for Announcements Attachments
        const resList: any[] = [];
        
        try {
          const resQuery = query(collection(db, "resources"), where("cohortId", "==", cohortId));
          const resSnap = await getDocs(resQuery);
          resSnap.forEach(d => { const data = d.data(); resList.push({ id: d.id, ...data, __source: 'Resource' }); });
        } catch(e) { console.error(e); }
        
        try {
          const galQuery = query(collection(db, "gallery"), where("cohortId", "==", cohortId));
          const galSnap = await getDocs(galQuery);
          galSnap.forEach(d => { const data = d.data(); resList.push({ id: d.id, ...data, type: 'gallery_image', category: 'Moment', url: data.imageUrl, title: data.title || 'Gallery Moment', __source: 'Gallery' }); });
        } catch(e) { console.error(e); }

        try {
          const lecQuery = query(collection(db, "lectures"), where("cohortId", "==", cohortId));
          const lecSnap = await getDocs(lecQuery);
          lecSnap.forEach(d => { const data = d.data(); resList.push({ id: d.id, ...data, type: data.type || 'lecture_video', category: 'Lecture', url: data.videoUrl || data.url, title: data.title || 'Lecture Video', __source: 'Lecture' }); });
        } catch(e) { console.error(e); }

        // Sort manually to bypass missing composite index in Firestore
        resList.sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });
        
        setSystemResources(resList);
      } catch (err) {
        console.error("Error fetching modules/resources:", err);
      }
    };

    const fetchFunds = async () => {
      if (!cohortId) return;
      try {
        const q = query(collection(db, "funds"), where("cohortId", "==", cohortId));
        const snap = await getDocs(q);
        const flist: any[] = [];
        snap.forEach(d => flist.push({ id: d.id, ...d.data() }));
        setFundsList(flist);
        if (flist.length > 0 && !txFundId) {
          setTxFundId(flist[0].id);
        }
      } catch(e) {
        console.error(e);
      }
    };

    fetchModules();
    if (activeTab === 'finances') {
      fetchFunds();
    }
  }, [user, isSuperAdmin, cohortId, activeTab]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (editId) {
      const fetchEditDoc = async () => {
        try {
          if (activeTab === "announcements") {
            const docSnap = await getDoc(doc(db, "announcements", editId));
            if (docSnap.exists()) {
              const data = docSnap.data();
              setAnnTitle(data.title || "");
              setAnnCategory(data.category || "General");
              setAnnContent(data.content || "");
              setAnnBannerUrl(data.bannerUrl || "");
              setAnnAttachedResources(data.attachedResources || []);
              if (data.poll) {
                setAnnHasPoll(true);
                setPollQuestion(data.poll.question || "");
                setPollType(data.poll.type || "single");
                setPollOptions(data.poll.options || ["", ""]);
              } else {
                setAnnHasPoll(false);
                setPollQuestion("");
                setPollType("single");
                setPollOptions(["", ""]);
              }
            }
          } else if (activeTab === "resources") {
            const resSnap = await getDoc(doc(db, "resources", editId));
            const parseChaptersString = (chStr: string) => {
              if (!chStr) return [];
              return chStr.split('|').map(c => {
                const [time, ...rest] = c.split('~');
                return { time, title: rest.join('~') };
              }).filter(c => c.time && c.title);
            };
            
            if (resSnap.exists()) {
              const data = resSnap.data();
              setResType(data.type || "pdf_document");
              setResCategory(data.category || "Lecture Notes");
              setResTitle(data.title || "");
              setResModule(data.moduleCode || data.module || "");
              setResUrl(data.url || "");
              setResDesc(data.description || "");
              setResChaptersList(parseChaptersString(data.chapters || ""));
            } else {
              const lecSnap = await getDoc(doc(db, "lectures", editId));
              if (lecSnap.exists()) {
                const data = lecSnap.data();
                setResType(data.type || "zoom_meeting"); // default to zoom_meeting if legacy lecture
                setResCategory(data.category || "Lecture Notes");
                setResTitle(data.title || "");
                setResModule(data.moduleCode || data.module || "");
                setResUrl(data.url || "");
                setResDesc(data.description || "");
                setResChaptersList(parseChaptersString(data.chapters || ""));
                setStartTime(data.startTime || "");
                setEndTime(data.endTime || "");
              }
            }
          } else if (activeTab === "finances") {
            const txSnap = await getDoc(doc(db, "transactions", editId));
            if (txSnap.exists()) {
              const data = txSnap.data();
              setTxType(data.type || "expense");
              setTxAmount(data.amount?.toString() || "");
              setTxDesc(data.description || "");
              setTxFundId(data.fundId || "");
              if (data.date) {
                // date might be full ISO or just YYYY-MM-DD
                setTxDate(data.date.split('T')[0]);
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch edit doc", e);
        }
      };
      fetchEditDoc();
    } else {
      setAnnTitle(""); setAnnCategory("General"); setAnnContent(""); setAnnBannerUrl(""); setAnnAttachedResources([]);
      setAnnHasPoll(false); setPollQuestion(""); setPollType("single"); setPollOptions(["", ""]);
      setResType("pdf_document"); setResCategory("Lecture Notes"); setResTitle(""); setResModule(""); setResUrl(""); setResDesc(""); setResChaptersList([]); setNewChapterTime(""); setNewChapterTitle(""); setStartTime(""); setEndTime("");
      setTxType("expense"); setTxAmount(""); setTxDesc("");
    }
  }, [editId, activeTab]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    router.push(`/admin?tab=${val}`, { scroll: false });
  };

  if (!user) return <div>Loading...</div>;

  if (user.role === 'student') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">You do not have the required permissions to view the admin dashboard.</p>
      </div>
    );
  }

  const clearEdit = () => {
    router.push(`/admin?tab=${activeTab}`, { scroll: false });
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingBanner(true);
      const url = await uploadToImgBB(file);
      setAnnBannerUrl(url);
      toast.success("Banner uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload banner image");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const [isUploadingResImage, setIsUploadingResImage] = useState(false);
  const handleResourceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingResImage(true);
      const url = await uploadToImgBB(file);
      setResUrl(url);
      setResType("image_resource"); // Auto set type to image
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingResImage(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cohortId) {
      toast.error("No cohort ID found");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const pollData = annHasPoll ? {
        question: pollQuestion,
        options: pollOptions.filter(o => o.trim() !== ""),
        type: pollType,
        votes: editId ? undefined : {} // Keep existing votes if editing, handled separately or we don't overwrite if not needed. Actually, if editing, we shouldn't wipe votes unless options changed drastically. We will just use it. Let's merge.
      } : null;

      const annData: any = {
        title: annTitle,
        category: annCategory,
        content: annContent,
        bannerUrl: annBannerUrl,
        attachedResources: annAttachedResources,
      };
      
      if (pollData) annData.poll = pollData;
      else annData.poll = null;

      if (editId) {
        // If we don't want to reset votes on edit, we can omit it if it exists.
        await updateDoc(doc(db, "announcements", editId), annData);
        toast.success("Announcement updated successfully!");
        clearEdit();
      } else {
        annData.cohortId = cohortId;
        annData.author = user?.name || "Admin";
        annData.createdAt = serverTimestamp();
        if (pollData) annData.poll.votes = {};

        await addDoc(collection(db, "announcements"), annData);
        toast.success("Announcement published successfully!");
        setAnnTitle(""); setAnnCategory("General"); setAnnContent(""); setAnnBannerUrl(""); setAnnAttachedResources([]);
        setAnnHasPoll(false); setPollQuestion(""); setPollType("single"); setPollOptions(["", ""]);
      }
      setRefreshKeys(prev => ({ ...prev, announcements: prev.announcements + 1 }));
    } catch (error) {
      console.error(error);
      toast.error(editId ? "Failed to update announcement" : "Failed to publish announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cohortId) {
      toast.error("No cohort ID found");
      return;
    }

    try {
      setIsSubmitting(true);
      const isLectureType = resType === "zoom_meeting" || resType === "youtube_video";
      const collectionName = isLectureType ? "lectures" : "resources";
      if (editId) {
        const updateData: any = {
          title: resTitle,
          moduleCode: resModule,
          module: resModule,
          url: resUrl || "",
          description: resDesc || "",
          type: resType,
          category: resCategory,
        };
        if (resType === "youtube_video") {
          updateData.chapters = resChaptersList.map(c => `${c.time}~${c.title}`).join('|') || "";
        }
        // For backwards compatibility
        if (resType === "pdf_document") updateData.driveViewUrl = resUrl || "";
        
        if (isLectureType && resType === "zoom_meeting") {
          updateData.startTime = startTime;
          updateData.endTime = endTime;
        }
        await updateDoc(doc(db, collectionName, editId), updateData);
        toast.success(`${isLectureType ? "Session" : "Resource"} updated successfully!`);
        clearEdit();
      } else {
        const insertData: any = {
          title: resTitle,
          moduleCode: resModule,
          module: resModule,
          url: resUrl || "",
          description: resDesc || "",
          type: resType,
          category: resCategory,
          cohortId,
          author: user?.name || "Admin",
          createdAt: serverTimestamp(),
        };
        if (resType === "youtube_video") {
          insertData.chapters = resChaptersList.map(c => `${c.time}~${c.title}`).join('|') || "";
        }
        if (resType === "pdf_document") insertData.driveViewUrl = resUrl || "";

        if (isLectureType && resType === "zoom_meeting") {
          insertData.startTime = startTime;
          insertData.endTime = endTime;
        }
        await addDoc(collection(db, collectionName), insertData);
        toast.success(`${isLectureType ? "Session" : "Resource"} published successfully!`);
        setResTitle(""); setResModule(""); setResUrl(""); setResDesc(""); setResChaptersList([]); setNewChapterTime(""); setNewChapterTitle(""); setStartTime(""); setEndTime("");
      }
      setRefreshKeys(prev => ({ ...prev, resources: prev.resources + 1 }));
    } catch (error) {
      console.error(error);
      toast.error(editId ? `Failed to update ${resType}` : `Failed to publish ${resType}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cohortId) {
      toast.error("No cohort ID found");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editId) {
        await updateDoc(doc(db, "transactions", editId), {
          type: txType,
          amount: Number(txAmount),
          description: txDesc,
          title: txDesc,
          date: txDate,
          fundId: txFundId || null,
          fundName: txFundId ? fundsList.find(f => f.id === txFundId)?.name || 'General' : 'General',
        });
        toast.success("Transaction updated successfully!");
        clearEdit();
      } else {
        await addDoc(collection(db, "transactions"), {
          type: txType,
          amount: Number(txAmount),
          description: txDesc,
          title: txDesc,
          cohortId,
          author: user?.name || "Admin",
          date: txDate,
          createdAt: serverTimestamp(),
          fundId: txFundId || null,
          fundName: txFundId ? fundsList.find(f => f.id === txFundId)?.name || 'General' : 'General',
        });
        toast.success("Transaction recorded successfully!");
        setTxAmount(""); setTxDesc(""); setTxDate(new Date().toISOString().split('T')[0]);
      }
      setRefreshKeys(prev => ({ ...prev, finances: prev.finances + 1 }));
    } catch (error) {
      console.error(error);
      toast.error(editId ? "Failed to update transaction" : "Failed to record transaction");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl">
          <ShieldAlert className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage {isSuperAdmin ? 'all platform' : 'cohort'} content and settings.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="mb-2">
            {(isSuperAdmin || user.role === 'rep') && (
              <>
                <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Users</TabsTrigger>
                <TabsTrigger value="profile_updates" className="gap-2"><UserCog className="h-4 w-4" /> Profile Updates</TabsTrigger>
              </>
            )}
            
            {(isSuperAdmin || user.role === 'rep' || user.role === 'media_rep') && (
              <TabsTrigger value="announcements" className="gap-2"><Megaphone className="h-4 w-4" /> Announcements</TabsTrigger>
            )}
            
            {(isSuperAdmin || user.role === 'rep' || user.role === 'academic_rep') && (
              <TabsTrigger value="resources">Resources & Kuppi Sessions</TabsTrigger>
            )}
            
            {(isSuperAdmin || user.role === 'rep' || user.role === 'treasurer') && (
              <TabsTrigger value="finances">Finances</TabsTrigger>
            )}
            
            {(isSuperAdmin || user.role === 'rep') && (
              <TabsTrigger value="feedback" className="gap-2"><MessageSquare className="h-4 w-4" /> Feedback</TabsTrigger>
            )}
            
            {(isSuperAdmin || user.role === 'rep' || user.role === 'media_rep') && (
              <TabsTrigger value="public" className="gap-2"><Sparkles className="h-4 w-4" /> Public Web</TabsTrigger>
            )}

            {(isSuperAdmin || user.role === 'rep') && (
              <>
                <TabsTrigger value="combinations" className="gap-2"><LibraryBig className="h-4 w-4" /> Combinations</TabsTrigger>
                <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Directory Settings</TabsTrigger>
              </>
            )}
            
            {(isSuperAdmin || user.role === 'rep' || user.role === 'academic_rep') && (
              <TabsTrigger value="subjects" className="gap-2"><Plus className="h-4 w-4" /> Subjects (Modules)</TabsTrigger>
            )}

            {isSuperAdmin && (
              <TabsTrigger value="cohorts" className="gap-2"><FolderGit2 className="h-4 w-4" /> Cohorts</TabsTrigger>
            )}
          </TabsList>
        </div>

        {(isSuperAdmin || user.role === 'rep') && (
          <>
            <TabsContent value="users">
              <UserManagementTab />
            </TabsContent>
            <TabsContent value="profile_updates">
              <ProfileRequestsTab />
            </TabsContent>
          </>
        )}

        {(isSuperAdmin || user.role === 'rep') && (
          <TabsContent value="feedback">
            <ComplaintsManagementTab cohortId={cohortId} />
          </TabsContent>
        )}

        {isSuperAdmin && (
          <TabsContent value="cohorts">
            <CohortsManagementTab />
          </TabsContent>
        )}

        {(isSuperAdmin || user.role === 'rep' || user.role === 'media_rep') && (
          <>
            <TabsContent value="public" className="mt-6">
              <PublicContentManagementTab />
            </TabsContent>
            <TabsContent value="combinations" className="mt-6">
              <CombinationsManagementTab />
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
              <DirectorySettingsTab />
            </TabsContent>
            <TabsContent value="subjects" className="mt-6">
              <SubjectsManagementTab cohortId={cohortId} />
            </TabsContent>
          </>
        )}
        
        {(isSuperAdmin || user.role === 'rep' || user.role === 'media_rep') && (
          <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>{editId ? "Edit Announcement" : "Publish Announcement"}</CardTitle>
              <CardDescription>Broadcast a new announcement to your cohort.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateAnnouncement}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="E.g., Exam Postponed" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select value={annCategory} onChange={e => setAnnCategory(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                    <option value="Urgent" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Urgent</option>
                    <option value="Academic" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Academic</option>
                    <option value="General" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">General</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea 
                    value={annContent} onChange={e => setAnnContent(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Enter announcement details..." 
                    required
                  />
                </div>

                <div className="pt-2 border-t mt-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Banner Image (Optional)</label>
                    <p className="text-[11px] text-muted-foreground mt-0 pt-0 mb-2">
                      Recommended size: 1200x400 pixels (or 3:1 width-to-height ratio) for best display.
                    </p>
                    <div className="flex items-center gap-4">
                      {annBannerUrl && (
                        <div className="relative w-24 h-16 rounded overflow-hidden border">
                          <img src={annBannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          disabled={isUploadingBanner}
                          className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {isUploadingBanner && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Uploading...</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Attach Internal Resources (Optional)</label>
                    <p className="text-xs text-muted-foreground mb-2">Select existing resources, lectures, or gallery moments to attach to this announcement.</p>
                    
                    <div className="flex gap-2 items-center mb-2">
                      <Input 
                        placeholder="Search resources by title..." 
                        value={attachSearch}
                        onChange={(e) => setAttachSearch(e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      <select 
                        value={attachFilter}
                        onChange={(e) => setAttachFilter(e.target.value)}
                        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="ALL">All Types</option>
                        <option value="Resource">Documents & Resources</option>
                        <option value="Lecture">Lectures & Videos</option>
                        <option value="Gallery">Gallery Moments</option>
                      </select>
                    </div>

                    <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2 bg-muted/20">
                      {systemResources
                        .filter(res => {
                          const matchesSearch = res.title?.toLowerCase().includes(attachSearch.toLowerCase());
                          const matchesFilter = attachFilter === "ALL" || res.__source === attachFilter;
                          return matchesSearch && matchesFilter;
                        })
                        .length === 0 ? (
                        <p className="text-xs text-muted-foreground p-2">No matching resources found.</p>
                      ) : (
                        systemResources
                          .filter(res => {
                            const matchesSearch = res.title?.toLowerCase().includes(attachSearch.toLowerCase());
                            const matchesFilter = attachFilter === "ALL" || res.__source === attachFilter;
                            return matchesSearch && matchesFilter;
                          })
                          .map(res => (
                          <label key={res.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                            <input 
                              type="checkbox" 
                              checked={annAttachedResources.some(ar => ar.id === res.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAnnAttachedResources([...annAttachedResources, { 
                                    id: res.id, 
                                    title: res.title, 
                                    type: res.type, 
                                    url: res.url,
                                    startTime: res.startTime || null,
                                    endTime: res.endTime || null,
                                    moduleCode: res.moduleCode || res.module || null
                                  }]);
                                } else {
                                  setAnnAttachedResources(annAttachedResources.filter(ar => ar.id !== res.id));
                                }
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{res.title}</span>
                              <span className="text-[10px] text-muted-foreground">{res.type?.replace('_', ' ').toUpperCase()} • {res.category}</span>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t mt-4">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input type="checkbox" checked={annHasPoll} onChange={(e) => setAnnHasPoll(e.target.checked)} />
                    Attach Poll (Optional)
                  </label>
                </div>
                
                {annHasPoll && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Poll Question</label>
                      <Input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="E.g., What time should the session be?" required={annHasPoll} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Poll Type</label>
                      <select value={pollType} onChange={e => setPollType(e.target.value as "single" | "multiple")} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                        <option value="single">Single Choice</option>
                        <option value="multiple">Multiple Choice</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Options</label>
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <Input value={opt} onChange={e => {
                            const newOpts = [...pollOptions];
                            newOpts[idx] = e.target.value;
                            setPollOptions(newOpts);
                          }} placeholder={`Option ${idx + 1}`} required={annHasPoll} />
                          {pollOptions.length > 2 && (
                            <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => {
                              const newOpts = pollOptions.filter((_, i) => i !== idx);
                              setPollOptions(newOpts);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 10 && (
                        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setPollOptions([...pollOptions, ""])}>
                          <Plus className="mr-2 h-3 w-3" /> Add Option
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="p-6 pt-0 flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}><Megaphone className="mr-2 h-4 w-4" /> {isSubmitting ? (editId ? "Saving..." : "Publishing...") : (editId ? "Save Changes" : "Publish Now")}</Button>
                {editId && (
                  <Button type="button" variant="outline" onClick={clearEdit}>Cancel Edit</Button>
                )}
              </div>
            </form>
          </Card>
          
          <AnnouncementsTable cohortId={cohortId} key={`ann-${refreshKeys.announcements}`} />
          </TabsContent>
        )}

        {(isSuperAdmin || user.role === 'rep' || user.role === 'academic_rep') && (
          <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>{editId ? "Edit Resource" : "Add Resource or Kuppi Session"}</CardTitle>
              <CardDescription>Upload a new PDF to Google Drive or link a Zoom/YouTube session.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateResource}>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <select value={resType} onChange={e => setResType(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                      <option value="zoom_meeting" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Zoom Live Session</option>
                      <option value="youtube_video" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Recorded Lecture (YouTube)</option>
                      <option value="pdf_document" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Google Drive PDF</option>
                      <option value="image_resource" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Image URL</option>
                      <option value="past_paper" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Past Paper PDF/Link</option>
                      <option value="custom_embed" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Raw iFrame Embed Code</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select value={resCategory} onChange={e => setResCategory(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                      <option value="Lecture Notes" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Lecture Notes</option>
                      <option value="Past Papers" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Past Papers</option>
                      <option value="Assignments" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Assignments</option>
                      <option value="Reference" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Reference</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input value={resTitle} onChange={e => setResTitle(e.target.value)} placeholder="E.g., Intro to Mechanics" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Module Code / Subject Name</label>
                  <select 
                    value={resModule} 
                    onChange={e => setResModule(e.target.value)} 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                    required
                  >
                    <option value="" disabled className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Select a Subject</option>
                    {modules.map(mod => (
                      <option key={mod.id} value={mod.code} className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">
                        {mod.code} - {mod.name}
                      </option>
                    ))}
                    {/* Fallback for existing resources with typed codes not in the DB */}
                    {resModule && !modules.find(m => m.code === resModule) && (
                      <option value={resModule} className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">{resModule}</option>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{resType === 'custom_embed' ? "Embed HTML Code" : "Link (Google Drive ID, Zoom/YouTube URL, or Image URL)"}</label>
                  {resType === 'custom_embed' ? (
                    <textarea value={resUrl} onChange={e => setResUrl(e.target.value)} className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="<iframe src='...' />" required />
                  ) : (
                    <div className="space-y-3">
                      <Input value={resUrl} onChange={(e) => setResUrl(e.target.value)} required placeholder="https://..." />
                      
                      <div className="flex items-center gap-2 pt-1">
                        <div className="text-xs font-semibold text-muted-foreground w-12 text-center">OR</div>
                        <div className="flex-1">
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Upload an Image Resource directly</label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleResourceImageUpload}
                              disabled={isUploadingResImage}
                              className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 h-auto py-1.5"
                            />
                            {isUploadingResImage && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Short Description (Optional)</label>
                  <textarea 
                    value={resDesc} 
                    onChange={e => setResDesc(e.target.value)} 
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                    placeholder="Brief details about the resource or session..." 
                  />
                </div>
                {resType === "youtube_video" && (
                  <div className="space-y-4 border border-input rounded-md p-4 bg-muted/10">
                    <div>
                      <label className="text-sm font-medium">Video Chapters / Timestamps (Optional)</label>
                      <p className="text-[11px] text-muted-foreground mt-0 pt-0 mb-3">
                        Add specific timestamps (e.g., 00:00) and titles for each chapter to allow easy navigation.
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="w-1/3">
                        <Input 
                          placeholder="e.g. 05:30" 
                          value={newChapterTime} 
                          onChange={e => setNewChapterTime(e.target.value)} 
                        />
                      </div>
                      <div className="flex-1">
                        <Input 
                          placeholder="Chapter title" 
                          value={newChapterTitle} 
                          onChange={e => setNewChapterTitle(e.target.value)} 
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={() => {
                          if (newChapterTime && newChapterTitle) {
                            setResChaptersList([...resChaptersList, { time: newChapterTime, title: newChapterTitle }]);
                            setNewChapterTime("");
                            setNewChapterTitle("");
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>

                    {resChaptersList.length > 0 && (
                      <div className="mt-4 border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left py-2 px-3 font-medium w-24">Time</th>
                              <th className="text-left py-2 px-3 font-medium">Title</th>
                              <th className="w-[50px]"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {resChaptersList.map((chapter, idx) => (
                              <tr key={idx} className="border-t border-border/50 bg-background">
                                <td className="py-2 px-3 text-primary font-mono">{chapter.time}</td>
                                <td className="py-2 px-3">{chapter.title}</td>
                                <td className="py-2 px-2 text-center">
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-destructive shrink-0"
                                    onClick={() => {
                                      setResChaptersList(resChaptersList.filter((_, i) => i !== idx));
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                {resType === "zoom_meeting" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Time</label>
                      <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Time</label>
                      <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="p-6 pt-0 flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}><Plus className="mr-2 h-4 w-4" /> {isSubmitting ? (editId ? "Saving..." : "Adding...") : (editId ? "Save Changes" : "Add Resource")}</Button>
                {editId && (
                  <Button type="button" variant="outline" onClick={clearEdit}>Cancel Edit</Button>
                )}
              </div>
            </form>
          </Card>
          
          <ResourcesTable cohortId={cohortId} key={`res-${refreshKeys.resources}`} />
          </TabsContent>
        )}

        {(isSuperAdmin || user.role === 'rep' || user.role === 'treasurer') && (
          <TabsContent value="finances" className="space-y-8">
          
          <FundsManager cohortId={cohortId} />

          <Card>
            <CardHeader>
              <CardTitle>{editId ? "Edit Transaction" : "Log Transaction"}</CardTitle>
              <CardDescription>Record an income or expense for your cohort.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateTransaction}>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Transaction Type</label>
                    <select value={txType} onChange={e => setTxType(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                      <option value="income" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Income</option>
                      <option value="expense" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">Expense</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (Rs.)</label>
                    <Input value={txAmount} onChange={e => setTxAmount(e.target.value)} type="number" placeholder="5000" required />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fund / Account</label>
                    <select value={txFundId} onChange={e => setTxFundId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      <option value="" className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">General Fund</option>
                      {fundsList.map(f => (
                        <option key={f.id} value={f.id} className="dark:bg-zinc-900 dark:text-slate-100 bg-white text-slate-900">{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input value={txDesc} onChange={e => setTxDesc(e.target.value)} placeholder="E.g., Sound system rental" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} required />
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}><Upload className="mr-2 h-4 w-4" /> {isSubmitting ? (editId ? "Saving..." : "Recording...") : (editId ? "Save Changes" : "Record Transaction")}</Button>
                {editId && (
                  <Button type="button" variant="outline" onClick={clearEdit}>Cancel Edit</Button>
                )}
              </div>
            </form>
          </Card>
          
          <FinancesTable cohortId={cohortId} key={`fin-${refreshKeys.finances}`} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading admin dashboard...</div>}>
      <AdminPageContent />
    </Suspense>
  );
}
